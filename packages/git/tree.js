const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Tree } = require('nodegit');

class IsoTree {
 static lookup(repo, id, callback) {
    return Tree.lookup(repo, id, callback)
 }
}

module.exports = IsoTree;