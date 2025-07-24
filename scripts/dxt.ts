import child from "node:child_process"
import fs from "node:fs/promises"
import {promisify} from "node:util"
import * as server from "../lib/server.ts"
import pack from "../package.json" with {type: "json"}

interface Tool {
	name: string
	description?: string
}

const exec = promisify(child.exec)

await fs.mkdir("tmp/bin", {recursive: true})
await fs.copyFile("bin/onlyoffice-docspace-mcp", "tmp/bin/onlyoffice-docspace-mcp")

await fs.mkdir("tmp/docs", {recursive: true})
await fs.copyFile("docs/icon.png", "tmp/docs/icon.png")

const i = await fs.readFile("dxt-manifest.json", "utf8")
const m = JSON.parse(i)

m.tools = []
for (let s of server.toolsets) {
	for (let t of s.tools) {
		let o: Tool = {
			name: t.name,
			description: t.description,
		}
		m.tools.push(o)
	}
}

const o = JSON.stringify(m, null, 2)
await fs.writeFile("tmp/manifest.json", o)

await fs.copyFile("LICENSE", "tmp/LICENSE")
await fs.copyFile("README.md", "tmp/README.md")

await exec(`pnpm exec dxt pack tmp onlyoffice-docspace-mcp-${pack.version}.dxt`, {env: process.env})

await fs.rm("tmp", {recursive: true, force: true})
