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

import * as z from "zod"
import * as result from "../../util/result.ts"
import type * as client from "../client.ts"

/**
 * {@link https://datatracker.ietf.org/doc/html/rfc6749/#section-4.1.2.1 | RFC 6749 Reference}
 */
export const OauthErrorSchema = z.object({
	error: z.string(),
	error_description: z.string().optional(),
})

export const OauthCustomErrorSchema = z.object({
	reason: z.string(),
})

export const OauthAnyErrorSchema = z.union([
	OauthErrorSchema,
	OauthCustomErrorSchema,
])

export const OauthMetadataResponseSchema = z.object({
	issuer: z.string(),
	authorization_endpoint: z.string(),
	device_authorization_endpoint: z.string().optional(),
	token_endpoint: z.string(),
	token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
	jwks_uri: z.string().optional(),
	response_types_supported: z.array(z.string()),
	grant_types_supported: z.array(z.string()).optional(),
	revocation_endpoint: z.string().optional(),
	revocation_endpoint_auth_methods_supported: z.array(z.string()).optional(),
	introspection_endpoint: z.string().optional(),
	introspection_endpoint_auth_methods_supported: z.array(z.string()).optional(),
	code_challenge_methods_supported: z.array(z.string()).optional(),
	tls_client_certificate_bound_access_tokens: z.boolean().optional(),
})

export const OauthIntrospectResponseSchema = z.object({
	active: z.boolean(),
	scope: z.string().optional(),
	client_id: z.string().optional(),
	exp: z.number().optional(),
})

export const OauthTokenPayloadSchema = z.object({
	aud: z.string(),
})

// eslint-disable-next-line typescript/consistent-type-definitions
export type OauthIntrospectOptions = {
	token: string
}

export type OauthMetadataResponse = z.output<typeof OauthMetadataResponseSchema>

export type OauthIntrospectResponse = z.output<typeof OauthIntrospectResponseSchema>

export type OauthTokenPayload = z.output<typeof OauthTokenPayloadSchema>

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/tree/v3.2.1-server/common/ASC.Identity/ | DocSpace Reference}
 */
export class OauthService {
	private c: client.Client

	constructor(c: client.Client) {
		this.c = c
	}

	async metadata(s: AbortSignal): Promise<result.Result<[OauthMetadataResponse, client.Response], Error>> {
		let u = this.c.createOauthUrl("/.well-known/oauth-authorization-server")
		if (u.err) {
			return result.error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return result.error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.oauthFetch(req.v)
		if (f.err) {
			return result.error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = OauthMetadataResponseSchema.safeParse(p)
		if (!e.success) {
			return result.error(new Error("Parsing response.", {cause: e.error}))
		}

		return result.ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.2.1-server/common/ASC.Identity/authorization/authorization-application/src/main/java/com/asc/authorization/application/security/oauth/provider/TokenIntrospectionAuthenticationProvider.java/#L63 | DocSpace Reference}
	 */
	async introspect(s: AbortSignal, o: OauthIntrospectOptions): Promise<result.Result<[OauthIntrospectResponse, client.Response], Error>> {
		let u = this.c.createOauthUrl("oauth2/introspect")
		if (u.err) {
			return result.error(new Error("Creating URL.", {cause: u.err}))
		}

		let d = new URLSearchParams(o)

		let req = this.c.createURLSearchParamsRequest(s, u.v, d)
		if (req.err) {
			return result.error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.oauthFetch(req.v)
		if (f.err) {
			return result.error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = OauthIntrospectResponseSchema.safeParse(p)
		if (!e.success) {
			return result.error(new Error("Parsing response.", {cause: e.error}))
		}

		return result.ok([e.data, res])
	}
}

export function decodeOauthTokenPayload(t: string): result.Result<OauthTokenPayload, Error> {
	let a = t.split(".")
	if (a.length !== 3) {
		return result.error(new Error(`Expected 3 parts in token, got ${a.length}`))
	}

	let b = Buffer.from(a[1], "base64")

	let o = result.safeSync(JSON.parse, b.toString())
	if (o.err) {
		return result.error(new Error("Parsing payload json", {cause: o.err}))
	}

	let s = OauthTokenPayloadSchema.safeParse(o)
	if (!s.success) {
		return result.error(new Error("Parsing payload schema", {cause: s.error}))
	}

	return result.ok(s.data)
}
