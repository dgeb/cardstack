const git = require("isomorphic-git");
const fs = require('fs');
// git.plugins.set('fs', fs);

const { Repository } = require('nodegit');

class IsoRepository {
  constructor(path) {
    this.path = path;
  }

  static open(path) {
		// should throw if the repo at this path doesn't exist/isn't a git repo
		// return new this(path);
		return Repository.open(path);
	}
	
	static init(dir, isBare) {
	// 	// const bare =  isBare === 1 ? true : false;
	// 	// await git.init( { dir, bare } );
	// 	// return new this(dir);
		return Repository.init(dir, isBare);
	}
}

module.exports = IsoRepository;
