const Error = require('@cardstack/plugin-utils/error');
const log = require('@cardstack/logger')('cardstack/ephemeral');
const crypto = require('crypto');
const { declareInjections } = require('@cardstack/di');
const { partition } = require('lodash');
const { INTERNAL_PRIVILEGED } = require('@cardstack/plugin-utils/session');
const streamToPromise = require('stream-to-promise');
const { statSync } = require("fs");
const { isInternalCard } = require('@cardstack/plugin-utils/card-utils');

// When we first load, we establish an identity. This allows us to
// distinguish any older content leftover in the search index from our
// own content.
const identity = Math.random();

// Within our own identity, we track generations to know what to update.
let generationCounter = 0;

function isCard(model) {
  return model.data && isInternalCard(model.data.type, model.data.id);
}

function getType(model) {
  return model.data ? model.data.type : model.type;
}

function getId(model) {
  return model.data ? model.data.id : model.id;
}

module.exports = declareInjections({
  indexers: 'hub:indexers',
  writers: 'hub:writers',
  schemaLoader: 'hub:schema-loader'
}, class EphemeralStorageService {
  constructor() {
    this._dataSources = new Map();
  }

  findStorage(dataSourceId) {
    let storage = this._dataSources.get(dataSourceId);
    if (!storage) {
      // we're not expecting this to happen because we know indexing
      // must happen at least once before writers are available (you
      // can't discovery the writers without indexing the data
      // sources).
      throw new Error("Bug in @cardstack/ephemeral: Tried to findStorage before findOrCreateStorage");
    }
    return storage;
  }

  async findOrCreateStorage(dataSourceId, initialModels) {
    let storage = this._dataSources.get(dataSourceId);
    if (!storage) {
      storage = new EphemeralStorage(this.indexers);
      this._dataSources.set(dataSourceId, storage);
      if (initialModels) {
        let schemaTypes = this.schemaLoader.ownTypes();
        for (let model of initialModels) {
          let isSchema = schemaTypes.includes(getType(model));
          if (model.readable) {
            // store binary data
            let id = getId(model) || crypto.randomBytes(20).toString('hex'); // if model has id, use it, otherwise generate one
            let blob = await streamToPromise(model);
            let storedDocument = {
              type: 'cardstack-files',
              id,
              attributes: {
                'created-at':   statSync(model.path).ctime,
                'size':         statSync(model.path).size,
                'content-type': model.mimeType,
                'file-name':    model.filename || model.path
              }
            };

            log.debug('storing document for binary data %j', storedDocument);

            storage.storeBinary(model.type, id, storedDocument, blob);
          } else {
            storage.store(getType(model), getId(model), model, isSchema);
          }
        }
      }
    }
    return storage;
  }

  // The ephemeral indexer is a bit special in the sense that we use
  // it in development and want it to explode on startup if you try to
  // initialize it with invalid models.
  //
  // We can't just look at our own initialModels to decide if there's
  // a consistent schema, because we're allowed to depend on models
  // coming out of other indexers (and we probably depend on
  // the @cardstack/hub::seeds indexer in any case).
  async validateModels(initialModels, read) {
    let models = await crawlModels(initialModels, read);
    let schemaTypes = this.schemaLoader.ownTypes();
    let [schemaModels, dataModels] = partition(models, model => schemaTypes.includes(model.type));
    let schema = await this.schemaLoader.loadFrom(schemaModels);
    for (let model of dataModels) {
      if (isCard(model)) {
        // TODO validate card document
        continue;
      }
      await schema.validate(await this.writers.createPendingChange({
        finalDocument: model,
        finalizer: () => { },
      }), { session: INTERNAL_PRIVILEGED });
    }
  }
});


async function crawlModels(initialModels, read) {
  let models = new Map();
  let foundModels = initialModels;
  while (foundModels.length > 0) {
    let pendingRefs = [];
    for (let model of foundModels) {
      // TODO crawl card documents
      if (isCard(model)) { continue; }
      let key = `${model.type}/${model.id}`;
      models.set(key, model);
      for (let ref of references(model)) {
        pendingRefs.push(ref);
      }
    }
    foundModels = (await Promise.all(pendingRefs.map(async ({ type, id }) => {
      let key = `${type}/${id}`;
      if (!models.has(key)) {
        models.set(key, null);
        let output = await read(type, id);
        return output;
      }
    }))).filter(Boolean);
  }
  return [...models.values()].filter(Boolean);
}

// TODO this assumes model is a resource--need to change it?
function references(model) {

  let refs = [
    // every model depends on its content type
    { type: 'content-types', id: model.type },

    // and has type and id fields
    { type: 'fields', id: 'id' },
    { type: 'fields', id: 'type', },

    // and I'm including the root privileged grant (from bootstrap
    // schema) so that we can validate using INTERNAL_PRIVILEGED
    // session and expect it to work
    { type: 'grants', id: 'hub-internal-grant' }
  ];

  if (model.relationships) {
    for (let relationship of Object.values(model.relationships)) {
      if (relationship.data) {
        if (Array.isArray(relationship.data)) {
          for (let ref of relationship.data) {
            refs.push(ref);
          }
        } else {
          refs.push(relationship.data);
        }
      }
    }
  }
  return refs;
}

class EphemeralStorage {
  constructor(indexers) {
    // map from `${type}/${id}` to { model, isSchema, generation, type, id }
    // if model == null, that's a tombstone
    this.models = new Map();
    this.blobs = new Map();
    this.indexers = indexers;

    this.checkpoints = new Map();
  }

  get identity() {
    return identity;
  }

  schemaModels() {
    return [...this.models.values()].filter(entry => entry.isSchema).map(entry => entry.model).filter(Boolean);
  }

  modelsNewerThan(generation) {
    if (generation == null) {
      generation = -Infinity;
    }
    return [...this.models.values()].filter(entry => entry.generation > generation);
  }

  blobsNewerThan(generation) {
    if (generation == null) {
      generation = -Infinity;
    }
    return [...this.blobs.values()].filter(entry => entry.generation > generation);
  }

  lookup(type, id) {
    let entry = this.models.get(`${type}/${id}`);
    if (entry) {
      return entry.model;
    }
  }

  lookupBinary(type, id) {
    let entry = this.blobs.get(`${type}/${id}`);
    if (entry) {
      return entry.blob;
    }
  }

  store(type, id, model, isSchema, ifMatch) {
    generationCounter++;
    let key = `${type}/${id}`;
    let entry = this.models.get(key);

    if (entry && ifMatch != null && String(entry.generation) !== String(ifMatch)) {
      throw new Error("Merge conflict", {
        status: 409,
        source: model ? { pointer: '/data/meta/version'} : { header: 'If-Match' }
      });
    }

    log.debug('storing %s %s, alreadyExisted=%s, deleting=%s', type, id, !!entry, !model);
    this.models.set(key, {
      model,
      isSchema,
      generation: generationCounter,
      type,
      id
    });

    return generationCounter;
  }

  storeBinary(type, id, model, blob) {
    generationCounter++;
    let key = `${type}/${id}`;

    log.debug('storing blob %s %s', type, id);

    this.blobs.set(key, {
      type,
      id,
      model,
      generation: generationCounter,
      blob
    });

    return generationCounter;
  }

  currentGeneration() {
    return generationCounter;
  }

  makeCheckpoint(id) {
    this.checkpoints.set(id, copyMap(this.models));
    log.debug(`created checkpoint ${id}`);
    return ++generationCounter;
  }

  async restoreCheckpoint(id) {
    generationCounter++;
    let checkpoint = this.checkpoints.get(id);
    if (!checkpoint) {
      throw new Error("No such checkpoint", {
        status: 400,
        source: { pointer: '/data/relationships/checkpoint'}
      });
    }

    log.debug(`restoring checkpoint ${id}`);

    for (let [key, value] of checkpoint.entries()) {
      let updatedValue = Object.assign({}, value, { generation: generationCounter });
      this.models.set(key, updatedValue);
    }

    for (let key of this.models.keys()) {
      let entry = this.models.get(key);
      if (entry.generation < generationCounter) {
        this.models.set(key, Object.assign({}, entry, {
          model: null,
          generation: generationCounter
        }));
      }
    }



    await this.indexers.update({ forceRefresh: true });
    log.debug(`restored checkpoint ${id}`);
    return generationCounter;
  }

}

function copyMap(m) {
  let copy = new Map();
  for (let [key, value] of m.entries()) {
    copy.set(key, value);
  }
  return copy;
}
