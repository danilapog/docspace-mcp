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

export interface Config {
	mcp: Mcp
	api: Api
	oauth: Oauth
}

export interface Mcp {
	dynamic: boolean
	tools: string[]
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

export function start(
	config: Config,
): [Promise<Error | undefined>, () => Promise<Error | undefined>] {
	let create = (req: express.Request): result.Result<server.Server, Error> => {
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

	let cc: api.client.Config = {
		userAgent: config.api.userAgent,
		sharedBaseUrl: "",
		sharedFetch() {
			throw new Error("Not implemented")
		},
		oauthBaseUrl: config.api.oauth.baseUrl,
		oauthFetch: morefetch.withLogger(globalThis.fetch),
	}

	let cl = new api.client.Client(cc)

	cl = cl.withApiKey(config.api.shared.apiKey)

	let orc: oauth.resource.Config = {
		resourceBaseUrl: config.mcp.server.baseUrl,
		scopesSupported: config.oauth.resource.scopesSupported,
		resourceName: config.oauth.resource.resourceName,
		resourceDocumentation: config.oauth.resource.resourceDocumentation,
	}

	let or = oauth.resource.router(orc)

	let osc: oauth.server.Config = {
		serverBaseUrl: config.mcp.server.baseUrl,
		redirectUris: config.oauth.client.redirectUris,
		clientId: config.oauth.client.clientId,
		clientName: config.oauth.client.clientName,
		scopes: config.oauth.client.scopes,
		tosUri: config.oauth.client.tosUri,
		policyUri: config.oauth.client.policyUri,
		clientSecret: config.oauth.client.clientSecret,
		client: cl,
	}

	let os = oauth.server.router(osc)

	let omc: oauth.middleware.Config = {
		resourceBaseUrl: config.mcp.server.baseUrl,
		client: cl,
	}

	let oh = oauth.middleware.handler(omc)
	if (oh.err) {
		// eslint-disable-next-line typescript/require-await
		return [Promise.resolve(oh.err), async() => undefined]
	}

	let sc: mcp.sessions.Config = {
		ttl: config.mcp.session.ttl,
	}

	let ss = new mcp.sessions.Sessions(sc)

	let tc: mcp.streamable.transports.Config = {
		sessions: ss,
	}

	let tt = new mcp.streamable.transports.Transports(tc)

	let mc: mcp.streamable.server.Config = {
		servers: {
			create,
		},
		transports: tt,
	}

	let mr = mcp.streamable.server.router(mc)

	let ex = express()

	ex.disable("x-powered-by")
	ex.disable("etag")
	ex.set("json spaces", 2)

	ex.use(moreexpress.context())
	ex.use(moreexpress.logger())

	ex.use(or)
	ex.use(os)

	let wr = express.Router()
	wr.use(oh.v)
	wr.use("/", mr)
	ex.use(wr)

	ex.use(moreexpress.notFound())

	let sa = new AbortController()

	let sw = ss.watch(sa.signal, config.mcp.session.interval)

	let hs = ex.listen(config.mcp.server.port, config.mcp.server.host)

	let cleanup = async(): Promise<Error | undefined> => {
		let errs: Error[] = []

		if (!sa.signal.aborted) {
			sa.abort("Cleaning up")

			let err = await sw
			if (err && !moreerrors.isAborted(err)) {
				errs.push(new Error("Stopping sessions watcher", {cause: err}))
			}

			err = await ss.clear()
			if (err) {
				errs.push(new Error("Clearing sessions", {cause: err}))
			}
		}

		if (hs.listening) {
			let err = await new Promise<Error | undefined>((res) => {
				hs.close((err) => {
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

	let p = new Promise<Error | undefined>((res) => {
		hs.once("error", onError)
		hs.once("listening", onListening)

		function onError(err: Error): void {
			close(new Error("Starting HTTP server", {cause: err}))
		}

		function onListening(): void {
			let o: Record<string, unknown> = {
				host: config.mcp.server.host,
				port: config.mcp.server.port,
			}
			logger.info("Server started", o)
			close()
		}

		function close(err?: Error): void {
			hs.removeListener("error", onError)
			hs.removeListener("listening", onListening)
			res(err)
		}
	})

	return [p, cleanup]
}
