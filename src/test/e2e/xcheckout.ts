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
