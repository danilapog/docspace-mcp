import type * as server from "@modelcontextprotocol/sdk/server/index.js"
import type * as streamableHttp from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import * as result from "../util/result.ts"

export interface Session {
	id: string
	server: server.Server
	transport: streamableHttp.StreamableHTTPServerTransport
	createdAt: Date
	expiresAt: Date
}

export interface CreateOptions {
	id: string
	server: server.Server
	transport: streamableHttp.StreamableHTTPServerTransport
	ttl: number
}

export class Sessions {
	private m = new Map<string, Session>()

	create(o: CreateOptions): result.Result<Session, Error> {
		let createdAt = new Date()
		if (Number.isNaN(createdAt.getTime())) {
			return result.error(new Error("Creation date is invalid"))
		}

		let expiresAt = new Date(createdAt.getTime() + o.ttl)
		if (Number.isNaN(expiresAt.getTime())) {
			return result.error(new Error("Expiration date is invalid"))
		}

		let s: Session = {
			id: o.id,
			server: o.server,
			transport: o.transport,
			createdAt,
			expiresAt,
		}

		this.m.set(s.id, s)

		s = {...s}

		return result.ok(s)
	}

	get(id: string): result.Result<Session, Error> {
		let s = this.m.get(id)
		if (!s) {
			return result.error(new Error(`Session ${id} not found`))
		}

		let a = new Date()
		if (Number.isNaN(a.getTime())) {
			return result.error(new Error("Current date is invalid"))
		}

		let b = s.expiresAt
		if (Number.isNaN(b.getTime())) {
			return result.error(new Error("Expiration date is invalid"))
		}

		if (a.getTime() >= b.getTime()) {
			return result.error(new Error(`Session ${s.id} has expired`))
		}

		s = {...s}

		return result.ok(s)
	}

	delete(id: string): Error | undefined {
		if (!this.m.delete(id)) {
			return new Error(`Session ${id} could not be deleted`)
		}
	}

	async close(id: string): Promise<Error | undefined> {
		let s = this.m.get(id)
		if (!s) {
			return new Error(`Session ${id} not found`)
		}

		let r = await result.safeAsync(s.server.close.bind(s.server))
		if (r.err) {
			return new Error(`Closing server for session ${s.id}`, {cause: r.err})
		}
	}

	async expire(id: string): Promise<Error | undefined> {
		let s = this.m.get(id)
		if (!s) {
			return new Error(`Session ${id} not found`)
		}

		let a = new Date()
		if (Number.isNaN(a.getTime())) {
			return new Error("Current date is invalid")
		}

		let b = s.expiresAt
		if (Number.isNaN(b.getTime())) {
			return new Error("Expiration date is invalid")
		}

		if (a.getTime() < b.getTime()) {
			return
		}

		let err = await this.close(id)
		if (err) {
			return new Error(`Closing session ${s.id}`, {cause: err})
		}
	}

	async clear(): Promise<Error | undefined> {
		let errs: Error[] = []

		for (let id of this.m.keys()) {
			let err = await this.close(id)
			if (err) {
				errs.push(new Error(`Closing session ${id}`, {cause: err}))
			}
		}

		if (errs.length !== 0) {
			return new Error("Multiple errors", {cause: errs})
		}
	}

	async watch(sig: AbortSignal, interval: number): Promise<Error | undefined> {
		if (sig.aborted) {
			return new DOMException("Aborted", "AbortError")
		}

		return await new Promise((res) => {
			let t = setInterval(tick.bind(this), interval)
			sig.addEventListener("abort", abort)

			function tick(this: Sessions): void {
				void (async() => {
					for (let id of this.m.keys()) {
						let err = await this.expire(id)
						if (err) {
							rej(new Error(`Expiring session ${id}`, {cause: err}))
						}
					}
				})()
			}

			function abort(): void {
				rej(new DOMException("Aborted", "AbortError"))
			}

			function rej(err: Error): void {
				clearInterval(t)
				sig.removeEventListener("abort", abort)
				res(err)
			}
		})
	}
}
