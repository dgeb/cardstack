const Error = require('@cardstack/plugin-utils/error');
const Session = require('@cardstack/plugin-utils/session');
const { declareInjections } = require('@cardstack/di');
const { partition, uniqWith, isEqual, uniq } = require('lodash');
const { resolveDocument } = require('@cardstack/plugin-utils/card-utils');

module.exports = declareInjections({
  schemaLoader: 'hub:schema-loader',
  searchers: 'hub:searchers',
},

class Schema {
  static create(opts) {
    return new this(opts);
  }

  constructor({ types, fields, computedFields, dataSources, inputModels, plugins, schemaLoader, searchers, grants }) {
    this._types = types;
    this._realFields = fields;
    this._computedFields = computedFields;
    this.__realAndComputedFields = null;
    this._dataSources = dataSources;
    this._mapping = null;
    this._customAnalyzers = null;
    this._originalModels = inputModels;
    this._allGrants = grants;
    this._abstractRealms = null;
    this.plugins = plugins;
    this.schemaLoader = schemaLoader;
    this.searchers = searchers;
  }

  get _realAndComputedFields() {
    if (!this.__realAndComputedFields) {
      let m = new Map();
      for (let [id, field] of this._realFields) {
        m.set(id, field);
      }
      for (let [id, computed] of this._computedFields) {
        m.set(id, computed.virtualField);
      }
      this.__realAndComputedFields = m;
    }
    return this.__realAndComputedFields;
  }

  // Ultimately I think we'll want these getters to be async,
  // let's tackle that in a future refactor...
  getRealAndComputedFields() {
    return this._realAndComputedFields;
  }

  getRealAndComputedField(id) {
    return this._realAndComputedFields.get(id);
  }

  getTypes() {
    return this._types;
  }

  getType(id) {
    return this._types.get(id);
  }

  getRealFields() {
    return this._realFields;
  }

  getRealField(id) {
    return this._realFields.get(id);
  }

  getDataSources() {
    return this._dataSources;
  }

  getDataSource(id) {
    return this._dataSources.get(id);
  }

  equalTo(otherSchema) {
    return otherSchema && isEqual(
      new Set(this._originalModels),
      new Set(otherSchema._originalModels)
    );
  }

  async teardown() {
    for (let source of this.getDataSources().values()) {
      await source.teardown();
    }
  }

  isSchemaType(type) {
    return this.schemaLoader.ownTypes().includes(type);
  }

  withOnlyRealFields(doc) {
    let activeDoc = doc;
    for (let section of ['attributes', 'relationships']) {
      if (!doc[section]) {
        continue;
      }
      for (let fieldName of Object.keys(doc[section])) {
        if (!this.getRealFields().has(fieldName)) {
          if (activeDoc === doc) {
            activeDoc = Object.assign({}, doc);
          }
          if (activeDoc[section] === doc[section]) {
            activeDoc[section] = Object.assign({}, doc[section]);
          }
          delete activeDoc[section][fieldName];
        }
      }
    }
    return activeDoc;
  }

  async authorizedCreatableContentTypes(session=Session.EVERYONE) {
    let authorizedTypes = [];
    for (let [ typeName, contentType ] of this.getTypes().entries()) {
      let canCreate = await contentType.authorizedToCreateResource({ session });
      if (canCreate) {
        authorizedTypes.push(typeName);
      }
    }
    return authorizedTypes;
  }

  // derives a new schema by adding, updating, or removing
  // models. Takes a list of { type, id, document } objects. A null document
  // means deletion.
  async applyChanges(changes) {
    let models = this._originalModels;
    for (let change of changes) {
      let { type, id, document } = change;
      if (!this.isSchemaType(type)) {
        // not a schema model, so we can ignore it
        continue;
      }
      models = models.filter(m => m.type !== type || m.id !== id);
      if (document) {
        models.push(document);
      }
    }
    if (models === this._originalModels) {
      return this;
    } else {
      return this.schemaLoader.loadFrom(models);
    }
  }

  async validationErrors(pendingChange, context={}) {
    try {
      await this.validate(pendingChange, context);
      return [];
    } catch (err) {
      if (!err.isCardstackError) { throw err; }
      if (err.additionalErrors) {
        return [err].concat(err.additionalErrors);
      } else {
        return [err];
      }
    }
  }

  // TODO push the card specific reasoning out of this layer
  async validate(pendingChange, context={}) {
    let type, id;
    if (pendingChange.finalDocument) {
      let document = resolveDocument(pendingChange.finalDocument);
      // Create or update: check basic request document structure.
      this._validateDocumentStructure(document, context);
      ({ type, id } = document);
    } else {
      // Deletion. There's no request document to check.
      let document = resolveDocument(pendingChange.originalDocument);
      ({ type, id } = document);
    }

    let contentType = this.getType(type);
    if (!contentType) {
      throw new Error(`"${type}" is not a valid type`, {
        status: 400,
        source: { pointer: '/data/type' }
      });
    }
    await contentType.validate(pendingChange, context);


    // Safety check: the change we're about to approve is a schema
    // change. The following will deliberately blow up if the new
    // schema hits a bug anywhere in schema instantiation. Better to
    // serve a 500 here than accept the broken schema and serve 500s
    // to everyone.
    let newSchema = await this.applyChanges([{type, id, document: pendingChange.finalDocument}]);
    if (newSchema !== this) {
      return newSchema;
    }
  }

  _validateDocumentStructure(document, context) {
    if (!document.type) {
      throw new Error(`missing required field "type"`, {
        status: 400,
        source: { pointer: '/data/type' }
      });
    }

    if (context.type != null) {
      if (document.type !== context.type) {
        throw new Error(`the type "${document.type}" is not allowed here`, {
          status: 409,
          source: { pointer: '/data/type' }
        });
      }
    }

    if (context.id != null) {
      if (!document.id) {
        throw new Error('missing required field "id"', {
          status: 400,
          source: { pointer: '/data/id' }
        });
      }
      if (String(document.id) !== context.id) {
        throw new Error('not allowed to change "id"', {
          status: 403,
          source: { pointer: '/data/id' }
        });
      }
    }
  }

  customAnalyzers() {
    if (!this._customAnalyzers) {

      let allAnalyzers;
      for (let contentType of this.getTypes().values()) {
        let analyzers = contentType.customAnalyzers();
        if (analyzers) {
          if (!allAnalyzers) {
            allAnalyzers = {};
          }
          Object.assign(allAnalyzers, analyzers);
        }
      }

      if (allAnalyzers) {
        this._customAnalyzers = allAnalyzers;
      }
    }

    return this._customAnalyzers;
  }

  async hasLoginAuthorization(potentialSession=Session.EVERYONE) {
    let userRealms = await potentialSession.realms();

    if (!potentialSession.type) {
      return;
    }

    let userType = this.getType(potentialSession.type);
    if (!userType) {
      return;
    }

    return await userType.hasLoginAuthorization(userRealms);
  }

  async authorizedReadRealms(type, documentContext) {
    let contentType = this.getType(type);
    if (contentType) {
      return await contentType.authorizedReadRealms(documentContext);
    } else {
      return [];
    }
  }

  // This gives us the complete set of realms that are in use by this
  // schema. They are "abstract" because they can be data-dependent.
  abstractRealms() {
    if (!this._abstractRealms) {
      this._abstractRealms = uniqWith(this._allGrants.map(({ who }) => {
        let [statics, dynamics] = partition(who, (entry) => entry.staticRealm);
        return {
          statics: statics.map(s => s.staticRealm),
          dynamicSlots: dynamics.length
        };
      }), isEqual);
    }
    return this._abstractRealms;
  }

  async userRealms(documentContext) {
    let contentType = this.getType(documentContext.type);
    if (!contentType || !contentType.isGroupable()) {
      return;
    }
    let groups = (await contentType.groups(documentContext)).map(group => Session.encodeBaseRealm('groups', group.id));
    let ownBaseRealm = Session.encodeBaseRealm(documentContext.type, documentContext.id);
    if (groups.length === 0) {
      // if you're not in any groups, only your own base realm matters
      return [ownBaseRealm];
    } else {
      // this finds all the in-use abstract realms that the user
      // (represented by `doc`) might have access to, based on the
      // static group requirements in each one.
      let hits = this.abstractRealms().filter(abstractRealm => abstractRealm.statics.every(realm => groups.includes(realm)));

      // And this fills in any dynamic slots with our own base realm,
      // which is the only case I'm supporting for now. We could
      // support more full combinatoric expansion so that dynamic
      // slots can be filled with groups, but I don't need that
      // feature and it's potentially expensive.
      return hits.map(abstractRealm => {
        if (abstractRealm.dynamicSlots > 0) {
          return uniq([...abstractRealm.statics, ownBaseRealm]).sort().join('/');
        } else {
          return uniq(abstractRealm.statics).sort().join('/');
        }
      });
    }

  }


});
