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
