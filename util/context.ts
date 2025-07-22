import * as asyncHooks from "node:async_hooks"

export interface Context {
	sessionId?: string
}

const context = new asyncHooks.AsyncLocalStorage<Context>({name: "context"})

export function run(ctx: Context, cb: () => void): void {
	context.run(ctx, cb)
}

export function get(): Context | undefined {
	return context.getStore()
}
