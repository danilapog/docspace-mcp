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
import type * as streamableHttp from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import * as types from "@modelcontextprotocol/sdk/types.js"
import express from "express"
import * as result from "../../util/result.ts"
import * as senders from "./senders.ts"

export interface Config {
	servers: Servers
	transports: Transports
}

export interface Servers {
	create(req: express.Request): result.Result<server.Server, Error>
}

export interface Transports {
	create(): streamableHttp.StreamableHTTPServerTransport
	retrieve(id: string): result.Result<streamableHttp.StreamableHTTPServerTransport, Error>
}

class Server {
	private servers: Servers
	private transports: Transports

	constructor(config: Config) {
		this.servers = config.servers
		this.transports = config.transports
	}

	async post(req: express.Request, res: express.Response): Promise<void> {
		try {
			let id = req.headers["mcp-session-id"]
			let t: streamableHttp.StreamableHTTPServerTransport | undefined

			if (id === undefined || id === "") {
				if (types.isInitializeRequest(req.body)) {
					let s = this.servers.create(req)
					if (s.err) {
						// It is most likely 400, rather than 500.
						let err = new Error("Creating server", {cause: s.err})
						senders.sendJsonrpcError(res, 400, -32000, err)
						return
					}

					t = this.transports.create()

					let c = await result.safeAsync(s.v.connect.bind(s), t)
					if (c.err) {
						let err = new Error("Attaching server", {cause: c.err})
						senders.sendJsonrpcError(res, 500, -32603, err)
						return
					}
				} else {
					// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L587
					let err = new Error("Bad Request: Mcp-Session-Id header is required")
					senders.sendJsonrpcError(res, 400, -32000, err)
					return
				}
			} else if (Array.isArray(id)) {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L597
				let err = new Error("Bad Request: Mcp-Session-Id header must be a single value")
				senders.sendJsonrpcError(res, 400, -32000, err)
				return
			} else {
				let r = this.transports.retrieve(id)
				if (r.err) {
					let err = new Error("Retrieving transport", {cause: r.err})
					senders.sendJsonrpcError(res, 404, -32001, err)
					return
				}

				t = r.v
			}

			let h = await result.safeAsync(t.handleRequest.bind(t), req, res, req.body)
			if (h.err) {
				let err = new Error("Handling request", {cause: h.err})
				senders.sendJsonrpcError(res, 500, -32603, err)
				return
			}
		} catch (err_) {
			let err = new Error("Internal Server Error", {cause: err_})
			senders.sendJsonrpcError(res, 500, -32603, err)
		}
	}

	async get(req: express.Request, res: express.Response): Promise<void> {
		await this.delete(req, res)
	}

	async delete(req: express.Request, res: express.Response): Promise<void> {
		try {
			let id = req.headers["mcp-session-id"]

			if (id === undefined || id === "") {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L587
				let err = new Error("Bad Request: Mcp-Session-Id header is required")
				senders.sendJsonrpcError(res, 400, -32000, err)
				return
			}

			if (Array.isArray(id)) {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L597
				let err = new Error("Bad Request: Mcp-Session-Id header must be a single value")
				senders.sendJsonrpcError(res, 400, -32000, err)
				return
			}

			let r = this.transports.retrieve(id)
			if (r.err) {
				let err = new Error("Retrieving transport", {cause: r.err})
				senders.sendJsonrpcError(res, 404, -32001, err)
				return
			}

			let h = await result.safeAsync(r.v.handleRequest.bind(r.v), req, res)
			if (h.err) {
				let err = new Error("Handling request", {cause: h.err})
				senders.sendJsonrpcError(res, 500, -32603, err)
				return
			}
		} catch (err_) {
			let err = new Error("Internal Server Error", {cause: err_})
			senders.sendJsonrpcError(res, 500, -32603, err)
		}
	}
}

export function router(c: Config): express.Router {
	let s = new Server(c)

	let r = express.Router()
	r.use(express.json())

	r.post("/mcp", s.post.bind(s))
	r.get("/mcp", s.get.bind(s))
	r.delete("/mcp", s.delete.bind(s))

	return r
}
