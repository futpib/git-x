import fs from 'fs/promises';
import { gitRevParseShowToplevel } from "../git.js";
import { TolerableError } from '../utils.js';

export async function xworktreePath(indexString: undefined | string) {
	indexString = indexString || '0';
	const indexSuffix = indexString === '0' ? undefined : `.${indexString}`;

	const toplevel = await gitRevParseShowToplevel();
	const toplevelWithoutIndex = (
		(indexSuffix && toplevel.endsWith(indexSuffix))
			? toplevel.split('.').slice(0, -1).join('.')
			: toplevel
	);
	const targetToplevel = toplevelWithoutIndex + (indexSuffix ?? '');

	try {
		const targetToplevelStat = await fs.stat(targetToplevel);

		if (targetToplevelStat.isDirectory()) {
			return targetToplevel;
		} else {
			throw new TolerableError(toplevel, new Error(`${targetToplevel} is not a directory`));
		}
	} catch (error) {
		if (error instanceof Error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new TolerableError(toplevel, error);
			}
		}

		throw error;
	}
}
