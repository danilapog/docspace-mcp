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

import * as server from "@modelcontextprotocol/sdk/server/index.js"
import * as types from "@modelcontextprotocol/sdk/types.js"
import pack from "../../package.json" with {type: "json"}
import * as format from "../../util/format.ts"
import type * as moremcp from "../../util/moremcp.ts"
import * as data from "./data.ts"

export interface Config {
	err: Error
}

class Server {
	err: Error
	tools: moremcp.ToolInfo[]

	constructor(config: Config) {
		this.err = config.err
		this.tools = []

		for (let s of data.regular.toolsets) {
			this.tools.push(...s.tools)
		}
	}

	listTools(): types.ListToolsResult {
		return {
			tools: this.tools,
		}
	}

	callTool(): types.CallToolResult {
		return {
			content: [
				{
					type: "text",
					text: format.format(this.err),
				},
			],
			isError: true,
		}
	}
}

export function create(config: Config): server.Server {
	let s = new Server(config)

	let m = new server.Server(
		{
			name: pack.name,
			version: pack.version,
		},
		{
			capabilities: {
				tools: {},
				logging: {},
			},
		},
	)

	m.setRequestHandler(types.ListToolsRequestSchema, s.listTools.bind(s))
	m.setRequestHandler(types.CallToolRequestSchema, s.callTool.bind(s))

	return m
}
