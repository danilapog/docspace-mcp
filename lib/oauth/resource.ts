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

import type * as auth from "@modelcontextprotocol/sdk/shared/auth.js"
import express from "express"

export interface Config {
	resourceBaseUrl: string
	scopesSupported: string[]
	resourceName: string
	resourceDocumentation: string
}

class Server {
	private resourceBaseUrl: string
	private scopesSupported: string[]
	private resourceName: string
	private resourceDocumentation: string

	constructor(config: Config) {
		this.resourceBaseUrl = config.resourceBaseUrl
		this.scopesSupported = config.scopesSupported
		this.resourceName = config.resourceName
		this.resourceDocumentation = config.resourceDocumentation
	}

	/**
	 * {@link https://github.com/modelcontextprotocol/typescript-sdk/blob/1.17.0/src/client/auth.ts#L485 | MCP Reference} \
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

	let r = express.Router()
	r.use(express.json())

	r.get("/.well-known/oauth-protected-resource", s.metadata.bind(s))

	return r
}
