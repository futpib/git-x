import anyTest from 'ava';
import { ExecaError } from 'execa';
import { setup } from './_setup.js';

const test = setup(anyTest);

test('xcheckout', async t => {
	const { exec } = t.context;

	const branches = {
		branch1: [
			'branch1',
			'1',
			'*1',
		],
		branch2: [
			'branch2',
			'2',
			'*2',
		],
	};

	for (const branch of Object.keys(branches)) {
		await exec('git', 'checkout', '-b', branch);
	}

	await exec('git', 'checkout', 'master');

	for (const [ branch, patterns ] of Object.entries(branches)) {
		for (const pattern of patterns) {
			const xcheckoutResult = await exec('git', 'xcheckout', pattern);

			t.is(xcheckoutResult.stdout, '')
			t.snapshot(xcheckoutResult.stderr, `stderr of \`${xcheckoutResult.escapedCommand}\``);

			const currentBranchResult = await exec('git', 'branch', '--show-current');

			t.is(currentBranchResult.stdout, branch);

			await exec('git', 'checkout', 'master');
		}
	}
});

test('xcheckout exact match with ambiguous prefix', async t => {
	const { exec } = t.context;

	await exec('git', 'checkout', '-b', 'feature/foo');
	await exec('git', 'checkout', '-b', 'feature/foo-bar');
	await exec('git', 'checkout', 'master');

	await exec('git', 'xcheckout', 'feature/foo');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'feature/foo');
});

test('xcheckout master falls back to local main', async t => {
	const { exec } = t.context;

	await exec('git', 'branch', '-m', 'master', 'main');

	await exec('git', 'checkout', '-b', 'feature');
	await exec('git', 'checkout', 'main');

	await exec('git', 'checkout', 'feature');

	await exec('git', 'xcheckout', 'master');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'main');
});

test('xcheckout main falls back to local master', async t => {
	const { exec } = t.context;

	await exec('git', 'checkout', '-b', 'feature');
	await exec('git', 'checkout', 'master');

	await exec('git', 'checkout', 'feature');

	await exec('git', 'xcheckout', 'main');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'master');
});

test('xcheckout prefers master when both master and main exist', async t => {
	const { exec } = t.context;

	await exec('git', 'checkout', '-b', 'main');
	await exec('git', 'checkout', 'master');
	await exec('git', 'checkout', '-b', 'feature');

	await exec('git', 'xcheckout', 'master');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'master');
});

test('xcheckout main prefers main when both master and main exist', async t => {
	const { exec } = t.context;

	await exec('git', 'checkout', '-b', 'main');
	await exec('git', 'checkout', 'master');
	await exec('git', 'checkout', '-b', 'feature');

	await exec('git', 'xcheckout', 'main');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'main');
});

test('xcheckout master falls back to remote main', async t => {
	const { exec, tempDirPath } = t.context;

	const remotePath = `${tempDirPath}/remote.git`;
	await exec('git', 'init', '--bare', remotePath);

	await exec('git', 'branch', '-m', 'master', 'main');
	await exec('git', 'remote', 'add', 'origin', remotePath);
	await exec('git', 'push', 'origin', 'main');

	await exec('git', 'checkout', '-b', 'feature');
	await exec('git', 'branch', '-D', 'main');

	await exec('git', 'xcheckout', 'master');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'main');
});

test('xcheckout frees branch from worktree', async t => {
	const { exec } = t.context;

	await exec('git', 'checkout', '-b', 'feature/test');
	await exec('git', 'checkout', 'master');

	await exec('git', 'worktree', 'add', '../worktree1', 'feature/test');

	const error = await t.throwsAsync(() => exec('git', 'checkout', 'feature/test'), {
		instanceOf: ExecaError,
	});
	t.truthy(error);

	await exec('git', 'xcheckout', 'feature/test');

	const currentBranchResult = await exec('git', 'branch', '--show-current');
	t.is(currentBranchResult.stdout, 'feature/test');

	const worktreeHeadResult = await exec('git', '-C', '../worktree1', 'rev-parse', '--abbrev-ref', 'HEAD');
	t.is(worktreeHeadResult.stdout, 'HEAD');
});
