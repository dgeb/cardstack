const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Reference } = require('nodegit');

class IsoReference {

  static nameToId(repo, name) {
    return Reference.nameToId(repo, name);
  }
}

module.exports = IsoReference;
