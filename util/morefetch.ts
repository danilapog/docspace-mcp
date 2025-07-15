import * as logger from "./logger.ts"

const OUTGOING = "<--"
const INCOMING = "-->"
const ERROR = "xxx"

interface Payload {
	method?: string
	url?: string
	status?: number
	duration?: string
	err?: unknown
}

export function withLogger(f: typeof fetch): typeof fetch {
	return async function fetch(input, init) {
		let p: Payload = {}

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
