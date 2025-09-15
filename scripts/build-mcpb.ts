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

import child from "node:child_process"
import fs from "node:fs/promises"
import util from "node:util"
import * as mcp from "../lib/mcp.ts"
import * as meta from "../lib/meta.ts"
import * as tools from "./tools.ts"

const exec = util.promisify(child.exec)

interface Tool {
	name: string
	description?: string
}

async function main(): Promise<void> {
	await fs.mkdir("tmp/bin", {recursive: true})
	await fs.copyFile("bin/onlyoffice-docspace-mcp.js", "tmp/bin/onlyoffice-docspace-mcp.js")

	await fs.mkdir("tmp/docs", {recursive: true})
	await fs.copyFile("docs/icon.png", "tmp/docs/icon.png")

	let i = await fs.readFile("manifest.json", "utf8")
	let m = JSON.parse(i)

	m.tools = []

	let toolsets = tools.sortToolsets(mcp.toolsetInfos)

	for (let s of toolsets) {
		for (let t of s.tools) {
			let o: Tool = {
				name: t.name,
				description: t.description,
			}
			m.tools.push(o)
		}
	}

	let o = JSON.stringify(m, null, 2)
	await fs.writeFile("tmp/manifest.json", o)

	await fs.copyFile("LICENSE", "tmp/LICENSE")
	await fs.copyFile("README.md", "tmp/README.md")

	await exec(`pnpm exec mcpb pack tmp onlyoffice-docspace-mcp-${meta.version}.mcpb`, {env: process.env})

	await fs.rm("tmp", {recursive: true, force: true})
}

await main()
