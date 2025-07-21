#!/usr/bin/env node

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

import {Server as ProtocolServer} from "@modelcontextprotocol/sdk/server/index.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import express from "express"
import type {Config as ClientConfig} from "../lib/client.ts"
import {Client} from "../lib/client.ts"
import {Resolver} from "../lib/resolver.ts"
import type {ConfiguredStdioConfig, InternalStreamableConfig, MisconfiguredStdioConfig} from "../lib/server.ts"
import {attachConfiguredStdio, attachInternalStreamable, attachMisconfiguredStdio} from "../lib/server.ts"
import {Uploader} from "../lib/uploader.ts"
import pack from "../package.json" with {type: "json"}
import * as logger from "../util/logger.ts"
import * as moreexpress from "../util/moreexpress.ts"
import * as morefetch from "../util/morefetch.ts"
import * as result from "../util/result.ts"
import * as config from "./config.ts"

const SIGNALS = ["SIGTERM", "SIGINT"]

async function main(): Promise<void> {
	try {
		let c = config.loadConfig()

		if (c.err || c.v.transport === "stdio") {
			logger.mute()
		}

		if (c.err) {
			logger.error("Loading config", {err: c.err})
		} else {
			logger.info("Loaded config", config.mask(c.v))
		}

		if (c.err) {
			await startMisconfiguredStdioServer(c)
			return
		}

		if (c.v.transport === "stdio") {
			await startConfiguredStdioServer(c)
			return
		}

		if (c.v.internal && c.v.transport === "http") {
			await startInternalStreamableServer(c)
			return
		}
	} catch (err) {
		logger.error("Executing main", {err})
	}

	process.exit(1)
}

async function startMisconfiguredStdioServer(config: result.Error<config.Config, Error>): Promise<void> {
	logger.info("Starting misconfigured stdio server")

	let ps = createProtocolServer()

	let sc: MisconfiguredStdioConfig = {
		server: ps,
		err: config.err,
	}

	attachMisconfiguredStdio(sc)

	let pt = new StdioServerTransport()

	for (let s of SIGNALS) {
		process.on(s, () => {
			void (async() => {
				logger.info(`Received ${s}, shutting down misconfigured stdio server`)

				let r = await result.safeAsync(ps.close.bind(ps))
				if (r.err) {
					let err = new Error("Closing misconfigured stdio server", {cause: r.err})
					logger.error("Misconfigured stdio server shut down with an error", {err})
					process.exit(1)
				}

				logger.info("Misconfigured stdio server shut down successfully")
				process.exit(0)
			})()
		})
	}

	let pc = await result.safeAsync(ps.connect.bind(ps), pt)
	if (pc.err) {
		logger.error("Connecting to misconfigured stdio server", {err: pc.err})
		process.exit(1)
	}
}

async function startConfiguredStdioServer(config: result.Ok<config.Config, unknown>): Promise<void> {
	logger.info("Starting configured stdio server")

	let ps = createProtocolServer()

	let cc: ClientConfig = {
		baseUrl: config.v.baseUrl,
		userAgent: config.v.userAgent,
		fetch,
	}

	if (config.v.origin) {
		cc.fetch = morefetch.withOrigin(cc.fetch, config.v.origin)
	}

	let cl = new Client(cc)

	if (config.v.apiKey) {
		cl = cl.withApiKey(config.v.apiKey)
	}

	if (config.v.authToken) {
		cl = cl.withAuthToken(config.v.authToken)
	}

	if (config.v.username && config.v.password) {
		cl = cl.withBasicAuth(config.v.username, config.v.password)
	}

	let sc: ConfiguredStdioConfig = {
		server: ps,
		client: cl,
		resolver: new Resolver(cl),
		uploader: new Uploader(cl),
		dynamic: config.v.dynamic,
		toolsets: config.v.toolsets,
		tools: config.v.tools,
	}

	attachConfiguredStdio(sc)

	let pt = new StdioServerTransport()

	for (let s of SIGNALS) {
		process.on(s, () => {
			void (async() => {
				logger.info(`Received ${s}, shutting down configured stdio server`)

				let r = await result.safeAsync(ps.close.bind(ps))
				if (r.err) {
					let err = new Error("Closing configured stdio server", {cause: r.err})
					logger.error("Configured stdio server shut down with an error", {err})
					process.exit(1)
				}

				logger.info("Configured stdio server shut down successfully")
				process.exit(0)
			})()
		})
	}

	let pc = await result.safeAsync(ps.connect.bind(ps), pt)
	if (pc.err) {
		logger.error("Connecting to configured stdio server", {err: pc.err})
		process.exit(1)
	}
}

async function startInternalStreamableServer(config: result.Ok<config.Config, unknown>): Promise<void> {
	logger.info("Starting internal streamable server")

	let app = express()

	app.use(moreexpress.loggerMiddleware)

	let servers: Record<string, ProtocolServer> = {}
	let transports: Record<string, StreamableHTTPServerTransport> = {}

	let sf: InternalStreamableConfig = {
		app,
		async createTransport(o) {
			let ps = createProtocolServer()

			let cf: ClientConfig = {
				baseUrl: o.baseUrl,
				userAgent: config.v.userAgent,
				fetch,
			}

			cf.fetch = morefetch.withLogger(cf.fetch)

			let cc = new Client(cf)

			cc = cc.withAuthToken(o.authToken)

			let sf: ConfiguredStdioConfig = {
				server: ps,
				client: cc,
				resolver: new Resolver(cc),
				uploader: new Uploader(cc),
				dynamic: config.v.dynamic,
				toolsets: config.v.toolsets,
				tools: config.v.tools,
			}

			attachConfiguredStdio(sf)

			let pt = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => {
					return crypto.randomUUID()
				},
				onsessioninitialized: (sessionId) => {
					logger.info("Streamable transport session initialized", {sessionId})
					servers[sessionId] = ps
					transports[sessionId] = pt
				},
			})

			// eslint-disable-next-line unicorn/prefer-add-event-listener
			pt.onclose = () => {
				if (!pt.sessionId) {
					logger.warn("Streamable transport closed without a sessionId")
					return
				}

				if (!transports[pt.sessionId]) {
					logger.warn("Streamable transport closed with an unknown sessionId", {sessionId: pt.sessionId})
					return
				}

				logger.info("Streamable transport session closed", {sessionId: pt.sessionId})
				/* eslint-disable typescript/no-dynamic-delete */
				delete transports[pt.sessionId]
				delete servers[pt.sessionId]
				/* eslint-enable typescript/no-dynamic-delete */
			}

			let pc = await result.safeAsync(ps.connect.bind(ps), pt)
			if (pc.err) {
				return result.error(new Error("Connecting to internal streamable server", {cause: pc.err}))
			}

			return result.ok(pt)
		},
		retrieveTransport(id) {
			return transports[id]
		},
	}

	attachInternalStreamable(sf)

	let hs = app.listen(config.v.port, config.v.host)

	for (let s of SIGNALS) {
		process.on(s, () => {
			void (async() => {
				logger.info(`Received ${s}, shutting down internal streamable server`)

				let errs: Error[] = []

				let promises: Promise<result.Result<void, Error>>[] = []

				for (let [k, v] of Object.entries(servers)) {
					promises.push((async() => {
						let r = await result.safeAsync(v.close.bind(v))
						if (r.err) {
							return result.error(new Error(`Closing internal streamable server for session ${k}`, {cause: r.err}))
						}
						return result.ok()
					})())
				}

				let results = await Promise.allSettled(promises)

				for (let r of results) {
					if (r.status === "fulfilled" && r.value.err) {
						errs.push(r.value.err)
					}
				}

				let hr = await new Promise<result.Result<void, Error>>((res) => {
					hs.close((err) => {
						if (err) {
							res(result.error(new Error("Closing HTTP server", {cause: err})))
						} else {
							res(result.ok())
						}
					})
				})

				if (hr.err) {
					errs.push(hr.err)
				}

				if (errs.length !== 0) {
					let err = new Error("Multiple errors during shutdown", {cause: errs})
					logger.error("Internal streamable server shut down with an error", {err})
					process.exit(1)
				}

				logger.info("Internal streamable server shut down successfully")
				process.exit(0)
			})()
		})
	}

	let hc = await new Promise<result.Result<void, Error>>((res) => {
		hs.once("listening", () => {
			logger.info("Internal streamable server started", {host: config.v.host, port: config.v.port})
			res(result.ok())
		})

		hs.once("error", (err) => {
			logger.error("Internal streamable server error", {err})
			res(result.error(err))
		})
	})

	if (hc.err) {
		process.exit(1)
	}
}

function createProtocolServer(): ProtocolServer {
	return new ProtocolServer(
		{
			name: pack.name,
			version: pack.version,
		},
		{
			capabilities: {
				tools: {},
				logging: {},
			},
		},
	)
}

await main()
