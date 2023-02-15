import anyTest from 'ava';
import { ExecaError } from 'execa';
import { setup } from './_setup.js';

const test = setup(anyTest);

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
