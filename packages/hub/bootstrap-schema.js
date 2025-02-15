const featureTypes = require('./plugin-loader').types();

const models = [
  {
    /* This is the content-type content-type. Mindblown. */
    type: 'content-types',
    id: 'content-types',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'data-source' },
          { type: 'fields', id: 'fields' },
          { type: 'fields', id: 'is-built-in' },
          { type: 'fields', id: 'routing-field' },
          { type: 'fields', id: 'default-includes' },
          { type: 'fields', id: 'fieldsets' },
          { type: 'fields', id: 'fieldset-expansion-format' },
          { type: 'fields', id: 'router' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'fields',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'field-type' },
          { type: 'fields', id: 'related-types' },
          { type: 'fields', id: 'default-at-create' },
          { type: 'fields', id: 'default-at-update' },
          { type: 'fields', id: 'caption' },
          { type: 'fields', id: 'searchable' },
          { type: 'fields', id: 'editor-component'},
          { type: 'fields', id: 'editor-options'},
          { type: 'fields', id: 'inline-editor-component'},
          { type: 'fields', id: 'inline-editor-options'},
          { type: 'fields', id: 'is-metadata'},
          { type: 'fields', id: 'needed-when-embedded'},
          { type: 'fields', id: 'constraints'},
          { type: 'fields', id: 'instructions'},
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'computed-fields',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'computed-field-type' },
          { type: 'fields', id: 'caption' },
          { type: 'fields', id: 'searchable' },
          { type: 'fields', id: 'params' },
          { type: 'fields', id: 'is-metadata'},
          { type: 'fields', id: 'needed-when-embedded'},
          { type: 'fields', id: 'instructions'},
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'constraints',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'constraint-type' },
          { type: 'fields', id: 'inputs' },
          { type: 'fields', id: 'input-assignments' },
          { type: 'fields', id: 'error-message' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'default-values',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'value' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'grants',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'who' },
          { type: 'fields', id: 'may-create-resource' },
          { type: 'fields', id: 'may-read-resource' },
          { type: 'fields', id: 'may-update-resource' },
          { type: 'fields', id: 'may-delete-resource' },
          { type: 'fields', id: 'may-read-fields' },
          { type: 'fields', id: 'may-write-fields' },
          { type: 'fields', id: 'may-login' },
          { type: 'fields', id: 'types' },
          { type: 'fields', id: 'fields' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'permissions',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'may-update-resource' },
          { type: 'fields', id: 'may-delete-resource' },
          { type: 'fields', id: 'writable-fields' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'plugins',
    attributes: {
      'is-built-in': true,
      'default-includes': ['features']
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'features' },
          { type: 'fields', id: 'config' },
          { type: 'computed-fields', id: 'plugin-enabled' }
        ]
      },
      'data-source': {
        data: { type: 'data-sources', id: 'plugins' }
      }
    }
  },
  {
    type: 'content-types',
    id: 'plugin-configs',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'enabled' },
          { type: 'fields', id: 'plugin-config' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'data-sources',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'source-type' },
          { type: 'fields', id: 'params' },
          { type: 'fields', id: 'user-rewriter' },
          { type: 'fields', id: 'user-correlation-query' },
          { type: 'fields', id: 'may-create-user' },
          { type: 'fields', id: 'may-update-user' },
          { type: 'fields', id: 'token-expiry-seconds' },
          { type: 'fields', id: 'card-types' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'message-sinks',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'messenger-type' },
          { type: 'fields', id: 'params' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'groups',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'search-query' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'user-realms',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'user' },
          { type: 'fields', id: 'realms' }
        ]
      }
    }
  },
  {
    type: 'content-types',
    id: 'input-assignments',
    attributes: {
      'is-built-in': true
    },
    relationships: {
      fields: {
        data: [
          { type: 'fields', id: 'input-name' },
          { type: 'fields', id: 'field' }
        ]
      }
    }
  },
  {
    type: 'fields',
    id: 'adopted-from',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    }
  },
  {
    type: 'fields',
    id: 'edit-template',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'isolated-template',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'embedded-template',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'edit-js',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'isolated-js',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'embedded-js',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'edit-css',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'isolated-css',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'embedded-css',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'search-query',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'user',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    }
  },
  {
    type: 'fields',
    id: 'realms',
    attributes: {
      'field-type': '@cardstack/core-types::string-array'
    }
  },
  {
    type: 'fields',
    id: 'input-name',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'routing-field',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'default-includes',
    attributes: {
      'field-type': '@cardstack/core-types::string-array'
    }
  },
  {
    type: 'fields',
    id: 'fieldsets',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'fieldset-expansion-format',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'router',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'model',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    }
  },
  {
    type: 'fields',
    id: 'is-metadata',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'needed-when-embedded',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'computed-fields',
    id: 'metadata-summary',
    attributes: {
      'computed-field-type': '@cardstack/core-types::fields-summary',
      params: { 'format': 'isolated' }
    }
  },
  {
    type: 'computed-fields',
    id: 'embedded-metadata-summary',
    attributes: {
      'computed-field-type': '@cardstack/core-types::fields-summary',
      params: { 'format': 'embedded' }
    }
  },
  {
    type: 'computed-fields',
    id: 'internal-fields-summary',
    attributes: {
      'computed-field-type': '@cardstack/core-types::fields-summary',
      params: { 'format': 'internal' }
    }
  },
  {
    type: 'computed-fields',
    id: 'adoption-chain',
    attributes: {
      'computed-field-type': '@cardstack/core-types::adoption-chain',
    }
  },
  {
    type: 'fields',
    id: 'instructions',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'field-order',
    attributes: {
      'field-type': '@cardstack/core-types::string-array',
    }
  },
  {
    type: 'fields',
    id: 'placeholder',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'constraints',
    attributes: {
      'field-type': '@cardstack/core-types::has-many'
    }
  },
  {
    type: 'fields',
    id: 'may-create-user',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-update-user',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'token-expiry-seconds',
    attributes: {
      'field-type': '@cardstack/core-types::integer'
    }
  },
  {
    type: 'fields',
    id: 'source-type',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'card-types',
    attributes: {
      'field-type': '@cardstack/core-types::string-array'
    }
  },
  {
    type: 'fields',
    id: 'messenger-type',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'user-rewriter',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'user-correlation-query',
    attributes: {
      'field-type': '@cardstack/handlebars'
    }
  },
  {
    type: 'fields',
    id: 'type',
    attributes: {
      'field-type': '@cardstack/core-types::type'
    }
  },
  {
    type: 'fields',
    id: 'types',
    attributes: {
      'field-type': '@cardstack/core-types::has-many'
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'content-types' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'who',
    attributes: {
      'field-type': '@cardstack/core-types::has-many'
    }
    // I'm not restricting related-types here because it can include
    // whatever app-defined types are used to represent users. In
    // addition to those types, `who` can contain:
    //  - groups
    //  - fields (which adds a layer of indirection, and the value of
    //    the field in the object we are evaluating access for must be
    //    a relationship to one of the other things that are allowed
    //    in `who`).
  },
  {
    type: 'fields',
    id: 'id',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'is-built-in',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'params',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'value',
    attributes: {
      'field-type': '@cardstack/core-types::any'
    }
  },
  {
    type: 'fields',
    id: 'constraint-type',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'error-message',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'default-at-create',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'default-values' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'default-at-update',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'default-values' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'field-type',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'computed-field-type',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'caption',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'searchable',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'editor-component',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'editor-options',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'inline-editor-component',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'inline-editor-options',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'fields',
    attributes: {
      'field-type': '@cardstack/core-types::has-many',
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'fields' }, { type: 'content-types', id: 'computed-fields'}]
      }
    }
  },
  {
    type: 'fields',
    id: 'field',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to',
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'fields' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'writable-fields',
    attributes: {
      'field-type': '@cardstack/core-types::has-many',
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'fields' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'inputs',
    attributes: {
      'field-type': '@cardstack/core-types::object',
    }
  },
  {
    type: 'fields',
    id: 'input-assignments',
    attributes: {
      'field-type': '@cardstack/core-types::has-many',
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'input-assignments' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'related-types',
    attributes: {
      'field-type': '@cardstack/core-types::has-many',
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'content-types' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'data-source',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'data-sources' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'may-create-resource',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-read-resource',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-update-resource',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-delete-resource',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-read-fields',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-write-fields',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'may-login',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'fields',
    id: 'plugin',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    },
    relationships: {
      'related-types': {
        data: [{ type: 'content-types', id: 'plugins' }]
      }
    }
  },
  {
    type: 'fields',
    id: 'load-path',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'fields',
    id: 'features',
    attributes: {
      'field-type': '@cardstack/core-types::has-many'
    }
  },
  {
    type: 'fields',
    id: 'enabled',
    attributes: {
      'field-type': '@cardstack/core-types::boolean'
    }
  },
  {
    type: 'computed-fields',
    id: 'plugin-enabled',
    attributes: {
      'computed-field-type': '@cardstack/core-types::alias',
      params: {
        'aliasPath': 'config.enabled',
        'defaultValue': true
      }
    }
  },
  {
    type: 'fields',
    id: 'config',
    attributes: {
      'field-type': '@cardstack/core-types::belongs-to'
    }
  },
  {
    type: 'fields',
    id: 'plugin-config',
    attributes: {
      'field-type': '@cardstack/core-types::object'
    }
  },
  {
    type: 'fields',
    id: 'name',
    attributes: {
      'field-type': '@cardstack/core-types::string'
    }
  },
  {
    type: 'grants',
    id: 'hub-internal-grant',
    attributes: {
      'may-read-fields': true,
      'may-write-fields': true,
      'may-create-resource': true,
      'may-read-resource': true,
      'may-update-resource': true,
      'may-delete-resource': true,
      'may-login': true
    },
    relationships: {
      who: {
        data: [{ type: 'groups', id: '@cardstack/hub' }]
      }
    }
  },
  {
    type: 'data-sources',
    id: 'plugins',
    attributes: {
      'source-type': '@cardstack/hub::plugins'
    }
  },
  {
    type: 'data-sources',
    id: 'permissions',
    attributes: {
      'source-type': '@cardstack/hub::permissions',
    }
  },
  {
    type: 'data-sources',
    id: 'static-models',
    attributes: {
      'source-type': '@cardstack/hub::static-models'
    }
  },
  {
    type: 'data-sources',
    id: 'spaces',
    attributes: {
      'source-type': '@cardstack/routing'
    }
  },
  /*
  The `everyone` group handles users who do not get assigned a role, so they
  default to everyone. Use this grant for things like universal, anonymous
  read of public info. An entry here is required so that the searcher runs.
  Also see everyone-group.js.
  */
  {
    type: 'data-sources',
    id: 'everyone-group',
    attributes: {
      'source-type': '@cardstack/hub::everyone-group',
    }
  },

];

module.exports = models.concat(featureTypes.map(type => ({
  type: 'content-types',
  id: type,
  attributes: {
    'is-built-in': true
  },
  relationships: {
    fields: {
      data: [
        { type: 'fields', id: 'load-path' },
        { type: 'fields', id: 'plugin' }
      ]
    },
    'data-source': {
      data: { type: 'data-sources', id: 'plugins' }
    }
  }
})));
