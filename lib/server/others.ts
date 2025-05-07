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
import {zodToJsonSchema} from "zod-to-json-schema"
import type {Result} from "../../util/result.ts"
import {error, ok, safeAsync, safeSync} from "../../util/result.ts"
import type {BulkDownloadOptions, CreateUploadSessionOptions, Response} from "../client.ts"
import type {Server} from "../server.ts"
import {RoomInvitationAccessSchema, RoomTypeSchema} from "./internal/schemas.ts"

export const DownloadAsTextInputSchema = z.object({
	fileId: z.number().describe("The ID of the file to download as text."),
})

export const UploadFileInputSchema = z.object({
	parentId: z.number().describe("The ID of the room or folder to upload the file to."),
	filename: z.string().describe("The file name with an extension to upload."),
	content: z.string().describe("The content of the file to upload."),
})

export class OthersToolset {
	private s: Server

	constructor(s: Server) {
		this.s = s
	}

	getAvailableRoomTypes(): Result<object, Error> {
		return ok(zodToJsonSchema(RoomTypeSchema))
	}

	getAvailableRoomInvitationAccess(): Result<object, Error> {
		return ok(zodToJsonSchema(RoomInvitationAccessSchema))
	}

	async downloadAsText(signal: AbortSignal, p: unknown): Promise<Result<string, Error>> {
		let pr = DownloadAsTextInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let gr = await this.s.client.files.getFileInfo(signal, pr.data.fileId)
		if (gr.err) {
			return error(new Error("Getting file info.", {cause: gr.err}))
		}

		let [gd] = gr.v

		if (!gd.fileType) {
			return error(new Error("File type is not defined."))
		}

		let ex: string

		switch (gd.fileType) {
		case 5:
		case "Spreadsheet":
			ex = ".csv"
			break
		case 6:
		case "Presentation":
		case 7:
		case "Document":
		case 10:
		case "Pdf":
			ex = ".txt"
			break
		default:
			return error(new Error(`File type ${gd.fileType} is not supported.`))
		}

		let bo: BulkDownloadOptions = {
			fileConvertIds: [{key: pr.data.fileId, value: ex}],
		}

		let br = await this.s.client.files.bulkDownload(signal, bo)
		if (br.err) {
			return error(new Error("Making bulk download.", {cause: br.err}))
		}

		let [bd] = br.v

		let rr = await this.s.resolver.resolve(signal, ...bd)
		if (rr.err) {
			return error(new Error("Resolving bulk download operations.", {cause: rr.err}))
		}

		if (rr.v.operations.length === 0) {
			return error(new Error("No resolved operations."))
		}

		if (rr.v.operations.length > 1) {
			return error(new Error(`Expected 1 resolved operation, got ${rr.v.operations.length}.`))
		}

		let [rd] = rr.v.operations

		if (rd.url === undefined) {
			return error(new Error("Resolved operation has no URL."))
		}

		let dr = this.s.client.createRequest(signal, "GET", rd.url)
		if (dr.err) {
			return error(new Error("Creating download request.", {cause: dr.err}))
		}

		let hr = safeSync(dr.v.headers.set.bind(dr.v.headers), "Accept", "text/plain")
		if (hr.err) {
			return error(new Error("Setting header.", {cause: hr.err}))
		}

		let tr = await this.s.client.bareFetch(dr.v)
		if (tr.err) {
			return error(new Error("Downloading file.", {cause: tr.err}))
		}

		let tt = await safeAsync(tr.v.text.bind(tr.v))
		if (tt.err) {
			return error(new Error("Converting response to text.", {cause: tt.err}))
		}

		return ok(tt.v)
	}

	async uploadFile(signal: AbortSignal, p: unknown): Promise<Result<Response, Error>> {
		let pr = UploadFileInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let te = new TextEncoder()

		let buf = te.encode(pr.data.content)

		let so: CreateUploadSessionOptions = {
			fileName: pr.data.filename,
			fileSize: buf.length,
			createOn: new Date().toISOString(),
		}

		let sr = await this.s.client.files.createUploadSession(signal, pr.data.parentId, so)
		if (sr.err) {
			return error(new Error("Creating upload session.", {cause: sr.err}))
		}

		let [sd] = sr.v

		if (sd.id === undefined) {
			return error(new Error("Upload session ID is not defined."))
		}

		let ur = await this.s.uploader.upload(signal, sd.id, buf)
		if (ur.err) {
			return error(new Error("Uploading file.", {cause: ur.err}))
		}

		let [, res] = ur.v

		return ok(res)
	}
}
