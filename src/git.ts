import { execa } from "execa";

export function git(...args: string[]) {
	return execa('git', args);
}

export async function gitRevParseShowToplevel() {
	const result = await git('rev-parse', '--show-toplevel');
	return result.stdout;
}
