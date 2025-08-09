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

import * as server from "@modelcontextprotocol/sdk/server/index.js"
import * as types from "@modelcontextprotocol/sdk/types.js"
import type * as zodToJsonSchema from "zod-to-json-schema"
import pack from "../../package.json" with {type: "json"}
import * as format from "../../util/format.ts"
import type * as moremcp from "../../util/moremcp.ts"
import * as result from "../../util/result.ts"
import * as api from "../api.ts"
import * as data from "./data.ts"
import * as tools from "./tools.ts"

export type RouteTool = (
	req: moremcp.CallToolRequest,
	extra: moremcp.Extra,
) => Promise<result.Result<RouteToolResult, Error>>

export type RouteToolResult = types.CallToolResult & {isError?: never}

export interface Config {
	client: api.client.Client
	resolver: api.resolver.Resolver
	uploader: api.uploader.Uploader
	dynamic: boolean
	tools: string[]
}

export class Server {
	client: api.client.Client
	resolver: api.resolver.Resolver
	uploader: api.uploader.Uploader

	meta: tools.meta.Tools
	regular: tools.regular.Tools

	toolsets: moremcp.Toolset[] = []
	tools: moremcp.ToolInfo[] = []

	routeTool: RouteTool

	constructor(config: Config) {
		this.client = config.client
		this.resolver = config.resolver
		this.uploader = config.uploader

		this.meta = new tools.meta.Tools(this)
		this.regular = new tools.regular.Tools(this)

		for (let s of data.regular.toolsets) {
			let o: moremcp.Toolset = {
				name: s.name,
				description: s.description,
				tools: [],
			}

			for (let n of config.tools) {
				for (let t of s.tools) {
					if (t.name === n) {
						o.tools.push(t)
						break
					}
				}
			}

			if (o.tools.length !== 0) {
				this.toolsets.push(o)
			}
		}

		if (config.dynamic) {
			this.tools = [...data.meta.tools]
			this.routeTool = this.routeMetaTool.bind(this)
		} else {
			for (let s of this.toolsets) {
				this.tools.push(...s.tools)
			}
			this.routeTool = this.routeRegularTool.bind(this)
		}
	}

	listTools(): types.ListToolsResult {
		return {
			tools: this.tools,
		}
	}

	async callTool(req: moremcp.CallToolRequest, extra: moremcp.Extra): Promise<types.CallToolResult> {
		let pr = await this.routeTool(req, extra)

		if (pr.err) {
			return {
				content: [
					{
						type: "text",
						text: format.format(pr.err),
					},
				],
				isError: true,
			}
		}

		return pr.v
	}

	async routeMetaTool(req: moremcp.CallToolRequest, extra: moremcp.Extra): Promise<result.Result<RouteToolResult, Error>> {
		let mr: result.Result<
			moremcp.SimplifiedToolInfo[] |
			moremcp.ToolInputSchema |
			moremcp.ToolOutputSchema,
			Error
		> | undefined

		let rr: result.Result<
			RouteToolResult,
			Error
		> | undefined

		try {
			switch (req.params.name) {
			case "list_toolsets":
				mr = this.meta.listToolsets()
				break
			case "list_tools":
				mr = this.meta.listTools(req.params.arguments)
				break
			case "get_tool_input_schema":
				mr = this.meta.getToolInputSchema(req.params.arguments)
				break
			case "get_tool_output_schema":
				mr = this.meta.getToolOutputSchema(req.params.arguments)
				break
			case "call_tool":
				rr = await this.meta.callTool(req, extra)
				break
			default:
				mr = result.error(new Error(`Tool ${req.params.name} not found.`))
				break
			}
		} catch (err) {
			if (err instanceof Error) {
				mr = result.error(err)
			} else {
				mr = result.error(new Error("Unknown error.", {cause: err}))
			}
		}

		if (mr) {
			if (mr.err) {
				return result.error(mr.err)
			}

			let s = result.safeSync(JSON.stringify, mr.v, undefined, 2)
			if (s.err) {
				return result.error(new Error("Stringifying value", {cause: s.err}))
			}

			let r: RouteToolResult = {
				content: [
					{
						type: "text",
						text: s.v,
					},
				],
			}

			return result.ok(r)
		}

		if (rr) {
			return rr
		}

		return result.error(new Error("Unknown result type"))
	}

	async routeRegularTool(req: moremcp.CallToolRequest, extra: moremcp.Extra): Promise<result.Result<RouteToolResult, Error>> {
		let f = false

		for (let s of this.toolsets) {
			for (let t of s.tools) {
				if (t.name === req.params.name) {
					f = true
					break
				}
			}

			if (f) {
				break
			}
		}

		if (!f) {
			return result.error(new Error(`Tool ${req.params.name} not found`))
		}

		let cr: result.Result<api.client.Response | zodToJsonSchema.JsonSchema7Type | string, Error>

		try {
			switch (req.params.name) {
			case "delete_file":
				cr = await this.regular.deleteFile(extra.signal, req.params.arguments)
				break
			case "get_file_info":
				cr = await this.regular.getFileInfo(extra.signal, req.params.arguments)
				break
			case "update_file":
				cr = await this.regular.updateFile(extra.signal, req.params.arguments)
				break
			case "copy_batch_items":
				cr = await this.regular.copyBatchItems(extra.signal, req.params.arguments)
				break
			case "move_batch_items":
				cr = await this.regular.moveBatchItems(extra.signal, req.params.arguments)
				break
			case "download_file_as_text":
				cr = await this.regular.downloadFileAsText(extra.signal, req.params.arguments)
				break
			case "upload_file":
				cr = await this.regular.uploadFile(extra.signal, req.params.arguments)
				break

			case "create_folder":
				cr = await this.regular.createFolder(extra.signal, req.params.arguments)
				break
			case "delete_folder":
				cr = await this.regular.deleteFolder(extra.signal, req.params.arguments)
				break
			case "get_folder_content":
				cr = await this.regular.getFolderContent(extra.signal, req.params.arguments)
				break
			case "get_folder_info":
				cr = await this.regular.getFolderInfo(extra.signal, req.params.arguments)
				break
			case "rename_folder":
				cr = await this.regular.renameFolder(extra.signal, req.params.arguments)
				break
			case "get_my_folder":
				cr = await this.regular.getMyFolder(extra.signal, req.params.arguments)
				break

			case "create_room":
				cr = await this.regular.createRoom(extra.signal, req.params.arguments)
				break
			case "get_room_info":
				cr = await this.regular.getRoomInfo(extra.signal, req.params.arguments)
				break
			case "update_room":
				cr = await this.regular.updateRoom(extra.signal, req.params.arguments)
				break
			case "archive_room":
				cr = await this.regular.archiveRoom(extra.signal, req.params.arguments)
				break
			case "set_room_security":
				cr = await this.regular.setRoomSecurity(extra.signal, req.params.arguments)
				break
			case "get_room_security_info":
				cr = await this.regular.getRoomSecurityInfo(extra.signal, req.params.arguments)
				break
			case "get_rooms_folder":
				cr = await this.regular.getRoomsFolder(extra.signal, req.params.arguments)
				break
			case "get_room_types":
				cr = this.regular.getRoomTypes()
				break
			case "get_room_access_levels":
				cr = await this.regular.getRoomAccessLevels(extra.signal, req.params.arguments)
				break

			case "get_all_people":
				cr = await this.regular.getAllPeople(extra.signal, req.params.arguments)
				break

			default:
				cr = result.error(new Error(`Tool ${req.params.name} not found.`))
				break
			}
		} catch (err) {
			if (err instanceof Error) {
				cr = result.error(err)
			} else {
				cr = result.error(new Error("Unknown error.", {cause: err}))
			}
		}

		if (cr.err) {
			return result.error(cr.err)
		}

		if (cr.v instanceof api.client.Response) {
			let h = cr.v.response.headers.get("Content-Type")
			if (h === null) {
				return result.error(new Error("Content-Type header is missing"))
			}

			if (h.startsWith("application/json")) {
				let j = await result.safeAsync(cr.v.response.json.bind(cr.v.response))
				if (j.err) {
					return result.error(new Error("Parsing json response", {cause: j.err}))
				}

				let s = result.safeSync(JSON.stringify, j.v, undefined, 2)
				if (s.err) {
					return result.error(new Error("Stringifying json value", {cause: s.err}))
				}

				let r: RouteToolResult = {
					content: [
						{
							type: "text",
							text: s.v,
						},
					],
				}

				let f = false

				for (let s of this.toolsets) {
					for (let t of s.tools) {
						if (t.name === req.params.name) {
							f = true

							if (t.outputSchema) {
								r.structuredContent = j.v
							}

							break
						}
					}

					if (f) {
						break
					}
				}

				return result.ok(r)
			}

			if (h.startsWith("text/")) {
				let t = await result.safeAsync(cr.v.response.text.bind(cr.v.response))
				if (t.err) {
					return result.error(new Error("Parsing text response", {cause: t.err}))
				}

				let r: RouteToolResult = {
					content: [
						{
							type: "text",
							text: t.v,
						},
					],
				}

				return result.ok(r)
			}

			return result.error(new Error(`Content-Type ${h} is not supported`))
		}

		if (typeof cr.v === "object") {
			let s = result.safeSync(JSON.stringify, cr.v, undefined, 2)
			if (s.err) {
				return result.error(new Error("Stringifying object value", {cause: s.err}))
			}

			let r: RouteToolResult = {
				content: [
					{
						type: "text",
						text: s.v,
					},
				],
			}

			let f = false

			for (let s of this.toolsets) {
				for (let t of s.tools) {
					if (t.name === req.params.name) {
						f = true

						if (t.outputSchema) {
							r.structuredContent = cr.v
						}

						break
					}
				}

				if (f) {
					break
				}
			}

			return result.ok(r)
		}

		if (typeof cr.v === "string") {
			let r: RouteToolResult = {
				content: [
					{
						type: "text",
						text: cr.v,
					},
				],
			}

			return result.ok(r)
		}

		return result.error(new Error("Unknown result type"))
	}
}

export function create(config: Config): server.Server {
	let s = new Server(config)

	let m = new server.Server(
		{
			name: pack.name,
			version: pack.version,
		},
		{
			capabilities: {
				tools: {},
				logging: {},
			},
		},
	)

	m.setRequestHandler(types.ListToolsRequestSchema, s.listTools.bind(s))
	m.setRequestHandler(types.CallToolRequestSchema, s.callTool.bind(s))

	return m
}
