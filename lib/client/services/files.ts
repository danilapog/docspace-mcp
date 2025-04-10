import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok, safeNew} from "../../../ext/result.ts"
import type {Response} from "../response.ts"
import type {Filters} from "../schemas.ts"
import {
	ArchiveRoomRequestSchema,
	BatchRequestDtoSchema,
	CreateFolderSchema,
	CreateRoomRequestDtoSchema,
	DeleteFolderSchema,
	DeleteSchema,
	DownloadRequestDtoSchema,
	FileDtoSchema,
	FileOperationDtoSchema,
	FiltersSchema,
	RoomInvitationRequestSchema,
	SessionRequestSchema,
	UpdateFileSchema,
	UpdateRoomRequestSchema,
	UploadSessionObjectDataSchema,
} from "../schemas.ts"
import {Service} from "../service.ts"

// FilesController: Options
export type DeleteFileOptions = z.input<typeof DeleteSchema>
export type UpdateFileOptions = z.input<typeof UpdateFileSchema>

// FilesController: Responses
export type DeleteFileResponseItem = z.output<typeof FileOperationDtoSchema>
export type GetFileInfoResponse = z.output<typeof FileDtoSchema>
export type UpdateFileResponse = z.output<typeof FileDtoSchema>

// FoldersController: Options
export type CreateFolderOptions = z.input<typeof CreateFolderSchema>
export type DeleteFolderOptions = z.input<typeof DeleteFolderSchema>
export type RenameFolderOptions = z.input<typeof CreateFolderSchema>

// FoldersController: Responses
export type DeleteFolderResponseItem = z.output<typeof FileOperationDtoSchema>

// OperationController: Options
export type BulkDownloadOptions = z.output<typeof DownloadRequestDtoSchema>
export type CopyBatchItemsOptions = z.input<typeof BatchRequestDtoSchema>
export type MoveBatchItemsOptions = z.input<typeof BatchRequestDtoSchema>

// OperationController: Responses
export type BulkDownloadResponseItem = z.output<typeof FileOperationDtoSchema>
export type CopyBatchItemsResponseItem = z.output<typeof FileOperationDtoSchema>
export type GetOperationStatusesResponseItem = z.output<typeof FileOperationDtoSchema>
export type MoveBatchItemsResponseItem = z.output<typeof FileOperationDtoSchema>

// UploadController: Options
export type CreateUploadSessionOptions = z.output<typeof SessionRequestSchema>

// UploadController: Responses
export type CreateUploadSessionResponse = z.output<typeof UploadSessionObjectDataSchema>

// VirtualRoomsController: Options
export type CreateRoomOptions = z.input<typeof CreateRoomRequestDtoSchema>
export type UpdateRoomOptions = z.input<typeof UpdateRoomRequestSchema>
export type ArchiveRoomOptions = z.input<typeof ArchiveRoomRequestSchema>
export type SetRoomSecurityOptions = z.input<typeof RoomInvitationRequestSchema>

// VirtualRoomsController: Responses
export type ArchiveRoomResponse = z.output<typeof FileOperationDtoSchema>

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/tree/v3.0.4-server/products/ASC.Files/ | DocSpace Reference}
 */
export class FilesService extends Service {
	//
	// FilesController
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FilesController.cs/#L239 | DocSpace Reference}
	 */
	async deleteFile(s: AbortSignal, id: number, o: DeleteFileOptions): Promise<Result<[DeleteFileResponseItem[], Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/file/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = DeleteSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "DELETE", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FilesController.cs/#L305 | DocSpace Reference}
	 */
	async getFileInfo(s: AbortSignal, id: number): Promise<Result<[GetFileInfoResponse, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/file/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = FileDtoSchema.safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FilesController.cs/#L399 | DocSpace Reference}
	 */
	async updateFile(s: AbortSignal, id: number, o: UpdateFileOptions): Promise<Result<[UpdateFileResponse, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/file/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = UpdateFileSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = FileDtoSchema.safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	//
	// FoldersController
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L110 | DocSpace Reference}
	 */
	async createFolder(s: AbortSignal, id: number, o: CreateFolderOptions): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/folder/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = CreateFolderSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "POST", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L126 | DocSpace Reference}
	 */
	async deleteFolder(s: AbortSignal, id: number, o: DeleteFolderOptions): Promise<Result<[DeleteFolderResponseItem[], Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/folder/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = DeleteFolderSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "DELETE", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L161 | DocSpace Reference}
	 */
	async getFolder(s: AbortSignal, id: number, filters?: Filters): Promise<Result<[unknown, Response], Error>> {
		let q: object | undefined

		if (filters) {
			let f = FiltersSchema.safeParse(filters)
			if (!f.success) {
				return error(new Error("Parsing filters.", {cause: f.error}))
			}

			q = f.data
		}

		let u = this.c.createUrl(`api/2.0/files/${id}`, q)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L180 | DocSpace Reference}
	 */
	async getFolderInfo(s: AbortSignal, id: number): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/folder/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L217 | DocSpace Reference}
	 */
	async getFolders(s: AbortSignal, id: number): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/${id}/subfolders`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L255 | DocSpace Reference}
	 */
	async renameFolder(s: AbortSignal, id: number, o: RenameFolderOptions): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/folder/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = CreateFolderSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/FoldersController.cs/#L348 | DocSpace Reference}
	 */
	async getMyFolder(s: AbortSignal): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/@my")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	//
	// OperationController
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/OperationController.cs/#L51 | DocSpace Reference}
	 */
	async bulkDownload(s: AbortSignal, o: BulkDownloadOptions): Promise<Result<[BulkDownloadResponseItem[], Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/fileops/bulkdownload")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = DownloadRequestDtoSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/OperationController.cs/#L74 | DocSpace Reference}
	 */
	async copyBatchItems(s: AbortSignal, o: CopyBatchItemsOptions): Promise<Result<[CopyBatchItemsResponseItem[], Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/fileops/copy")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = BatchRequestDtoSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/OperationController.cs/#L136 | DocSpace Reference}
	 */
	async getOperationStatuses(s: AbortSignal): Promise<Result<[GetOperationStatusesResponseItem[], Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/fileops")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/OperationController.cs/#L173 | DocSpace Reference}
	 */
	async moveBatchItems(s: AbortSignal, o: MoveBatchItemsOptions): Promise<Result<[MoveBatchItemsResponseItem[], Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/fileops/move")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = BatchRequestDtoSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = z.array(FileOperationDtoSchema).safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	//
	// UploadController
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/UploadController.cs/#L76 | DocSpace Reference}
	 */
	async createUploadSession(s: AbortSignal, id: number, o: CreateUploadSessionOptions): Promise<Result<[CreateUploadSessionResponse, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/${id}/upload/create_session`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = SessionRequestSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "POST", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = UploadSessionObjectDataSchema.safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	//
	// VirtualRoomsController
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L70 | DocSpace Reference}
	 */
	async createRoom(s: AbortSignal, o: CreateRoomOptions): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/rooms")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = CreateRoomRequestDtoSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "POST", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L165 | DocSpace Reference}
	 */
	async getRoomInfo(s: AbortSignal, id: number): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/rooms/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L180 | DocSpace Reference}
	 */
	async updateRoom(s: AbortSignal, id: number, o: UpdateRoomOptions): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/rooms/${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = UpdateRoomRequestSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L275 | DocSpace Reference}
	 */
	async archiveRoom(s: AbortSignal, id: number, o: ArchiveRoomOptions): Promise<Result<[ArchiveRoomResponse, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/rooms/${id}/archive`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = ArchiveRoomRequestSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		let [p, res] = f.v

		let e = FileOperationDtoSchema.safeParse(p)
		if (!e.success) {
			return error(new Error("Parsing response.", {cause: e.error}))
		}

		return ok([e.data, res])
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L311 | DocSpace Reference}
	 */
	async setRoomSecurity(s: AbortSignal, id: number, o: SetRoomSecurityOptions): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/rooms/${id}/share`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let b = RoomInvitationRequestSchema.safeParse(o)
		if (!b.success) {
			return error(new Error("Parsing options.", {cause: b.error}))
		}

		let req = this.c.createRequest(s, "PUT", u.v, b.data)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L349 | DocSpace Reference}
	 */
	async getRoomSecurityInfo(s: AbortSignal, id: number): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`api/2.0/files/rooms/${id}/share`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Api/VirtualRoomsController.cs/#L649 | DocSpace Reference}
	 */
	async getRoomsFolder(s: AbortSignal): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl("api/2.0/files/rooms")
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let req = this.c.createRequest(s, "GET", u.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}

	//
	// Others
	//

	/**
	 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Startup.cs/#L76 | DocSpace Reference}
	 */
	async uploadChunk(s: AbortSignal, id: string, chunk: Blob): Promise<Result<[unknown, Response], Error>> {
		let u = this.c.createUrl(`ChunkedUploader.ashx?uid=${id}`)
		if (u.err) {
			return error(new Error("Creating URL.", {cause: u.err}))
		}

		let d = safeNew(FormData)
		if (d.err) {
			return error(new Error("Creating FormData.", {cause: d.err}))
		}

		d.v.append("file", chunk)

		let req = this.c.createFormRequest(s, u.v, d.v)
		if (req.err) {
			return error(new Error("Creating request.", {cause: req.err}))
		}

		let f = await this.c.fetch(req.v)
		if (f.err) {
			return error(new Error("Fetching request.", {cause: f.err}))
		}

		return ok(f.v)
	}
}
