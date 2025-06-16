import type {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js"
import type {
	CallToolRequestSchema,
	ListToolsResult,
	ServerNotification,
	ServerRequest,
} from "@modelcontextprotocol/sdk/types.js"
import type * as z from "zod"
import {zodToJsonSchema} from "zod-to-json-schema"

export type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>

export type ToolInfo = ListToolsResult["tools"][0]

export interface SimplifiedToolInfo {
	name: string
	description?: string
}

export type CallToolRequest = z.infer<typeof CallToolRequestSchema>

export type ToolInputSchema = ListToolsResult["tools"][0]["inputSchema"]

// eslint-disable-next-line typescript/no-empty-object-type
export function toInputSchema<T extends z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>(o: T): ToolInputSchema {
	return zodToJsonSchema(o) as ToolInputSchema
}
