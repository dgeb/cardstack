const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Commit } = require('nodegit');

class IsoCommit {

  static lookup(repo, id) {
    return Commit.lookup(repo, id);
  }

  static create(repo, update_ref, author, committer, message_encoding, message, tree, parent_count, parents) {
    return Commit.create(repo, update_ref, author, committer, message_encoding, message, tree, parent_count, parents);
  }
}

module.exports = IsoCommit;
