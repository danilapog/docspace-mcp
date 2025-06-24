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

if (process.env.DOCSPACE_DYNAMIC !== undefined) {
	args.push("-e", `DOCSPACE_DYNAMIC=${process.env.DOCSPACE_DYNAMIC}`)
}

if (process.env.DOCSPACE_TOOLSETS !== undefined) {
	args.push("-e", `DOCSPACE_TOOLSETS=${process.env.DOCSPACE_TOOLSETS}`)
}

args.push("--", "node")

if (process.env.HTTP_PROXY !== undefined) {
	args.push("--require", "./util/proxy.ts")
}

args.push("app/main.ts")

spawn("pnpm", args, {
	env: process.env,
	stdio: "inherit",
	shell: true,
})
