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
import * as base from "../lib/base.ts"
import pack from "../package.json" with {type: "json"}
import type {Result} from "../util/result.ts"
import {error, ok} from "../util/result.ts"

export interface Config {
	// Internal options
	internal: boolean

	// General options
	transport: "stdio" | "http"
	userAgent: string
	dynamic: boolean
	toolsets: string[]
	tools: string[]

	// stdio options
	baseUrl: string
	origin?: string | undefined
	apiKey?: string | undefined
	authToken?: string | undefined
	username?: string | undefined
	password?: string | undefined

	// HTTP options
	host: string
	port: number
	sessionTtl: number
	sessionInterval: number
}

const ConfigSchema = z.object({
	// Internal options
	DOCSPACE_INTERNAL: z.string().optional(),

	// General options
	DOCSPACE_TRANSPORT: z.string().optional(),
	DOCSPACE_USER_AGENT: z.string().optional(),
	DOCSPACE_DYNAMIC: z.string().optional(),
	DOCSPACE_TOOLSETS: z.string().optional(),
	DOCSPACE_ENABLED_TOOLS: z.string().optional(),
	DOCSPACE_DISABLED_TOOLS: z.string().optional(),

	// stdio options
	DOCSPACE_BASE_URL: z.string().optional(),
	DOCSPACE_ORIGIN: z.string().optional(),
	DOCSPACE_API_KEY: z.string().optional(),
	DOCSPACE_AUTH_TOKEN: z.string().optional(),
	DOCSPACE_USERNAME: z.string().optional(),
	DOCSPACE_PASSWORD: z.string().optional(),

	// HTTP options
	DOCSPACE_HOST: z.string().optional(),
	DOCSPACE_PORT: z.string().optional(),
	DOCSPACE_SESSION_TTL: z.string().optional(),
	DOCSPACE_SESSION_INTERVAL: z.string().optional(),
})

export function loadConfig(): Result<Config, Error> {
	let o = ConfigSchema.safeParse(process.env)
	if (o.error) {
		return error(new Error("Accessing environment variables", {cause: o.error}))
	}

	let c = {} as Config
	let errs: Error[] = []

	let internal = validateBoolean(o.data.DOCSPACE_INTERNAL, false)
	if (internal.err) {
		errs.push(new Error("Validating DOCSPACE_INTERNAL", {cause: internal.err}))
	} else {
		c.internal = internal.v
	}

	let transport = validateTransport(o.data.DOCSPACE_TRANSPORT)
	if (transport.err) {
		errs.push(new Error("Validating DOCSPACE_TRANSPORT", {cause: transport.err}))
	} else {
		c.transport = transport.v
	}

	let userAgent = validateUserAgent(o.data.DOCSPACE_USER_AGENT)
	if (userAgent.err) {
		errs.push(new Error("Validating DOCSPACE_USER_AGENT", {cause: userAgent.err}))
	} else {
		c.userAgent = userAgent.v
	}

	let dynamic = validateBoolean(o.data.DOCSPACE_DYNAMIC, false)
	if (dynamic.err) {
		errs.push(new Error("Validating DOCSPACE_DYNAMIC", {cause: dynamic.err}))
	} else {
		c.dynamic = dynamic.v
	}

	let toolsets = validateToolsets(o.data.DOCSPACE_TOOLSETS)
	if (toolsets.err) {
		errs.push(new Error("Validating DOCSPACE_TOOLSETS", {cause: toolsets.err}))
	}

	let enabledTools = validateTools(o.data.DOCSPACE_ENABLED_TOOLS)
	if (enabledTools.err) {
		errs.push(new Error("Validating DOCSPACE_ENABLED_TOOLS", {cause: enabledTools.err}))
	}

	let disabledTools = validateTools(o.data.DOCSPACE_DISABLED_TOOLS)
	if (disabledTools.err) {
		errs.push(new Error("Validating DOCSPACE_DISABLED_TOOLS", {cause: disabledTools.err}))
	}

	if (!toolsets.err && !enabledTools.err && !disabledTools.err) {
		let r = resolveToolsetsAndTools(toolsets.v, enabledTools.v, disabledTools.v)
		if (r.err) {
			errs.push(new Error("Resolving toolsets and tools", {cause: r.err}))
		} else {
			c.toolsets = r.v[0]
			c.tools = r.v[1]
		}
	}

	if (!transport.err && transport.v === "stdio") {
		let baseUrl = validateBaseUrl(o.data.DOCSPACE_BASE_URL)
		if (baseUrl.err) {
			errs.push(new Error("Validating DOCSPACE_BASE_URL", {cause: baseUrl.err}))
		} else {
			c.baseUrl = baseUrl.v
		}

		let origin = validateOrigin(o.data.DOCSPACE_ORIGIN)
		if (origin.err) {
			errs.push(new Error("Validating DOCSPACE_ORIGIN", {cause: origin.err}))
		} else {
			c.origin = origin.v
		}

		let auth = validateAuth(o.data)
		if (auth.err) {
			errs.push(new Error("Validating authentication options", {cause: auth.err}))
		} else {
			c.apiKey = auth.v.apiKey
			c.authToken = auth.v.authToken
			c.username = auth.v.username
			c.password = auth.v.password
		}
	}

	if (!internal.err && !internal.v && !transport.err && transport.v === "http") {
		errs.push(new Error("HTTP transport is only available for internal use"))
	}

	if (!internal.err && internal.v && !transport.err && transport.v === "http") {
		let host = validateHost(o.data.DOCSPACE_HOST)
		if (host.err) {
			errs.push(new Error("Validating DOCSPACE_HOST", {cause: host.err}))
		} else {
			c.host = host.v
		}

		let port = validatePort(o.data.DOCSPACE_PORT)
		if (port.err) {
			errs.push(new Error("Validating DOCSPACE_PORT", {cause: port.err}))
		} else {
			c.port = port.v
		}

		let sessionTtl = validateSessionTtl(o.data.DOCSPACE_SESSION_TTL)
		if (sessionTtl.err) {
			errs.push(new Error("Validating DOCSPACE_SESSION_TTL", {cause: sessionTtl.err}))
		} else {
			c.sessionTtl = sessionTtl.v
		}

		let sessionInterval = validateSessionInterval(o.data.DOCSPACE_SESSION_INTERVAL)
		if (sessionInterval.err) {
			errs.push(new Error("Validating DOCSPACE_SESSION_INTERVAL", {cause: sessionInterval.err}))
		} else {
			c.sessionInterval = sessionInterval.v
		}
	}

	if (errs.length !== 0) {
		return error(new Error("Validating configuration", {cause: errs}))
	}

	return ok(c)
}

function validateTransport(v: string | undefined): Result<"stdio" | "http", Error> {
	if (v === undefined) {
		return ok("stdio")
	}

	v = v.trim().toLocaleLowerCase()

	if (v === "stdio") {
		return ok("stdio")
	}

	if (v === "http") {
		return ok("http")
	}

	return error(new Error(`Expected one of: stdio, http, but got ${v}`))
}

function validateUserAgent(v: string | undefined): Result<string, Error> {
	if (v === undefined) {
		return ok(`${pack.name} v${pack.version}`)
	}

	v = v.trim()

	return ok(v)
}

function validateToolsets(v: string | undefined): Result<string[], Error> {
	let a: string[] = []
	for (let s of base.data.regular.toolsets) {
		a.push(s.name)
	}

	a.push("all")

	let r = validateList(a, v, a)
	if (r.err) {
		return error(r.err)
	}

	a.pop()

	if (r.v.includes("all")) {
		return ok(a)
	}

	return ok(r.v)
}

function validateTools(v: string | undefined): Result<string[], Error> {
	let a: string[] = []
	for (let s of base.data.regular.toolsets) {
		for (let t of s.tools) {
			a.push(t.name)
		}
	}

	let r = validateList(a, v, [])
	if (r.err) {
		return error(r.err)
	}

	return ok(r.v)
}

function resolveToolsetsAndTools(toolsets: string[], enabledTools: string[], disabledTools: string[]): Result<[string[], string[]], Error> {
	let x: string[] = []
	let y: string[] = []

	for (let n of toolsets) {
		x.push(n)

		for (let s of base.data.regular.toolsets) {
			if (s.name === n) {
				for (let t of s.tools) {
					y.push(t.name)
				}
				break
			}
		}
	}

	for (let n of enabledTools) {
		for (let s of base.data.regular.toolsets) {
			let h = false
			for (let t of s.tools) {
				if (t.name === n) {
					h = true
					break
				}
			}

			if (h) {
				if (!x.includes(s.name)) {
					x.push(s.name)
				}
				break
			}
		}

		if (!y.includes(n)) {
			y.push(n)
		}
	}

	for (let n of disabledTools) {
		let i = y.indexOf(n)
		if (i !== -1) {
			y.splice(i, 1)
		}
	}

	for (let sn of x) {
		for (let s of base.data.regular.toolsets) {
			if (s.name === sn) {
				let h = false

				for (let tn of y) {
					for (let t of s.tools) {
						if (t.name === tn) {
							h = true
							break
						}
					}

					if (h) {
						break
					}
				}

				if (!h) {
					let i = x.indexOf(sn)
					if (i !== -1) {
						x.splice(i, 1)
					}
				}

				break
			}
		}
	}

	if (x.length === 0 || y.length === 0) {
		return error(new Error("No tools left"))
	}

	return ok([x, y])
}

function validateBaseUrl(v: string | undefined): Result<string, Error> {
	if (v === undefined) {
		return error(new Error("Expected to be set"))
	}

	v = v.trim()

	if (!v.endsWith("/")) {
		v += "/"
	}

	return ok(v)
}

function validateOrigin(v: string | undefined): Result<string | undefined, Error> {
	if (v === undefined) {
		return ok(undefined)
	}

	v = v.trim()

	return ok(v)
}

interface AuthInput {
	DOCSPACE_API_KEY?: string | undefined
	DOCSPACE_AUTH_TOKEN?: string | undefined
	DOCSPACE_USERNAME?: string | undefined
	DOCSPACE_PASSWORD?: string | undefined
}

interface AuthOutput {
	apiKey?: string | undefined
	authToken?: string | undefined
	username?: string | undefined
	password?: string | undefined
}

function validateAuth(v: AuthInput): Result<AuthOutput, Error> {
	let a = Boolean(v.DOCSPACE_API_KEY)
	let b = Boolean(v.DOCSPACE_AUTH_TOKEN)
	let c = Boolean(v.DOCSPACE_USERNAME) && Boolean(v.DOCSPACE_PASSWORD)
	let r = Number(a) + Number(b) + Number(c)

	if (r === 0) {
		return error(new Error("Expected at least one of DOCSPACE_API_KEY, DOCSPACE_AUTH_TOKEN, or (DOCSPACE_USERNAME and DOCSPACE_PASSWORD) to be set"))
	}

	if (r !== 1) {
		return error(new Error("Expected only one of DOCSPACE_API_KEY, DOCSPACE_AUTH_TOKEN, or (DOCSPACE_USERNAME and DOCSPACE_PASSWORD) to be set"))
	}

	let o: AuthOutput = {
		apiKey: v.DOCSPACE_API_KEY,
		authToken: v.DOCSPACE_AUTH_TOKEN,
		username: v.DOCSPACE_USERNAME,
		password: v.DOCSPACE_PASSWORD,
	}

	return ok(o)
}

function validateHost(v: string | undefined): Result<string, Error> {
	if (v === undefined) {
		return ok("127.0.0.1")
	}

	v = v.trim()

	return ok(v)
}

function validatePort(v: string | undefined): Result<number, Error> {
	if (v === undefined) {
		return ok(8080)
	}

	v = v.trim()

	let n = Number.parseInt(v, 10)

	if (Number.isNaN(n)) {
		return error(new Error(`Expected a number, but got ${v}`))
	}

	if (n < 1 || n > 65535) {
		return error(new Error(`Expected a number between 1 and 65535, but got ${n}`))
	}

	return ok(n)
}

function validateSessionTtl(v: string | undefined): Result<number, Error> {
	if (v === undefined) {
		return ok(8 * 1000 * 60 * 60) // 8 hours
	}

	v = v.trim()

	let n = Number.parseInt(v, 10)

	if (Number.isNaN(n)) {
		return error(new Error(`Expected a number, but got ${v}`))
	}

	if (n < 0) {
		return error(new Error(`Expected a positive number, but got ${n}`))
	}

	return ok(n)
}

function validateSessionInterval(v: string | undefined): Result<number, Error> {
	if (v === undefined) {
		return ok(4 * 1000 * 60) // 4 minutes
	}

	v = v.trim()

	let n = Number.parseInt(v, 10)

	if (Number.isNaN(n)) {
		return error(new Error(`Expected a number, but got ${v}`))
	}

	if (n < 0) {
		return error(new Error(`Expected a positive number, but got ${n}`))
	}

	return ok(n)
}

function validateBoolean(v: string | undefined, d: boolean): Result<boolean, Error> {
	if (v === undefined) {
		return ok(d)
	}

	v = v.trim().toLocaleLowerCase()

	if (v === "yes" || v === "y" || v === "true" || v === "1") {
		return ok(true)
	}

	if (v === "no" || v === "n" || v === "false" || v === "0") {
		return ok(false)
	}

	return error(new Error(`Expected one of: yes, y, true, 1, no, n, false, 0, but got ${v}`))
}

function validateList(a: string[], v: string | undefined, d: string[]): Result<string[], Error> {
	if (v === undefined) {
		return ok(d)
	}

	let x: string[] = []
	let y: string[] = []

	for (let u of v.split(",")) {
		u.trim().toLocaleLowerCase()
		if (u === "") {
			continue
		}

		let h = false
		for (let n of a) {
			if (n === u) {
				h = true
				break
			}
		}

		if (!h && !y.includes(u)) {
			y.push(u)
		}
		if (h && !x.includes(u)) {
			x.push(u)
		}
	}

	if (y.length !== 0) {
		let errs: Error[] = []
		for (let u of y) {
			errs.push(new Error(`Unknown value: ${u}`))
		}
		return error(new Error("Multiple errors", {cause: errs}))
	}

	return ok(x)
}

export function mask(c: Config): Config {
	c = {...c}

	if (c.apiKey) {
		c.apiKey = "***"
	}

	if (c.authToken) {
		c.authToken = "***"
	}

	if (c.username) {
		c.username = "***"
	}

	if (c.password) {
		c.password = "***"
	}

	return c
}
