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

import type http from "node:http"
import type * as server from "@modelcontextprotocol/sdk/server/index.js"
import express from "express"
import * as api from "../../lib/api.ts"
import * as mcp from "../../lib/mcp.ts"
import * as oauth from "../../lib/oauth.ts"
import * as logger from "../../lib/util/logger.ts"
import * as moreerrors from "../../lib/util/moreerrors.ts"
import * as moreexpress from "../../lib/util/moreexpress.ts"
import * as morefetch from "../../lib/util/morefetch.ts"
import * as result from "../../lib/util/result.ts"
import type * as shared from "../shared.ts"

export interface Config {
	mcp: Mcp
	api: Api
	oauth: Oauth
	server: Server
}

export interface Mcp {
	dynamic: boolean
	tools: string[]
	session: McpSession
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
	apiKey: string
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
}

type CreateServer = (req: express.Request) => result.Result<server.Server, Error>

interface App {
	oauth: AppOauth
	streamable: AppMcp
	express: express.Express
}

interface AppOauth {
	resource: express.Router
	server: express.Router
	middleware: express.Handler
}

interface AppMcp {
	sessions: mcp.sessions.Sessions
	server: express.Router
}

export function start(config: Config): [shared.P, shared.Cleanup] {
	let a = createApp(config)
	if (a.err) {
		// eslint-disable-next-line typescript/require-await
		return [Promise.resolve(a.err), async() => undefined]
	}
	return startApp(config, a.v)
}

function createApp(config: Config): result.Result<App, Error> {
	let create = createCreateServer(config)

	let o = createOauth(config)
	if (o.err) {
		return result.error(new Error("Creating OAuth", {cause: o.err}))
	}

	let s = createStreamable(config, create)

	let e = createExpress(o.v, s)

	let a: App = {
		oauth: o.v,
		streamable: s,
		express: e,
	}

	return result.ok(a)
}

function createCreateServer(config: Config): CreateServer {
	return (req) => {
		if (!req.auth) {
			return result.error(new Error("OAuth middleware was not registered"))
		}

		let p = api.client.decodeOauthTokenPayload(req.auth.token)
		if (p.err) {
			return result.error(new Error("Decoding OAuth token", {cause: p.err}))
		}

		if (!p.v.aud.endsWith("/")) {
			p.v.aud += "/"
		}

		let cc: api.client.Config = {
			userAgent: config.api.userAgent,
			sharedBaseUrl: p.v.aud,
			sharedFetch: morefetch.withLogger(globalThis.fetch),
			oauthBaseUrl: "",
			oauthFetch() {
				throw new Error("Not implemented")
			},
		}

		let c = new api.client.Client(cc)

		c = c.withBearerAuth(req.auth.token)

		let sc: mcp.base.configured.Config = {
			client: c,
			resolver: new api.resolver.Resolver(c),
			uploader: new api.uploader.Uploader(c),
			dynamic: config.mcp.dynamic,
			tools: config.mcp.tools,
		}

		let s = mcp.base.configured.create(sc)

		return result.ok(s)
	}
}

function createOauth(config: Config): result.Result<AppOauth, Error> {
	let cc: api.client.Config = {
		userAgent: config.api.userAgent,
		sharedBaseUrl: "",
		sharedFetch() {
			throw new Error("Not implemented")
		},
		oauthBaseUrl: config.api.oauth.baseUrl,
		oauthFetch: morefetch.withLogger(globalThis.fetch),
	}

	let c = new api.client.Client(cc)

	c = c.withApiKey(config.api.shared.apiKey)

	let rc: oauth.resource.Config = {
		resourceBaseUrl: config.server.baseUrl,
		scopesSupported: config.oauth.resource.scopesSupported,
		resourceName: config.oauth.resource.resourceName,
		resourceDocumentation: config.oauth.resource.resourceDocumentation,
	}

	let r = oauth.resource.router(rc)

	let sc: oauth.server.Config = {
		serverBaseUrl: config.server.baseUrl,
		redirectUris: config.oauth.client.redirectUris,
		clientId: config.oauth.client.clientId,
		clientName: config.oauth.client.clientName,
		scopes: config.oauth.client.scopes,
		tosUri: config.oauth.client.tosUri,
		policyUri: config.oauth.client.policyUri,
		clientSecret: config.oauth.client.clientSecret,
		client: c,
	}

	let s = oauth.server.router(sc)

	let mc: oauth.middleware.Config = {
		resourceBaseUrl: config.server.baseUrl,
		client: c,
	}

	let m = oauth.middleware.handler(mc)
	if (m.err) {
		return result.error(new Error("Creating OAuth middleware", {cause: m.err}))
	}

	let a: AppOauth = {
		resource: r,
		server: s,
		middleware: m.v,
	}

	return result.ok(a)
}

function createStreamable(config: Config, create: CreateServer): AppMcp {
	let sc: mcp.sessions.Config = {
		ttl: config.mcp.session.ttl,
	}

	let s = new mcp.sessions.Sessions(sc)

	let tc: mcp.streamable.transports.Config = {
		sessions: s,
	}

	let t = new mcp.streamable.transports.Transports(tc)

	let rc: mcp.streamable.server.Config = {
		servers: {
			create,
		},
		transports: t,
	}

	let r = mcp.streamable.server.router(rc)

	let a: AppMcp = {
		sessions: s,
		server: r,
	}

	return a
}

function createExpress(o: AppOauth, s: AppMcp): express.Express {
	let e = express()

	e.disable("x-powered-by")
	e.disable("etag")
	e.set("json spaces", 2)

	e.use(moreexpress.context())
	e.use(moreexpress.logger())

	e.use(o.resource)
	e.use(o.server)

	let r = express.Router()
	r.use(o.middleware)
	r.use("/", s.server)
	e.use(r)

	e.use(moreexpress.notFound())

	return e
}

function startApp(config: Config, a: App): [shared.P, shared.Cleanup] {
	let c = new AbortController()

	let w = a.streamable.sessions.watch(c.signal, config.mcp.session.interval)

	let h = a.express.listen(config.server.port, config.server.host)

	let cleanup = createCleanup(a, c, w, h)

	let p = createPromise(config, h)

	return [p, cleanup]
}

function createCleanup(a: App, c: AbortController, w: shared.P, h: http.Server): shared.Cleanup {
	return async() => {
		let errs: Error[] = []

		if (!c.signal.aborted) {
			c.abort("Cleaning up")

			let err = await w
			if (err && !moreerrors.isAborted(err)) {
				errs.push(new Error("Stopping sessions watcher", {cause: err}))
			}

			err = await a.streamable.sessions.clear()
			if (err) {
				errs.push(new Error("Clearing sessions", {cause: err}))
			}
		}

		if (h.listening) {
			let err = await new Promise<Error | undefined>((res) => {
				h.close((err) => {
					if (err) {
						res(new Error("Closing HTTP server", {cause: err}))
					} else {
						res(undefined)
					}
				})
			})

			if (err) {
				errs.push(err)
			}
		}

		if (errs.length !== 0) {
			return new Error("Multiple errors", {cause: errs})
		}
	}
}

async function createPromise(config: Config, h: http.Server): shared.P {
	return await new Promise((res) => {
		h.once("error", onError)
		h.once("listening", onListening)

		function onError(err: Error): void {
			close(new Error("Starting HTTP server", {cause: err}))
		}

		function onListening(): void {
			let o: Record<string, unknown> = {
				host: config.server.host,
				port: config.server.port,
			}
			logger.info("Server started", o)
			close()
		}

		function close(err?: Error): void {
			h.removeListener("error", onError)
			h.removeListener("listening", onListening)
			res(err)
		}
	})
}
