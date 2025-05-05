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

import {existsSync} from "node:fs"
import {readFile, writeFile} from "node:fs/promises"
import type {ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {RawConfigSchema} from "../app/config.ts"
import type {Config as ServerConfig} from "../lib/server.ts"
import {Server} from "../lib/server.ts"

async function main(): Promise<void> {
	if (!existsSync("README.md")) {
		throw new Error("README.md not found")
	}

	let input = await readFile("README.md", "utf8")

	let c: ServerConfig = {
		// @ts-ignore
		server: {
			setRequestHandler() {},
		},
	}

	let s = new Server(c)

	let ls = s.listTools().tools.sort((a, b) => {
		return a.name.localeCompare(b.name)
	})

	let config = formatConfig(RawConfigSchema.shape)
	let tools = formatTools(ls)

	let output = input
	output = insert("config", output, config)
	output = insert("tools", output, tools)

	await writeFile("README.md", output, "utf8")
}

function formatConfig(shape: typeof RawConfigSchema.shape): string {
	let c = "| Name | Description |\n|-|-|\n"

	for (let [k, v] of Object.entries(shape)) {
		c += `| \`${k}\` | ${v.description} |\n`
	}

	if (c.length !== 0) {
		c = c.slice(0, -1)
	}

	return c
}

function formatTools(tools: ListToolsResult["tools"]): string {
	let c = "| # | Name | Description |\n|-|-|-|\n"

	for (let [i, t] of tools.entries()) {
		c += `| ${i + 1} | \`${t.name}\` | ${t.description} |\n`
	}

	if (c.length !== 0) {
		c = c.slice(0, -1)
	}

	return c
}

function insert(section: string, content: string, patch: string): string {
	let b: string[] = []

	let inside = false
	let found = false

	for (let l of content.split("\n")) {
		if (l === `<!--generate ${section}-start-->`) {
			inside = true
			found = true
			b.push(l)
			b.push("")
			b.push(patch)
			b.push("")
			continue
		}

		if (l === `<!--generate ${section}-end-->` && inside) {
			inside = false
			b.push(l)
			continue
		}

		if (!inside) {
			b.push(l)
			continue
		}
	}

	if (!found) {
		throw new Error(`Section ${section} not found`)
	}

	return b.join("\n")
}

await main()
