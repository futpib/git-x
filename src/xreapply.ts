import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import openEditor from 'open-editor';
import { Context } from './context.js';
import { gitRevParseShowToplevel, gitShow } from './git.js';

export async function xreapply(context: Context, commit: string, {
	commit: shouldCommit = true,
}: {
	commit?: boolean;
} = {}) {
	const diff = await gitShow(commit);

	const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), [ 'git', 'xreapply' ].join('-')));
	const tempFilePath = path.join(tempDirPath, [ commit, 'patch' ].join('.'));

	await fs.writeFile(tempFilePath, diff);

	await openEditor([ tempFilePath ], {
		wait: true,
	});

	const editedDiff = await fs.readFile(tempFilePath, 'utf8');

	const toplevel = await gitRevParseShowToplevel();

	await context.executePatch([
		'--strip', '1',
		'--directory', toplevel,
	], {
		input: editedDiff,
	});

	if (!shouldCommit) {
		return;
	}

	await context.executeGit([
		'add', '--all',
	]);

	await context.executeGit([
		'commit',
		'--reedit-message', commit,
	]);
}
