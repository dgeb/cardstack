const browser = require('./-browser');

module.exports = Object.assign({}, browser, {
  overrides: [
    // This loads our node rules
    Object.assign({}, require('./-node'), {
      // And applies them to all the paths that are node paths in a
      // standard ember-addon
      files: [
        'index.js',
        'testem.js',
        'ember-cli-build.js',
        'cardstack/**/*.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js',
        'tests/dummy/cardstack/**/*.js'
      ],
      excludedFiles: [
        'app/**',
        'addon/**',
        'tests/dummy/app/**'
      ]
    }),

    // And this loads our node tests rules
    Object.assign({}, require('./test'), {
      files: [
        'node-tests/**/*.js'
      ]
    })
  ]
});
