const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Remote } = require('nodegit');

class IsoRemote {
    static create(repo, name, url) {
        return Remote.create(repo, name, url);
    }
}

module.exports = IsoRemote;