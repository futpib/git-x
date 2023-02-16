import { execa } from "execa";

async function executeGit(args: string[]) {
	console.error('+', 'git', ...args);

	await execa('git', args, {
		stdio: 'inherit',
	});
}

export interface Context {
	executeGit(args: string[]): Promise<void>;
}

export function createContext(): Context {
	return {
		executeGit,
	}
}
