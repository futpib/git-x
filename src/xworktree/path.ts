import fs from 'fs/promises';
import { Context } from '../context.js';
import { gitRevParseShowToplevel } from "../git.js";

export async function xworktreePath(_context: Context, indexString: undefined | string) {
	indexString = indexString || '0';
	const indexSuffix = indexString === '0' ? undefined : `.${indexString}`;

	const toplevel = await gitRevParseShowToplevel();
	const toplevelWithoutIndex = toplevel.replace(/\.\d+$/, '');
	const targetToplevel = toplevelWithoutIndex + (indexSuffix ?? '');

	try {
		const targetToplevelStat = await fs.stat(targetToplevel);

		if (targetToplevelStat.isDirectory()) {
			console.log(targetToplevel);
		} else {
			console.log(toplevel);
			throw new Error(`${targetToplevel} is not a directory`);
		}
	} catch (error) {
		if (error instanceof Error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.log(toplevel);
			}
		}

		throw error;
	}
}
