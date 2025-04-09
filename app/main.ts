import {Server as ProtocolServer} from "@modelcontextprotocol/sdk/server/index.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {Client} from "../lib/client.ts"
import {Resolver} from "../lib/resolver.ts"
import {Uploader} from "../lib/uploader.ts"
import pack from "../package.json" with {type: "json"}
import type {Config as AppConfig} from "./config.ts"
import {ConfigSchema} from "./config.ts"
import type {Config as ServerConfig} from "./server/base.ts"
import {format} from "./format.ts"
import {Server} from "./server.ts"

async function main(): Promise<void> {
	let ac = ConfigSchema.safeParse(process.env)
	if (!ac.success) {
		throw new Error("Parsing config.", {cause: ac.error})
	}

	let ps = new ProtocolServer(
		{
			name: pack.name,
			version: pack.version,
		},
		{
			capabilities: {
				tools: {},
				logging: {},
			},
		},
	)

	let lc = createClient(ac.data)

	let lr = new Resolver(lc.files.getOperationStatuses.bind(lc.files))
	let lu = new Uploader(lc)

	let sc: ServerConfig = {
		server: ps,
		client: lc,
		resolver: lr,
		uploader: lu,
		format,
	}

	let _ = new Server(sc)

	let pt = new StdioServerTransport()

	await ps.connect(pt)
}

function createClient(config: AppConfig): Client {
	let f = fetch

	if (config.origin) {
		f = withOrigin(f, config.origin)
	}

	let c = new Client(f)

	c.baseUrl = config.baseUrl
	c.userAgent = config.userAgent

	if (config.apiKey) {
		c = c.withApiKey(config.apiKey)
	}

	if (config.authToken) {
		c = c.withAuthToken(config.authToken)
	}

	if (config.username && config.password) {
		c = c.withBasicAuth(config.username, config.password)
	}

	return c
}

function withOrigin(f: typeof fetch, o: string): typeof fetch {
	return async function fetch(input, init) {
		if (!(input instanceof Request)) {
			throw new Error("Unsupported input type.")
		}

		input = input.clone()
		input.headers.set("Origin", o)

		return await f(input, init)
	}
}

await main()
