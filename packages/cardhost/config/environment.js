'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: '@cardstack/cardhost',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
        EMBER_NATIVE_DECORATOR_SUPPORT: true,
        EMBER_METAL_TRACKED_PROPERTIES: true,
        EMBER_GLIMMER_ANGLE_BRACKET_NESTED_LOOKUP: true,
        EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS: true,
        EMBER_GLIMMER_FN_HELPER: true,
        EMBER_GLIMMER_ON_MODIFIER: true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      },

    },
    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
    cardTemplates: JSON.parse(process.env.CARD_TEMPLATES || null) || []
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.cardTemplates = JSON.parse(process.env.CARD_TEMPLATES || null) ||
      ['local-hub::location-card', 'local-hub::event-card'];
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;

    ENV.cardTemplates = JSON.parse(process.env.CARD_TEMPLATES || null) ||
      ['local-hub::location-card'];
  }

  // if (environment === 'production') {

  // }

  return ENV;
};
