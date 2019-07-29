const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Reset } = require('nodegit');

module.exports = function(repo, target, resetType, opts) {
  return Reset.reset(repo, target, resetType, opts);
};