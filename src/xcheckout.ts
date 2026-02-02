import { ExecaError } from 'execa';
import { Context } from './context.js';
import { gitResolveBranch, gitString } from './git.js';

function parseWorktreePath(stderr: string): string | undefined {
	const match = stderr.match(/already used by worktree at '([^']+)'/);
	return match?.[1];
}

export async function xcheckout(context: Context, branchGlob: string) {
	const branch = await gitResolveBranch(context, branchGlob);

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
