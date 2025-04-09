import * as z from "zod"
import type {Result} from "../../../ext/result.ts"
import {error, ok} from "../../../ext/result.ts"
import type {CreateRoomOptions} from "../../../lib/client.ts"
import {Toolset} from "../toolset.ts"

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

export class RoomsToolset extends Toolset {
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

	async getRoomsFolder(signal: AbortSignal): Promise<Result<unknown, Error>> {
		let gr = await this.s.client.files.getRoomsFolder(signal)
		if (gr.err) {
			return error(new Error("Getting rooms folder.", {cause: gr.err}))
		}

		let [gd] = gr.v

		return ok(gd)
	}
}
