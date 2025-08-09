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
import type {Result} from "../../../../util/result.ts"
import {error, ok, safeAsync, safeSync} from "../../../../util/result.ts"
import {
	ErrorApiResponseSchema,
	SuccessApiResponseSchema,
	UploadChunkErrorResponseSchema,
	UploadChunkSuccessResponseSchema,
	UploadSessionObjectSchema,
} from "./schemas.ts"

export class Response {
	request: Request
	response: globalThis.Response

	constructor(request: Request, response: globalThis.Response) {
		this.request = request
		this.response = response
	}
}

// eslint-disable-next-line unicorn/custom-error-definition
export class ErrorResponse extends Error {
	response: Response

	constructor(response: Response, message: string) {
		super(message)
		this.name = "ErrorResponse"
		this.response = response
	}
}

const SuccessResponseSchema = z.
	union([
		SuccessApiResponseSchema,
		UploadChunkSuccessResponseSchema,
	]).
	transform((o) => {
		let t: {
			data: unknown
		} = {
			data: undefined,
		}

		switch (true) {
		case "response" in o:
			let u = UploadSessionObjectSchema.safeParse(o.response)
			if (u.success) {
				t.data = u.data.data
			} else {
				t.data = o.response
			}
			break

		case "data" in o:
			t.data = o.data
			break

		// no default
		}

		return t
	})

const ErrorResponseSchema = z.
	union([
		ErrorApiResponseSchema,
		UploadChunkErrorResponseSchema,
	]).
	transform((o) => {
		let t: {
			message: string
		} = {
			message: "",
		}

		switch (true) {
		case "error" in o:
			t.message = o.error.message
			break

		case "message" in o:
			t.message = o.message
			break

		// no default
		}

		return t
	})

export async function checkSharedResponse(req: Request, res: globalThis.Response): Promise<Error | undefined> {
	// DocSpace does not always respect HTTP status codes. Even when it returns
	// HTTP 2xx, it may still include an error in the response body. Therefore,
	// try to first parse the response body for errors before checking the status
	// codes.

	let err = await (async(): Promise<Error> => {
		let c = safeSync(res.clone.bind(res))
		if (c.err) {
			return new Error("Cloning response.", {cause: c.err})
		}

		let b = await safeAsync(c.v.json.bind(c.v))
		if (b.err) {
			return new Error("Parsing response body.", {cause: b.err})
		}

		let s = ErrorResponseSchema.safeParse(b.v)
		if (!s.success) {
			return new Error("Parsing error response.", {cause: s.error})
		}

		let r = new Response(req, res)
		let m = `${req.method} ${req.url}: ${res.status} ${s.data.message}`
		let e = new ErrorResponse(r, m)

		return e
	})()

	if (err instanceof ErrorResponse) {
		return err
	}

	if (res.status >= 200 && res.status <= 299) {
		return
	}

	let r = new Response(req, res)
	let m = `${req.method} ${req.url}: ${res.status} ${res.statusText}`
	let e = new ErrorResponse(r, m)

	return e
}

export async function parseSharedResponse(req: Request, res: globalThis.Response): Promise<Result<[unknown, Response], Error>> {
	let c = safeSync(res.clone.bind(res))
	if (c.err) {
		return error(new Error("Cloning response.", {cause: c.err}))
	}

	let b = await safeAsync(c.v.json.bind(c.v))
	if (b.err) {
		return error(new Error("Parsing response body.", {cause: b.err}))
	}

	let s = SuccessResponseSchema.safeParse(b.v)
	if (!s.success) {
		return error(new Error("Parsing success response.", {cause: s.error}))
	}

	let r = new Response(req, res)
	return ok([s.data.data, r])
}
