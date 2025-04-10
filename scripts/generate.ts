import {existsSync} from "node:fs"
import {RawConfigSchema} from "../app/config.ts"
import type {Config as ServerConfig} from "../app/server.ts"
import {Server} from "../app/server.ts"
import type {ListToolsResult} from "@modelcontextprotocol/sdk/types.js"
import {readFile, writeFile} from "node:fs/promises"

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
