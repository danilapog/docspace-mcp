import type {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js"
import type {CallToolResult, ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {CallToolRequestSchema, ListToolsRequestSchema} from "@modelcontextprotocol/sdk/types.js"
import * as z from "zod"
import {zodToJsonSchema} from "zod-to-json-schema"
import type {Result} from "../ext/result.ts"
import {error, safeSync} from "../ext/result.ts"
import type {Config} from "./server/base.ts"
import {Base} from "./server/base.ts"
import {
	ArchiveRoomInputSchema,
	CopyBatchItemsInputSchema,
	CreateFolderInputSchema,
	CreateRoomInputSchema,
	DeleteFileInputSchema,
	DeleteFolderInputSchema,
	DownloadAsTextInputSchema,
	FilesToolset,
	FoldersToolset,
	GetFileInfoInputSchema,
	GetFolderInfoInputSchema,
	GetFoldersInputSchema,
	GetRoomInfoInputSchema,
	MoveBatchItemsInputSchema,
	OperationsToolset,
	RenameFolderInputSchema,
	RoomsToolset,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
	UploadFileInputSchema,
} from "./server/toolsets.ts"

export type {Config} from "./server/base.ts"

export class Server {
	private base: Base

	files: FilesToolset
	folders: FoldersToolset
	operations: OperationsToolset
	rooms: RoomsToolset

	constructor(config: Config) {
		this.base = new Base(config)

		this.files = new FilesToolset(this.base)
		this.folders = new FoldersToolset(this.base)
		this.operations = new OperationsToolset(this.base)
		this.rooms = new RoomsToolset(this.base)

		this.base.server.setRequestHandler(ListToolsRequestSchema, this.listTools.bind(this))
		this.base.server.setRequestHandler(CallToolRequestSchema, this.callTools.bind(this))
	}

	listTools(): ListToolsResult {
		return {
			tools: [
				// Files
				{
					name: "delete_file",
					description: "",
					inputSchema: toInputSchema(DeleteFileInputSchema),
				},
				{
					name: "get_file_info",
					description: "",
					inputSchema: toInputSchema(GetFileInfoInputSchema),
				},
				{
					name: "update_file",
					description: "",
					inputSchema: toInputSchema(UpdateFileInputSchema),
				},

				// Folders
				{
					name: "create_folder",
					description: "",
					inputSchema: toInputSchema(CreateFolderInputSchema),
				},
				{
					name: "delete_folder",
					description: "",
					inputSchema: toInputSchema(DeleteFolderInputSchema),
				},
				{
					name: "get_folder_info",
					description: "",
					inputSchema: toInputSchema(GetFolderInfoInputSchema),
				},
				{
					name: "get_folders",
					description: "",
					inputSchema: toInputSchema(GetFoldersInputSchema),
				},
				{
					name: "rename_folder",
					description: "",
					inputSchema: toInputSchema(RenameFolderInputSchema),
				},
				{
					name: "get_my_folder",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},

				// Operations
				{
					name: "copy_batch_items",
					description: "",
					inputSchema: toInputSchema(CopyBatchItemsInputSchema),
				},
				{
					name: "download_as_text",
					description: "",
					inputSchema: toInputSchema(DownloadAsTextInputSchema),
				},
				{
					name: "get_operation_statuses",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},
				{
					name: "move_batch_items",
					description: "",
					inputSchema: toInputSchema(MoveBatchItemsInputSchema),
				},
				{
					name: "upload_file",
					description: "",
					inputSchema: toInputSchema(UploadFileInputSchema),
				},

				// Rooms
				{
					name: "create_room",
					description: "",
					inputSchema: toInputSchema(CreateRoomInputSchema),
				},
				{
					name: "get_room_info",
					description: "",
					inputSchema: toInputSchema(GetRoomInfoInputSchema),
				},
				{
					name: "update_room",
					description: "",
					inputSchema: toInputSchema(UpdateRoomInputSchema),
				},
				{
					name: "archive_room",
					description: "",
					inputSchema: toInputSchema(ArchiveRoomInputSchema),
				},
				{
					name: "get_rooms_folder",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},
			],
		}
	}

	async callTools(req: CallToolRequest, extra: RequestHandlerExtra): Promise<CallToolResult> {
		let r: Result<unknown, Error>

		try {
			switch (req.params.name) {
			// Files
			case "delete_file":
				r = await this.files.deleteFile(extra.signal, req.params.arguments)
				break
			case "get_file_info":
				r = await this.files.getFileInfo(extra.signal, req.params.arguments)
				break
			case "update_file":
				r = await this.files.updateFile(extra.signal, req.params.arguments)
				break

			// Folders
			case "create_folder":
				r = await this.folders.createFolder(extra.signal, req.params.arguments)
				break
			case "delete_folder":
				r = await this.folders.deleteFolder(extra.signal, req.params.arguments)
				break
			case "get_folder_info":
				r = await this.folders.getFolderInfo(extra.signal, req.params.arguments)
				break
			case "get_folders":
				r = await this.folders.getFolders(extra.signal, req.params.arguments)
				break
			case "rename_folder":
				r = await this.folders.renameFolder(extra.signal, req.params.arguments)
				break
			case "get_my_folder":
				r = await this.folders.getMyFolder(extra.signal)
				break

			// Operations
			case "copy_batch_items":
				r = await this.operations.copyBatchItems(extra.signal, req.params.arguments)
				break
			case "download_as_text":
				r = await this.operations.downloadAsText(extra.signal, req.params.arguments)
				break
			case "get_operation_statuses":
				r = await this.operations.getOperationStatuses(extra.signal)
				break
			case "move_batch_items":
				r = await this.operations.moveBatchItems(extra.signal, req.params.arguments)
				break
			case "upload_file":
				r = await this.operations.uploadFile(extra.signal, req.params.arguments)
				break

			// Rooms
			case "create_room":
				r = await this.rooms.createRoom(extra.signal, req.params.arguments)
				break
			case "get_room_info":
				r = await this.rooms.getRoomInfo(extra.signal, req.params.arguments)
				break
			case "update_room":
				r = await this.rooms.updateRoom(extra.signal, req.params.arguments)
				break
			case "archive_room":
				r = await this.rooms.archiveRoom(extra.signal, req.params.arguments)
				break
			case "get_rooms_folder":
				r = await this.rooms.getRoomsFolder(extra.signal)
				break

			default:
				r = error(new Error(`Tool ${req.params.name} not found.`))
				break
			}
		} catch (err) {
			if (err instanceof Error) {
				r = error(err)
			} else {
				r = error(new Error("Unknown error.", {cause: err}))
			}
		}

		if (r.err) {
			return {
				content: [
					{
						type: "text",
						text: this.base.format(r.err),
					},
				],
				isError: true,
			}
		}

		if (typeof r.v === "string") {
			return {
				content: [
					{
						type: "text",
						text: r.v,
					},
				],
			}
		}

		let j = safeSync(JSON.stringify, r.v, undefined, 2)
		if (j.err) {
			let err = new Error("Stringifying json value", {cause: j.err})
			return {
				content: [
					{
						type: "text",
						text: this.base.format(err),
					},
				],
				isError: true,
			}
		}

		return {
			content: [
				{
					type: "text",
					text: j.v,
				},
			],
		}
	}
}

type CallToolRequest = z.infer<typeof CallToolRequestSchema>

type ToolInputSchema = ListToolsResult["tools"][0]["inputSchema"]

// eslint-disable-next-line typescript/no-empty-object-type
function toInputSchema<T extends z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>(o: T): ToolInputSchema {
	return zodToJsonSchema(o) as ToolInputSchema
}
