import {safeNew, safeSync} from "../../../ext/result.ts"
import type {Client} from "../../client.ts"
import type {AuthenticateMeOptions} from "../auth.ts"

const headerApiKey = "Authorization"
const headerAuthToken = "Authorization"
const schemaApiKey = "Bearer"
const cookieAuthToken = "asc_auth_key"
const thresholdBasicAuth = 5 * 60 * 1000 // 5min

export interface BasicAuthState {
	token: string
	expires: number
}

export async function checkBasicAuth(c: Client, s: BasicAuthState, o: AuthenticateMeOptions, input: Request): Promise<Error | undefined> {
	if (s.expires > Date.now()) {
		return
	}

	let a = await c.auth.authenticateMe(input.signal, o)
	if (a.err) {
		return new Error("Making authentication.", {cause: a.err})
	}

	let [d] = a.v

	let errors: Error[] = []

	let t = ""

	if (d.token === undefined) {
		errors.push(new Error("Token is not defined."))
	} else {
		t = d.token
	}

	let e = ""

	if (d.expires === undefined) {
		errors.push(new Error("Expiration date is not defined."))
	} else {
		e = d.expires
	}

	if (errors.length !== 0) {
		return new Error("Checking authentication data.", {cause: errors})
	}

	let p = safeNew(Date, e)
	if (p.err) {
		return new Error("Parsing expiration date.", {cause: p.err})
	}

	s.token = t
	s.expires = p.v.getTime() - thresholdBasicAuth
}

export function injectAuthKey(input: Request, k: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerApiKey, `${schemaApiKey} ${k}`)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}

export function injectAuthToken(input: Request, t: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerAuthToken, t)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}

	let p = `${cookieAuthToken}=${t}`

	let c = input.headers.get("Cookie")

	if (c === null) {
		c = p
	} else {
		c = `${c}; ${p}`
	}

	h = safeSync(input.headers.set.bind(input.headers), "Cookie", c)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}
