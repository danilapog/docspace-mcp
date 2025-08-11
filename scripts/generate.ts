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
import * as base from "../lib/mcp/base.ts"
import type {SimplifiedToolInfo, Toolset} from "../util/moremcp.ts"

/**
 * {@link https://code.visualstudio.com/docs/reference/variables-reference/#_input-variables | VS Code Reference}
 */
interface VscodeInput {
	type: string
	id: string
	description: string
	password?: boolean
}

/**
 * {@link https://code.visualstudio.com/docs/copilot/chat/mcp-servers/#_configuration-format | VS Code Reference}
 */
interface VscodeConfig {
	env: Record<string, string>
	command: string
	args: string[]
}

interface VscodeQuery {
	name: string
	inputs: string
	config: string
	quality?: string
}

async function main(): Promise<void> {
	if (!existsSync("README.md")) {
		throw new Error("README.md not found")
	}

	let input = await readFile("README.md", "utf8")

	let badges = createBadges()
	let toolsets = formatToolsets(base.data.regular.toolsets)
	let dynamic = formatMetaTools(base.data.meta.tools)
	let tools = formatTools(base.data.regular.toolsets)

	let output = input
	output = insert("badges", output, badges)
	output = insert("toolsets", output, toolsets)
	output = insert("dynamic", output, dynamic)
	output = insert("tools", output, tools)

	await writeFile("README.md", output, "utf8")
}

function createBadges(): string {
	let bru = "https://badgen.net/static/Open%20in%20VS%20Code/npx/blue"
	let biu = "https://badgen.net/static/Open%20in%20VS%20Code%20Insiders/npx/cyan"

	let inputs: VscodeInput[] = [
		{
			type: "promptString",
			id: "docspace_base_url",
			description: "The base URL of the DocSpace instance for API requests.",
		},
		{
			type: "promptString",
			id: "docspace_api_key",
			description: "The API key for accessing the DocSpace API.",
			password: true,
		},
	]

	let config: VscodeConfig = {
		env: {
			DOCSPACE_BASE_URL: "${input:docspace_base_url}",
			DOCSPACE_API_KEY: "${input:docspace_api_key}",
		},
		command: "npx",
		args: ["--yes", "@onlyoffice/docspace-mcp"],
	}

	let query: VscodeQuery = {
		name: "onlyoffice-docspace",
		inputs: JSON.stringify(inputs),
		config: JSON.stringify(config),
	}

	let vbu = "https://insiders.vscode.dev/redirect/mcp/install"

	let vru = new URL(vbu)
	vru.search = new URLSearchParams({...query}).toString()

	query.quality = "insiders"

	let viu = new URL(vbu)
	viu.search = new URLSearchParams({...query}).toString()

	let c = ""

	c += `[![Open in VS Code using npx command](${bru})](${vru})\n`
	c += `[![Open in VS Code Insiders using npx command](${biu})](${viu})`

	return c
}

function formatToolsets(toolsets: Toolset[]): string {
	toolsets = toolsets.sort((a, b) => {
		return a.name.localeCompare(b.name)
	})

	let c = "| # | Toolset Name | Toolset Description |\n|-|-|-|\n"

	for (let [i, t] of toolsets.entries()) {
		c += `| ${i + 1} | \`${t.name}\` | ${t.description} |\n`
	}

	if (c.length !== 0) {
		c = c.slice(0, -1)
	}

	return c
}

function formatTools(toolsets: Toolset[]): string {
	toolsets = toolsets.sort((a, b) => {
		return a.name.localeCompare(b.name)
	})

	let c = ""

	let i = 0

	for (let s of toolsets) {
		let tools = s.tools.sort((a, b) => {
			return a.name.localeCompare(b.name)
		})

		// eslint-disable-next-line github/unescaped-html-literal
		c += `<details>\n  <summary><code>${s.name}</code></summary>\n\n`

		c += "| # | Tool Name | Tool Description |\n|-|-|-|\n"

		for (let [j, t] of tools.entries()) {
			c += `| ${j + 1 + i} | \`${t.name}\` | ${t.description} |\n`
		}

		if (c.length !== 0) {
			c = c.slice(0, -1)
		}

		c += "\n\n</details>\n\n"

		i += tools.length
	}

	if (c.length !== 0) {
		c = c.slice(0, -2)
	}

	return c
}

function formatMetaTools(tools: SimplifiedToolInfo[]): string {
	tools = tools.sort((a, b) => {
		return a.name.localeCompare(b.name)
	})

	let c = "| # | Meta Tool Name | Meta Tool Description |\n|-|-|-|\n"

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
