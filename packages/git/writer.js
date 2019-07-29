const {
  Cred,
  Clone
} = require('nodegit');

const Repository = require('./repository');

const crypto = require('crypto');
const Change = require('./change');
const os = require('os');
const process = require('process');
const Error = require('@cardstack/plugin-utils/error');
const { promisify } = require('util');
const temp = require('temp').track();
const Gitchain = require('@cardstack/gitchain');
const log = require('@cardstack/logger')('cardstack/git');
const stringify = require('json-stable-stringify-without-jsonify');

const mkdir = promisify(temp.mkdir);
const defaultBranch = 'master';

module.exports = class Writer {
  static create(...args) {
    return new this(...args);
  }

  constructor({ repo, idGenerator, basePath, branchPrefix, remote, hyperledger }) {
    this.repoPath = repo;
    this.basePath = basePath;
    this.branchPrefix = branchPrefix || "";
    this.repo = null;
    let hostname = os.hostname();
    this.myName = `PID${process.pid} on ${hostname}`;
    this.myEmail = `${os.userInfo().username}@${hostname}`;
    this.idGenerator = idGenerator;
    this.remote = remote;

    if (hyperledger) {
      let config = Object.assign({}, hyperledger);
      config.logger = log.info.bind(log); // TODO fix logger so we don't have to bind
      this.hyperledgerConfig = config;
    }


    if(remote) {
      this.fetchOpts = {
        callbacks: {
          credentials: (url, userName) => {
            if (remote && remote.privateKey) {
              return Cred.sshKeyMemoryNew(userName, remote.publicKey || '', remote.privateKey, remote.passphrase || '');
            }
            return Cred.sshKeyFromAgent(userName);
          }
        }
      };
    }
  }

  async prepareCreate(session, type, document, isSchema) {
    return withErrorHandling(document.id, type, async () => {
      await this._ensureRepo();
      let change = await Change.create(this.repo, null, this.branchPrefix + defaultBranch, this.fetchOpts);

      let id = document.id;
      let file;
      while (id == null) {
        let candidateId = this._generateId();
        let candidateFile = await change.get(this._filenameFor(document.type, candidateId, isSchema), { allowCreate: true });
        if (!candidateFile.exists()) {
          id = candidateId;
          file = candidateFile;
        }
      }

      if (!file) {
        file = await change.get(this._filenameFor(document.type, id, isSchema), { allowCreate: true });
      }

      let gitDocument = { id, type: document.type };
      if (document.attributes) {
        gitDocument.attributes = document.attributes;
      }
      if (document.relationships) {
        gitDocument.relationships = document.relationships;
      }

      let signature = await this._commitOptions('create', document.type, id, session);
      return {
        finalDocument: gitDocument,
        finalizer: finalizer.bind(this),
        type: document.type,
        id,
        signature,
        change,
        file
      };
    });
  }

  async prepareUpdate(session, type, id, document, isSchema) {
    if (!document.meta || !document.meta.version) {
      throw new Error('missing required field "meta.version"', {
        status: 400,
        source: { pointer: '/data/meta/version' }
      });
    }

    await this._ensureRepo();
    return withErrorHandling(id, type, async () => {
      let change = await Change.create(this.repo, document.meta.version, this.branchPrefix + defaultBranch, this.fetchOpts);

      let file = await change.get(this._filenameFor(type, id, isSchema), { allowUpdate: true });
      let before = JSON.parse(await file.getBuffer());
      let after = patch(before, document);
      // we don't write id & type into the actual file (they're part
      // of the filename). But we want them present on the
      // PendingChange as complete valid documents.
      before.id = id;
      before.type = type;
      after.id = document.id;
      after.type = document.type;
      let signature = await this._commitOptions('update', type, id, session);
      return {
        originalDocument: before,
        finalDocument: after,
        finalizer: finalizer.bind(this),
        type,
        id,
        signature,
        change,
        file
      };
    });
  }

  async prepareDelete(session, version, type, id, isSchema) {
    if (!version) {
      throw new Error('version is required', {
        status: 400,
        source: { pointer: '/data/meta/version' }
      });
    }
    await this._ensureRepo();
    return withErrorHandling(id, type, async () => {
      let change = await Change.create(this.repo, version, this.branchPrefix + defaultBranch, this.fetchOpts);

      let file = await change.get(this._filenameFor(type, id, isSchema));
      let before = JSON.parse(await file.getBuffer());
      file.delete();
      before.id = id;
      before.type = type;
      let signature = await this._commitOptions('delete', type, id, session);
      return {
        originalDocument: before,
        finalizer: finalizer.bind(this),
        type,
        id,
        signature,
        change
      };
    });
  }

  async _commitOptions(operation, type, id, session) {
    let user = session && await session.loadUser();
    let userAttributes = (user && user.data && user.data.attributes) || {};

    return {
      authorName: userAttributes['full-name'] || userAttributes.name || 'Anonymous Coward',
      authorEmail: userAttributes.email || 'anon@example.com',
      committerName: this.myName,
      committerEmail: this.myEmail,
      message: `${operation} ${type} ${String(id).slice(12)}`
    };
  }

  _filenameFor(type, id, isSchema) {
    let category = isSchema ? 'schema' : 'contents';
    let base = this.basePath ? this.basePath + '/' : '';
    return `${base}${category}/${type}/${id}.json`;
  }

  async _ensureRepo() {
    if (!this.repo) {
      if (this.remote) {
        let tempRepoPath = await mkdir('cardstack-temp-repo');
        this.repo = await Clone(this.remote.url, tempRepoPath, {
          fetchOpts: this.fetchOpts,
        });
        return;
      }

      this.repo = await Repository.open(this.repoPath);
    }
  }

  async _ensureGitchain() {
    await this._ensureRepo();

    if (!this.gitChain && this.hyperledgerConfig) {
      this.gitChain = new Gitchain(this.repo.path(), this.hyperledgerConfig);
    }
  }

  _generateId() {
    if (this.idGenerator) {
      return this.idGenerator();
    } else {
      // 20 bytes is good enough for git, so it's good enough for
      // me. In practice we probably have a lower collision
      // probability too, because we're allowed to retry if we know
      // the id is already in use (so we can really only collide
      // with things that have not yet merged into our branch).
      return crypto.randomBytes(20).toString('hex');
    }
  }

  async _pushToHyperledger() {
    await this._ensureGitchain();

    if(this.gitChain) {
      // make sure only one push is ongoing at a time, by creating a chain of
      // promises here
      this._gitChainPromise = Promise.resolve(this._gitChainPromise).then(() =>
        this.gitChain.push(this.hyperledgerConfig.tag).catch(e => {
          log.error("Error pushing to hyperledger:", e, e.stack);
        })
      );
    }
  }
};


// TODO: we only need to do this here because the Hub has no generic
// "read" hook to call on writers. We should use that instead and move
// this into the generic hub:writers code.
function patch(before, diffDocument) {
  let after = Object.assign({}, before);
  for (let section of ['attributes', 'relationships']) {
    if (diffDocument[section]) {
      after[section] = Object.assign(
        {},
        before[section],
        diffDocument[section]
      );
    }
  }
  return after;
}

async function withErrorHandling(id, type, fn) {
  try {
    return await fn();
  } catch (err) {
    if (/Unable to parse OID/i.test(err.message) || /Object not found/i.test(err.message)) {
      throw new Error(err.message, { status: 400, source: { pointer: '/data/meta/version' }});
    }
    if (err instanceof Change.GitConflict) {
      throw new Error("Merge conflict", { status: 409 });
    }
    if (err instanceof Change.OverwriteRejected) {
      throw new Error(`id ${id} is already in use for type ${type}`, { status: 409, source: { pointer: '/data/id'}});
    }
    if (err instanceof Change.NotFound) {
      throw new Error(`${type} with id ${id} does not exist`, {
        status: 404,
        source: { pointer: '/data/id' }
      });
    }
    throw err;
  }
}


async function finalizer(pendingChange) {
  let { id, type, change, file, signature } = pendingChange;
  return withErrorHandling(id, type, async () => {
    if (file) {
      if (pendingChange.finalDocument) {
        // use stringify library instead of JSON.stringify, since JSON's method
        // is non-deterministic and could produce unnecessary diffs
        file.setContent(stringify({
          attributes: pendingChange.finalDocument.attributes,
          relationships: pendingChange.finalDocument.relationships
        }, null, 2));
      } else {
        file.delete();
      }
    }
    let version = await change.finalize(signature, this.remote, this.fetchOpts);
    await this._pushToHyperledger();
    return { version, hash: (file ? file.savedId() : null) };
  });
}
