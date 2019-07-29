const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Cred } = require('nodegit');

class IsoCred {

  static sshKeyMemoryNew(username, publickey, privatekey, passphrase) {
    return Cred.sshKeyMemoryNew(username, publickey, privatekey, passphrase);
  }

  static sshKeyFromAgent(username) {
    return Cred.sshKeyFromAgent(username);
  }
}

module.exports = IsoCred;
