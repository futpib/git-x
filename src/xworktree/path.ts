import fs from 'fs/promises';
import { Context } from '../context.js';
import { gitRevParseShowToplevel } from "../git.js";

type CheckWorktreeIndexResult = {
	type: 'ok';
	targetToplevel: string;
} | {
	type: 'does-not-exist' | 'not-a-directory';
	toplevel: string;
	targetToplevel: string;
};

export async function xworktreeCheckWorktreeIndex(indexString: undefined | string): Promise<CheckWorktreeIndexResult> {
	indexString = indexString || '0';
	const indexSuffix = indexString === '0' ? undefined : `.${indexString}`;

	const toplevel = await gitRevParseShowToplevel();
	const toplevelWithoutIndex = toplevel.replace(/\.\d+$/, '');
	const targetToplevel = toplevelWithoutIndex + (indexSuffix ?? '');

	try {
		const targetToplevelStat = await fs.stat(targetToplevel);

		if (targetToplevelStat.isDirectory()) {
			return {
				type: 'ok',
				targetToplevel,
			};
		} else {
			return {
				type: 'not-a-directory',
				toplevel,
				targetToplevel,
			};
		}
	} catch (error) {
		if (error instanceof Error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return {
					type: 'does-not-exist',
					toplevel,
					targetToplevel,
				};
			}
		}

		throw error;
	}
}

export async function xworktreePath(_context: Context, indexString: undefined | string) {
	const result = await xworktreeCheckWorktreeIndex(indexString);

	if (result.type === 'ok') {
		console.log(result.targetToplevel);

		return;
	}

	if (result.type === 'does-not-exist') {
		console.log(result.toplevel);

		return;
	}

	if (result.type === 'not-a-directory') {
		console.log(result.toplevel);

		throw new Error(`${result.targetToplevel} is not a directory`);
	}

	throw new Error(`Unknown result type ${result.type}`);
}
