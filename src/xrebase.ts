import { Context } from './context.js';
import { gitResolveBranch } from './git.js';

export async function xrebase(context: Context, upstreamGlob: string, topicGlobs: string[]) {
	const upstreamBranch = await gitResolveBranch(context, upstreamGlob);
	const topicBranches = [];

	for (const topicGlob of topicGlobs) {
		topicBranches.push(await gitResolveBranch(context, topicGlob));
	}

	let currentUpstreamBranch = upstreamBranch;
	let currentTopicBranch = topicBranches.shift();

	while (currentTopicBranch) {
		await context.executeGit([ 'rebase', currentUpstreamBranch, currentTopicBranch ]);
		currentUpstreamBranch = currentTopicBranch;
		currentTopicBranch = topicBranches.shift();
	}
}
