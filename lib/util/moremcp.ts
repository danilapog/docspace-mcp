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

export type ToolOutputSchema = types.ListToolsResult["tools"][0]["outputSchema"]

export function toInputSchema<T extends z.ZodObject<z.ZodRawShape>>(o: T): ToolInputSchema {
	return zodToJsonSchema.zodToJsonSchema(o) as ToolInputSchema
}

export function toOutputSchema<T extends z.ZodObject<z.ZodRawShape>>(o: T): ToolOutputSchema {
	return zodToJsonSchema.zodToJsonSchema(o) as ToolOutputSchema
}
