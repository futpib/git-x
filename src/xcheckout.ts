import { ExecaError } from 'execa';
import { Context } from './context.js';
import { gitResolveBranch, gitString } from './git.js';

function parseWorktreePath(stderr: string): string | undefined {
	const match = stderr.match(/already used by worktree at '([^']+)'/);
	return match?.[1];
}

function isUnknownBranchError(error: unknown): boolean {
	if (!(error instanceof ExecaError)) {
		return false;
	}
	return /pathspec '.*' did not match/.test(error.stderr ?? '');
}

async function checkoutWithWorktreeRecovery(context: Context, branch: string): Promise<void> {
	try {
		await context.executeGit([ 'checkout', branch ], { stderr: 'pipe' });
	} catch (error: unknown) {
		if (!(error instanceof ExecaError)) {
			throw error;
		}

		const worktreePath = parseWorktreePath(error.stderr ?? '');

		if (!worktreePath) {
			throw error;
		}

		const commitHash = await gitString([ '-C', worktreePath, 'rev-parse', 'HEAD' ]);

		await context.executeGit([ '-C', worktreePath, 'checkout', '--detach', commitHash ]);

		await context.executeGit([ 'checkout', branch ]);
	}
}

export async function xcheckout(context: Context, branchGlob: string) {
	let branch: string;
	try {
		branch = await gitResolveBranch(context, branchGlob);
	} catch (originalError) {
		if (branchGlob !== 'master' && branchGlob !== 'main') {
			throw originalError;
		}

		const otherName = branchGlob === 'master' ? 'main' : 'master';

		for (const candidate of [ branchGlob, otherName ]) {
			try {
				await checkoutWithWorktreeRecovery(context, candidate);
				return;
			} catch (error) {
				if (!isUnknownBranchError(error)) {
					throw error;
				}
			}
		}

		throw originalError;
	}

	await checkoutWithWorktreeRecovery(context, branch);
}
