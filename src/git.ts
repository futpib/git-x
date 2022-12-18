import { execa } from "execa";
import readline from "readline";

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
