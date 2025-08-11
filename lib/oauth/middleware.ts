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

import * as bearerAuth from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js"
import type * as types from "@modelcontextprotocol/sdk/server/auth/types.js"
import type express from "express"
import type * as client from "../api/client.ts"
import * as result from "../util/result.ts"

export interface Config {
	resourceBaseUrl: string
	client: Client
}

export interface Client {
	oauth: OauthService
}

export interface OauthService {
	introspect(s: AbortSignal, o: client.OauthIntrospectOptions): Promise<result.Result<[client.OauthIntrospectResponse, client.Response], Error>>
}

class Middleware {
	private resourceBaseUrl: string
	private client: Client

	constructor(config: Config) {
		this.resourceBaseUrl = config.resourceBaseUrl
		this.client = config.client
	}

	handler(): result.Result<express.RequestHandler, Error> {
		let u = result.safeNew(URL, "/.well-known/oauth-protected-resource", this.resourceBaseUrl)
		if (u.err) {
			return result.error(new Error("Creating OAuth protected resource URL", {cause: u.err}))
		}

		let m = bearerAuth.requireBearerAuth({
			verifier: {
				verifyAccessToken: async(t) => {
					let r = await this.verify(t)
					if (r.err) {
						throw r.err
					}
					return r.v
				},
			},
			resourceMetadataUrl: u.v.toString(),
		})

		return result.ok(m)
	}

	private async verify(t: string): Promise<result.Result<types.AuthInfo, Error>> {
		let c = new AbortController()

		let o: client.OauthIntrospectOptions = {
			token: t,
		}

		let r = await this.client.oauth.introspect(c.signal, o)
		if (r.err) {
			return result.error(new Error("Introspecting OAuth token", {cause: r.err}))
		}

		let [d] = r.v

		if (!d.active) {
			return result.error(new Error("OAuth token is not active"))
		}

		if (!d.client_id) {
			return result.error(new Error("OAuth token does not have a client ID"))
		}

		if (!d.scope) {
			return result.error(new Error("OAuth token does not have scopes"))
		}

		let a: types.AuthInfo = {
			token: t,
			clientId: d.client_id,
			scopes: d.scope.split(" "),
			expiresAt: d.exp,
		}

		return result.ok(a)
	}
}

export function handler(config: Config): result.Result<express.RequestHandler, Error> {
	return new Middleware(config).handler()
}
