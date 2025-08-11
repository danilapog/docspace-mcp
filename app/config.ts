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
import * as base from "../lib/mcp/base.ts"
import pack from "../package.json" with {type: "json"}
import type * as morets from "../util/morets.ts"
import * as result from "../util/result.ts"
import * as morezod from "../util/zod.ts"

const availableToolsets = (() => {
	let a: string[] = ["all"]
	for (let s of base.data.regular.toolsets) {
		a.push(s.name)
	}
	return a
})()

const availableTools = (() => {
	let a: string[] = []
	for (let s of base.data.regular.toolsets) {
		for (let t of s.tools) {
			a.push(t.name)
		}
	}
	return a
})()

export interface Config {
	internal: boolean
	mcp: Mcp
	api: Api
	oauth: Oauth
}

export interface Mcp {
	transport: "stdio" | "http"
	dynamic: boolean
	toolsets: string[]
	tools: string[]
	enabledTools: string[]
	disabledTools: string[]
	server: McpServer
	session: McpSession
}

export interface McpServer {
	baseUrl: string
	host: string
	port: number
}

export interface McpSession {
	ttl: number
	interval: number
}

export interface Api {
	userAgent: string
	shared: ApiShared
	oauth: ApiOauth
}

export interface ApiShared {
	baseUrl: string
	origin: string
	apiKey: string
	pat: string
	username: string
	password: string
}

export interface ApiOauth {
	baseUrl: string
}

export interface Oauth {
	resource: OauthResource
	client: OauthClient
}

export interface OauthResource {
	scopesSupported: string[]
	resourceName: string
	resourceDocumentation: string
}

export interface OauthClient {
	redirectUris: string[]
	clientId: string
	clientName: string
	scopes: string[]
	tosUri: string
	policyUri: string
	clientSecret: string
}

export const ConfigSchema = z.
	object({
		//
		// General options
		//

		DOCSPACE_INTERNAL: z.
			string().
			default("0").
			transform(morezod.envBoolean()),

		//
		// MCP options
		//

		DOCSPACE_TRANSPORT: z.
			string().
			default("stdio").
			transform(morezod.envUnion<"stdio" | "http">(["stdio", "http"])),

		DOCSPACE_DYNAMIC: z.
			string().
			default("0").
			transform(morezod.envBoolean()),

		DOCSPACE_TOOLSETS: z.
			string().
			default("all").
			transform(morezod.envOptions([...availableToolsets])),

		DOCSPACE_ENABLED_TOOLS: z.
			string().
			default("").
			transform(morezod.envOptions([...availableTools])),

		DOCSPACE_DISABLED_TOOLS: z.
			string().
			default("").
			transform(morezod.envOptions([...availableTools])),

		//
		// MCP Server options
		//

		DOCSPACE_MCP_BASE_URL: z. // todo: check url
			string().
			trim().
			default(""),

		DOCSPACE_HOST: z. // todo: cannot be empty, see https://github.com/nodejs/node/blob/v24.5.0/lib/net.js#L299
			string().
			trim().
			default("127.0.0.1"),

		DOCSPACE_PORT: z.
			string().
			default("8080").
			transform(morezod.envNumber()).
			pipe(z.number().min(1).max(65534)), // todo: change to 0-64535

		//
		// MCP Session options
		//

		DOCSPACE_SESSION_TTL: z.
			string().
			default("28800000"). // 8 hours
			transform(morezod.envNumber()).
			pipe(z.number().min(0)), // todo: change to 1

		DOCSPACE_SESSION_INTERVAL: z.
			string().
			default("240000"). // 4 minutes
			transform(morezod.envNumber()).
			pipe(z.number().min(0)), // todo: change to 1

		//
		// API options
		//

		DOCSPACE_USER_AGENT: z.
			string().
			trim().
			default(`${pack.name} v${pack.version}`),

		//
		// API Shared options
		//

		DOCSPACE_BASE_URL: z. // todo: use new URL
			string().
			trim().
			default(""),

		DOCSPACE_ORIGIN: z. // todo: remove
			string().
			trim().
			default(""),

		DOCSPACE_API_KEY: z. // todo: trim
			string().
			default(""),

		DOCSPACE_AUTH_TOKEN: z. // todo: trim
			string().
			default(""),

		DOCSPACE_USERNAME: z. // todo: trim
			string().
			default(""),

		DOCSPACE_PASSWORD: z. // todo: trim
			string().
			default(""),

		//
		// API OAuth options
		//

		DOCSPACE_OAUTH_BASE_URL: z. // todo: check url
			string().
			trim().
			default("https://oauth.onlyoffice.com/"),

		//
		// Oauth Resource options
		//

		DOCSPACE_OAUTH_SCOPES_SUPPORTED: z.
			string().
			default("").
			transform(morezod.envList()),

		DOCSPACE_OAUTH_RESOURCE_NAME: z.
			string().
			trim().
			default(`${pack.name} v${pack.version}`),

		DOCSPACE_OAUTH_RESOURCE_DOCUMENTATION: z. // todo: check url
			string().
			trim().
			default("https://github.com/onlyoffice/docspace-mcp/blob/main/README.md"),

		//
		// Oauth Client options
		//

		DOCSPACE_OAUTH_REDIRECT_URIS: z. // todo: check url
			string().
			default("").
			transform(morezod.envList()),

		DOCSPACE_OAUTH_CLIENT_ID: z.
			string().
			trim().
			default(""),

		DOCSPACE_OAUTH_CLIENT_NAME: z.
			string().
			trim().
			default(""),

		DOCSPACE_OAUTH_SCOPES: z.
			string().
			default("").
			transform(morezod.envList()),

		DOCSPACE_OAUTH_TOS_URI: z. // todo: check url
			string().
			trim().
			default(""),

		DOCSPACE_OAUTH_POLICY_URI: z. // todo: check url
			string().
			trim().
			default(""),

		DOCSPACE_OAUTH_CLIENT_SECRET: z.
			string().
			trim().
			default(""),
	}).
	transform((o) => {
		let c: Config = {
			internal: o.DOCSPACE_INTERNAL,
			mcp: {
				transport: o.DOCSPACE_TRANSPORT,
				dynamic: o.DOCSPACE_DYNAMIC,
				toolsets: o.DOCSPACE_TOOLSETS,
				tools: [],
				enabledTools: o.DOCSPACE_ENABLED_TOOLS,
				disabledTools: o.DOCSPACE_DISABLED_TOOLS,
				server: {
					baseUrl: o.DOCSPACE_MCP_BASE_URL,
					host: o.DOCSPACE_HOST,
					port: o.DOCSPACE_PORT,
				},
				session: {
					ttl: o.DOCSPACE_SESSION_TTL,
					interval: o.DOCSPACE_SESSION_INTERVAL,
				},
			},
			api: {
				userAgent: o.DOCSPACE_USER_AGENT,
				shared: {
					baseUrl: o.DOCSPACE_BASE_URL,
					origin: o.DOCSPACE_ORIGIN,
					apiKey: o.DOCSPACE_API_KEY,
					pat: o.DOCSPACE_AUTH_TOKEN,
					username: o.DOCSPACE_USERNAME,
					password: o.DOCSPACE_PASSWORD,
				},
				oauth: {
					baseUrl: o.DOCSPACE_OAUTH_BASE_URL,
				},
			},
			oauth: {
				resource: {
					scopesSupported: o.DOCSPACE_OAUTH_SCOPES_SUPPORTED,
					resourceName: o.DOCSPACE_OAUTH_RESOURCE_NAME,
					resourceDocumentation: o.DOCSPACE_OAUTH_RESOURCE_DOCUMENTATION,
				},
				client: {
					redirectUris: o.DOCSPACE_OAUTH_REDIRECT_URIS,
					clientId: o.DOCSPACE_OAUTH_CLIENT_ID,
					clientName: o.DOCSPACE_OAUTH_CLIENT_NAME,
					scopes: o.DOCSPACE_OAUTH_SCOPES,
					tosUri: o.DOCSPACE_OAUTH_TOS_URI,
					policyUri: o.DOCSPACE_OAUTH_POLICY_URI,
					clientSecret: o.DOCSPACE_OAUTH_CLIENT_SECRET,
				},
			},
		}

		c.mcp.toolsets = normalizeToolsets(c.mcp.toolsets)

		let r = resolveToolsetsAndTools(
			c.mcp.toolsets,
			c.mcp.enabledTools,
			c.mcp.disabledTools,
		)
		c.mcp.toolsets = r[0]
		c.mcp.tools = r[1]

		// todo: check if not empty
		c.mcp.server.baseUrl = ensureTrailing(c.mcp.server.baseUrl)

		// todo: check if not empty
		c.api.shared.baseUrl = ensureTrailing(c.api.shared.baseUrl)

		// todo: check if not empty
		c.api.oauth.baseUrl = ensureTrailing(c.api.oauth.baseUrl)

		return c
	}).
	superRefine((o, ctx) => {
		if (o.mcp.toolsets.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "No toolsets left",
			})
		}

		if (o.mcp.tools.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "No tools left",
			})
		}

		if (o.mcp.transport === "stdio") {
			if (!o.api.shared.baseUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "API base URL is required for stdio transport",
				})
			}

			let a = Boolean(o.api.shared.apiKey)
			let b = Boolean(o.api.shared.pat)
			let c = Boolean(o.api.shared.username) && Boolean(o.api.shared.password)
			let u = Number(a) + Number(b) + Number(c)

			if (u === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Expected at least one of API key, PAT, or (username and password) to be set for stdio transport",
				})
			}

			if (u !== 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Expected only one of API key, PAT, or (username and password) to be set for stdio transport",
				})
			}
		}

		if (!o.internal && o.mcp.transport === "http") {
			if (!o.mcp.server.baseUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "MCP server base URL is required for HTTP transport",
				})
			}

			if (!o.oauth.client.clientId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "OAuth client ID is required for HTTP transport",
				})
			}
		}
	})

export function load(): result.Result<Config, Error> {
	let o = ConfigSchema.safeParse(process.env)
	if (o.error) {
		return result.error(new Error("Parsing environment variables", {cause: o.error}))
	}
	return result.ok(o.data)
}

function normalizeToolsets(a: string[]): string[] {
	if (a.includes("all")) {
		a = [...availableToolsets]

		let i = a.indexOf("all")
		if (i !== -1) {
			a.splice(i, 1)
		}

		return a
	}

	return [...a]
}

function resolveToolsetsAndTools(toolsets: string[], enabledTools: string[], disabledTools: string[]): [string[], string[]] {
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

	return [x, y]
}

function ensureTrailing(u: string): string {
	if (!u.endsWith("/")) {
		u += "/"
	}
	return u
}

export function format(c: Config): object {
	let o: morets.RecursivePartial<Config> = {}
	let mcp: morets.RecursivePartial<Mcp> = {}
	let server: morets.RecursivePartial<McpServer> = {}
	let session: morets.RecursivePartial<McpSession> = {}
	let api: morets.RecursivePartial<Api> = {}
	let shared: morets.RecursivePartial<ApiShared> = {}
	let oauth: morets.RecursivePartial<ApiOauth> = {}

	if (c.internal) {
		o.internal = c.internal
	}

	if (c.mcp.transport) {
		mcp.transport = c.mcp.transport
	}

	if (c.mcp.dynamic) {
		mcp.dynamic = c.mcp.dynamic
	}

	if (c.mcp.toolsets.length !== 0) {
		mcp.toolsets = c.mcp.toolsets
	}

	if (c.mcp.tools.length !== 0) {
		mcp.tools = c.mcp.tools
	}

	if (c.mcp.server.baseUrl) {
		server.baseUrl = c.mcp.server.baseUrl
	}

	if (c.mcp.server.host) {
		server.host = c.mcp.server.host
	}

	if (c.mcp.server.port) {
		server.port = c.mcp.server.port
	}

	if (Object.keys(server).length !== 0) {
		mcp.server = server
	}

	if (c.mcp.session.ttl) {
		session.ttl = c.mcp.session.ttl
	}

	if (c.mcp.session.interval) {
		session.interval = c.mcp.session.interval
	}

	if (Object.keys(session).length !== 0) {
		mcp.session = session
	}

	if (Object.keys(mcp).length !== 0) {
		o.mcp = mcp
	}

	if (c.api.userAgent) {
		api.userAgent = c.api.userAgent
	}

	if (c.api.shared.baseUrl) {
		shared.baseUrl = c.api.shared.baseUrl
	}

	if (c.api.shared.origin) {
		shared.origin = c.api.shared.origin
	}

	if (c.api.shared.apiKey) {
		shared.apiKey = "***"
	}

	if (c.api.shared.pat) {
		shared.pat = "***"
	}

	if (c.api.shared.username) {
		shared.username = "***"
	}

	if (c.api.shared.password) {
		shared.password = "***"
	}

	if (Object.keys(shared).length !== 0) {
		api.shared = shared
	}

	if (c.api.oauth.baseUrl) {
		oauth.baseUrl = c.api.oauth.baseUrl
	}

	if (Object.keys(oauth).length !== 0) {
		api.oauth = oauth
	}

	if (Object.keys(api).length !== 0) {
		o.api = api
	}

	return o
}
