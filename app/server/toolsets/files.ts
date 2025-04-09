import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {
	DeleteFileOptions,
	GetFileInfoResponse,
	UpdateFileOptions,
	UpdateFileResponse,
} from "../../../lib/client.ts"
import {Toolset} from "../toolset.ts"

export const DeleteFileInputSchema = z.object({
	fileId: z.number().describe("The ID of the file to delete."),
})

export const GetFileInfoInputSchema = z.object({
	fileId: z.number().describe("The ID of the file to get info for."),
})

export const UpdateFileInputSchema = z.object({
	fileId: z.number().describe("The ID of the file to update."),
	title: z.string().describe("The new title of the file."),
})

export class FilesToolset extends Toolset {
	async deleteFile(signal: AbortSignal, p: unknown): Promise<Result<string, Error>> {
		let pr = DeleteFileInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let dp: DeleteFileOptions = {
			deleteAfter: false,
			immediately: false,
		}

		let dr = await this.s.client.files.deleteFile(signal, pr.data.fileId, dp)
		if (dr.err) {
			return error(new Error("Deleting file.", {cause: dr.err}))
		}

		let [dd] = dr.v

		let rr = await this.s.resolver.resolve(signal, ...dd)
		if (rr.err) {
			return error(new Error("Resolving delete file operations.", {cause: rr.err}))
		}

		return ok("File deleted.")
	}

	async getFileInfo(signal: AbortSignal, p: unknown): Promise<Result<GetFileInfoResponse, Error>> {
		let pr = GetFileInfoInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let gr = await this.s.client.files.getFileInfo(signal, pr.data.fileId)
		if (gr.err) {
			return error(new Error("Getting file info.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	async updateFile(signal: AbortSignal, p: unknown): Promise<Result<UpdateFileResponse, Error>> {
		let pr = UpdateFileInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let uo: UpdateFileOptions = {
			title: pr.data.title,
		}

		let ur = await this.s.client.files.updateFile(signal, pr.data.fileId, uo)
		if (ur.err) {
			return error(new Error("Updating file.", {cause: ur.err}))
		}

		let [ud] = ur.v

		return ok(ud)
	}
}
