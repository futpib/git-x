import anyTest from 'ava';
import { setup } from './_setup.js';

const test = setup(anyTest);

test('xcheckout', async t => {
	const { exec } = t.context;

	const branches = {
		branch1: [
			'branch1',
			'*1',
		],
		branch2: [
			'branch2',
			'*2',
		],
	};

	for (const branch of Object.keys(branches)) {
		await exec('git', 'checkout', '-b', branch);
	}

	await exec('git', 'checkout', 'master');

	for (const [ branch, patterns ] of Object.entries(branches)) {
		for (const pattern of patterns) {
			const {stdout, stderr} = await exec('git', 'xcheckout', pattern);
			console.log({stdout, stderr});
			const result = await exec('git', 'branch', '--show-current');
			t.is(result.stdout, branch);
			await exec('git', 'checkout', 'master');
		}
	}
});
