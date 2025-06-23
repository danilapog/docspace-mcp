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
import * as server from "../lib/server.ts"
import pack from "../package.json" with {type: "json"}
import type {Result} from "../util/result.ts"
import {error, ok} from "../util/result.ts"

export type Config = z.infer<typeof ConfigSchema>

export const RawConfigSchema = z.
	object({
		DOCSPACE_BASE_URL: z.
			string().
			url().
			describe("The base URL of the DocSpace instance. This configuration is required for making API requests to DocSpace."),
		DOCSPACE_ORIGIN: z.
			string().
			url().
			optional().
			describe("The origin of the DocSpace instance. This configuration is not required but can be used to specify the `Origin` header in requests to DocSpace."),
		DOCSPACE_USER_AGENT: z.
			string().
			optional().
			describe("The user agent to use for requests. This configuration is not required but can be used to specify the `User-Agent` header in requests to DocSpace.").
			default(`${pack.name} v${pack.version}`),
		DOCSPACE_API_KEY: z.
			string().
			optional().
			describe("The API key for accessing the DocSpace API. This configuration is required if nether `DOCSPACE_AUTH_TOKEN` nor `DOCSPACE_USERNAME` and `DOCSPACE_PASSWORD` are provided."),
		DOCSPACE_AUTH_TOKEN: z.
			string().
			optional().
			describe("The authentication token for accessing the DocSpace API. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_USERNAME` and `DOCSPACE_PASSWORD` are provided."),
		DOCSPACE_USERNAME: z.
			string().
			optional().
			describe("The username for accessing the DocSpace API using basic authentication. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_AUTH_TOKEN` are provided. This is used in conjunction with `DOCSPACE_PASSWORD`."),
		DOCSPACE_PASSWORD: z.
			string().
			optional().
			describe("The password for accessing the DocSpace API using basic authentication. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_AUTH_TOKEN` are provided. This is used in conjunction with `DOCSPACE_USERNAME`."),
		DOCSPACE_DYNAMIC: z.
			string().
			optional().
			default("false").
			describe("Whether to enable dynamic toolsets."),
		DOCSPACE_TOOLSETS: z.
			string().
			optional().
			default("all").
			describe("The comma-separated list of toolset names to use. If set to 'all', all available toolsets will be used."),
	})

export const ConfigSchema = RawConfigSchema.
	refine(
		(o) => {
			let a = Boolean(o.DOCSPACE_USERNAME)
			let b = Boolean(o.DOCSPACE_PASSWORD)
			return a && b || !a && !b
		},
		{
			path: ["DOCSPACE_USERNAME", "DOCSPACE_PASSWORD"],
			message: "Both DOCSPACE_USERNAME and DOCSPACE_PASSWORD must be set or both must be unset.",
		},
	).
	refine(
		(o) => {
			let a = Boolean(o.DOCSPACE_API_KEY)
			let b = Boolean(o.DOCSPACE_AUTH_TOKEN)
			let c = Boolean(o.DOCSPACE_USERNAME) && Boolean(o.DOCSPACE_PASSWORD)
			return Number(a) + Number(b) + Number(c) <= 1
		},
		{
			path: ["DOCSPACE_API_KEY", "DOCSPACE_AUTH_TOKEN", "DOCSPACE_USERNAME", "DOCSPACE_PASSWORD"],
			message: "Only one of DOCSPACE_API_KEY, DOCSPACE_AUTH_TOKEN, or (DOCSPACE_USERNAME and DOCSPACE_PASSWORD) must be set.",
		},
	).
	refine(
		(o) => {
			let d = toBool(o.DOCSPACE_DYNAMIC)
			if (d.err) {
				return false
			}
			return true
		},
		{
			path: ["DOCSPACE_DYNAMIC"],
			message: "Invalid value for DOCSPACE_DYNAMIC. Must be one of: yes, y, true, 1, no, n, false, 0.",
		},
	).
	refine(
		(o) => {
			let c = 0

			for (let n of o.DOCSPACE_TOOLSETS.split(",")) {
				n = n.trim().toLocaleLowerCase()

				if (n === "") {
					continue
				}

				if (n === "all") {
					c += 1
					continue
				}

				let has = false

				for (let t of server.toolsets) {
					if (t.name === n) {
						has = true
						break
					}
				}

				if (has) {
					c += 1
					continue
				}

				return false
			}

			if (c === 0) {
				return false
			}

			return true
		},
		{
			path: ["DOCSPACE_TOOLSETS"],
			message: (() => {
				let n = ""

				for (let t of server.toolsets) {
					n += `${t.name}, `
				}

				if (n.length !== 0) {
					n = n.slice(0, -2)
				}

				return `Invalid toolset name in DOCSPACE_TOOLSETS or no toolsets specified. Must be one of: ${n}, or 'all'.`
			})(),
		},
	).
	transform((o) => {
		let dynamic = toBool(o.DOCSPACE_DYNAMIC)
		if (dynamic.err) {
			throw dynamic.err
		}

		let toolsets: string[] = []

		for (let n of o.DOCSPACE_TOOLSETS.split(",")) {
			n = n.trim().toLocaleLowerCase()

			if (n === "") {
				continue
			}

			if (n === "all") {
				for (let t of server.toolsets) {
					toolsets.push(t.name)
				}
				break
			}

			for (let t of server.toolsets) {
				if (t.name === n) {
					toolsets.push(t.name)
					break
				}
			}
		}

		return {
			baseUrl: ensureTrailingSlash(o.DOCSPACE_BASE_URL),
			origin: o.DOCSPACE_ORIGIN,
			userAgent: o.DOCSPACE_USER_AGENT,
			apiKey: o.DOCSPACE_API_KEY,
			authToken: o.DOCSPACE_AUTH_TOKEN,
			username: o.DOCSPACE_USERNAME,
			password: o.DOCSPACE_PASSWORD,
			dynamic: dynamic.v,
			toolsets,
		}
	})

function ensureTrailingSlash(u: string): string {
	if (!u.endsWith("/")) {
		u = `${u}/`
	}
	return u
}

function toBool(s: string): Result<boolean, Error> {
	s = s.trim().toLocaleLowerCase()
	if (s === "yes" || s === "y" || s === "true" || s === "1") {
		return ok(true)
	}
	if (s === "no" || s === "n" || s === "false" || s === "0") {
		return ok(false)
	}
	return error(new Error(`Invalid boolean value: ${s}. Must be one of: yes, y, true, 1, no, n, false, 0.`))
}
