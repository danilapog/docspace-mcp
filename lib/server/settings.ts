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

import type {Result} from "../../util/result.ts"
import {error, ok} from "../../util/result.ts"
// eslint-disable-next-line import-newlines/enforce
import type {
	Response,
	SettingsService, // eslint-disable-line typescript/no-unused-vars
} from "../client.ts"
import type {ConfiguredServer} from "../server.ts"

export class SettingsToolset {
	private s: ConfiguredServer

	constructor(s: ConfiguredServer) {
		this.s = s
	}

	/**
	 * {@link SettingsService.getSupportedCultures}
	 */
	async getSupportedCultures(signal: AbortSignal): Promise<Result<Response, Error>> {
		let gr = await this.s.client.settings.getSupportedCultures(signal)
		if (gr.err) {
			return error(new Error("Getting supported cultures.", {cause: gr.err}))
		}

		let [, res] = gr.v

		return ok(res)
	}

	/**
	 * {@link SettingsService.getTimeZones}
	 */
	async getTimeZones(signal: AbortSignal): Promise<Result<Response, Error>> {
		let gr = await this.s.client.settings.getTimeZones(signal)
		if (gr.err) {
			return error(new Error("Getting time zones.", {cause: gr.err}))
		}

		let [, res] = gr.v

		return ok(res)
	}
}
