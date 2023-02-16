import { Context } from './context.js';
import { gitResolveBranch } from './git.js';

export async function xcheckout(context: Context, branchGlob: string) {
	const branch = await gitResolveBranch(context, branchGlob);

	await context.executeGit([ 'checkout', branch ]);
}
