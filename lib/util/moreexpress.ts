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
	url?: string
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
		p.url = req.url

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
		let err = new moreerrors.JsonError("Not Found")
		res.status(404)
		res.json(err.toObject())
	}
}

const ETAG_HEADERS: string[] = [
	"ETag",
	"If-Modified-Since",
	"If-Match",
	"If-None-Match",
	"If-Range",
	"If-Unmodified-Since",
]

const NO_CACHE_HEADERS: Record<string, string> = {
	"Expires": new Date(0).toUTCString(),
	"Cache-Control": "no-cache, no-store, no-transform, must-revalidate, private, max-age=0",
	"Pragma": "no-cache",
	"X-Accel-Expires": "0",
}

/**
 * {@link https://github.com/go-pkgz/rest/blob/v1.20.4/nocache.go | go-pkgz/rest Reference}
 */
export function noCache(): express.Handler {
	return (req, res, next) => {
		for (let h of ETAG_HEADERS) {
			h = h.toLowerCase()
			if (req.headers[h] !== undefined) {
				// eslint-disable-next-line typescript/no-dynamic-delete
				delete req.headers[h]
			}
		}

		for (let [h, v] of Object.entries(NO_CACHE_HEADERS)) {
			h = h.toLowerCase()
			res.header(h, v)
		}

		next()
	}
}
