import { execa } from "execa";

async function executeGit(args: string[]) {
	console.error('+', 'git', ...args);

	await execa('git', args, {
		stdio: 'inherit',
	});
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
	executeGit(args: string[]): Promise<void>;
	executePatch(args: string[], options: PatchOptions): Promise<void>;
}

export function createContext(): Context {
	return {
		executeGit,
		executePatch,
	}
}
