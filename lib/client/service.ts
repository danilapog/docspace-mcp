import type {Base} from "./base.ts"

export class Service {
	protected c: Base

	constructor(c: Base) {
		this.c = c
	}
}
