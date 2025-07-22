import type express from "express"
import * as context from "./context.ts"
import * as logger from "./logger.ts"

export function contextMiddleware(req: express.Request, _: express.Response, next: express.NextFunction): void {
	let ctx: context.Context = {}

	let id = req.headers["mcp-session-id"]
	if (id !== undefined && id !== "" && !Array.isArray(id)) {
		ctx.sessionId = id
	}

	context.run(ctx, () => {
		next()
	})
}

const OUTGOING = "<--"
const INCOMING = "-->"

interface Payload {
	sessionId?: string
	method?: string
	path?: string
	status?: number
	duration?: string
}

export function loggerMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
	let p: Payload = {}

	let ctx = context.get()
	if (ctx && ctx.sessionId) {
		p.sessionId = ctx.sessionId
	}

	p.method = req.method
	p.path = req.path

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
