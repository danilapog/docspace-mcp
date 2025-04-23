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

import type {Server} from "@modelcontextprotocol/sdk/server/index.js"
import type {Client} from "../../lib/client.ts"
import type {Resolver} from "../../lib/resolver.ts"
import type {Uploader} from "../../lib/uploader.ts"

export interface Config {
	server: Server
	client: Client
	resolver: Resolver
	uploader: Uploader
	format(this: void, err: Error): string
}

export class Base {
	server: Server
	client: Client
	resolver: Resolver
	uploader: Uploader
	format: (this: void, err: Error) => string

	constructor(config: Config) {
		this.server = config.server
		this.client = config.client
		this.resolver = config.resolver
		this.uploader = config.uploader
		this.format = config.format
	}
}
