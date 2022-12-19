import type { ActionResult } from "./result.js";

export class TolerableError extends Error {
	constructor(
		public readonly result: ActionResult,
		public readonly cause: Error,
	) {
		super(cause.message);
	}
}
