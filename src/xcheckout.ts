import minimatch from 'minimatch';
import { gitBranchList } from './git.js';
import { resultExecuteGit } from './result.js';

export async function * xcheckout(branchGlob: string) {
	const branches = gitBranchList();

	const matchingBranches = [];

	for await (const branch of branches) {
		if (branch === branchGlob || minimatch(branch, branchGlob)) {
			matchingBranches.push(branch);
		}
	}

	if (matchingBranches.length === 0) {
		throw new Error('No matching branches.');
	}

	if (matchingBranches.length > 1) {
		throw new Error('Too many matching branches.');
	}

	yield resultExecuteGit([ 'checkout', matchingBranches[0] ]);
}
