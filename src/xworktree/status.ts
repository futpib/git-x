import { Context } from '../context.js';
import { xworktreeCheckWorktreeIndex } from './path.js';

export async function xworktreeStatus(context: Context) {
	let index = 0;

	while (index < 1024) {
		const result = await xworktreeCheckWorktreeIndex(index.toString());

		if (result.type === 'ok') {
			await context.executeGit(['--work-tree', result.targetToplevel, 'status']);
			index += 1;
		} else {
			break;
		}
	}
}
