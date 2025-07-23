import type * as protocol from "@modelcontextprotocol/sdk/shared/protocol.js"
import type * as types from "@modelcontextprotocol/sdk/types.js"
import type * as z from "zod"
import * as zodToJsonSchema from "zod-to-json-schema"

export type Extra = protocol.RequestHandlerExtra<types.ServerRequest, types.ServerNotification>

export interface Toolset {
	name: string
	description: string
	tools: ToolInfo[]
}

export type ToolInfo = types.ListToolsResult["tools"][0]

export interface SimplifiedToolInfo {
	name: string
	description?: string
}

export type CallToolRequest = z.infer<typeof types.CallToolRequestSchema>

export type ToolInputSchema = types.ListToolsResult["tools"][0]["inputSchema"]

// eslint-disable-next-line typescript/no-empty-object-type
export function toInputSchema<T extends z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>(o: T): ToolInputSchema {
	return zodToJsonSchema.zodToJsonSchema(o) as ToolInputSchema
}
