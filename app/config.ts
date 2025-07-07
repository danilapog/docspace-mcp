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

export const ConfigSchema = z.
	object({
		DOCSPACE_BASE_URL: z.string().url(),
		DOCSPACE_ORIGIN: z.string().url().optional(),
		DOCSPACE_USER_AGENT: z.string().optional().default(`${pack.name} v${pack.version}`),
		DOCSPACE_API_KEY: z.string().optional(),
		DOCSPACE_AUTH_TOKEN: z.string().optional(),
		DOCSPACE_USERNAME: z.string().optional(),
		DOCSPACE_PASSWORD: z.string().optional(),
		DOCSPACE_DYNAMIC: z.string().optional().default("false"),
		DOCSPACE_TOOLSETS: z.string().optional().default("all"),
	}).
	refine(
		(o) => {
			let a = Boolean(o.DOCSPACE_USERNAME)
			let b = Boolean(o.DOCSPACE_PASSWORD)
			return a && b || !a && !b
		},
		{
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
