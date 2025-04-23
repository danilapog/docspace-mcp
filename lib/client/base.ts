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

import type {Result} from "../../ext/result.ts"
import {error, ok, safeAsync, safeNew, safeSync} from "../../ext/result.ts"
import type {Response} from "./response.ts"
import {checkResponse, parseResponse} from "./response.ts"

export class Base {
	baseUrl = ""
	userAgent = ""

	baseFetch: typeof globalThis.fetch

	constructor(fetch: typeof globalThis.fetch) {
		this.baseFetch = fetch
	}

	createUrl(path: string, query?: object): Result<string, Error> {
		if (!this.baseUrl.endsWith("/")) {
			return error(new Error(`Base URL must end with a trailing slash, but ${this.baseUrl} does not.`))
		}

		if (path.startsWith("/")) {
			return error(new Error(`Path must not start with a leading slash, but ${path} does.`))
		}

		let u = safeNew(URL, path, this.baseUrl)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		if (query) {
			let q = new URLSearchParams()

			for (let [k, v] of Object.entries(query)) {
				if (v !== undefined) {
					q.append(k, v.toString())
				}
			}

			let s = q.toString()
			if (s) {
				u.v.search = s
			}
		}

		return ok(u.v.toString())
	}

	createRequest(signal: AbortSignal, method: string, url: string, body?: unknown): Result<Request, Error> {
		let c: RequestInit = {
			method,
			signal,
		}

		if (body !== undefined) {
			let b = safeSync(JSON.stringify, body)
			if (b.err) {
				return error(new Error("Stringifying body.", {cause: b.err}))
			}

			c.body = b.v
		}

		let r = safeNew(Request, url, c)
		if (r.err) {
			return error(new Error("Creating request.", {cause: r.err}))
		}

		let h = safeSync(r.v.headers.set.bind(r.v.headers), "Accept", "application/json")
		if (h.err) {
			return error(new Error("Setting header.", {cause: h.err}))
		}

		if (body !== undefined) {
			let h = safeSync(r.v.headers.set.bind(r.v.headers), "Content-Type", "application/json")
			if (h.err) {
				return error(new Error("Setting header.", {cause: h.err}))
			}
		}

		if (this.userAgent) {
			let h = safeSync(r.v.headers.set.bind(r.v.headers), "User-Agent", this.userAgent)
			if (h.err) {
				return error(new Error("Setting header.", {cause: h.err}))
			}
		}

		return ok(r.v)
	}

	createFormRequest(signal: AbortSignal, url: string, body: FormData): Result<Request, Error> {
		let c: RequestInit = {
			body,
			method: "POST",
			signal,
		}

		let r = safeNew(Request, url, c)
		if (r.err) {
			return error(new Error("Creating request.", {cause: r.err}))
		}

		let h = safeSync(r.v.headers.set.bind(r.v.headers), "Accept", "application/json")
		if (h.err) {
			return error(new Error("Setting header.", {cause: h.err}))
		}

		if (this.userAgent) {
			let h = safeSync(r.v.headers.set.bind(r.v.headers), "User-Agent", this.userAgent)
			if (h.err) {
				return error(new Error("Setting header.", {cause: h.err}))
			}
		}

		return ok(r.v)
	}

	async fetch(req: Request): Promise<Result<[unknown, Response], Error>> {
		let f = await this.bareFetch(req)
		if (f.err) {
			return error(new Error("Making bare fetch.", {cause: f.err}))
		}

		let p = await parseResponse(req, f.v)
		if (p.err) {
			return error(new Error("Parsing response.", {cause: p.err}))
		}

		return ok(p.v)
	}

	async bareFetch(req: Request): Promise<Result<globalThis.Response, Error>> {
		let f = await safeAsync(this.baseFetch, req.clone())
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let c = await checkResponse(req, f.v)
		if (c) {
			return error(new Error("Checking response.", {cause: c}))
		}

		return ok(f.v)
	}
}
