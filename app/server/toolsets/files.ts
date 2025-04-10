import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {
	CopyBatchItemsOptions,
	CreateFolderOptions,
	CreateRoomOptions,
	DeleteFileOptions,
	DeleteFolderOptions,
	FilesService, // eslint-disable-line typescript/no-unused-vars
	GetFileInfoResponse,
	MoveBatchItemsOptions,
	RenameFolderOptions,
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

export const CreateFolderInputSchema = z.object({
	parentId: z.number().describe("The ID of the parent folder."),
	title: z.string().describe("The title of the folder."),
})

export const DeleteFolderInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to delete."),
})

export const GetFolderInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to get info for."),
})

export const GetFoldersInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to get subfolders for."),
})

export const RenameFolderInputSchema = z.object({
	folderId: z.number().describe("The ID of the folder to rename."),
	title: z.string().describe("The new title of the folder."),
})

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

export const CreateRoomInputSchema = z.object({
	title: z.string().describe("The title of the room."),
	// roomType: z.string().optional().default("PublicRoom").describe("The type of the room."),
})

export const GetRoomInfoInputSchema = z.object({
	roomId: z.number().describe("The ID of the room to get info for."),
})

export const UpdateRoomInputSchema = z.object({
	roomId: z.number().describe("The ID of the room to update."),
})

export const ArchiveRoomInputSchema = z.object({
	roomId: z.number().describe("The ID of the room to archive."),
})

export class FilesToolset extends Toolset {
	/**
	 * {@link FilesService.deleteFile}
	 */
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

	/**
	 * {@link FilesService.getFileInfo}
	 */
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

	/**
	 * {@link FilesService.updateFile}
	 */
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

	/**
	 * {@link FilesService.createFolder}
	 */
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

	/**
	 * {@link FilesService.deleteFolder}
	 */
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

	/**
	 * {@link FilesService.getFolder}
	 */
	async getFolder(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = GetFolderInputSchema.safeParse(p)
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

	/**
	 * {@link FilesService.getFolders}
	 */
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

	/**
	 * {@link FilesService.renameFolder}
	 */
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

	/**
	 * {@link FilesService.getMyFolder}
	 */
	async getMyFolder(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getMyFolder(signal)
		if (gr.err) {
			return error(new Error("Getting my folder.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	/**
	 * {@link FilesService.copyBatchItems}
	 */
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

	/**
	 * {@link FilesService.getOperationStatuses}
	 */
	async getOperationStatuses(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getOperationStatuses(signal)
		if (gr.err) {
			return error(new Error("Getting operation statuses.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	/**
	 * {@link FilesService.moveBatchItems}
	 */
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

	/**
	 * {@link FilesService.createRoom}
	 */
	async createRoom(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = CreateRoomInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let co: CreateRoomOptions = {
			title: pr.data.title,
			roomType: "PublicRoom",
		}

		let cr = await this.s.client.files.createRoom(signal, co)
		if (cr.err) {
			return error(new Error("Creating room.", {cause: cr.err}))
		}

		let [cd] = cr.v

		return ok(cd)
	}

	/**
	 * {@link FilesService.getRoomInfo}
	 */
	async getRoomInfo(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = GetRoomInfoInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let gr = await this.s.client.files.getRoomInfo(signal, pr.data.roomId)
		if (gr.err) {
			return error(new Error("Getting room info.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}

	/**
	 * {@link FilesService.updateRoom}
	 */
	async updateRoom(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = UpdateRoomInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let ur = await this.s.client.files.updateRoom(signal, pr.data.roomId, {})
		if (ur.err) {
			return error(new Error("Updating room.", {cause: ur.err}))
		}

		let [ud] = ur.v

		return ok(ud)
	}

	/**
	 * {@link FilesService.archiveRoom}
	 */
	async archiveRoom(signal: AbortSignal, p: unknown): Promise<Result<unknown, Error>> {
		let pr = ArchiveRoomInputSchema.safeParse(p)
		if (!pr.success) {
			return error(new Error("Parsing input.", {cause: pr.error}))
		}

		let ar = await this.s.client.files.archiveRoom(signal, pr.data.roomId, {})
		if (ar.err) {
			return error(new Error("Archiving room.", {cause: ar.err}))
		}

		let [ad] = ar.v

		let rr = await this.s.resolver.resolve(signal, ad)
		if (rr.err) {
			return error(new Error("Resolving archive room operations.", {cause: rr.err}))
		}

		return ok("Room archived.")
	}

	/**
	 * {@link FilesService.getRoomsFolder}
	 */
	async getRoomsFolder(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getRoomsFolder(signal)
		if (gr.err) {
			return error(new Error("Getting rooms folder.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}
}
