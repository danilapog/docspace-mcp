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
import * as api from "../lib/api.ts"
import * as mcp from "../lib/mcp.ts"
import * as oauth from "../lib/oauth.ts"
import * as logger from "../lib/util/logger.ts"
import * as moreerrors from "../lib/util/moreerrors.ts"
import * as moreexpress from "../lib/util/moreexpress.ts"
import * as morefetch from "../lib/util/morefetch.ts"
import * as result from "../lib/util/result.ts"
import type * as config from "./config.ts"
import type * as shared from "./shared.ts"

type CreateServer = (req: express.Request) => result.Result<server.Server, Error>

interface Components {
	oauth: Oauth | undefined
	sse: Mcp | undefined
	streamable: Mcp | undefined
}

interface Oauth {
	resource: express.Router
	server: express.Router
	middleware: express.Handler
}

interface Mcp {
	sessions: mcp.sessions.Sessions
	server: express.Router
}

interface App {
	sse: Watchable | undefined
	streamable: Watchable | undefined
	server: http.Server
}

interface Watchable {
	controller: AbortController
	promise: shared.P
}

export function start(config: config.Config): [shared.P, shared.Cleanup] {
	let create = createCreateServer(config)

	let c = createComponents(config, create)
	if (c.err) {
		// eslint-disable-next-line typescript/require-await
		return [Promise.resolve(c.err), async() => undefined]
	}

	let e = createExpress(c.v)

	let a = createApp(config, c.v, e)

	let cleanup = createCleanup(c.v, a)

	let p = createPromise(config, a.server)

	return [p, cleanup]
}

function createCreateServer(config: config.Config): CreateServer {
	if (config.internal) {
		return createCreateServerWithHeaders(config)
	}
	return createCreateServerWithOauth(config)
}

function createCreateServerWithHeaders(config: config.Config): CreateServer {
	return (req: express.Request): result.Result<server.Server, Error> => {
		let a = req.headers.authorization
		if (!a) {
			return result.error(new Error("Authorization header is required"))
		}

		let r = req.headers.referer
		if (!r) {
			return result.error(new Error("Referer header is required"))
		}

		let cc: api.client.Config = {
			userAgent: config.api.userAgent,
			sharedBaseUrl: r,
			sharedFetch: morefetch.withLogger(globalThis.fetch),
			oauthBaseUrl: "",
			oauthFetch() {
				throw new Error("Not implemented")
			},
		}

		let c = new api.client.Client(cc)

		c = c.withAuthToken(a)

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

function createCreateServerWithOauth(config: config.Config): CreateServer {
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

function createComponents(config: config.Config, create: CreateServer): result.Result<Components, Error> {
	let c: Components = {
		oauth: undefined,
		sse: undefined,
		streamable: undefined,
	}

	if (!config.internal) {
		let r = createOauth(config)
		if (r.err) {
			return result.error(new Error("Creating OAuth", {cause: r.err}))
		}
		c.oauth = r.v

		c.sse = createSse(config, create)
	}

	c.streamable = createStreamable(config, create)

	return result.ok(c)
}

function createOauth(config: config.Config): result.Result<Oauth, Error> {
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
		metadataCorsOrigin: config.server.cors.oauthMetadata.origin,
		metadataCorsMaxAge: config.server.cors.oauthMetadata.maxAge,
		metadataRateLimitCapacity: config.server.rateLimits.oauthMetadata.capacity,
		metadataRateLimitWindow: config.server.rateLimits.oauthMetadata.window,
		resourceBaseUrl: config.server.baseUrl,
		scopesSupported: config.oauth.resource.scopesSupported,
		resourceName: config.oauth.resource.resourceName,
		resourceDocumentation: config.oauth.resource.resourceDocumentation,
	}

	let r = oauth.resource.router(rc)

	let sc: oauth.server.Config = {
		serverBaseUrl: config.server.baseUrl,
		metadataCorsOrigin: config.server.cors.oauthMetadata.origin,
		metadataCorsMaxAge: config.server.cors.oauthMetadata.maxAge,
		metadataRateLimitCapacity: config.server.rateLimits.oauthMetadata.capacity,
		metadataRateLimitWindow: config.server.rateLimits.oauthMetadata.window,
		registerCorsOrigin: config.server.cors.oauthRegister.origin,
		registerCorsMaxAge: config.server.cors.oauthRegister.maxAge,
		registerRateLimitCapacity: config.server.rateLimits.oauthRegister.capacity,
		registerRateLimitWindow: config.server.rateLimits.oauthRegister.window,
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

	let o: Oauth = {
		resource: r,
		server: s,
		middleware: m.v,
	}

	return result.ok(o)
}

function createSse(config: config.Config, create: CreateServer): Mcp {
	let sc: mcp.sessions.Config = {
		ttl: config.mcp.session.ttl,
	}

	let s = new mcp.sessions.Sessions(sc)

	let tc: mcp.sse.transports.Config = {
		sessions: s,
	}

	let t = new mcp.sse.transports.Transports(tc)

	let rc: mcp.sse.server.Config = {
		corsOrigin: "",
		corsMaxAge: 0,
		corsAllowedHeaders: [],
		corsExposedHeaders: [],
		rateLimitCapacity: 0,
		rateLimitWindow: 0,
		servers: {
			create,
		},
		transports: t,
	}

	if (!config.internal) {
		rc.corsOrigin = config.server.cors.mcp.origin
		rc.corsMaxAge = config.server.cors.mcp.maxAge
		rc.corsAllowedHeaders.push("Authorization")
		rc.corsExposedHeaders.push("WWW-Authenticate")
		rc.rateLimitCapacity = config.server.rateLimits.mcp.capacity
		rc.rateLimitWindow = config.server.rateLimits.mcp.window
	}

	let r = mcp.sse.server.router(rc)

	let m: Mcp = {
		sessions: s,
		server: r,
	}

	return m
}

function createStreamable(config: config.Config, create: CreateServer): Mcp {
	let sc: mcp.sessions.Config = {
		ttl: config.mcp.session.ttl,
	}

	let s = new mcp.sessions.Sessions(sc)

	let tc: mcp.streamable.transports.Config = {
		sessions: s,
	}

	let t = new mcp.streamable.transports.Transports(tc)

	let rc: mcp.streamable.server.Config = {
		corsOrigin: "",
		corsMaxAge: 0,
		corsAllowedHeaders: [],
		corsExposedHeaders: [],
		rateLimitCapacity: 0,
		rateLimitWindow: 0,
		servers: {
			create,
		},
		transports: t,
	}

	if (!config.internal) {
		rc.corsOrigin = config.server.cors.mcp.origin
		rc.corsMaxAge = config.server.cors.mcp.maxAge
		rc.corsAllowedHeaders.push("Authorization")
		rc.corsExposedHeaders.push("WWW-Authenticate")
		rc.rateLimitCapacity = config.server.rateLimits.mcp.capacity
		rc.rateLimitWindow = config.server.rateLimits.mcp.window
	}

	let r = mcp.streamable.server.router(rc)

	let m: Mcp = {
		sessions: s,
		server: r,
	}

	return m
}

function createExpress(c: Components): express.Express {
	let e = express()

	e.disable("x-powered-by")
	e.disable("etag")
	e.set("json spaces", 2)

	e.use(moreexpress.context())
	e.use(moreexpress.logger())

	if (c.oauth) {
		e.use(c.oauth.resource)
		e.use(c.oauth.server)

		let r = express.Router()
		r.use(c.oauth.middleware)

		if (c.sse) {
			r.use("/", c.sse.server)
		}

		if (c.streamable) {
			r.use("/", c.streamable.server)
		}

		e.use(r)
	} else {
		if (c.sse) {
			e.use(c.sse.server)
		}

		if (c.streamable) {
			e.use(c.streamable.server)
		}
	}

	e.use(moreexpress.notFound())

	return e
}

function createApp(config: config.Config, c: Components, e: express.Express): App {
	let sse: Watchable | undefined

	if (c.sse) {
		let a = new AbortController()
		let w = c.sse.sessions.watch(a.signal, config.mcp.session.interval)
		sse = {
			controller: a,
			promise: w,
		}
	}

	let streamable: Watchable | undefined

	if (c.streamable) {
		let a = new AbortController()
		let w = c.streamable.sessions.watch(a.signal, config.mcp.session.interval)
		streamable = {
			controller: a,
			promise: w,
		}
	}

	let h = e.listen(config.server.port, config.server.host)

	let a: App = {
		sse,
		streamable,
		server: h,
	}

	return a
}

function createCleanup(c: Components, a: App): shared.Cleanup {
	return async() => {
		let errs: Error[] = []

		if (c.sse && a.sse && !a.sse.controller.signal.aborted) {
			a.sse.controller.abort("Cleaning up")

			let err = await a.sse.promise
			if (err && !moreerrors.isAborted(err)) {
				errs.push(new Error("Stopping sse sessions watcher", {cause: err}))
			}

			err = await c.sse.sessions.clear()
			if (err) {
				errs.push(new Error("Clearing sse sessions", {cause: err}))
			}
		}

		if (c.streamable && a.streamable && !a.streamable.controller.signal.aborted) {
			a.streamable.controller.abort("Cleaning up")

			let err = await a.streamable.promise
			if (err && !moreerrors.isAborted(err)) {
				errs.push(new Error("Stopping streamable sessions watcher", {cause: err}))
			}

			err = await c.streamable.sessions.clear()
			if (err) {
				errs.push(new Error("Clearing streamable sessions", {cause: err}))
			}
		}

		if (a.server.listening) {
			let err = await new Promise<Error | undefined>((res) => {
				a.server.close((err) => {
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

async function createPromise(config: config.Config, h: http.Server): shared.P {
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
