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
	GetFileInfoInputSchema,
	GetFolderInputSchema,
	GetFoldersInputSchema,
	GetRoomInfoInputSchema,
	MoveBatchItemsInputSchema,
	OthersToolset,
	RenameFolderInputSchema,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
	UploadFileInputSchema,
} from "./server/toolsets.ts"

export type {Config} from "./server/base.ts"

export class Server {
	private base: Base

	files: FilesToolset
	others: OthersToolset

	constructor(config: Config) {
		this.base = new Base(config)

		this.files = new FilesToolset(this.base)
		this.others = new OthersToolset(this.base)

		this.base.server.setRequestHandler(ListToolsRequestSchema, this.listTools.bind(this))
		this.base.server.setRequestHandler(CallToolRequestSchema, this.callTools.bind(this))
	}

	listTools(): ListToolsResult {
		return {
			tools: [
				{
					name: "files.delete_file",
					description: "",
					inputSchema: toInputSchema(DeleteFileInputSchema),
				},
				{
					name: "files.get_file_info",
					description: "",
					inputSchema: toInputSchema(GetFileInfoInputSchema),
				},
				{
					name: "files.update_file",
					description: "",
					inputSchema: toInputSchema(UpdateFileInputSchema),
				},
				{
					name: "files.create_folder",
					description: "",
					inputSchema: toInputSchema(CreateFolderInputSchema),
				},
				{
					name: "files.delete_folder",
					description: "",
					inputSchema: toInputSchema(DeleteFolderInputSchema),
				},
				{
					name: "files.get_folder",
					description: "",
					inputSchema: toInputSchema(GetFolderInputSchema),
				},
				{
					name: "files.get_folders",
					description: "",
					inputSchema: toInputSchema(GetFoldersInputSchema),
				},
				{
					name: "files.rename_folder",
					description: "",
					inputSchema: toInputSchema(RenameFolderInputSchema),
				},
				{
					name: "files.get_my_folder",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},
				{
					name: "files.copy_batch_items",
					description: "",
					inputSchema: toInputSchema(CopyBatchItemsInputSchema),
				},
				{
					name: "files.get_operation_statuses",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},
				{
					name: "files.move_batch_items",
					description: "",
					inputSchema: toInputSchema(MoveBatchItemsInputSchema),
				},
				{
					name: "files.create_room",
					description: "",
					inputSchema: toInputSchema(CreateRoomInputSchema),
				},
				{
					name: "files.get_room_info",
					description: "",
					inputSchema: toInputSchema(GetRoomInfoInputSchema),
				},
				{
					name: "files.update_room",
					description: "",
					inputSchema: toInputSchema(UpdateRoomInputSchema),
				},
				{
					name: "files.archive_room",
					description: "",
					inputSchema: toInputSchema(ArchiveRoomInputSchema),
				},
				{
					name: "files.get_rooms_folder",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},

				{
					name: "others.download_as_text",
					description: "",
					inputSchema: toInputSchema(DownloadAsTextInputSchema),
				},
				{
					name: "others.upload_file",
					description: "",
					inputSchema: toInputSchema(UploadFileInputSchema),
				},
			],
		}
	}

	async callTools(req: CallToolRequest, extra: RequestHandlerExtra): Promise<CallToolResult> {
		let r: Result<unknown, Error>

		try {
			switch (req.params.name) {
			case "files.delete_file":
				r = await this.files.deleteFile(extra.signal, req.params.arguments)
				break
			case "files.get_file_info":
				r = await this.files.getFileInfo(extra.signal, req.params.arguments)
				break
			case "files.update_file":
				r = await this.files.updateFile(extra.signal, req.params.arguments)
				break
			case "files.create_folder":
				r = await this.files.createFolder(extra.signal, req.params.arguments)
				break
			case "files.delete_folder":
				r = await this.files.deleteFolder(extra.signal, req.params.arguments)
				break
			case "files.get_folder":
				r = await this.files.getFolder(extra.signal, req.params.arguments)
				break
			case "files.get_folders":
				r = await this.files.getFolders(extra.signal, req.params.arguments)
				break
			case "files.rename_folder":
				r = await this.files.renameFolder(extra.signal, req.params.arguments)
				break
			case "files.get_my_folder":
				r = await this.files.getMyFolder(extra.signal)
				break
			case "files.copy_batch_items":
				r = await this.files.copyBatchItems(extra.signal, req.params.arguments)
				break
			case "files.get_operation_statuses":
				r = await this.files.getOperationStatuses(extra.signal)
				break
			case "files.move_batch_items":
				r = await this.files.moveBatchItems(extra.signal, req.params.arguments)
				break
			case "files.create_room":
				r = await this.files.createRoom(extra.signal, req.params.arguments)
				break
			case "files.get_room_info":
				r = await this.files.getRoomInfo(extra.signal, req.params.arguments)
				break
			case "files.update_room":
				r = await this.files.updateRoom(extra.signal, req.params.arguments)
				break
			case "files.archive_room":
				r = await this.files.archiveRoom(extra.signal, req.params.arguments)
				break
			case "files.get_rooms_folder":
				r = await this.files.getRoomsFolder(extra.signal)
				break

			case "others.download_as_text":
				r = await this.others.downloadAsText(extra.signal, req.params.arguments)
				break
			case "others.upload_file":
				r = await this.others.uploadFile(extra.signal, req.params.arguments)
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
