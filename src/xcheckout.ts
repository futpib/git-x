import { gitResolveBranch } from './git.js';
import { resultExecuteGit } from './result.js';

export async function * xcheckout(branchGlob: string) {
	const branch = yield * gitResolveBranch(branchGlob);

	yield resultExecuteGit([ 'checkout', branch ]);
}
