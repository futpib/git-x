#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import { xworktreeStatus } from './xworktree/status.js';
import { xworktreePath } from './xworktree/path.js';
import { xworktreeAdd } from './xworktree/add.js';
import { xcheckout } from './xcheckout.js';
import { xrebase } from './xrebase.js';
import { xreapply } from './xreapply.js';
import { Context, createContext } from './context.js';

type Action = (context: Context, ...args: any[]) => Promise<void>;

function wrapAction(action: Action) {
	return async (...args: unknown[]) => {
		await action(createContext(), ...args);
	};
}

function normalizeArgv(argv: string[]): string[] {
	let [ nodePath, scriptPath, ...scriptArguments ] = argv
	const scriptBasename = path.basename(scriptPath);

	if (scriptBasename === 'cli.js') {
		const newScriptBasename = [ 'git', scriptArguments.shift() ].join('-');
		scriptPath = path.join(scriptPath, newScriptBasename);
	}

	return [ nodePath, scriptPath, ...scriptArguments ];
}

const programName = 'git-x';

const [ nodePath, scriptPath, ...scriptArguments ] = normalizeArgv(process.argv);
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

program
	.command('xreapply')
	.argument('<commit>')
	.option('--no-commit', 'do not commit')
	.option('--path [path]', 'reapply only changes to paths')
	.action(wrapAction(xreapply));

const xworktree = (
	program
		.command('xworktree')
);

xworktree
	.command('status')
	.action(wrapAction(xworktreeStatus));

xworktree
	.command('path')
	.argument('[index]')
	.action(wrapAction(xworktreePath));

xworktree
	.command('add')
	.argument('[index]')
	.action(wrapAction(xworktreeAdd));

const argv = [ nodePath, programName, subcommandName, ...scriptArguments ];

program.parse(argv);
