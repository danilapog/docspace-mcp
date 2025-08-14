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
import type * as morets from "../lib/util/morets.ts"
import * as morezod from "../lib/util/morezod.ts"
import * as result from "../lib/util/result.ts"
import pack from "../package.json" with {type: "json"}

const availableTransports: McpTransport[] = [
	"stdio",
	"sse",
	"streamable-http",
	"http",
]

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
	server: Server
}

export interface Mcp {
	transport: McpTransport
	dynamic: boolean
	toolsets: string[]
	tools: string[]
	enabledTools: string[]
	disabledTools: string[]
	session: McpSession
}

export type McpTransport =
	"stdio" |
	"sse" |
	"streamable-http" |
	"http"

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

export interface Server {
	baseUrl: string
	host: string
	port: number
	cors: Cors
	rateLimits: RateLimits
}

export interface Cors {
	mcp: CorsItem
	oauthMetadata: CorsItem
	oauthRegister: CorsItem
}

export interface CorsItem {
	origin: string
	maxAge: number
}

export interface RateLimits {
	mcp: RateLimit
	oauthMetadata: RateLimit
	oauthRegister: RateLimit
}

export interface RateLimit {
	capacity: number
	window: number
}

export const ConfigSchema = z.
	object({
		DOCSPACE_INTERNAL: z.
			string().
			default("0").
			transform(morezod.envBoolean()),

		DOCSPACE_TRANSPORT: z.
			string().
			default("stdio").
			transform(morezod.envUnion([...availableTransports])),

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

		DOCSPACE_USER_AGENT: z.
			string().
			trim().
			default(`${pack.name} v${pack.version}`),

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

		DOCSPACE_OAUTH_BASE_URL: z. // todo: check url
			string().
			trim().
			default("https://oauth.onlyoffice.com/"),

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

		DOCSPACE_SERVER_BASE_URL: z. // todo: check url
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

		DOCSPACE_SERVER_CORS_MCP_ORIGIN: z.
			string().
			trim().
			default("*"),

		DOCSPACE_SERVER_CORS_MCP_MAX_AGE: z.
			string().
			default("86400000"). // 1 day
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_CORS_OAUTH_METADATA_ORIGIN: z.
			string().
			trim().
			default("*"),

		DOCSPACE_SERVER_CORS_OAUTH_METADATA_MAX_AGE: z.
			string().
			default("86400000"). // 1 day
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_CORS_OAUTH_REGISTER_ORIGIN: z.
			string().
			trim().
			default("*"),

		DOCSPACE_SERVER_CORS_OAUTH_REGISTER_MAX_AGE: z.
			string().
			default("86400000"). // 1 day
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_MCP_CAPACITY: z.
			string().
			default("1000").
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_MCP_WINDOW: z.
			string().
			default("1000"). // 1 second
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_OAUTH_METADATA_CAPACITY: z.
			string().
			default("200").
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_OAUTH_METADATA_WINDOW: z.
			string().
			default("1000"). // 1 second
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_OAUTH_REGISTER_CAPACITY: z.
			string().
			default("20").
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),

		DOCSPACE_SERVER_RATE_LIMITS_OAUTH_REGISTER_WINDOW: z.
			string().
			default("3600000"). // 1 hour
			transform(morezod.envNumber()).
			pipe(z.number().min(0)),
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
			server: {
				baseUrl: o.DOCSPACE_SERVER_BASE_URL,
				host: o.DOCSPACE_HOST,
				port: o.DOCSPACE_PORT,
				cors: {
					mcp: {
						origin: o.DOCSPACE_SERVER_CORS_MCP_ORIGIN,
						maxAge: o.DOCSPACE_SERVER_CORS_MCP_MAX_AGE,
					},
					oauthMetadata: {
						origin: o.DOCSPACE_SERVER_CORS_OAUTH_METADATA_ORIGIN,
						maxAge: o.DOCSPACE_SERVER_CORS_OAUTH_METADATA_MAX_AGE,
					},
					oauthRegister: {
						origin: o.DOCSPACE_SERVER_CORS_OAUTH_REGISTER_ORIGIN,
						maxAge: o.DOCSPACE_SERVER_CORS_OAUTH_REGISTER_MAX_AGE,
					},
				},
				rateLimits: {
					mcp: {
						capacity: o.DOCSPACE_SERVER_RATE_LIMITS_MCP_CAPACITY,
						window: o.DOCSPACE_SERVER_RATE_LIMITS_MCP_WINDOW,
					},
					oauthMetadata: {
						capacity: o.DOCSPACE_SERVER_RATE_LIMITS_OAUTH_METADATA_CAPACITY,
						window: o.DOCSPACE_SERVER_RATE_LIMITS_OAUTH_METADATA_WINDOW,
					},
					oauthRegister: {
						capacity: o.DOCSPACE_SERVER_RATE_LIMITS_OAUTH_REGISTER_CAPACITY,
						window: o.DOCSPACE_SERVER_RATE_LIMITS_OAUTH_REGISTER_WINDOW,
					},
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
		c.api.shared.baseUrl = ensureTrailing(c.api.shared.baseUrl)

		// todo: check if not empty
		c.api.oauth.baseUrl = ensureTrailing(c.api.oauth.baseUrl)

		// todo: check if not empty
		c.server.baseUrl = ensureTrailing(c.server.baseUrl)

		if (c.internal) {
			c = {
				internal: c.internal,
				mcp: {
					transport: "streamable-http",
					dynamic: c.mcp.dynamic,
					toolsets: c.mcp.toolsets,
					tools: c.mcp.tools,
					enabledTools: c.mcp.enabledTools,
					disabledTools: c.mcp.disabledTools,
					session: c.mcp.session,
				},
				api: {
					userAgent: c.api.userAgent,
					shared: {
						baseUrl: "",
						origin: "",
						apiKey: "",
						pat: "",
						username: "",
						password: "",
					},
					oauth: {
						baseUrl: "",
					},
				},
				oauth: {
					resource: {
						scopesSupported: [],
						resourceName: "",
						resourceDocumentation: "",
					},
					client: {
						redirectUris: [],
						clientId: "",
						clientName: "",
						scopes: [],
						tosUri: "",
						policyUri: "",
						clientSecret: "",
					},
				},
				server: {
					baseUrl: "",
					host: c.server.host,
					port: c.server.port,
					cors: {
						mcp: {
							origin: "",
							maxAge: 0,
						},
						oauthMetadata: {
							origin: "",
							maxAge: 0,
						},
						oauthRegister: {
							origin: "",
							maxAge: 0,
						},
					},
					rateLimits: {
						mcp: {
							capacity: 0,
							window: 0,
						},
						oauthMetadata: {
							capacity: 0,
							window: 0,
						},
						oauthRegister: {
							capacity: 0,
							window: 0,
						},
					},
				},
			}
		}

		if (c.mcp.transport === "stdio") {
			c = {
				internal: c.internal,
				mcp: c.mcp,
				api: {
					userAgent: c.api.userAgent,
					shared: c.api.shared,
					oauth: {
						baseUrl: "",
					},
				},
				oauth: {
					resource: {
						scopesSupported: [],
						resourceName: "",
						resourceDocumentation: "",
					},
					client: {
						redirectUris: [],
						clientId: "",
						clientName: "",
						scopes: [],
						tosUri: "",
						policyUri: "",
						clientSecret: "",
					},
				},
				server: {
					baseUrl: "",
					host: "",
					port: 0,
					cors: {
						mcp: {
							origin: "",
							maxAge: 0,
						},
						oauthMetadata: {
							origin: "",
							maxAge: 0,
						},
						oauthRegister: {
							origin: "",
							maxAge: 0,
						},
					},
					rateLimits: {
						mcp: {
							capacity: 0,
							window: 0,
						},
						oauthMetadata: {
							capacity: 0,
							window: 0,
						},
						oauthRegister: {
							capacity: 0,
							window: 0,
						},
					},
				},
			}
		}

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
			let a = Boolean(o.api.shared.apiKey)
			let b = Boolean(o.api.shared.pat)
			let c = Boolean(o.api.shared.username) && Boolean(o.api.shared.password)
			let d = Boolean(o.oauth.client.clientId)
			let u = Number(a) + Number(b) + Number(c) + Number(d)

			if (u === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Expected at least one of API key, PAT, (username and password), or OAuth client ID to be set for HTTP transport",
				})
			}

			if (u !== 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Expected only one of API key, PAT, (username and password), or OAuth client ID to be set for HTTP transport",
				})
			}

			if ((a || b || c) && !o.api.shared.baseUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "API base URL is required for HTTP transport with API key, PAT, or (username and password)",
				})
			}

			if (d && !o.server.baseUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Server base URL is required for HTTP transport with OAuth client ID",
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

	let mcp = formatMcp(c.mcp)
	if (Object.keys(mcp).length !== 0) {
		o.mcp = mcp
	}

	let api = formatApi(c.api)
	if (Object.keys(api).length !== 0) {
		o.api = api
	}

	let oauth = formatOauth(c.oauth)
	if (Object.keys(oauth).length !== 0) {
		o.oauth = oauth
	}

	let server = formatServer(c.server)
	if (Object.keys(server).length !== 0) {
		o.server = server
	}

	return o
}

function formatMcp(c: Mcp): morets.RecursivePartial<Mcp> {
	let o: morets.RecursivePartial<Mcp> = {}

	if (c.transport) {
		o.transport = c.transport
	}

	if (c.dynamic) {
		o.dynamic = c.dynamic
	}

	if (c.toolsets.length !== 0) {
		o.toolsets = c.toolsets
	}

	if (c.tools.length !== 0) {
		o.tools = c.tools
	}

	let session = formatMcpSession(c.session)
	if (Object.keys(session).length !== 0) {
		o.session = session
	}

	return o
}

function formatMcpSession(c: McpSession): morets.RecursivePartial<McpSession> {
	let o: morets.RecursivePartial<McpSession> = {}

	if (c.ttl) {
		o.ttl = c.ttl
	}

	if (c.interval) {
		o.interval = c.interval
	}

	return o
}

function formatApi(c: Api): morets.RecursivePartial<Api> {
	let o: morets.RecursivePartial<Api> = {}

	if (c.userAgent) {
		o.userAgent = c.userAgent
	}

	let shared = formatApiShared(c.shared)
	if (Object.keys(shared).length !== 0) {
		o.shared = shared
	}

	let oauth = formatApiOauth(c.oauth)
	if (Object.keys(oauth).length !== 0) {
		o.oauth = oauth
	}

	return o
}

function formatApiShared(c: ApiShared): morets.RecursivePartial<ApiShared> {
	let o: morets.RecursivePartial<ApiShared> = {}

	if (c.baseUrl) {
		o.baseUrl = c.baseUrl
	}

	if (c.origin) {
		o.origin = c.origin
	}

	if (c.apiKey) {
		o.apiKey = "***"
	}

	if (c.pat) {
		o.pat = "***"
	}

	if (c.username) {
		o.username = "***"
	}

	if (c.password) {
		o.password = "***"
	}

	return o
}

function formatApiOauth(c: ApiOauth): morets.RecursivePartial<ApiOauth> {
	let o: morets.RecursivePartial<ApiOauth> = {}

	if (c.baseUrl) {
		o.baseUrl = c.baseUrl
	}

	return o
}

function formatOauth(c: Oauth): morets.RecursivePartial<Oauth> {
	let o: morets.RecursivePartial<Oauth> = {}

	let resource = formatOauthResource(c.resource)
	if (Object.keys(resource).length !== 0) {
		o.resource = resource
	}

	let client = formatOauthClient(c.client)
	if (Object.keys(client).length !== 0) {
		o.client = client
	}

	return o
}

function formatOauthResource(c: OauthResource): morets.RecursivePartial<OauthResource> {
	let o: morets.RecursivePartial<OauthResource> = {}

	if (c.scopesSupported.length !== 0) {
		o.scopesSupported = c.scopesSupported
	}

	if (c.resourceName) {
		o.resourceName = c.resourceName
	}

	if (c.resourceDocumentation) {
		o.resourceDocumentation = c.resourceDocumentation
	}

	return o
}

function formatOauthClient(c: OauthClient): morets.RecursivePartial<OauthClient> {
	let o: morets.RecursivePartial<OauthClient> = {}

	if (c.redirectUris.length !== 0) {
		o.redirectUris = c.redirectUris
	}

	if (c.clientId) {
		o.clientId = c.clientId
	}

	if (c.clientName) {
		o.clientName = c.clientName
	}

	if (c.scopes.length !== 0) {
		o.scopes = c.scopes
	}

	if (c.tosUri) {
		o.tosUri = c.tosUri
	}

	if (c.policyUri) {
		o.policyUri = c.policyUri
	}

	if (c.clientSecret) {
		o.clientSecret = "***"
	}

	return o
}

function formatServer(c: Server): morets.RecursivePartial<Server> {
	let o: morets.RecursivePartial<Server> = {}

	if (c.baseUrl) {
		o.baseUrl = c.baseUrl
	}

	if (c.host) {
		o.host = c.host
	}

	if (c.port) {
		o.port = c.port
	}

	let cors = formatCors(c.cors)
	if (Object.keys(cors).length !== 0) {
		o.cors = cors
	}

	let rateLimits = formatRateLimits(c.rateLimits)
	if (Object.keys(rateLimits).length !== 0) {
		o.rateLimits = rateLimits
	}

	return o
}

function formatCors(c: Cors): morets.RecursivePartial<Cors> {
	let o: morets.RecursivePartial<Cors> = {}

	let mcp = formatCorsItem(c.mcp)
	if (Object.keys(mcp).length !== 0) {
		o.mcp = mcp
	}

	let oauthMetadata = formatCorsItem(c.oauthMetadata)
	if (Object.keys(oauthMetadata).length !== 0) {
		o.oauthMetadata = oauthMetadata
	}

	let oauthRegister = formatCorsItem(c.oauthRegister)
	if (Object.keys(oauthRegister).length !== 0) {
		o.oauthRegister = oauthRegister
	}

	return o
}

function formatCorsItem(c: CorsItem): morets.RecursivePartial<CorsItem> {
	let o: morets.RecursivePartial<CorsItem> = {}

	if (c.origin) {
		o.origin = c.origin
	}

	if (c.maxAge) {
		o.maxAge = c.maxAge
	}

	return o
}

function formatRateLimits(c: RateLimits): morets.RecursivePartial<RateLimits> {
	let o: morets.RecursivePartial<RateLimits> = {}

	let mcp = formatRateLimit(c.mcp)
	if (Object.keys(mcp).length !== 0) {
		o.mcp = mcp
	}

	let oauthMetadata = formatRateLimit(c.oauthMetadata)
	if (Object.keys(oauthMetadata).length !== 0) {
		o.oauthMetadata = oauthMetadata
	}

	let oauthRegister = formatRateLimit(c.oauthRegister)
	if (Object.keys(oauthRegister).length !== 0) {
		o.oauthRegister = oauthRegister
	}

	return o
}

function formatRateLimit(c: RateLimit): morets.RecursivePartial<RateLimit> {
	let o: morets.RecursivePartial<RateLimit> = {}

	if (c.capacity) {
		o.capacity = c.capacity
	}

	if (c.window) {
		o.window = c.window
	}

	return o
}
