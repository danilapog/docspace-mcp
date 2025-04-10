import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
// eslint-disable-next-line import-newlines/enforce
import type {
	PeopleService, // eslint-disable-line typescript/no-unused-vars
	Response,
} from "../../../lib/client.ts"
import {Toolset} from "../toolset.ts"

export class PeopleToolset extends Toolset {
	/**
	 * {@link PeopleService.getAll}
	 */
	async getAll(signal: AbortSignal): Promise<Result<Response, Error>> {
		let gr = await this.s.client.people.getAll(signal)
		if (gr.err) {
			return error(new Error("Getting people.", {cause: gr.err}))
		}

		let [, res] = gr.v

		return ok(res)
	}
}
