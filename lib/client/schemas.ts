import * as z from "zod"

/**
 * {@link https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/reference-types/#the-object-type | .NET Reference}
 */
export const TypeObjectSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.array(z.unknown()),
	z.object({}).passthrough(),
])

/**
 * {@link https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonelement/?view=net-9.0 | .NET Reference}
 */
export const JsonElementSchema = z.union([z.string(), z.number()])

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Middleware/CommonApiResponse.cs/#L31 | DocSpace Reference}
 */
export const CommonApiResponseSchema = z.object({
	status: z.number(),
	statusCode: z.number(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Middleware/CommonApiResponse.cs/#L128 | DocSpace Reference}
 */
export const CommonApiErrorSchema = z.object({
	message: z.string(),
	type: z.string(),
	stack: z.string(),
	hresult: z.number(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Middleware/CommonApiResponse.cs/#L46 | DocSpace Reference}
 */
export const ErrorApiResponseSchema = CommonApiResponseSchema.extend({
	error: CommonApiErrorSchema,
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Middleware/CommonApiResponse.cs/#L153 | DocSpace Reference}
 */
export const LinkSchema = z.object({
	href: z.string(),
	action: z.string(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Middleware/CommonApiResponse.cs/#L57 | DocSpace Reference}
 */
export const SuccessApiResponseSchema = CommonApiResponseSchema.extend({
	response: TypeObjectSchema,
	count: z.number().optional(),
	total: z.number().optional(),
	links: z.array(LinkSchema),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/common/ASC.Api.Core/Model/EmailInvitationDto.cs/#L36 | DocSpace Reference}
 */
export const EmailInvitationDtoSchema = z.object({
	email: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/ArchiveRoomRequestDto.cs/#L32 | DocSpace Reference}
 */
export const ArchiveRoomRequestSchema = z.object({
	deleteAfter: z.boolean().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/BatchModelRequestDto.cs/#L43 | DocSpace Reference}
 */
export const BaseBatchRequestDtoSchema = z.object({
	folderIds: z.array(JsonElementSchema).optional(),
	fileIds: z.array(JsonElementSchema).optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/BatchModelRequestDto.cs/#L67 | DocSpace Reference}
 */
export const DownloadRequestItemDtoSchema = z.object({
	key: JsonElementSchema.optional(),
	value: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/BatchModelRequestDto.cs/#L59 | DocSpace Reference}
 */
export const DownloadRequestDtoSchema = BaseBatchRequestDtoSchema.extend({
	fileConvertIds: z.array(DownloadRequestItemDtoSchema).optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/BatchModelRequestDto.cs/#L93 | DocSpace Reference}
 */
export const DeleteSchema = z.object({
	deleteAfter: z.boolean().optional(),
	immediately: z.boolean().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/BatchModelRequestDto.cs/#L127 | DocSpace Reference}
 */
export const BatchRequestDtoSchema = BaseBatchRequestDtoSchema.extend({
	destFolderId: JsonElementSchema.optional(),
	deleteAfter: z.boolean().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/CreateFolderRequestDto.cs/#L32 | DocSpace Reference}
 */
export const CreateFolderSchema = z.object({
	title: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/CreateRoomRequestDto.cs/#L30 | DocSpace Reference}
 */
export const RoomTypeSchema = z.
	union([
		z.literal(1),
		z.literal(2),
		z.literal(5),
		z.literal(6),
		z.literal(8),
		z.literal("FillingFormsRoom"),
		z.literal("EditingRoom"),
		z.literal("CustomRoom"),
		z.literal("PublicRoom"),
		z.literal("VirtualDataRoom"),
	]).
	transform((v) => {
		// DocSpace has a bug that does not allow the use string literals.
		switch (v) {
		case "FillingFormsRoom":
			return 1
		case "EditingRoom":
			return 2
		case "CustomRoom":
			return 5
		case "PublicRoom":
			return 6
		case "VirtualDataRoom":
			return 8
		default:
			return v
		}
	})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/UpdateRoomRequestDto.cs/#L32 | DocSpace Reference}
 */
export const UpdateRoomRequestSchema = z.object({
	title: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/CreateRoomRequestDto.cs/#L72 | DocSpace Reference}
 */
export const CreateRoomRequestDtoSchema = UpdateRoomRequestSchema.extend({
	roomType: RoomTypeSchema.optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/DeleteFolderDto.cs/#L32 | DocSpace Reference}
 */
export const DeleteFolderSchema = z.object({
	deleteAfter: z.boolean().optional(),
	immediately: z.boolean().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/RoomInvitation.cs/#L29 | DocSpace Reference}
 */
export const RoomInvitationSchema = EmailInvitationDtoSchema.extend({
	id: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/RoomInvitationRequestDto.cs/#L32 | DocSpace Reference}
 */
export const RoomInvitationRequestSchema = z.object({
	invitations: z.array(RoomInvitationSchema).optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/SessionRequestDto.cs/#L32 | DocSpace Reference}
 */
export const SessionRequestSchema = z.object({
	fileName: z.string().optional(),
	fileSize: z.number().optional(),
	createOn: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/RequestDto/UpdateFileRequestDto.cs/#L32 | DocSpace Reference}
 */
export const UpdateFileSchema = z.object({
	title: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Core/Files/FileType.cs/#L32 | DocSpace Reference}
 */
export const FileTypeSchema = z.union([
	z.literal(0),
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
	z.literal(5),
	z.literal(6),
	z.literal(7),
	z.literal(10),
	z.literal("Unknown"),
	z.literal("Archive"),
	z.literal("Video"),
	z.literal("Audio"),
	z.literal("Image"),
	z.literal("Spreadsheet"),
	z.literal("Presentation"),
	z.literal("Document"),
	z.literal("Pdf"),
])

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/ResponseDto/FileDto.cs/#L29 | DocSpace Reference}
 */
export const FileDtoSchema = z.
	object({
		fileType: FileTypeSchema.optional(),
	}).
	passthrough()

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/ApiModels/ResponseDto/FileOperationDto.cs/#L29 | DocSpace Reference}
 */
export const FileOperationDtoSchema = z.
	object({
		id: z.string().optional(),
		progress: z.number().optional(),
		error: z.string().optional(),
		finished: z.boolean().optional(),
		url: z.string().optional(),
	}).
	passthrough()

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Core/HttpHandlers/ChunkedUploaderHandler.cs/#L233 | DocSpace Reference}
 */
export const UploadChunkResponseSchema = z.object({
	success: z.boolean(),
	data: TypeObjectSchema,
	message: z.string(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Helpers/UploadControllerHelper.cs/#L97 | DocSpace Reference}
 */
export const UploadSessionObjectDataSchema = z.
	object({
		id: z.string().optional(),
	}).
	passthrough()

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/products/ASC.Files/Server/Helpers/UploadControllerHelper.cs/#L97 | DocSpace Reference}
 */
export const UploadSessionObjectSchema = z.object({
	success: z.boolean(),
	data: TypeObjectSchema,
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Api/ApiModels/RequestsDto/AuthRequestsDto.cs/#L32 | DocSpace Reference}
 */
export const AuthRequestsDtoSchema = z.object({
	userName: z.string().optional(),
	password: z.string().optional(),
})

/**
 * {@link https://github.com/ONLYOFFICE/DocSpace-server/blob/v3.0.4-server/web/ASC.Web.Api/ApiModels/ResponseDto/AuthenticationTokenDto.cs/#L29 | DocSpace Reference}
 */
export const AuthenticationTokenDtoSchema = z.
	object({
		token: z.string().optional(),
		expires: z.string().optional(),
	}).
	passthrough()
