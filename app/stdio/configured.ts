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
import * as mcp from "../../lib/mcp.ts"
import * as result from "../../lib/util/result.ts"
import type * as config from "../config.ts"
import type * as shared from "../shared.ts"

export function start(config: config.Config): [shared.P, shared.Cleanup] {
	let cc: api.client.Config = {
		userAgent: config.api.userAgent,
		sharedBaseUrl: config.api.shared.baseUrl,
		sharedFetch: fetch,
		oauthBaseUrl: "",
		oauthFetch() {
			throw new Error("Not implemented")
		},
	}

	let c = new api.client.Client(cc)

	if (config.api.shared.apiKey) {
		c = c.withApiKey(config.api.shared.apiKey)
	}

	if (config.api.shared.pat) {
		c = c.withAuthToken(config.api.shared.pat)
	}

	if (config.api.shared.username && config.api.shared.password) {
		c = c.withBasicAuth(config.api.shared.username, config.api.shared.password)
	}

	let sc: mcp.base.configured.Config = {
		client: c,
		resolver: new api.resolver.Resolver(c),
		uploader: new api.uploader.Uploader(c),
		dynamic: config.mcp.dynamic,
		tools: config.mcp.tools,
	}

	let s = mcp.base.configured.create(sc)

	let t = new stdio.StdioServerTransport()

	let cleanup: shared.Cleanup = async() => {
		let r = await result.safeAsync(t.close.bind(s))
		if (r.err) {
			return new Error("Closing transport", {cause: r.err})
		}
	}

	let p: shared.P = new Promise((res) => {
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
