import {safeNew, safeSync} from "../ext/result.ts"
import {Base} from "./client/base.ts"
import type {AuthenticateMeOptions} from "./client/services.ts"
import {AuthService, FilesService, PeopleService} from "./client/services.ts"

export * from "./client/response.ts"
export * from "./client/services.ts"

const headerApiKey = "Authorization"
const headerAuthToken = "Authorization"
const schemaApiKey = "Bearer"
const cookieAuthToken = "asc_auth_key"
const thresholdBasicAuth = 1000 * 60 * 5 // 5min

export class Client {
	private base: Base

	get baseUrl(): string {
		return this.base.baseUrl
	}

	set baseUrl(v: string) {
		this.base.baseUrl = v
	}

	get userAgent(): string {
		return this.base.userAgent
	}

	set userAgent(v: string) {
		this.base.userAgent = v
	}

	auth: AuthService
	files: FilesService
	people: PeopleService

	constructor(fetch: typeof globalThis.fetch) {
		this.base = new Base(fetch)
		this.auth = new AuthService(this.base)
		this.files = new FilesService(this.base)
		this.people = new PeopleService(this.base)
	}

	withApiKey(k: string): Client {
		let c = this.copy()

		let f = c.base.baseFetch

		c.base.baseFetch = async function baseFetch(input, init) {
			if (!(input instanceof Request)) {
				throw new Error("Unsupported input type.")
			}

			input = input.clone()

			let err = injectAuthKey(input, k)
			if (err) {
				throw new Error("Injecting authentication key.", {cause: err})
			}

			return await f(input, init)
		}

		return c
	}

	withAuthToken(t: string): Client {
		let c = this.copy()

		let f = c.base.baseFetch

		c.base.baseFetch = async function baseFetch(input, init) {
			if (!(input instanceof Request)) {
				throw new Error("Unsupported input type.")
			}

			input = input.clone()

			let err = injectAuthToken(input, t)
			if (err) {
				throw new Error("Injecting authentication token.", {cause: err})
			}

			return await f(input, init)
		}

		return c
	}

	withBasicAuth(u: string, p: string): Client {
		// eslint-disable-next-line typescript/no-this-alias, unicorn/no-this-assignment
		let self = this

		let c = this.copy()

		let f = c.base.baseFetch

		let s: BasicAuthState = {
			token: "",
			expires: 0,
		}

		let o: AuthenticateMeOptions = {
			userName: u,
			password: p,
		}

		c.base.baseFetch = async function baseFetch(input, init) {
			if (!(input instanceof Request)) {
				throw new Error("Unsupported input type.")
			}

			let err = await checkBasicAuth(self, s, o, input)
			if (err) {
				throw new Error("Checking authentication.", {cause: err})
			}

			input = input.clone()

			err = injectAuthToken(input, s.token)
			if (err) {
				throw new Error("Injecting authentication token.", {cause: err})
			}

			return await f(input, init)
		}

		return c
	}

	private copy(): Client {
		let c = new Client(this.base.baseFetch)
		c.baseUrl = this.baseUrl
		c.userAgent = this.userAgent
		return c
	}

	createUrl(...args: Parameters<Base["createUrl"]>): ReturnType<Base["createUrl"]> {
		return this.base.createUrl(...args)
	}

	createRequest(...args: Parameters<Base["createRequest"]>): ReturnType<Base["createRequest"]> {
		return this.base.createRequest(...args)
	}

	async fetch(...args: Parameters<Base["fetch"]>): ReturnType<Base["fetch"]> {
		return await this.base.fetch(...args)
	}

	async bareFetch(...args: Parameters<Base["bareFetch"]>): ReturnType<Base["bareFetch"]> {
		return await this.base.bareFetch(...args)
	}
}

interface BasicAuthState {
	token: string
	expires: number
}

async function checkBasicAuth(c: Client, s: BasicAuthState, o: AuthenticateMeOptions, input: Request): Promise<Error | undefined> {
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

function injectAuthKey(input: Request, k: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerApiKey, `${schemaApiKey} ${k}`)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}

function injectAuthToken(input: Request, t: string): Error | undefined {
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
