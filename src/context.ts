import { execa, ExecaError } from "execa";

type GitOptions = {
	stderr?: 'pipe' | 'inherit';
};

async function executeGit(args: string[], {
	stderr,
}: GitOptions = {}) {
	console.error('+', 'git', ...args);

	try {
		const result = await execa('git', args, {
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: stderr ?? 'inherit',
		});

		if (result.stderr) {
			console.error(result.stderr);
		}
	} catch (error) {
		if (stderr === 'pipe' && error instanceof ExecaError && error.stderr) {
			console.error(error.stderr);
		}

		throw error;
	}
}

type PatchOptions = {
	input?: string;
};

async function executePatch(args: string[], { input }: PatchOptions) {
	console.error('+', 'patch', ...args);

	await execa('patch', args, {
		stdout: 'inherit',
		stderr: 'inherit',
		input,
	});
}

export interface Context {
	executeGit(args: string[], options?: GitOptions): Promise<void>;
	executePatch(args: string[], options: PatchOptions): Promise<void>;
}

export function createContext(): Context {
	return {
		executeGit,
		executePatch,
	}
}
