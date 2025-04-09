import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {CreateFolderOptions, DeleteFolderOptions, RenameFolderOptions} from "../../../lib/client.ts"
import {Toolset} from "../toolset.ts"

export const CreateFolderInputSchema = z.object({
	parentId: z.number().describe("The ID of the parent folder."),
	title: z.string().describe("The title of the folder."),
})

export const DeleteFolderInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to delete."),
})

export const GetFolderInfoInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to get info for."),
})

export const GetFoldersInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to get subfolders for."),
})

export const RenameFolderInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to rename."),
	title: z.string().describe("The new title of the folder."),
})

export class FoldersToolset extends Toolset {
	async createFolder(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = CreateFolderInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let co: CreateFolderOptions = {
			title: pr.data.title,
		}

		let cr = await this.s.client.files.createFolder(signal, pr.data.parentId, co)
		if (cr.err) {
			return error(new Error("Creating folder.", {cause: cr.err}))
		}

		let [cd] = cr.v

		return ok(cd)
	}

	async deleteFolder(signal: AbortSignal, p: unknown): Promise<Result<string, Error>> {
		let pr = DeleteFolderInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let dp: DeleteFolderOptions = {
			deleteAfter: false,
			immediately: false,
		}

		let dr = await this.s.client.files.deleteFolder(signal, pr.data.folderId, dp)
		if (dr.err) {
			return error(new Error("Deleting folder.", {cause: dr.err}))
		}

		let [dd] = dr.v

		let rr = await this.s.resolver.resolve(signal, ...dd)
		if (rr.err) {
			return error(new Error("Resolving delete folder operations.", {cause: rr.err}))
		}

		return ok("Folder deleted.")
	}

	async getFolderInfo(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = GetFolderInfoInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let gr = await this.s.client.files.getFolder(signal, pr.data.folderId)
		if (gr.err) {
			return error(new Error("Getting folder info.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	async getFolders(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = GetFoldersInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let gr = await this.s.client.files.getFolders(signal, pr.data.folderId)
		if (gr.err) {
			return error(new Error("Getting folders.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	async renameFolder(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = RenameFolderInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let ro: RenameFolderOptions = {
			title: pr.data.title,
		}

		let rr = await this.s.client.files.renameFolder(signal, pr.data.folderId, ro)
		if (rr.err) {
			return error(new Error("Renaming folder.", {cause: rr.err}))
		}

		let [rd] = rr.v

		return ok(rd)
	}

	async getMyFolder(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getMyFolder(signal)
		if (gr.err) {
			return error(new Error("Getting my folder.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}
}
