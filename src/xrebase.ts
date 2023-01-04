import { gitResolveBranch } from './git.js';
import { resultExecuteGit } from './result.js';

export async function * xrebase(upstreamGlob: string, topicGlobs: string[]) {
	const upstreamBranch = yield * gitResolveBranch(upstreamGlob);
	const topicBranches = [];

	for (const topicGlob of topicGlobs) {
		topicBranches.push(yield * gitResolveBranch(topicGlob));
	}

	let currentUpstreamBranch = upstreamBranch;
	let currentTopicBranch = topicBranches.shift();

	while (currentTopicBranch) {
		yield resultExecuteGit([ 'rebase', currentUpstreamBranch, currentTopicBranch ]);
		currentUpstreamBranch = currentTopicBranch;
		currentTopicBranch = topicBranches.shift();
	}
}
