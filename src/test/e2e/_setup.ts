import type { Implementation, TestFn } from 'ava';
import { execa, ExecaReturnValue } from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

const { PATH } = process.env;

export interface TestContext {
	packageJson: {
		name: string;
		bin: Record<string, string>;
	},

	tempDirPath: string;

	exec: (...args: string[]) => Promise<ExecaReturnValue>;

	toRelative: (absolute: string) => string;

	changeWorkingDirectory: (path: string) => Promise<void>;
}

const before: Implementation<[], TestContext> = async t => {
	const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));

	const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), [ packageJson.name, 'e2e-test', '' ].join('-')));

	console.log(tempDirPath);

	Object.assign(t.context, {
		packageJson,
		tempDirPath,
	});
};

const beforeEach: Implementation<[], TestContext> = async t => {
	const { tempDirPath, packageJson } = t.context;

	const binariesPath = path.join(tempDirPath, 'binaries');
	const repositoriesPath = path.join(tempDirPath, 'repositories');
	const repositoryPath = path.join(repositoriesPath, 'repository');

	await fs.mkdir(binariesPath);
	await fs.mkdir(repositoriesPath);
	await fs.mkdir(repositoryPath);

	for (const [ executable, sourceRelativePath ] of Object.entries(packageJson.bin as Record<string, string>)) {
		const executablePath = path.join(binariesPath, executable);
		const sourcePath = await fs.realpath(sourceRelativePath);
		await fs.symlink(sourcePath, executablePath);
	}

	let currentWorkingDirectory = repositoryPath;

	function exec(command: string, ...args: string[]) {
		return execa(command, args, {
			env: {
				PATH: [ binariesPath, PATH ].join(path.delimiter),
			},
			cwd: currentWorkingDirectory,
		});
	}

	function toRelative(absolute: string) {
		return path.relative(currentWorkingDirectory, absolute);
	}

	async function changeWorkingDirectory(path: string) {
		const { stdout } = await exec('realpath', path);
		currentWorkingDirectory = stdout;
	}

	await exec('git', 'init');
	await exec('git', 'config', 'user.email', 'you@example.com');
	await exec('git', 'config', 'user.name', 'Your Name');
	await exec('git', 'commit', '--allow-empty', '--message', 'initial commit');

	Object.assign(t.context, {
		exec,
		toRelative,
		changeWorkingDirectory,
	});
};

export function setup(anyTest: TestFn<unknown>): TestFn<TestContext> {
	const test = anyTest as TestFn<TestContext>;

	test.before(before);
	test.beforeEach(beforeEach);

	return test;
}
