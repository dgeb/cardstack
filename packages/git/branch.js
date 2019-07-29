const git = require("isomorphic-git");
const fs = require('fs');
git.plugins.set('fs', fs);
const { Branch } = require('nodegit');

class IsoBranch {
  constructor(repo, branch) {
    this.repo = repo;
    this.branch = branch;

  }

  static lookup(repo, branch, branchType) {
    // return new this(repo, branch);
    let branchTypeCode = branchType === 'remote' ? Branch.BRANCH.REMOTE : Branch.BRANCH.LOCAL;
    return Branch.lookup(repo, branch, branchTypeCode);
  }

  static create(repo, branch_name, target, force) {
    return Branch.create(repo, branch_name, target, force);
  }
}

module.exports = IsoBranch;
