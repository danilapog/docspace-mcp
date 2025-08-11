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
import type express from "express"
import * as result from "../../../../util/result.ts"
import * as api from "../../../api.ts"
import * as configured from "../../base/configured.ts"

export interface Config {
	userAgent: string
	dynamic: boolean
	tools: string[]
	fetch: typeof globalThis.fetch
}

export class Servers {
	private userAgent: string
	private dynamic: boolean
	private tools: string[]
	private fetch: typeof globalThis.fetch

	constructor(config: Config) {
		this.userAgent = config.userAgent
		this.dynamic = config.dynamic
		this.tools = config.tools
		this.fetch = config.fetch
	}

	create(req: express.Request): result.Result<server.Server, Error> {
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
			userAgent: this.userAgent,
			sharedBaseUrl: p.v.aud,
			sharedFetch: this.fetch,
			oauthBaseUrl: "",
			oauthFetch() {
				throw new Error("Not implemented")
			},
		}

		let c = new api.client.Client(cc)

		c = c.withBearerAuth(req.auth.token)

		let sc: configured.Config = {
			client: c,
			resolver: new api.resolver.Resolver(c),
			uploader: new api.uploader.Uploader(c),
			dynamic: this.dynamic,
			tools: this.tools,
		}

		let s = configured.create(sc)

		return result.ok(s)
	}
}
