#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import { xworktreePath } from './xworktree/path.js';
import { xcheckout } from './xcheckout.js';
import { TolerableError } from './utils.js';
import { ActionResult, outputActionResult } from './result.js';
import { xrebase } from './xrebase.js';

type Action = (...args: any[]) => ActionResult;

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

program
	.command('xcheckout')
	.argument('<branch>')
	.action(wrapAction(xcheckout));

program
	.command('xrebase')
	.argument('<upstream>')
	.argument('[topics...]')
	.action(wrapAction(xrebase));

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
