import { execa } from "execa";

const resultExecuteGitSymbol = Symbol('resultExecuteGit');

interface ResultExecuteGit {
	type: typeof resultExecuteGitSymbol;
	args: string[];
}

type ActionResult_ =
	| void
	| string
	| ResultExecuteGit
;

export type ActionResult =
	| ActionResult_
	| Promise<ActionResult_>
	| AsyncGenerator<ActionResult_>
	;

export function resultExecuteGit(args: string[]): ResultExecuteGit {
	return {
		type: resultExecuteGitSymbol,
		args,
	};
}

async function executeGit(args: string[]) {
	console.log('+', 'git', ...args);

	await execa('git', args, {
		stdio: 'inherit',
	});
}

export async function outputActionResult(actionResult: ActionResult) {
	const result = await actionResult;

	if (typeof result === 'string') {
		console.log(result);
		return;
	}

	if (typeof result === 'object') {
		if ('type' in result) {
			if (result.type === resultExecuteGitSymbol) {
				await executeGit(result.args);
				return;
			}
		}

		if (Symbol.asyncIterator in result) {
			for await (const subresult of (result as AsyncGenerator<string | ResultExecuteGit>)) {
				await outputActionResult(subresult);
			}

			return;
		}
	}

	throw new Error('Unexpected result type');
}
