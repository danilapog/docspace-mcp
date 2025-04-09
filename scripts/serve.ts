import {spawn} from "node:child_process"
import {existsSync} from "node:fs"

if (existsSync(".env")) {
	process.loadEnvFile(".env")
}

const args: string[] = ["exec", "mcp-inspector"]

if (process.env.HTTP_PROXY !== undefined) {
	args.push("-e", `HTTP_PROXY=${process.env.HTTP_PROXY}`)
}

if (process.env.DOCSPACE_BASE_URL !== undefined) {
	args.push("-e", `DOCSPACE_BASE_URL=${process.env.DOCSPACE_BASE_URL}`)
}

if (process.env.DOCSPACE_ORIGIN !== undefined) {
	args.push("-e", `DOCSPACE_ORIGIN=${process.env.DOCSPACE_ORIGIN}`)
}

if (process.env.DOCSPACE_USER_AGENT !== undefined) {
	args.push("-e", `DOCSPACE_USER_AGENT=${process.env.DOCSPACE_USER_AGENT}`)
}

if (process.env.DOCSPACE_API_KEY !== undefined) {
	args.push("-e", `DOCSPACE_API_KEY=${process.env.DOCSPACE_API_KEY}`)
}

if (process.env.DOCSPACE_AUTH_TOKEN !== undefined) {
	args.push("-e", `DOCSPACE_AUTH_TOKEN=${process.env.DOCSPACE_AUTH_TOKEN}`)
}

if (process.env.DOCSPACE_USERNAME !== undefined) {
	args.push("-e", `DOCSPACE_USERNAME=${process.env.DOCSPACE_USERNAME}`)
}

if (process.env.DOCSPACE_PASSWORD !== undefined) {
	args.push("-e", `DOCSPACE_PASSWORD=${process.env.DOCSPACE_PASSWORD}`)
}

args.push("--", "node")

if (process.env.HTTP_PROXY !== undefined) {
	args.push("--require", "./ext/proxy.ts")
}

args.push("app/main.ts")

spawn("pnpm", args, {
	env: process.env,
	stdio: "inherit",
	shell: true,
})
