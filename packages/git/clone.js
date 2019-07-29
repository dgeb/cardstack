const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Clone } = require('nodegit');

module.exports = function(url, local_path, options) {
  return Clone(url, local_path, options);
};
