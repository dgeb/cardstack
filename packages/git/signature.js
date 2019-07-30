const git = require('isomorphic-git');
const fs = require('fs');
git.plugins.set('fs', fs);
const  { Signature } = require('nodegit');

class IsoSignature {

    static create(name, email, time, offset) {
			return Signature.create(name, email, time, offset)
		}

}

module.exports = IsoSignature;