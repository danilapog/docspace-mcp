#!/usr/bin/env node

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

import * as logger from "../lib/util/logger.ts"
import * as config from "./config.ts"
import * as http from "./http.ts"
import type * as shared from "./shared.ts"
import * as stdio from "./stdio.ts"

const SIGNALS = ["SIGTERM", "SIGINT"]

async function main(): Promise<void> {
	try {
		let c = config.load()

		if (c.err || c.v.mcp.transport === "stdio") {
			logger.mute()
		}

		if (c.err) {
			logger.error("Loading config", {err: c.err})
		} else {
			logger.info("Loaded config", config.format(c.v))
		}

		if (c.err) {
			let [p, cleanup] = stdio.misconfigured.start(c.err)
			watch(cleanup)
			await start(p, cleanup)
			return
		}

		if (c.v.mcp.transport === "stdio") {
			let [p, cleanup] = stdio.configured.start(c.v)
			watch(cleanup)
			await start(p, cleanup)
			return
		}

		if (c.v.mcp.transport === "http") {
			let [p, cleanup] = http.start(c.v)
			watch(cleanup)
			await start(p, cleanup)
			return
		}
	} catch (err) {
		logger.error("Executing main", {err})
	}

	process.exit(1)
}

async function start(p: shared.P, cleanup: shared.Cleanup): Promise<void> {
	let err = await p
	if (err) {
		logger.error("Server failed to start", {err})

		err = await cleanup()
		if (err) {
			logger.error("Cleaning up", {err})
		}

		process.exit(1)
	}
}

function watch(cleanup: shared.Cleanup): void {
	for (let s of SIGNALS) {
		process.on(s, () => {
			void (async() => {
				logger.info(`Received ${s}, shutting down`)

				let err = await cleanup()
				if (err) {
					logger.error("Cleaning up", {err})
				}

				if (err) {
					logger.error("Shut down with an error", {err})
					process.exit(1)
				}

				logger.info("Shut down successfully")
				process.exit(0)
			})()
		})
	}
}

await main()
