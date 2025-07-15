import type express from "express"
import * as logger from "./logger.ts"

const OUTGOING = "<--"
const INCOMING = "-->"

interface Payload {
	method?: string
	path?: string
	status?: number
	duration?: string
}

export function loggerMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
	let p: Payload = {
		method: req.method,
		path: req.path,
	}

	logger.info(INCOMING, p)

	let s = Date.now()

	res.on("finish", () => {
		p.status = res.statusCode

		let d = Date.now() - s
		if (d < 1000) {
			p.duration = `${d}ms`
		} else {
			p.duration = `${Math.round(d / 1000)}s`
		}

		logger.info(OUTGOING, p)
	})

	next()
}
