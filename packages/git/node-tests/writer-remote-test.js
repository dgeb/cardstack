const {
  Remote,
} = require('nodegit');

const Clone = require('../clone');
const Cred = require('../cred');

const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { join } = require('path');
const { readFileSync } = require('fs');
const { promisify } = require('util');
const temp = require('@cardstack/test-support/temp-helper');

const { inRepo, makeRepo } = require('./support');
const Change = require('../change');
const service = require('../service');

const mkdir = promisify(temp.mkdir);

const privateKey = readFileSync(join(__dirname, 'git-ssh-server', 'cardstack-test-key'), 'utf8');

const fetchOpts = {
  callbacks: {
    credentials: (url, userName) => {
      return Cred.sshKeyMemoryNew(userName, '', privateKey, '');
    }
  }
};

async function resetRemote() {
  let root = await temp.mkdir('cardstack-server-test');

  let tempRepo = await makeRepo(root, {
    'contents/events/event-1.json': JSON.stringify({
      attributes: {
        title: "This is a test event",
        'published-date': "2018-09-25"
      }
    }, null, 2),
    'contents/events/event-2.json': JSON.stringify({
      attributes: {
        title: "This is another test event",
        "published-date": "2018-10-25"
      }
    }, null, 2)
  });

  let remote = await Remote.create(tempRepo.repo, 'origin', 'ssh://root@localhost:9022/root/data-test');
  await remote.push(["+refs/heads/master:refs/heads/master"], fetchOpts);
  return tempRepo;
}

describe('git/writer with remote', function() {
  let env, writers, repo, tempRepoPath, tempRemoteRepoPath, head, remoteRepo;

  beforeEach(async function() {
    let tempRepo = await resetRemote();

    head = tempRepo.head;
    remoteRepo = tempRepo.repo;

    let factory = new JSONAPIFactory();

    tempRepoPath = await mkdir('cardstack-temp-test-repo');
    tempRemoteRepoPath = await mkdir('cardstack-temp-test-remote-repo');

    repo = await Clone('ssh://root@localhost:9022/root/data-test', tempRemoteRepoPath, {
      fetchOpts,
    });

    let dataSource = factory.addResource('data-sources')
        .withAttributes({
          'source-type': '@cardstack/git',
          params: {
            remote: {
              url: 'ssh://root@localhost:9022/root/data-test',
              privateKey,
              cacheDir: tempRepoPath,
            }
          }
        });

    factory.addResource('content-types', 'events')
      .withRelated('fields', [
        factory.addResource('fields', 'title').withAttributes({ fieldType: '@cardstack/core-types::string' }),
        factory.addResource('fields', 'published-date').withAttributes({ fieldType: '@cardstack/core-types::string' })
      ]).withRelated('data-source', dataSource);

    factory.addResource('plugin-configs', '@cardstack/hub')
      .withRelated(
        'default-data-source',
        dataSource
      );

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    writers = env.lookup('hub:writers');
  });

  afterEach(async function() {
    await temp.cleanup();
    await destroyDefaultEnvironment(env);
    service.clearCache();
  });

  describe('create', function() {
    it('saves attributes', async function () {
      let { data:record } = await writers.create(env.session, 'events', {
        data: {
          type: 'events',
          attributes: {
            title: 'Second Event',
            'published-date': '2018-09-01',
          }
        }
      });
      await repo.fetch('origin', fetchOpts);
      let saved = await inRepo(tempRemoteRepoPath).getJSONContents('origin/master', `contents/events/${record.id}.json`);
      expect(saved).to.deep.equal({
        attributes: {
          title: 'Second Event',
          'published-date': '2018-09-01',
        }
      });
    });
  });

  describe('update', function() {
    it('returns updated document', async function() {
      let { data:record } = await writers.update(env.session, 'events', 'event-1', {
        data: {
          id: 'event-1',
          type: 'events',
          attributes: {
            title: 'Updated title'
          },
          meta: {
            version: head
          }
        }
      });
      expect(record).has.deep.property('attributes.title', 'Updated title');
      expect(record).has.deep.property('meta.version').not.equal(head);


      await repo.fetch('origin', fetchOpts);
      let updated = await inRepo(tempRemoteRepoPath).getJSONContents('origin/master', `contents/events/event-1.json`);

      expect(updated).to.deep.equal({
        attributes: {
          title: 'Updated title',
          'published-date': '2018-09-25',
        }
      });
    });

    it('successfully merges updates when repo is out of sync', async function() {
      this.timeout(20000);

      let change = await Change.create(remoteRepo, head, 'master');

      let file = await change.get('contents/events/event-2.json', { allowUpdate: true });

      file.setContent(JSON.stringify({
        attributes: {
          title: "This is a test event",
          'published-date': "2019-09-25"
        }
      }));

      await change.finalize({
        authorName: 'John Milton',
        authorEmail: 'john@paradiselost.com',
        message: 'I probably shouldnt update this out of sync'
      });

      let remote = await remoteRepo.getRemote('origin');
      await remote.push(["refs/heads/master:refs/heads/master"], fetchOpts);

      let { data:record } = await writers.update(env.session, 'events', 'event-1', {
        data: {
          id: 'event-1',
          type: 'events',
          attributes: {
            title: 'Updated title',
          },
          meta: {
            version: head
          }
        }
      });
      expect(record).has.deep.property('attributes.title', 'Updated title');
      expect(record).has.deep.property('meta.version').not.equal(head);


      await repo.fetch('origin', fetchOpts);
      let updated = await inRepo(tempRemoteRepoPath).getJSONContents('origin/master', `contents/events/event-1.json`);

      expect(updated).to.deep.equal({
        attributes: {
          title: 'Updated title',
          'published-date': '2018-09-25',
        }
      });
    });

    it('successfully merges updates when same file is out of sync', async function() {
      this.timeout(20000);

      let change = await Change.create(remoteRepo, head, 'master');

      let file = await change.get('contents/events/event-1.json', { allowUpdate: true });

      file.setContent(JSON.stringify({
        attributes: {
          title: "This is a test event",
          'published-date': "2018-09-25"
        }
      }, null, 2));

      await change.finalize({
        authorName: 'John Milton',
        authorEmail: 'john@paradiselost.com',
        message: 'I probably shouldnt update this out of sync'
      });

      let remote = await remoteRepo.getRemote('origin');
      await remote.push(["refs/heads/master:refs/heads/master"], fetchOpts);

      let { data:record } = await writers.update(env.session, 'events', 'event-1', {
        data: {
          id: 'event-1',
          type: 'events',
          attributes: {
            title: 'Updated title'
          },
          meta: {
            version: head
          }
        }
      });
      expect(record).has.deep.property('attributes.title', 'Updated title');
      expect(record).has.deep.property('meta.version').not.equal(head);


      await repo.fetch('origin', fetchOpts);
      let updated = await inRepo(tempRemoteRepoPath).getJSONContents('origin/master', `contents/events/event-1.json`);

      expect(updated).to.deep.equal({
        attributes: {
          title: 'Updated title',
          'published-date': '2018-09-25',
        }
      });
    });
  });

  describe('delete', function() {
    it('deletes document', async function() {
      await writers.delete(env.session, head, 'events', 'event-1');

      await repo.fetch('origin', fetchOpts);

      let articles = (await inRepo(tempRemoteRepoPath).listTree('origin/master', 'contents/events')).map(a => a.name);
      expect(articles).to.not.contain('event-1.json');
    });

    // TODO: come up with testing scenarios for conflicts
  });
});

describe('git/writer with empty remote', function() {
  let env, writers, repo, tempRepoPath, tempRemoteRepoPath;

  beforeEach(async function() {
    let root = await temp.mkdir('cardstack-server-test');

    let { repo: remoteRepo } = await makeRepo(root);

    let remote = await Remote.create(remoteRepo, 'origin', 'ssh://root@localhost:9022/root/data-test');
    await remote.push(["+refs/heads/master:refs/heads/master"], fetchOpts);

    let factory = new JSONAPIFactory();

    tempRepoPath = await mkdir('cardstack-temp-test-repo');
    tempRemoteRepoPath = await mkdir('cardstack-temp-test-remote-repo');

    repo = await Clone('ssh://root@localhost:9022/root/data-test', tempRemoteRepoPath, {
      fetchOpts,
    });

    let dataSource = factory.addResource('data-sources')
        .withAttributes({
          'source-type': '@cardstack/git',
          params: {
            remote: {
              url: 'ssh://root@localhost:9022/root/data-test',
              privateKey,
              cacheDir: tempRepoPath,
            }
          }
        });

    factory.addResource('content-types', 'events')
      .withRelated('fields', [
        factory.addResource('fields', 'title').withAttributes({ fieldType: '@cardstack/core-types::string' }),
        factory.addResource('fields', 'published-date').withAttributes({ fieldType: '@cardstack/core-types::string' })
      ]).withRelated('data-source', dataSource);

    factory.addResource('plugin-configs', '@cardstack/hub')
      .withRelated(
        'default-data-source',
        dataSource
      );

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    writers = env.lookup('hub:writers');
  });

  afterEach(async function() {
    await temp.cleanup();
    await destroyDefaultEnvironment(env);
    service.clearCache();
  });

  describe('create', function() {
    it('allows you to create a record in an empty git repo', async function () {
      let { data:record } = await writers.create(env.session, 'events', {
        data: {
          type: 'events',
          attributes: {
            title: 'Fresh Event',
            'published-date': '2018-09-01',
          }
        }
      });
      await repo.fetch('origin', fetchOpts);
      let saved = await inRepo(tempRemoteRepoPath).getJSONContents('origin/master', `contents/events/${record.id}.json`);
      expect(saved).to.deep.equal({
        attributes: {
          title: 'Fresh Event',
          'published-date': '2018-09-01',
        }
      });
    });
  });
});
