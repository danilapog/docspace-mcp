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

import type * as http from "node:http"
import * as z from "zod"
import * as errors from "../../lib/util/errors.ts"
import * as result from "../../lib/util/result.ts"
import * as zod from "../../lib/util/zod.ts"
import type * as global from "./global.ts"
import * as tools from "./tools.ts"

export interface Mcp {
	dynamic: boolean
	toolsets: string[]
	tools: string[]
	enabledTools: string[]
	disabledTools: string[]
}

export interface ApiShared {
	baseUrl: string
	apiKey: string
	pat: string
	username: string
	password: string
}

let McpSchema: ReturnType<typeof createMcp> | undefined

let ApiSharedSchema: ReturnType<typeof createApiShared> | undefined

export function setup(g: global.Config): void {
	if (g.request.headerPrefix) {
		McpSchema = createMcp(g)
		ApiSharedSchema = createApiShared(g)
	}
}

// eslint-disable-next-line typescript/explicit-function-return-type
function createMcp(g: global.Config) {
	let keyDynamic = `${g.request.headerPrefix}dynamic`
	let keyToolsets = `${g.request.headerPrefix}toolsets`
	let keyEnabledTools = `${g.request.headerPrefix}enabled-tools`
	let keyDisabledTools = `${g.request.headerPrefix}disabled-tools`

	return z.
		object({
			[keyDynamic]: z.
				string().
				optional().
				transform(zod.envOptionalBoolean()),

			[keyToolsets]: z.
				string().
				optional().
				transform(zod.envOptionalOptions([...g.mcp.toolsets])),

			[keyEnabledTools]: z.
				string().
				optional().
				transform(zod.envOptionalOptions([...g.mcp.tools])),

			[keyDisabledTools]: z.
				string().
				optional().
				transform(zod.envOptionalOptions([...g.mcp.tools])),
		}).
		transform((o) => ({
			dynamic: o[keyDynamic] as boolean | undefined,
			toolsets: o[keyToolsets] as string[] | undefined,
			enabledTools: o[keyEnabledTools] as string[] | undefined,
			disabledTools: o[keyDisabledTools] as string[] | undefined,
		}))
}

export function parseMcp(g: global.Config, v: http.IncomingHttpHeaders): result.Result<Mcp, Error> {
	let o: z.output<Exclude<typeof McpSchema, undefined>> | undefined

	if (g.request.headerPrefix) {
		if (!McpSchema) {
			return result.error(new Error("MCP schema was not initialized"))
		}

		let p = McpSchema.safeParse(v)
		if (p.error) {
			return result.error(new Error("Parsing headers", {cause: p.error}))
		}

		o = p.data
	} else {
		o = {
			dynamic: undefined,
			toolsets: undefined,
			enabledTools: undefined,
			disabledTools: undefined,
		}
	}

	let c = computeMcp(g, o)

	let err = validateMcp(c)
	if (err) {
		return result.error(new Error("Validating config", {cause: err}))
	}

	return result.ok(c)
}

function computeMcp(g: global.Config, o: z.output<Exclude<typeof McpSchema, undefined>>): Mcp {
	let c: Mcp = {
		dynamic: false,
		toolsets: [],
		tools: [],
		enabledTools: [],
		disabledTools: [],
	}

	if (o.dynamic !== undefined) {
		c.dynamic = o.dynamic
	} else {
		c.dynamic = g.mcp.dynamic
	}

	if (o.toolsets !== undefined) {
		c.toolsets = o.toolsets
	} else {
		c.toolsets = [...g.mcp.toolsets]
	}

	if (o.enabledTools !== undefined) {
		c.enabledTools = o.enabledTools
	} else {
		c.enabledTools = [...g.mcp.enabledTools]
	}

	if (o.disabledTools !== undefined) {
		c.disabledTools = o.disabledTools
	} else {
		c.disabledTools = [...g.mcp.disabledTools]
	}

	c.toolsets = tools.normalizeToolsets(c.toolsets)

	let r = tools.resolveToolsetsAndTools(
		c.toolsets,
		c.enabledTools,
		c.disabledTools,
	)
	c.toolsets = r[0]
	c.tools = r[1]

	return c
}

function validateMcp(o: Mcp): Error | undefined {
	let errs: Error[] = []

	if (o.toolsets.length === 0) {
		errs.push(new Error("No toolsets left"))
	}

	if (o.tools.length === 0) {
		errs.push(new Error("No tools left"))
	}

	if (errs.length !== 0) {
		return new errors.Errors({cause: errs})
	}
}

// eslint-disable-next-line typescript/explicit-function-return-type
function createApiShared(g: global.Config) {
	let keyBaseUrl = `${g.request.headerPrefix}base-url`
	let keyApiKey = `${g.request.headerPrefix}api-key`
	let keyAuthToken = `${g.request.headerPrefix}auth-token`
	let keyUsername = `${g.request.headerPrefix}username`
	let keyPassword = `${g.request.headerPrefix}password`

	return z.
		object({
			[keyBaseUrl]: z.
				string().
				optional().
				transform(zod.envOptionalBaseUrl()),

			[keyApiKey]: z.
				string().
				trim().
				optional(),

			[keyAuthToken]: z.
				string().
				trim().
				optional(),

			[keyUsername]: z.
				string().
				time().
				optional(),

			[keyPassword]: z.
				string().
				time().
				optional(),
		}).
		transform((o) => ({
			baseUrl: o[keyBaseUrl],
			apiKey: o[keyApiKey],
			pat: o[keyAuthToken],
			username: o[keyUsername],
			password: o[keyPassword],
		}))
}

export function parseApiShared(g: global.Config, v: http.IncomingHttpHeaders): result.Result<ApiShared, Error> {
	let o: z.output<Exclude<typeof ApiSharedSchema, undefined>> | undefined

	if (g.request.headerPrefix) {
		if (!ApiSharedSchema) {
			return result.error(new Error("API shared schema was not initialized"))
		}

		let p = ApiSharedSchema.safeParse(v)
		if (p.error) {
			return result.error(new Error("Parsing headers", {cause: p.error}))
		}

		o = p.data
	} else {
		o = {
			baseUrl: undefined,
			apiKey: undefined,
			pat: undefined,
			username: undefined,
			password: undefined,
		}
	}

	let c = computeApiShared(g, o)

	let err = validateApiShared(c)
	if (err) {
		return result.error(new Error("Validating config", {cause: err}))
	}

	return result.ok(c)
}

function computeApiShared(g: global.Config, o: z.output<Exclude<typeof ApiSharedSchema, undefined>>): ApiShared {
	let c: ApiShared = {
		baseUrl: "",
		apiKey: "",
		pat: "",
		username: "",
		password: "",
	}

	if (o.baseUrl !== undefined) {
		c.baseUrl = o.baseUrl
	}

	if (o.apiKey !== undefined) {
		c.apiKey = o.apiKey
	}

	if (o.pat !== undefined) {
		c.pat = o.pat
	}

	if (o.username !== undefined) {
		c.username = o.username
	}

	if (o.password !== undefined) {
		c.password = o.password
	}

	if (
		o.baseUrl === undefined &&
		o.apiKey === undefined &&
		o.pat === undefined &&
		o.username === undefined &&
		o.password === undefined
	) {
		c.baseUrl = g.api.shared.baseUrl
		c.apiKey = g.api.shared.apiKey
		c.pat = g.api.shared.pat
		c.username = g.api.shared.username
		c.password = g.api.shared.password
	}

	return c
}

function validateApiShared(o: ApiShared): Error | undefined {
	let errs: Error[] = []

	let a = Boolean(o.apiKey)
	let b = Boolean(o.pat)
	let c = Boolean(o.username) && Boolean(o.password)
	let u = Number(a) + Number(b) + Number(c)

	if (u === 0) {
		errs.push(new Error("Expected at least one of API key, PAT, or (username and password) to be set"))
	}

	if (u !== 1) {
		errs.push(new Error("Expected only one of API key, PAT, or (username and password) to be set"))
	}

	if ((a || b || c) && !o.baseUrl) {
		errs.push(new Error("API base URL is required with API key, PAT, or (username and password)"))
	}

	if (errs.length !== 0) {
		return new errors.Errors({cause: errs})
	}

	return
}
