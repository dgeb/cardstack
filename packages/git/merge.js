const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Merge } = require('nodegit');

class IsoMerge {

  static commits(repo, ourCommit, theirCommit, options) {
    return Merge.commits(repo, ourCommit, theirCommit, options);
  }

  static base(repo, one, two) {
    return Merge.base(repo, one, two);
  }
}

module.exports = IsoMerge;