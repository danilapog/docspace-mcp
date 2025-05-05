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

import type {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js"
import type {CallToolResult, ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {CallToolRequestSchema, ListToolsRequestSchema} from "@modelcontextprotocol/sdk/types.js"
import * as z from "zod"
import {zodToJsonSchema} from "zod-to-json-schema"
import type {Result} from "../ext/result.ts"
import {error, ok, safeAsync, safeSync} from "../ext/result.ts"
import type {Response} from "../lib/client.ts"
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
	GetRoomSecurityInfoInputSchema,
	MoveBatchItemsInputSchema,
	OthersToolset,
	PeopleToolset,
	RenameFolderInputSchema,
	SetRoomSecurityInputSchema,
	UpdateFileInputSchema,
	UpdateRoomInputSchema,
	UploadFileInputSchema,
} from "./server/toolsets.ts"

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
					inputSchema: toInputSchema(z.object({})),
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
					description: "Set room access rights.",
					inputSchema: toInputSchema(SetRoomSecurityInputSchema),
				},
				{
					name: "files_get_room_security_info",
					description: "Get room access rights.",
					inputSchema: toInputSchema(GetRoomSecurityInfoInputSchema),
				},
				{
					name: "files_get_rooms_folder",
					description: "Get the 'Rooms' folder.",
					inputSchema: toInputSchema(z.object({})),
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

				{
					name: "people_get_all",
					description: "Get all people.",
					inputSchema: toInputSchema(z.object({})),
				},
			],
		}
	}

	async callTools(req: CallToolRequest, extra: RequestHandlerExtra): Promise<CallToolResult> {
		let cr: Result<string | Response, Error>

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
				cr = await this.files.getMyFolder(extra.signal)
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
				cr = await this.files.getRoomsFolder(extra.signal)
				break

			case "others_download_as_text":
				cr = await this.others.downloadAsText(extra.signal, req.params.arguments)
				break
			case "others_upload_file":
				cr = await this.others.uploadFile(extra.signal, req.params.arguments)
				break

			case "people_get_all":
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
