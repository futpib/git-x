import anyTest from 'ava';
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
