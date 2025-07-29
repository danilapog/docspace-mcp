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
import type {CallToolRequest, Extra, SimplifiedToolInfo, ToolInputSchema, Toolset} from "../../util/moremcp.ts"
import type {Result} from "../../util/result.ts"
import {error, ok} from "../../util/result.ts"
import type {ConfiguredStdioServer} from "../server.ts"

export const ListToolsInputSchema = z.object({
	toolset: z.string().describe("The name of the toolset to list tools from."),
})

export const GetToolInputSchemaInputSchema = z.object({
	tool: z.string().describe("The name of the tool to get input schema for."),
})

export const CallToolInputSchema = z.object({
	tool: z.string().describe("The name of the tool to call."),
	input: z.object({}).passthrough().optional().describe("The value that corresponds to the input schema of the tool."),
})

export class MetaToolset {
	private s: ConfiguredStdioServer

	constructor(s: ConfiguredStdioServer) {
		this.s = s
	}

	listToolsets(): Result<SimplifiedToolInfo[], Error> {
		let toolsets: SimplifiedToolInfo[] = []

		for (let t of this.s.toolsets) {
			let s: SimplifiedToolInfo = {
				name: t.name,
				description: t.description,
			}
			toolsets.push(s)
		}

		if (toolsets.length === 0) {
			return error(new Error("No toolsets found."))
		}

		return ok(toolsets)
	}

	listTools(p: unknown): Result<SimplifiedToolInfo[], Error> {
		let pr = ListToolsInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let s: Toolset | undefined

		for (let t of this.s.toolsets) {
			if (t.name === pr.data.toolset) {
				s = t
				break
			}
		}

		if (!s) {
			return error(new Error(`Toolset '${pr.data.toolset}' not found.`))
		}

		let tools: SimplifiedToolInfo[] = []

		for (let t of s.tools) {
			let s: SimplifiedToolInfo = {
				name: t.name,
				description: t.description,
			}
			tools.push(s)
		}

		if (tools.length === 0) {
			return error(new Error(`No tools found for toolset '${pr.data.toolset}'.`))
		}

		return ok(tools)
	}

	getToolInputSchema(p: unknown): Result<ToolInputSchema, Error> {
		let pr = GetToolInputSchemaInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let i: ToolInputSchema | undefined

		for (let s of this.s.toolsets) {
			for (let t of s.tools) {
				if (t.name === pr.data.tool) {
					i = t.inputSchema
					break
				}
			}

			if (i) {
				break
			}
		}

		if (!i) {
			return error(new Error(`Tool '${pr.data.tool}' not found.`))
		}

		return ok(i)
	}

	async callTool(req: CallToolRequest, extra: Extra): Promise<Result<string, Error>> {
		let pr = CallToolInputSchema.safeParse(req.params.arguments)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		req = {
			...req,
			params: {
				...req.params,
			},
		}

		req.params.name = pr.data.tool
		req.params.arguments = pr.data.input

		let cr = await this.s.routeRegularTool(req, extra)
		if (cr.err) {
			return error(new Error("Routing tool.", {cause: cr.err}))
		}

		return ok(cr.v)
	}
}
