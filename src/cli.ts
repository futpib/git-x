#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import { xworktreePath } from './xworktree/path.js';
import { TolerableError } from './utils.js';

export type ActionResult =
	| string
	| Promise<string>;

type Action = (...args: any[]) => ActionResult;

async function outputActionResult(actionResult: ActionResult) {
	const result = await actionResult;

	if (typeof result === 'string') {
		console.log(result);
	}
}

function wrapAction(action: Action) {
	return async (...args: unknown[]) => {
		try {
			const result = await action(...args);
			await outputActionResult(result);
		} catch (error) {
			if (error instanceof TolerableError) {
				await outputActionResult(error.result);
				program.error(error.message, { exitCode: 1 });
			}

			throw error;
		}
	};
}

const programName = 'git-x';

const [ nodePath, scriptPath, ...scriptArguments ] = process.argv;
const scriptName = path.basename(scriptPath);
const [ _gitName, subcommandName ] = scriptName.split('-');

program
	.name(programName);

const xworktree = (
	program
		.command('xworktree')
);

xworktree
	.command('path')
	.argument('[index]')
	.action(wrapAction(xworktreePath));

const argv = [ nodePath, programName, subcommandName, ...scriptArguments ];

program.parse(argv);
