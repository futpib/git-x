import { execa } from "execa";
import readline from "readline";
import minimatch from 'minimatch';
import { Context } from "vm";

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
}

export async function gitRevParseShowToplevel() {
	const result = await git([ 'rev-parse', '--show-toplevel' ]);
	return result.stdout;
}

export function gitBranchList() {
	return gitLines([ 'for-each-ref', '--format=%(refname:short)', 'refs/heads/' ]);
}

export async function gitResolveBranch(_context: Context, branchGlob: string) {
	const matchingBranches = [];

	for await (const branch of gitBranchList()) {
		if (branch.includes(branchGlob) || minimatch(branch, branchGlob)) {
			matchingBranches.push(branch);
		}
	}

	if (matchingBranches.length === 0) {
		throw new Error(`No branches match ${branchGlob}.`);
	}

	if (matchingBranches.length > 1) {
		console.error('Matching branches:\n', matchingBranches.join('\n'));
		throw new Error(`Too many branches match ${branchGlob}.`);
	}

	return matchingBranches[0];
}
