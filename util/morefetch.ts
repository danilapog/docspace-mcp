import * as context from "./context.ts"
import * as logger from "./logger.ts"

const OUTGOING = "<--"
const INCOMING = "-->"
const ERROR = "xxx"

interface Payload {
	sessionId?: string
	method?: string
	url?: string
	status?: number
	duration?: string
	err?: unknown
}

export function withLogger(f: typeof fetch): typeof fetch {
	return async function fetch(input, init) {
		let p: Payload = {}

		let ctx = context.get()
		if (ctx && ctx.sessionId) {
			p.sessionId = ctx.sessionId
		}

		if (input instanceof Request) {
			p.method = input.method
			p.url = input.url
		}

		try {
			logger.info(INCOMING, p)

			let s = Date.now()

			let r = await f(input, init)

			p.status = r.status

			let d = Date.now() - s
			if (d < 1000) {
				p.duration = `${d}ms`
			} else {
				p.duration = `${Math.round(d / 1000)}s`
			}

			logger.info(OUTGOING, p)

			return r
		} catch (err) {
			p.err = err

			logger.error(ERROR, p)

			throw err
		}
	}
}

export function withOrigin(f: typeof fetch, o: string): typeof fetch {
	return async function fetch(input, init) {
		if (input instanceof Request) {
			input = input.clone()
			input.headers.set("Origin", o)
		}

		return await f(input, init)
	}
}
