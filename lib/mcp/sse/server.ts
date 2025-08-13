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
import type * as sse from "@modelcontextprotocol/sdk/server/sse.js"
import express from "express"
import * as moreerrors from "../../util/moreerrors.ts"
import * as result from "../../util/result.ts"

export interface Config {
	servers: Servers
	transports: Transports
}

export interface Servers {
	create(req: express.Request): result.Result<server.Server, Error>
}

export interface Transports {
	create(endpoint: string, res: express.Response): sse.SSEServerTransport
	retrieve(id: string): result.Result<sse.SSEServerTransport, Error>
}

class Server {
	private servers: Servers
	private transports: Transports

	constructor(config: Config) {
		this.servers = config.servers
		this.transports = config.transports
	}

	async sse(req: express.Request, res: express.Response): Promise<void> {
		try {
			let s = this.servers.create(req)
			if (s.err) {
				// It is most likely 400, rather than 500.
				let err = new moreerrors.MessageError("Creating server", {cause: s.err})
				res.writeHead(400)
				res.end(err.toString())
				return
			}

			let t = this.transports.create("/messages", res)

			let c = await result.safeAsync(s.v.connect.bind(s.v), t)
			if (c.err) {
				let err = new moreerrors.MessageError("Attaching server", {cause: c.err})
				res.writeHead(500)
				res.end(err.toString())
				return
			}
		} catch (err_) {
			if (res.headersSent) {
				if (!res.writableEnded) {
					res.end()
				}
			} else {
				let err = new moreerrors.MessageError("Internal Server Error", {cause: err_})
				res.writeHead(500)
				res.end(err.toString())
			}
		}
	}

	async messages(req: express.Request, res: express.Response): Promise<void> {
		try {
			let id = req.headers["mcp-session-id"]

			if (id === undefined || id === "") {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L587
				let err = new moreerrors.MessageError("Bad Request: Mcp-Session-Id header is required")
				res.writeHead(400)
				res.end(err.toString())
				return
			}

			if (Array.isArray(id)) {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L597
				let err = new moreerrors.MessageError("Bad Request: Mcp-Session-Id header must be a single value")
				res.writeHead(400)
				res.end(err.toString())
				return
			}

			let r = this.transports.retrieve(id)
			if (r.err) {
				let err = new moreerrors.MessageError("Retrieving transport", {cause: r.err})
				res.writeHead(404)
				res.end(err.toString())
				return
			}

			let h = await result.safeAsync(r.v.handlePostMessage.bind(r.v), req, res)
			if (h.err) {
				// The handlePostMessage will most likely populate the response itself;
				// however, if it does not, we will do it ourselves.
				if (res.headersSent) {
					if (!res.writableEnded) {
						res.end()
					}
				} else {
					let err = new moreerrors.MessageError("Handling post message", {cause: h.err})
					res.writeHead(500)
					res.end(err.toString())
				}
				return
			}
		} catch (err_) {
			if (res.headersSent) {
				if (!res.writableEnded) {
					res.end()
				}
			} else {
				let err = new moreerrors.MessageError("Internal Server Error", {cause: err_})
				res.writeHead(500)
				res.end(err.toString())
			}
		}
	}
}

export function router(c: Config): express.Router {
	let s = new Server(c)

	let r = express.Router()
	r.use(express.json())

	r.get("/sse", s.sse.bind(s))
	r.post("/messages", s.messages.bind(s))

	return r
}
