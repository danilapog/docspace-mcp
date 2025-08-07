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

import * as stdio from "@modelcontextprotocol/sdk/server/stdio.js"
import * as api from "../../lib/api.ts"
import * as base from "../../lib/mcp/base.ts"
import * as morefetch from "../../util/morefetch.ts"
import * as result from "../../util/result.ts"

export interface Config {
	mcp: Mcp
	api: Api
}

export interface Mcp {
	dynamic: boolean
	tools: string[]
}

export interface Api {
	userAgent: string
	shared: ApiShared
}

export interface ApiShared {
	baseUrl: string
	origin: string
	apiKey: string
	pat: string
	username: string
	password: string
}

export function start(
	config: Config,
): [Promise<Error | undefined>, () => Promise<Error | undefined>] {
	let cc: api.client.Config = {
		userAgent: config.api.userAgent,
		sharedBaseUrl: config.api.shared.baseUrl,
		sharedFetch: fetch,
	}

	if (config.api.shared.origin) {
		cc.sharedFetch = morefetch.withOrigin(cc.sharedFetch, config.api.shared.origin)
	}

	let cl = new api.client.Client(cc)

	if (config.api.shared.apiKey) {
		cl = cl.withApiKey(config.api.shared.apiKey)
	}

	if (config.api.shared.pat) {
		cl = cl.withAuthToken(config.api.shared.pat)
	}

	if (config.api.shared.username && config.api.shared.password) {
		cl = cl.withBasicAuth(config.api.shared.username, config.api.shared.password)
	}

	let sc: base.configured.Config = {
		client: cl,
		resolver: new api.resolver.Resolver(cl),
		uploader: new api.uploader.Uploader(cl),
		dynamic: config.mcp.dynamic,
		tools: config.mcp.tools,
	}

	let s = base.configured.create(sc)

	let t = new stdio.StdioServerTransport()

	let cleanup = async(): Promise<Error | undefined> => {
		let r = await result.safeAsync(s.close.bind(s))
		if (r.err) {
			return new Error("Closing transport", {cause: r.err})
		}
	}

	let p = new Promise<Error | undefined>((res) => {
		s.connect(t).
			// eslint-disable-next-line promise/prefer-await-to-then
			then(() => {
				res(undefined)
				return
			}).
			// eslint-disable-next-line promise/prefer-await-to-then
			catch((err: unknown) => {
				res(new Error("Attaching server", {cause: err}))
			})
	})

	return [p, cleanup]
}
