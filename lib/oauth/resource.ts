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

import * as errors from "@modelcontextprotocol/sdk/server/auth/errors.js"
import * as allowedMethods from "@modelcontextprotocol/sdk/server/auth/middleware/allowedMethods.js"
import type * as auth from "@modelcontextprotocol/sdk/shared/auth.js"
import cors from "cors"
import express from "express"
import * as expressRateLimit from "express-rate-limit"

export interface Config {
	metadataCorsOrigin: string
	metadataCorsMaxAge: number
	metadataRateLimitCapacity: number
	metadataRateLimitWindow: number
	resourceBaseUrl: string
	scopesSupported: string[]
	resourceName: string
	resourceDocumentation: string
}

class Server {
	private metadataCorsOrigin: string
	private metadataCorsMaxAge: number
	private metadataRateLimitCapacity: number
	private metadataRateLimitWindow: number
	private resourceBaseUrl: string
	private scopesSupported: string[]
	private resourceName: string
	private resourceDocumentation: string

	constructor(config: Config) {
		this.metadataCorsOrigin = config.metadataCorsOrigin
		this.metadataCorsMaxAge = config.metadataCorsMaxAge
		this.metadataRateLimitCapacity = config.metadataRateLimitCapacity
		this.metadataRateLimitWindow = config.metadataRateLimitWindow
		this.resourceBaseUrl = config.resourceBaseUrl
		this.scopesSupported = config.scopesSupported
		this.resourceName = config.resourceName
		this.resourceDocumentation = config.resourceDocumentation
	}

	metadataCors(): express.Handler {
		if (!this.metadataCorsOrigin) {
			return (_, __, next) => {
				next()
			}
		}

		let o: cors.CorsOptions = {
			origin: this.metadataCorsOrigin,
			methods: ["GET"],
		}

		let exposedHeaders: string[] = []

		if (this.metadataRateLimitCapacity && this.metadataRateLimitWindow) {
			exposedHeaders.push(
				"Retry-After",
				"RateLimit-Limit",
				"RateLimit-Remaining",
				"RateLimit-Reset",
			)
		}

		if (exposedHeaders.length !== 0) {
			o.exposedHeaders = exposedHeaders
		}

		if (this.metadataCorsMaxAge) {
			o.maxAge = this.metadataCorsMaxAge / 1000
		}

		return cors(o)
	}

	metadataRateLimit(): express.Handler {
		if (!this.metadataRateLimitCapacity || !this.metadataRateLimitWindow) {
			return (_, __, next) => {
				next()
			}
		}

		return expressRateLimit.rateLimit({
			windowMs: this.metadataRateLimitWindow,
			limit: this.metadataRateLimitCapacity,
			standardHeaders: true,
			legacyHeaders: false,
			message: new errors.
				TooManyRequestsError("You have exceeded the rate limit for protected resource metadata requests").
				toResponseObject(),
		})
	}

	/**
	 * {@link https://github.com/modelcontextprotocol/typescript-sdk/blob/1.17.0/src/client/auth.ts#L485 | MCP Client Reference} \
	 * {@link https://github.com/modelcontextprotocol/typescript-sdk/blob/1.17.0/src/server/auth/handlers/metadata.ts#6 | MCP Server Reference} \
	 * {@link https://www.rfc-editor.org/rfc/rfc9728#section-3 | RFC 9728 Obtaining Protected Resource Metadata Reference} \
	 * {@link https://www.rfc-editor.org/rfc/rfc9728#name-protected-resource-metadata | RFC 9728 Protected Resource Metadata Reference}
	 */
	metadata(_: express.Request, res: express.Response): void {
		let m: auth.OAuthProtectedResourceMetadata = {
			resource: this.resourceBaseUrl,
		}

		if (this.scopesSupported.length !== 0) {
			m.scopes_supported = [...this.scopesSupported]
		}

		if (this.resourceName) {
			m.resource_name = this.resourceName
		}

		if (this.resourceDocumentation) {
			m.resource_documentation = this.resourceDocumentation
		}

		res.status(200)
		res.json(m)
	}
}

export function router(config: Config): express.Router {
	let s = new Server(config)

	let g = express.Router()
	g.use(express.json())

	let m = express.Router()
	m.use(s.metadataCors())
	m.use(allowedMethods.allowedMethods(["GET"]))
	m.use(s.metadataRateLimit())
	m.get("/", s.metadata.bind(s))

	g.get("/.well-known/oauth-protected-resource", m)

	return g
}
