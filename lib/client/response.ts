import * as z from "zod"
import type {Result} from "../../ext/result.ts"
import {error, ok, safeAsync, safeSync} from "../../ext/result.ts"
import {
	ErrorApiResponseSchema,
	SuccessApiResponseSchema,
	UploadChunkResponseSchema,
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

export async function checkResponse(req: Request, res: globalThis.Response): Promise<Error | undefined> {
	if (res.status >= 200 && res.status <= 299) {
		return
	}

	let c = safeSync(res.clone.bind(res))
	if (c.err) {
		return new Error("Cloning response.", {cause: c.err})
	}

	let b = await safeAsync(c.v.json.bind(c.v))
	if (b.err) {
		return new Error("Parsing response body.", {cause: b.err})
	}

	let s = ErrorApiResponseSchema.safeParse(b.v)
	if (!s.success) {
		return new Error("Parsing error response.", {cause: s.error})
	}

	let r = new Response(req, res)

	let m = `${req.method} ${req.url}: ${res.status} ${s.data.error.message}`
	let e = new ErrorResponse(r, m)

	return e
}

export async function parseResponse(req: Request, res: globalThis.Response): Promise<Result<[unknown, Response], Error>> {
	let c = safeSync(res.clone.bind(res))
	if (c.err) {
		return error(new Error("Cloning response.", {cause: c.err}))
	}

	let b = await safeAsync(c.v.json.bind(c.v))
	if (b.err) {
		return error(new Error("Parsing response body.", {cause: b.err}))
	}

	let u = z.union([
		SuccessApiResponseSchema,
		UploadChunkResponseSchema,
	])

	let s = u.safeParse(b.v)
	if (!s.success) {
		return error(new Error("Parsing success response.", {cause: s.error}))
	}

	if ("response" in s.data) {
		let u = UploadSessionObjectSchema.safeParse(s.data.response)
		if (u.success) {
			let r = new Response(req, res)
			return ok([u.data.data, r])
		}

		let r = new Response(req, res)
		return ok([s.data.response, r])
	}

	if ("data" in s.data) {
		let r = new Response(req, res)
		return ok([s.data.data, r])
	}

	return error(new Error("Unknown success response format."))
}
