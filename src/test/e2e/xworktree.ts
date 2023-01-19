import anyTest, { TestFn } from 'ava';
import { execa, ExecaError, ExecaReturnValue } from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

const { PATH } = process.env;

interface TestContext {
	packageJson: {
		name: string;
		bin: Record<string, string>;
	},

	tempDirPath: string;

	exec: (...args: string[]) => Promise<ExecaReturnValue>;

	toRelative: (absolute: string) => string;

	changeWorkingDirectory: (path: string) => Promise<void>;
}

const test = anyTest as TestFn<TestContext>;

test.before(async t => {
	const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));

	const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), [ packageJson.name, 'e2e-test', '' ].join('-')));

	console.log(tempDirPath);

	Object.assign(t.context, {
		packageJson,
		tempDirPath,
	});
});

test.beforeEach(async t => {
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
});

test('xworktree', async t => {
	const { exec, toRelative, changeWorkingDirectory } = t.context;

	const resultA0 = await exec('git', 'xworktree', 'path', '0');
	const resultA1 = await t.throwsAsync(() => exec('git', 'xworktree', 'path', '1'), {
		message: /exit code 1:/,
	}) as ExecaError;

	t.is(toRelative(resultA0.stdout), '');
	t.is(toRelative(resultA1.stdout), '');

	await exec('git', 'worktree', 'add', '../repository.1');

	const resultB0 = await exec('git', 'xworktree', 'path', '0');
	const resultB1 = await exec('git', 'xworktree', 'path', '1');

	t.is(toRelative(resultB0.stdout), '');
	t.is(toRelative(resultB1.stdout), '../repository.1');

	await changeWorkingDirectory('../repository.1');

	const resultC0 = await exec('git', 'xworktree', 'path', '0');
	const resultC1 = await exec('git', 'xworktree', 'path', '1');

	t.is(toRelative(resultC0.stdout), '../repository');
	t.is(toRelative(resultC1.stdout), '');
});
