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
import * as result from "../../../util/result.ts"
import * as configured from "../../base/configured.ts"
import * as client from "../../client.ts"
import * as resolver from "../../resolver.ts"
import * as uploader from "../../uploader.ts"

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
		let a = req.headers.authorization
		if (!a) {
			return result.error(new Error("Authorization header is required"))
		}

		let r = req.headers.referer
		if (!r) {
			return result.error(new Error("Referer header is required"))
		}

		let cc: client.Config = {
			userAgent: this.userAgent,
			sharedBaseUrl: r,
			sharedFetch: this.fetch,
		}

		let c = new client.Client(cc)

		c = c.withAuthToken(a)

		let sc: configured.Config = {
			client: c,
			resolver: new resolver.Resolver(c),
			uploader: new uploader.Uploader(c),
			dynamic: this.dynamic,
			tools: this.tools,
		}

		let s = configured.create(sc)

		return result.ok(s)
	}
}
