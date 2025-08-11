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

import type express from "express"
import * as globalContext from "./context.ts"
import * as globalLogger from "./logger.ts"
import * as moreerrors from "./moreerrors.ts"

export function context(): express.Handler {
	return (req, _, next) => {
		let ctx: globalContext.Context = {}

		let id = req.headers["mcp-session-id"]
		if (id !== undefined && id !== "" && !Array.isArray(id)) {
			ctx.sessionId = id
		}

		globalContext.run(ctx, () => {
			next()
		})
	}
}

const OUTGOING = "<--"
const INCOMING = "-->"

interface Payload {
	sessionId?: string
	method?: string
	path?: string
	status?: number
	duration?: string
}

export function logger(): express.Handler {
	return (req, res, next) => {
		let p: Payload = {}

		let ctx = globalContext.get()
		if (ctx && ctx.sessionId) {
			p.sessionId = ctx.sessionId
		}

		p.method = req.method
		p.path = req.path

		globalLogger.info(INCOMING, p)

		let s = Date.now()

		res.on("finish", () => {
			p.status = res.statusCode

			let d = Date.now() - s
			if (d < 1000) {
				p.duration = `${d}ms`
			} else {
				p.duration = `${Math.round(d / 1000)}s`
			}

			globalLogger.info(OUTGOING, p)
		})

		next()
	}
}

export function notFound(): express.Handler {
	return (_, res) => {
		let err = new Error("Not Found")
		sendJsonError(res, 404, err)
	}
}

export function sendJsonError(res: express.Response, code: number, err: Error): void {
	res.status(code)
	res.json({
		message: moreerrors.format(err),
	})
}

export function sendJsonrpcError(res: express.Response, httpCode: number, jsonrpcCode: number, err: Error): void {
	res.status(httpCode)
	res.json({
		jsonrpc: "2.0",
		error: {
			code: jsonrpcCode,
			message: moreerrors.format(err),
		},
		id: null,
	})
}
