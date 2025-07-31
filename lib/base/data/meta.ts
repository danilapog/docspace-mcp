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

import * as z from "zod"
import * as moremcp from "../../../util/moremcp.ts"
import * as meta from "../tools/meta.ts"

export const tools: moremcp.ToolInfo[] = [
	{
		name: "list_toolsets",
		description: "This is a meta-tool for listing available toolsets. Toolset is a set of available tools.",
		inputSchema: moremcp.toInputSchema(z.object({})),
	},
	{
		name: "list_tools",
		description: "This is a meta-tool for listing available tools of a specific toolset. The list of available toolsets can be obtained using the list_toolsets meta-tool.",
		inputSchema: moremcp.toInputSchema(meta.ListToolsInputSchema),
	},
	{
		name: "get_tool_input_schema",
		description: "This is a meta-tool for getting an input schema for a specific tool. The list of available tools can be obtained using the list_tools meta-tool.",
		inputSchema: moremcp.toInputSchema(meta.GetToolInputSchemaInputSchema),
	},
	{
		name: "get_tool_output_schema",
		description: "This is a meta-tool for getting an output schema for a specific tool. The list of available tools can be obtained using the list_tools meta-tool.",
		inputSchema: moremcp.toInputSchema(meta.GetToolOutputSchemaInputSchema),
	},
	{
		name: "call_tool",
		description: "This is a meta-tool for calling a tool. The list of available tools can be obtained using the list_tools meta-tool. The input schema can be obtained using the get_tool_input_schema meta-tool.",
		inputSchema: moremcp.toInputSchema(meta.CallToolInputSchema),
	},
]
