import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok, safeAsync, safeSync} from "../../../ext/result.ts"
import type {
	BulkDownloadOptions,
	CopyBatchItemsOptions,
	CreateUploadSessionOptions,
	MoveBatchItemsOptions,
} from "../../../lib/client.ts"
import {Toolset} from "../toolset.ts"

export const CopyBatchItemsInputSchema = z.object({
	folderIds: z.
		array(z.union([z.number(), z.string()])).
		optional().
		describe("The IDs of the folders to copy."),
	fileIds: z.
		array(z.union([z.number(), z.string()])).
		optional().
		describe("The IDs of the files to copy."),
	destFolderId: z.
		union([z.number(), z.string()]).
		optional().
		describe("The ID of the destination folder."),
})

export const DownloadAsTextInputSchema = z.object({
	fileId: z.number().describe("The ID of the file to download as text."),
})

export const MoveBatchItemsInputSchema = z.object({
	folderIds: z.
		array(z.union([z.number(), z.string()])).
		optional().
		describe("The IDs of the folders to move items to."),
	fileIds: z.
		array(z.union([z.number(), z.string()])).
		optional().
		describe("The IDs of the files to move."),
	destFolderId: z.
		union([z.number(), z.string()]).
		optional().
		describe("The ID of the destination folder."),
})

export const UploadFileInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to upload the file to."),
	filename: z.string().describe("The name of the file to upload."),
	content: z.string().describe("The content of the file to upload."),
})

export class OperationsToolset extends Toolset {
	async copyBatchItems(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = CopyBatchItemsInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let co: CopyBatchItemsOptions = {
			folderIds: pr.data.folderIds,
			fileIds: pr.data.fileIds,
			destFolderId: pr.data.destFolderId,
			deleteAfter: false,
		}

		let cr = await this.s.client.files.copyBatchItems(signal, co)
		if (cr.err) {
			return error(new Error("Copying batch items.", {cause: cr.err}))
		}

		let [cd] = cr.v

		let rr = await this.s.resolver.resolve(signal, ...cd)
		if (rr.err) {
			return error(new Error("Resolving copy batch items operations.", {cause: rr.err}))
		}

		return ok("Batch items copied.")
	}

	async downloadAsText(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
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

	async getOperationStatuses(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getOperationStatuses(signal)
		if (gr.err) {
			return error(new Error("Getting operation statuses.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	async moveBatchItems(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = MoveBatchItemsInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let mo: MoveBatchItemsOptions = {
			folderIds: pr.data.folderIds,
			fileIds: pr.data.fileIds,
			destFolderId: pr.data.destFolderId,
			deleteAfter: false,
		}

		let mr = await this.s.client.files.moveBatchItems(signal, mo)
		if (mr.err) {
			return error(new Error("Moving batch items.", {cause: mr.err}))
		}

		let [md] = mr.v

		let rr = await this.s.resolver.resolve(signal, ...md)
		if (rr.err) {
			return error(new Error("Resolving move batch items operations.", {cause: rr.err}))
		}

		return ok("Batch items moved.")
	}

	async uploadFile(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = UploadFileInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let so: CreateUploadSessionOptions = {
			fileName: pr.data.filename,
			fileSize: pr.data.content.length,
			createOn: new Date().toISOString(),
		}

		let sr = await this.s.client.files.createUploadSession(signal, pr.data.folderId, so)
		if (sr.err) {
			return error(new Error("Creating upload session.", {cause: sr.err}))
		}

		let [sd] = sr.v

		if (sd.id === undefined) {
			return error(new Error("Upload session ID is not defined."))
		}

		let ur = await this.s.uploader.upload(signal, sd.id, pr.data.content)
		if (ur.err) {
			return error(new Error("Uploading file.", {cause: ur.err}))
		}

		let [ud] = ur.v

		return ok(ud)
	}
}
