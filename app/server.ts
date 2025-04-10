import type {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js"
import type {CallToolResult, ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {CallToolRequestSchema, ListToolsRequestSchema} from "@modelcontextprotocol/sdk/types.js"
import * as z from "zod"
import {zodToJsonSchema} from "zod-to-json-schema"
import type {Result} from "../ext/result.ts"
import {error, ok, safeAsync, safeSync} from "../ext/result.ts"
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
	GetFolderInfoInputSchema,
	GetFolderInputSchema,
	GetFoldersInputSchema,
	GetRoomInfoInputSchema,
	MoveBatchItemsInputSchema,
	OthersToolset,
	PeopleToolset,
	RenameFolderInputSchema,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
	UploadFileInputSchema,
} from "./server/toolsets.ts"
import type {Response} from "../lib/client.ts"

export type {Config} from "./server/base.ts"

export class Server {
	private base: Base

	files: FilesToolset
	others: OthersToolset
	people: PeopleToolset

	constructor(config: Config) {
		this.base = new Base(config)

		this.files = new FilesToolset(this.base)
		this.others = new OthersToolset(this.base)
		this.people = new PeopleToolset(this.base)

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
					name: "files.get_folder_info",
					description: "",
					inputSchema: toInputSchema(GetFolderInfoInputSchema),
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

				{
					name: "people.get_all",
					description: "",
					inputSchema: toInputSchema(z.object({})),
				},
			],
		}
	}

	async callTools(req: CallToolRequest, extra: RequestHandlerExtra): Promise<CallToolResult> {
		let cr: Result<string | Response, Error>

		try {
			switch (req.params.name) {
			case "files.delete_file":
				cr = await this.files.deleteFile(extra.signal, req.params.arguments)
				break
			case "files.get_file_info":
				cr = await this.files.getFileInfo(extra.signal, req.params.arguments)
				break
			case "files.update_file":
				cr = await this.files.updateFile(extra.signal, req.params.arguments)
				break
			case "files.create_folder":
				cr = await this.files.createFolder(extra.signal, req.params.arguments)
				break
			case "files.delete_folder":
				cr = await this.files.deleteFolder(extra.signal, req.params.arguments)
				break
			case "files.get_folder":
				cr = await this.files.getFolder(extra.signal, req.params.arguments)
				break
			case "files.get_folder_info":
				cr = await this.files.getFolderInfo(extra.signal, req.params.arguments)
				break
			case "files.get_folders":
				cr = await this.files.getFolders(extra.signal, req.params.arguments)
				break
			case "files.rename_folder":
				cr = await this.files.renameFolder(extra.signal, req.params.arguments)
				break
			case "files.get_my_folder":
				cr = await this.files.getMyFolder(extra.signal)
				break
			case "files.copy_batch_items":
				cr = await this.files.copyBatchItems(extra.signal, req.params.arguments)
				break
			case "files.get_operation_statuses":
				cr = await this.files.getOperationStatuses(extra.signal)
				break
			case "files.move_batch_items":
				cr = await this.files.moveBatchItems(extra.signal, req.params.arguments)
				break
			case "files.create_room":
				cr = await this.files.createRoom(extra.signal, req.params.arguments)
				break
			case "files.get_room_info":
				cr = await this.files.getRoomInfo(extra.signal, req.params.arguments)
				break
			case "files.update_room":
				cr = await this.files.updateRoom(extra.signal, req.params.arguments)
				break
			case "files.archive_room":
				cr = await this.files.archiveRoom(extra.signal, req.params.arguments)
				break
			case "files.get_rooms_folder":
				cr = await this.files.getRoomsFolder(extra.signal)
				break

			case "others.download_as_text":
				cr = await this.others.downloadAsText(extra.signal, req.params.arguments)
				break
			case "others.upload_file":
				cr = await this.others.uploadFile(extra.signal, req.params.arguments)
				break

			case "people.get_all":
				cr = await this.people.getAll(extra.signal)
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

			if (typeof cr.v === "string") {
				return ok(cr.v)
			}

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
		})()

		if (pr.err) {
			return {
				content: [
					{
						type: "text",
						text: this.base.format(pr.err),
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
}

type CallToolRequest = z.infer<typeof CallToolRequestSchema>

type ToolInputSchema = ListToolsResult["tools"][0]["inputSchema"]

// eslint-disable-next-line typescript/no-empty-object-type
function toInputSchema<T extends z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>(o: T): ToolInputSchema {
	return zodToJsonSchema(o) as ToolInputSchema
}
