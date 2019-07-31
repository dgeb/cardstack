const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Remote } = require('nodegit');

class IsoRemote {
    static async create(repo, name, url) {
        await git.addRemote({fs, remote: name, url, gitdir: repo.path()});
        return Remote.lookup(repo, name);
    }
}

module.exports = IsoRemote;