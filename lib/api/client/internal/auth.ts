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

import {safeSync} from "../../../util/result.ts"

const headerApiKey = "Authorization"
const headerAuthToken = "Authorization"
const headerBasicAuth = "Authorization"
const schemaApiKey = "Bearer"
const schemaBasicAuth = "Basic"
const schemaBearerAuth = "Bearer"
const cookieAuthToken = "asc_auth_key"

export function injectAuthKey(input: Request, k: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerApiKey, `${schemaApiKey} ${k}`)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}

export function injectAuthToken(input: Request, t: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerAuthToken, t)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}

	let p = `${cookieAuthToken}=${t}`

	let c = input.headers.get("Cookie")

	if (c === null) {
		c = p
	} else {
		c = `${c}; ${p}`
	}

	h = safeSync(input.headers.set.bind(input.headers), "Cookie", c)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}

export function injectBasicAuth(input: Request, u: string, p: string): Error | undefined {
	let v = Buffer.from(`${u}:${p}`, "utf8").toString("base64")

	let h = safeSync(input.headers.set.bind(input.headers), headerBasicAuth, `${schemaBasicAuth} ${v}`)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}

export function injectBearerAuth(input: Request, t: string): Error | undefined {
	let h = safeSync(input.headers.set.bind(input.headers), headerAuthToken, `${schemaBearerAuth} ${t}`)
	if (h.err) {
		return new Error("Setting header.", {cause: h.err})
	}
}
