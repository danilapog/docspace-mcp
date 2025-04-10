/**
 * (c) Copyright Ascensio System SIA 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {Response} from "../response.ts"
import {AuthRequestsDtoSchema, AuthenticationTokenDtoSchema} from "../schemas.ts"
import {Service} from "../service.ts"

export type AuthenticateMeOptions = z.input<typeof AuthRequestsDtoSchema>

export type AuthenticateMeResponse = z.output<typeof AuthenticationTokenDtoSchema>

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Api/Api/AuthenticationController.cs/ | DocSpace Reference}
 */
export class AuthService extends Service {
	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Api/Api/AuthenticationController.cs/#L88 | DocSpace Reference}
	 */
	async getIsAuthentificated(s: AbortSignal): Promise<Result<[boolean, Response], Error>> {
		let u = this.c.createUrl("api/2.0/authentication")
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

		let [p, res] = f.v

		let e = z.boolean().safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Api/Api/AuthenticationController.cs/#L185 | DocSpace Reference}
	 */
	async authenticateMe(s: AbortSignal, o: AuthenticateMeOptions): Promise<Result<[AuthenticateMeResponse, Response], Error>> {
		let u = this.c.createUrl("api/2.0/authentication")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = AuthRequestsDtoSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "POST", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = AuthenticationTokenDtoSchema.safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}
}
