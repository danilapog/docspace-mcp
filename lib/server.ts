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

import type {Server as ProtocolServer} from "@modelcontextprotocol/sdk/server/index.js"
import type {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import type {CallToolResult, ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {CallToolRequestSchema, ListToolsRequestSchema, isInitializeRequest} from "@modelcontextprotocol/sdk/types.js"
import express from "express"
import * as z from "zod"
import {format} from "../util/format.ts"
import type {CallToolRequest, Extra, SimplifiedToolInfo, ToolInfo, ToolInputSchema, Toolset} from "../util/moremcp.ts"
import {toInputSchema} from "../util/moremcp.ts"
import type {Result} from "../util/result.ts"
import {error, ok, safeAsync, safeSync} from "../util/result.ts"
import type {Client} from "./client.ts"
import {Response} from "./client.ts"
import type {Resolver} from "./resolver.ts"
import {CallToolInputSchema, GetToolInputSchemaInputSchema, ListToolsInputSchema, MetaToolset} from "./server/meta.ts"
import {
	ArchiveRoomInputSchema,
	CopyBatchItemsInputSchema,
	CreateFolderInputSchema,
	CreateRoomInputSchema,
	DeleteFileInputSchema,
	DeleteFolderInputSchema,
	DownloadFileAsTextInputSchema,
	GetAllPeopleInputSchema,
	GetFileInfoInputSchema,
	GetFolderContentInputSchema,
	GetFolderInfoInputSchema,
	GetMyFolderInputSchema,
	GetRoomAccessLevelsSchema,
	GetRoomInfoInputSchema,
	GetRoomSecurityInfoInputSchema,
	GetRoomsFolderInputSchema,
	MoveBatchItemsInputSchema,
	RegularToolset,
	RenameFolderInputSchema,
	SetRoomSecurityInputSchema,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
	UploadFileInputSchema,
} from "./server/regular.ts"
import type {Uploader} from "./uploader.ts"

export const metaTools: ToolInfo[] = [
	{
		name: "list_toolsets",
		description: "This is a meta-tool for listing available toolsets. Toolset is a set of available tools.",
		inputSchema: toInputSchema(z.object({})),
	},
	{
		name: "list_tools",
		description: "This is a meta-tool for listing available tools of a specific toolset. The list of available toolsets can be obtained using the list_toolsets meta-tool.",
		inputSchema: toInputSchema(ListToolsInputSchema),
	},
	{
		name: "get_tool_input_schema",
		description: "This is a meta-tool for getting an input schema for a specific tool. The list of available tools can be obtained using the list_tools meta-tool.",
		inputSchema: toInputSchema(GetToolInputSchemaInputSchema),
	},
	{
		name: "call_tool",
		description: "This is a meta-tool for calling a tool. The list of available tools can be obtained using the list_tools meta-tool. The input schema can be obtained using the get_tool_input_schema meta-tool.",
		inputSchema: toInputSchema(CallToolInputSchema),
	},
]

export const toolsets: Toolset[] = [
	{
		name: "files",
		description: "Operations for working with files.",
		tools: [
			{
				name: "delete_file",
				description: "Delete a file.",
				inputSchema: toInputSchema(DeleteFileInputSchema),
			},
			{
				name: "get_file_info",
				description: "Get file information.",
				inputSchema: toInputSchema(GetFileInfoInputSchema),
			},
			{
				name: "update_file",
				description: "Update a file.",
				inputSchema: toInputSchema(UpdateFileInputSchema),
			},
			{
				name: "copy_batch_items",
				description: "Copy to a folder.",
				inputSchema: toInputSchema(CopyBatchItemsInputSchema),
			},
			{
				name: "move_batch_items",
				description: "Move to a folder.",
				inputSchema: toInputSchema(MoveBatchItemsInputSchema),
			},
			{
				name: "download_file_as_text",
				description: "Download a file as text.",
				inputSchema: toInputSchema(DownloadFileAsTextInputSchema),
			},
			{
				name: "upload_file",
				description: "Upload a file.",
				inputSchema: toInputSchema(UploadFileInputSchema),
			},
		],
	},
	{
		name: "folders",
		description: "Operations for working with folders.",
		tools: [
			{
				name: "create_folder",
				description: "Create a folder.",
				inputSchema: toInputSchema(CreateFolderInputSchema),
			},
			{
				name: "delete_folder",
				description: "Delete a folder.",
				inputSchema: toInputSchema(DeleteFolderInputSchema),
			},
			{
				name: "get_folder_content",
				description: "Get content of a folder.",
				inputSchema: toInputSchema(GetFolderContentInputSchema),
			},
			{
				name: "get_folder_info",
				description: "Get folder information.",
				inputSchema: toInputSchema(GetFolderInfoInputSchema),
			},
			{
				name: "rename_folder",
				description: "Rename a folder.",
				inputSchema: toInputSchema(RenameFolderInputSchema),
			},
			{
				name: "get_my_folder",
				description: "Get the 'My Documents' folder.",
				inputSchema: toInputSchema(GetMyFolderInputSchema),
			},
		],
	},
	{
		name: "rooms",
		description: "Operations for working with rooms.",
		tools: [
			{
				name: "create_room",
				description: "Create a room.",
				inputSchema: toInputSchema(CreateRoomInputSchema),
			},
			{
				name: "get_room_info",
				description: "Get room information.",
				inputSchema: toInputSchema(GetRoomInfoInputSchema),
			},
			{
				name: "update_room",
				description: "Update a room.",
				inputSchema: toInputSchema(UpdateRoomInputSchema),
			},
			{
				name: "archive_room",
				description: "Archive a room.",
				inputSchema: toInputSchema(ArchiveRoomInputSchema),
			},
			{
				name: "set_room_security",
				description: "Invite or remove users from a room.",
				inputSchema: toInputSchema(SetRoomSecurityInputSchema),
			},
			{
				name: "get_room_security_info",
				description: "Get a list of users with their access levels to a room.",
				inputSchema: toInputSchema(GetRoomSecurityInfoInputSchema),
			},
			{
				name: "get_rooms_folder",
				description: "Get the 'Rooms' folder.",
				inputSchema: toInputSchema(GetRoomsFolderInputSchema),
			},
			{
				name: "get_room_types",
				description: "Get a list of available room types.",
				inputSchema: toInputSchema(z.object({})),
			},
			{
				name: "get_room_access_levels",
				description: "Get a list of available room invitation access levels.",
				inputSchema: toInputSchema(GetRoomAccessLevelsSchema),
			},
		],
	},
	{
		name: "people",
		description: "Operations for working with users.",
		tools: [
			{
				name: "get_all_people",
				description: "Get all people.",
				inputSchema: toInputSchema(GetAllPeopleInputSchema),
			},
		],
	},
]

export interface MisconfiguredStdioConfig {
	server: ProtocolServer
	err: Error
}

export interface ConfiguredStdioConfig {
	server: ProtocolServer
	client: Client
	resolver: Resolver
	uploader: Uploader
	dynamic: boolean
	tools: string[]
}

export interface InternalStreamableConfig {
	app: express.Express
	createTransport(this: void, o: InternalStreamableCreateTransportOptions): Promise<Result<StreamableHTTPServerTransport, Error>>
	retrieveTransport(this: void, id: string): Result<StreamableHTTPServerTransport, Error>
}

export interface InternalStreamableCreateTransportOptions {
	baseUrl: string
	authToken: string
}

class MisconfiguredStdioServer {
	err: Error
	tools: ToolInfo[]

	constructor(config: MisconfiguredStdioConfig) {
		this.err = config.err
		this.tools = []

		for (let s of toolsets) {
			this.tools.push(...s.tools)
		}
	}

	listTools(): ListToolsResult {
		return {
			tools: this.tools,
		}
	}

	callTool(): CallToolResult {
		return {
			content: [
				{
					type: "text",
					text: format(this.err),
				},
			],
			isError: true,
		}
	}
}

export class ConfiguredStdioServer {
	client: Client
	resolver: Resolver
	uploader: Uploader

	meta: MetaToolset
	regular: RegularToolset

	toolsets: Toolset[] = []
	tools: ToolInfo[] = []

	routeTool: (req: CallToolRequest, extra: Extra) => Promise<Result<string, Error>>

	constructor(config: ConfiguredStdioConfig) {
		this.client = config.client
		this.resolver = config.resolver
		this.uploader = config.uploader

		this.meta = new MetaToolset(this)
		this.regular = new RegularToolset(this)

		for (let s of toolsets) {
			let o: Toolset = {
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
			this.tools = [...metaTools]
			this.routeTool = this.routeMetaTool.bind(this)
		} else {
			for (let s of this.toolsets) {
				this.tools.push(...s.tools)
			}
			this.routeTool = this.routeRegularTool.bind(this)
		}
	}

	listTools(): ListToolsResult {
		return {
			tools: this.tools,
		}
	}

	async callTool(req: CallToolRequest, extra: Extra): Promise<CallToolResult> {
		let pr = await this.routeTool(req, extra)

		if (pr.err) {
			return {
				content: [
					{
						type: "text",
						text: format(pr.err),
					},
				],
				isError: true,
			}
		}

		return {
			content: [
				{
					type: "text",
					text: pr.v,
				},
			],
		}
	}

	async routeMetaTool(req: CallToolRequest, extra: Extra): Promise<Result<string, Error>> {
		let cr: Result<SimplifiedToolInfo[] | ToolInputSchema | string, Error>

		try {
			switch (req.params.name) {
			case "list_toolsets":
				cr = this.meta.listToolsets()
				break
			case "list_tools":
				cr = this.meta.listTools(req.params.arguments)
				break
			case "get_tool_input_schema":
				cr = this.meta.getToolInputSchema(req.params.arguments)
				break
			case "call_tool":
				cr = await this.meta.callTool(req, extra)
				break
			default:
				cr = error(new Error(`Tool ${req.params.name} not found.`))
				break
			}
		} catch (err) {
			if (err instanceof Error) {
				cr = error(err)
			} else {
				cr = error(new Error("Unknown error.", {cause: err}))
			}
		}

		if (cr.err) {
			return error(cr.err)
		}

		if (typeof cr.v === "string") {
			return ok(cr.v)
		}

		let s = safeSync(JSON.stringify, cr.v, undefined, 2)
		if (s.err) {
			return error(new Error("Stringifying value", {cause: s.err}))
		}

		return ok(s.v)
	}

	async routeRegularTool(req: CallToolRequest, extra: Extra): Promise<Result<string, Error>> {
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
			return error(new Error(`Tool ${req.params.name} not found`))
		}

		let cr: Result<Response | string | object, Error>

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
				cr = error(new Error(`Tool ${req.params.name} not found.`))
				break
			}
		} catch (err) {
			if (err instanceof Error) {
				cr = error(err)
			} else {
				cr = error(new Error("Unknown error.", {cause: err}))
			}
		}

		let pr = await (async(): Promise<Result<string, Error>> => {
			if (cr.err) {
				return error(cr.err)
			}

			if (cr.v instanceof Response) {
				let h = cr.v.response.headers.get("Content-Type")
				if (h === null) {
					return error(new Error("Content-Type header is missing"))
				}

				if (h.startsWith("application/json")) {
					let p = await safeAsync(cr.v.response.json.bind(cr.v.response))
					if (p.err) {
						return error(new Error("Parsing json response", {cause: p.err}))
					}

					let s = safeSync(JSON.stringify, p.v, undefined, 2)
					if (s.err) {
						return error(new Error("Stringifying json value", {cause: s.err}))
					}

					return ok(s.v)
				}

				if (h.startsWith("text/")) {
					let t = await safeAsync(cr.v.response.text.bind(cr.v.response))
					if (t.err) {
						return error(new Error("Parsing text response", {cause: t.err}))
					}

					return ok(t.v)
				}

				return error(new Error(`Content-Type ${h} is not supported`))
			}

			if (typeof cr.v === "string") {
				return ok(cr.v)
			}

			if (typeof cr.v === "object") {
				let s = safeSync(JSON.stringify, cr.v, undefined, 2)
				if (s.err) {
					return error(new Error("Stringifying object value", {cause: s.err}))
				}

				return ok(s.v)
			}

			return error(new Error(`Unknown result type ${typeof cr.v}`))
		})()

		return pr
	}
}

class InternalStreamableServer {
	createTransport: InternalStreamableConfig["createTransport"]
	retrieveTransport: InternalStreamableConfig["retrieveTransport"]

	constructor(config: InternalStreamableConfig) {
		this.createTransport = config.createTransport
		this.retrieveTransport = config.retrieveTransport
	}

	notFound(_: express.Request, res: express.Response): void {
		let err = new Error("Not Found")
		this.sendError(res, 404, -32001, err)
	}

	async post(req: express.Request, res: express.Response): Promise<void> {
		try {
			let a = req.headers.authorization
			if (a === undefined || a === "") {
				let err = new Error("Bad Request: Authorization header is required")
				this.sendError(res, 400, -32000, err)
				return
			}

			let r = req.headers.referer
			if (r === undefined || r === "") {
				let err = new Error("Bad Request: Referer header is required")
				this.sendError(res, 400, -32000, err)
				return
			}

			let id = req.headers["mcp-session-id"]
			let t: StreamableHTTPServerTransport | undefined

			if (id === undefined || id === "") {
				if (isInitializeRequest(req.body)) {
					let o: InternalStreamableCreateTransportOptions = {
						baseUrl: r,
						authToken: a,
					}

					let c = await this.createTransport(o)
					if (c.err) {
						let err = new Error("Creating transport", {cause: c.err})
						this.sendError(res, 500, -32603, err)
						return
					}

					t = c.v
				} else {
					// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L587
					let err = new Error("Bad Request: Mcp-Session-Id header is required")
					this.sendError(res, 400, -32000, err)
					return
				}
			} else if (Array.isArray(id)) {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L597
				let err = new Error("Bad Request: Mcp-Session-Id header must be a single value")
				this.sendError(res, 400, -32000, err)
				return
			} else {
				let r = this.retrieveTransport(id)
				if (r.err) {
					let err = new Error("Retrieving transport", {cause: r.err})
					this.sendError(res, 404, -32001, err)
					return
				}

				t = r.v
			}

			let h = await safeAsync(t.handleRequest.bind(t), req, res, req.body)
			if (h.err) {
				let err = new Error("Handling request", {cause: h.err})
				this.sendError(res, 500, -32603, err)
				return
			}
		} catch (err_) {
			let err = new Error("Internal Server Error", {cause: err_})
			this.sendError(res, 500, -32603, err)
		}
	}

	async get(req: express.Request, res: express.Response): Promise<void> {
		await this.delete(req, res)
	}

	async delete(req: express.Request, res: express.Response): Promise<void> {
		try {
			let id = req.headers["mcp-session-id"]

			if (id === undefined || id === "") {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L587
				let err = new Error("Bad Request: Mcp-Session-Id header is required")
				this.sendError(res, 400, -32000, err)
				return
			}

			if (Array.isArray(id)) {
				// https://github.com/modelcontextprotocol/typescript-sdk/blob/1.15.1/src/server/streamableHttp.ts#L597
				let err = new Error("Bad Request: Mcp-Session-Id header must be a single value")
				this.sendError(res, 400, -32000, err)
				return
			}

			let r = this.retrieveTransport(id)
			if (r.err) {
				let err = new Error("Retrieving transport", {cause: r.err})
				this.sendError(res, 404, -32001, err)
				return
			}

			let h = await safeAsync(r.v.handleRequest.bind(r.v), req, res)
			if (h.err) {
				let err = new Error("Handling request", {cause: h.err})
				this.sendError(res, 500, -32603, err)
				return
			}
		} catch (err_) {
			let err = new Error("Internal Server Error", {cause: err_})
			this.sendError(res, 500, -32603, err)
		}
	}

	sendError(res: express.Response, httpCode: number, jsonrpcCode: number, err: Error): void {
		res.status(httpCode)
		res.json({
			jsonrpc: "2.0",
			error: {
				code: jsonrpcCode,
				message: format(err),
			},
			id: null,
		})
	}
}

export function attachConfiguredStdio(config: ConfiguredStdioConfig): void {
	let s = new ConfiguredStdioServer(config)
	config.server.setRequestHandler(ListToolsRequestSchema, s.listTools.bind(s))
	config.server.setRequestHandler(CallToolRequestSchema, s.callTool.bind(s))
}

export function attachMisconfiguredStdio(config: MisconfiguredStdioConfig): void {
	let s = new MisconfiguredStdioServer(config)
	config.server.setRequestHandler(ListToolsRequestSchema, s.listTools.bind(s))
	config.server.setRequestHandler(CallToolRequestSchema, s.callTool.bind(s))
}

export function attachInternalStreamable(config: InternalStreamableConfig): void {
	let s = new InternalStreamableServer(config)
	config.app.disable("x-powered-by")
	config.app.disable("etag")
	config.app.post("/mcp", express.json(), s.post.bind(s))
	config.app.get("/mcp", express.json(), s.get.bind(s))
	config.app.delete("/mcp", express.json(), s.delete.bind(s))
	config.app.use(s.notFound.bind(s))
}
