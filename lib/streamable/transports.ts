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

import * as streamableHttp from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import * as logger from "../../util/logger.ts"
import * as result from "../../util/result.ts"
import type * as sessions from "./sessions.ts"

export interface Config {
	sessions: Sessions
}

export interface Sessions {
	create(o: sessions.CreateOptions): result.Result<sessions.Session, Error>
	get(id: string): result.Result<sessions.Session, Error>
	delete(id: string): Error | undefined
}

export class Transports {
	private sessions: Sessions

	constructor(config: Config) {
		this.sessions = config.sessions
	}

	create(): streamableHttp.StreamableHTTPServerTransport {
		let t = new streamableHttp.StreamableHTTPServerTransport({
			sessionIdGenerator: () => {
				return crypto.randomUUID()
			},
			onsessioninitialized: (sessionId) => {
				let o: sessions.CreateOptions = {
					id: sessionId,
					transport: t,
				}

				let s = this.sessions.create(o)
				if (s.err) {
					logger.error("Creating session", {sessionId, err: s.err})
					return
				}

				logger.info("Session created", {sessionId: s.v.id})
			},
		})

		t.onclose = () => {
			if (!t.sessionId) {
				logger.warn("Transport closed without a session ID")
				return
			}

			let err = this.sessions.delete(t.sessionId)
			if (err) {
				logger.error("Deleting session", {sessionId: t.sessionId, err})
				return
			}

			logger.info("Session deleted", {sessionId: t.sessionId})
		}

		return t
	}

	retrieve(id: string): result.Result<streamableHttp.StreamableHTTPServerTransport, Error> {
		let s = this.sessions.get(id)
		if (s.err) {
			return result.error(new Error("Getting session", {cause: s.err}))
		}
		return result.ok(s.v.transport)
	}
}
