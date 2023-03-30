import { Context } from '../context.js';
import { gitRevParseShowToplevel } from "../git.js";

export async function xworktreeAdd(context: Context, indexString: undefined | string) {
	indexString = indexString || '0';
	const indexSuffix = indexString === '0' ? undefined : `.${indexString}`;

	const toplevel = await gitRevParseShowToplevel();
	const toplevelWithoutIndex = toplevel.replace(/\.\d+$/, '');
	const targetToplevel = toplevelWithoutIndex + (indexSuffix ?? '');

	await context.executeGit([ 'worktree', 'add', targetToplevel ]);
}
