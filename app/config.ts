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
import * as server from "../lib/server.ts"
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
}

const ConfigSchema = z.object({
	// Internal options
	DOCSPACE_INTERNAL: z.string().optional(),

	// General options
	DOCSPACE_TRANSPORT: z.string().optional(),
	DOCSPACE_USER_AGENT: z.string().optional(),
	DOCSPACE_DYNAMIC: z.string().optional(),
	DOCSPACE_TOOLSETS: z.string().optional(),

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
	} else {
		c.toolsets = toolsets.v
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
	let all: string[] = []

	for (let t of server.toolsets) {
		all.push(t.name)
	}

	if (v === undefined) {
		return ok(all)
	}

	let s: string[] = []

	for (let n of v.split(",")) {
		n.trim().toLocaleLowerCase()

		if (n === "") {
			continue
		}

		if (n === "all") {
			s = ["all"]
			continue
		}

		let has = false

		for (let t of server.toolsets) {
			if (t.name === n) {
				has = true
				break
			}
		}

		if (!has) {
			let e = ""

			for (let t of server.toolsets) {
				e += `${t.name}, `
			}

			if (e.length !== 0) {
				e = e.slice(0, -2)
			}

			return error(new Error(`Expected one of: ${e}, or all, but got ${v}`))
		}

		if (s[0] !== "all") {
			s.push(n)
		}
	}

	if (s.length === 0 || s.length === 1 && s[0] === "all") {
		return ok(all)
	}

	return ok(s)
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
