import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {Response} from "../response.ts"
import {Service} from "../service.ts"

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/tree/v3.0.4-server/products/ASC.People/ | DocSpace Reference}
 */
export class PeopleService extends Service {
	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.People/Server/Api/UserController.cs/#L681 | DocSpace Reference}
	 */
	async getAll(s: AbortSignal): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl("api/2.0/people")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}
}
