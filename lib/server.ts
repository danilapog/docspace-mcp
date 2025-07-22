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
import type {Result} from "../util/result.ts"
import {error, ok, safeAsync, safeSync} from "../util/result.ts"
import type {Client} from "./client.ts"
import {Response} from "./client.ts"
import type {Resolver} from "./resolver.ts"
import {
	ArchiveRoomInputSchema,
	CopyBatchItemsInputSchema,
	CreateFolderInputSchema,
	CreateRoomInputSchema,
	DeleteFileInputSchema,
	DeleteFolderInputSchema,
	FilesToolset,
	GetFileInfoInputSchema,
	GetFolderInfoInputSchema,
	GetFolderInputSchema,
	GetFoldersInputSchema,
	GetMyFolderInputSchema,
	GetRoomInfoInputSchema,
	GetRoomSecurityInfoInputSchema,
	GetRoomsFolderInputSchema,
	MoveBatchItemsInputSchema,
	RenameFolderInputSchema,
	SetRoomSecurityInputSchema,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
} from "./server/files.ts"
import type {
	CallToolRequest,
	Extra,
	SimplifiedToolInfo,
	ToolInfo,
	ToolInputSchema,
	Toolset,
} from "./server/internal/protocol.ts"
import {toInputSchema} from "./server/internal/protocol.ts"
import {CallToolInputSchema, GetToolInputSchemaInputSchema, ListToolsInputSchema, MetaToolset} from "./server/meta.ts"
import {
	DownloadAsTextInputSchema,
	GetAvailableRoomAccessSchema,
	OthersToolset,
	UploadFileInputSchema,
} from "./server/others.ts"
import {GetAllInputSchema, PeopleToolset} from "./server/people.ts"
import {PortalToolset} from "./server/portal.ts"
import {SettingsToolset} from "./server/settings.ts"
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
		description: "Operations for working with files, folders, and rooms.",
		tools: [
			{
				name: "files_delete_file",
				description: "Delete a file.",
				inputSchema: toInputSchema(DeleteFileInputSchema),
			},
			{
				name: "files_get_file_info",
				description: "Get file information.",
				inputSchema: toInputSchema(GetFileInfoInputSchema),
			},
			{
				name: "files_update_file",
				description: "Update a file.",
				inputSchema: toInputSchema(UpdateFileInputSchema),
			},
			{
				name: "files_create_folder",
				description: "Create a folder.",
				inputSchema: toInputSchema(CreateFolderInputSchema),
			},
			{
				name: "files_delete_folder",
				description: "Delete a folder.",
				inputSchema: toInputSchema(DeleteFolderInputSchema),
			},
			{
				name: "files_get_folder",
				description: "Get content of a folder.",
				inputSchema: toInputSchema(GetFolderInputSchema),
			},
			{
				name: "files_get_folder_info",
				description: "Get folder information.",
				inputSchema: toInputSchema(GetFolderInfoInputSchema),
			},
			{
				name: "files_get_folders",
				description: "Get subfolders of a folder.",
				inputSchema: toInputSchema(GetFoldersInputSchema),
			},
			{
				name: "files_rename_folder",
				description: "Rename a folder.",
				inputSchema: toInputSchema(RenameFolderInputSchema),
			},
			{
				name: "files_get_my_folder",
				description: "Get the 'My Documents' folder.",
				inputSchema: toInputSchema(GetMyFolderInputSchema),
			},
			{
				name: "files_copy_batch_items",
				description: "Copy to a folder.",
				inputSchema: toInputSchema(CopyBatchItemsInputSchema),
			},
			{
				name: "files_get_operation_statuses",
				description: "Get active file operations.",
				inputSchema: toInputSchema(z.object({})),
			},
			{
				name: "files_move_batch_items",
				description: "Move to a folder.",
				inputSchema: toInputSchema(MoveBatchItemsInputSchema),
			},
			{
				name: "files_create_room",
				description: "Create a room.",
				inputSchema: toInputSchema(CreateRoomInputSchema),
			},
			{
				name: "files_get_room_info",
				description: "Get room information.",
				inputSchema: toInputSchema(GetRoomInfoInputSchema),
			},
			{
				name: "files_update_room",
				description: "Update a room.",
				inputSchema: toInputSchema(UpdateRoomInputSchema),
			},
			{
				name: "files_archive_room",
				description: "Archive a room.",
				inputSchema: toInputSchema(ArchiveRoomInputSchema),
			},
			{
				name: "files_set_room_security",
				description: "Invite or remove users from a room.",
				inputSchema: toInputSchema(SetRoomSecurityInputSchema),
			},
			{
				name: "files_get_room_security_info",
				description: "Get a list of users with their access levels to a room.",
				inputSchema: toInputSchema(GetRoomSecurityInfoInputSchema),
			},
			{
				name: "files_get_rooms_folder",
				description: "Get the 'Rooms' folder.",
				inputSchema: toInputSchema(GetRoomsFolderInputSchema),
			},
		],
	},
	{
		name: "others",
		description: "Operations for listing additional enumeration values. Operations for downloading and uploading files.",
		tools: [
			{
				name: "others_get_available_room_types",
				description: "Get a list of available room types.",
				inputSchema: toInputSchema(z.object({})),
			},
			{
				name: "others_get_available_room_access",
				description: "Get a list of available room invitation access levels.",
				inputSchema: toInputSchema(GetAvailableRoomAccessSchema),
			},
			{
				name: "others_download_as_text",
				description: "Download a file as text.",
				inputSchema: toInputSchema(DownloadAsTextInputSchema),
			},
			{
				name: "others_upload_file",
				description: "Upload a file.",
				inputSchema: toInputSchema(UploadFileInputSchema),
			},
		],
	},
	{
		name: "people",
		description: "Operations for working with users.",
		tools: [
			{
				name: "people_get_all",
				description: "Get all people.",
				inputSchema: toInputSchema(GetAllInputSchema),
			},
		],
	},
	{
		name: "portal",
		description: "Operations for working with the portal.",
		tools: [
			{
				name: "portal_get_tariff",
				description: "Get the current tariff.",
				inputSchema: toInputSchema(z.object({})),
			},
			{
				name: "portal_get_quota",
				description: "Get the current quota.",
				inputSchema: toInputSchema(z.object({})),
			},
		],
	},
	{
		name: "settings",
		description: "Operations for working with settings.",
		tools: [
			{
				name: "settings_get_supported_cultures",
				description: "Get a list of the supported cultures, languages.",
				inputSchema: toInputSchema(z.object({})),
			},
			{
				name: "settings_get_time_zones",
				description: "Get a list of the available time zones.",
				inputSchema: toInputSchema(z.object({})),
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
	toolsets: string[]
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

	files: FilesToolset
	meta: MetaToolset
	others: OthersToolset
	people: PeopleToolset
	portal: PortalToolset
	settings: SettingsToolset

	activeToolsets: SimplifiedToolInfo[] = []
	activeTools: ToolInfo[] = []
	listableTools: ToolInfo[] = []

	routeTool: (req: CallToolRequest, extra: Extra) => Promise<Result<string, Error>>

	constructor(config: ConfiguredStdioConfig) {
		this.client = config.client
		this.resolver = config.resolver
		this.uploader = config.uploader

		this.files = new FilesToolset(this)
		this.meta = new MetaToolset(this)
		this.others = new OthersToolset(this)
		this.people = new PeopleToolset(this)
		this.portal = new PortalToolset(this)
		this.settings = new SettingsToolset(this)

		for (let n of config.toolsets) {
			for (let s of toolsets) {
				if (s.name === n) {
					let t: SimplifiedToolInfo = {
						name: s.name,
						description: s.description,
					}
					this.activeToolsets.push(t)
					break
				}
			}
		}

		for (let n of config.tools) {
			for (let s of toolsets) {
				for (let t of s.tools) {
					if (t.name === n) {
						this.activeTools.push(t)
						break
					}
				}
			}
		}

		if (config.dynamic) {
			this.listableTools = [...metaTools]
			this.routeTool = this.routeMetaTool.bind(this)
		} else {
			this.listableTools = [...this.activeTools]
			this.routeTool = this.routeRegularTool.bind(this)
		}
	}

	listTools(): ListToolsResult {
		return {
			tools: this.listableTools,
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
		let cr: Result<Response | string | object, Error>

		try {
			switch (req.params.name) {
			case "files_delete_file":
				cr = await this.files.deleteFile(extra.signal, req.params.arguments)
				break
			case "files_get_file_info":
				cr = await this.files.getFileInfo(extra.signal, req.params.arguments)
				break
			case "files_update_file":
				cr = await this.files.updateFile(extra.signal, req.params.arguments)
				break
			case "files_create_folder":
				cr = await this.files.createFolder(extra.signal, req.params.arguments)
				break
			case "files_delete_folder":
				cr = await this.files.deleteFolder(extra.signal, req.params.arguments)
				break
			case "files_get_folder":
				cr = await this.files.getFolder(extra.signal, req.params.arguments)
				break
			case "files_get_folder_info":
				cr = await this.files.getFolderInfo(extra.signal, req.params.arguments)
				break
			case "files_get_folders":
				cr = await this.files.getFolders(extra.signal, req.params.arguments)
				break
			case "files_rename_folder":
				cr = await this.files.renameFolder(extra.signal, req.params.arguments)
				break
			case "files_get_my_folder":
				cr = await this.files.getMyFolder(extra.signal, req.params.arguments)
				break
			case "files_copy_batch_items":
				cr = await this.files.copyBatchItems(extra.signal, req.params.arguments)
				break
			case "files_get_operation_statuses":
				cr = await this.files.getOperationStatuses(extra.signal)
				break
			case "files_move_batch_items":
				cr = await this.files.moveBatchItems(extra.signal, req.params.arguments)
				break
			case "files_create_room":
				cr = await this.files.createRoom(extra.signal, req.params.arguments)
				break
			case "files_get_room_info":
				cr = await this.files.getRoomInfo(extra.signal, req.params.arguments)
				break
			case "files_update_room":
				cr = await this.files.updateRoom(extra.signal, req.params.arguments)
				break
			case "files_archive_room":
				cr = await this.files.archiveRoom(extra.signal, req.params.arguments)
				break
			case "files_set_room_security":
				cr = await this.files.setRoomSecurity(extra.signal, req.params.arguments)
				break
			case "files_get_room_security_info":
				cr = await this.files.getRoomSecurityInfo(extra.signal, req.params.arguments)
				break
			case "files_get_rooms_folder":
				cr = await this.files.getRoomsFolder(extra.signal, req.params.arguments)
				break

			case "others_get_available_room_types":
				cr = this.others.getAvailableRoomTypes()
				break
			case "others_get_available_room_access":
				cr = await this.others.getAvailableRoomAccess(extra.signal, req.params.arguments)
				break
			case "others_download_as_text":
				cr = await this.others.downloadAsText(extra.signal, req.params.arguments)
				break
			case "others_upload_file":
				cr = await this.others.uploadFile(extra.signal, req.params.arguments)
				break

			case "people_get_all":
				cr = await this.people.getAll(extra.signal, req.params.arguments)
				break

			case "portal_get_tariff":
				cr = await this.portal.getTariff(extra.signal)
				break
			case "portal_get_quota":
				cr = await this.portal.getQuota(extra.signal)
				break

			case "settings_get_supported_cultures":
				cr = await this.settings.getSupportedCultures(extra.signal)
				break
			case "settings_get_time_zones":
				cr = await this.settings.getTimeZones(extra.signal)
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
