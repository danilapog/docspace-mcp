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

import express from "express"
import * as streamable from "../../lib/mcp/streamable.ts"
import * as logger from "../../lib/util/logger.ts"
import * as moreerrors from "../../lib/util/moreerrors.ts"
import * as moreexpress from "../../lib/util/moreexpress.ts"
import * as morefetch from "../../lib/util/morefetch.ts"

export interface Config {
	mcp: Mcp
	api: Api
}

export interface Mcp {
	dynamic: boolean
	tools: string[]
	server: McpServer
	session: McpSession
}

export interface McpServer {
	host: string
	port: number
}

export interface McpSession {
	ttl: number
	interval: number
}

export interface Api {
	userAgent: string
}

export function start(
	config: Config,
): [Promise<Error | undefined>, () => Promise<Error | undefined>] {
	let bc: streamable.base.internal.Config = {
		userAgent: config.api.userAgent,
		dynamic: config.mcp.dynamic,
		tools: config.mcp.tools,
		fetch: morefetch.withLogger(globalThis.fetch),
	}

	let bs = new streamable.base.internal.Servers(bc)

	let sc: streamable.sessions.Config = {
		ttl: config.mcp.session.ttl,
	}

	let ss = new streamable.sessions.Sessions(sc)

	let tc: streamable.transports.Config = {
		sessions: ss,
	}

	let tt = new streamable.transports.Transports(tc)

	let mc: streamable.server.Config = {
		servers: bs,
		transports: tt,
	}

	let mr = streamable.server.router(mc)

	let app = express()

	app.disable("x-powered-by")
	app.disable("etag")

	app.use(moreexpress.context())
	app.use(moreexpress.logger())

	app.use(mr)
	app.use(moreexpress.notFound())

	let sa = new AbortController()

	let sw = ss.watch(sa.signal, config.mcp.session.interval)

	let hs = app.listen(config.mcp.server.port, config.mcp.server.host)

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
