import { execa } from "execa";
import readline from "readline";
import minimatch from 'minimatch';

export function git(args: string[]) {
	return execa('git', args);
}

export async function * gitLines(args: string[]) {
	const subprocess = execa('git', args);

	const lines = subprocess.stdout && readline.createInterface({
		input: subprocess.stdout,
		crlfDelay: Infinity,
	});

	for await (const line of (lines ?? [])) {
		if (line.trim()) {
			yield line;
		}
	}

	await subprocess;
}

export async function gitRevParseShowToplevel() {
	const result = await git([ 'rev-parse', '--show-toplevel' ]);
	return result.stdout;
}

export function gitBranchList() {
	return gitLines([ 'for-each-ref', '--format=%(refname:short)', 'refs/heads/' ]);
}

export async function * gitResolveBranch(branchGlob: string) {
	const branches = gitBranchList();

	const matchingBranches = [];

	for await (const branch of branches) {
		if (branch.includes(branchGlob) || minimatch(branch, branchGlob)) {
			matchingBranches.push(branch);
		}
	}

	if (matchingBranches.length === 0) {
		throw new Error(`No branches match ${branchGlob}.`);
	}

	if (matchingBranches.length > 1) {
		yield 'Matching branches:';
		yield * matchingBranches;
		throw new Error(`Too many branches match ${branchGlob}.`);
	}

	return matchingBranches[0];
}
