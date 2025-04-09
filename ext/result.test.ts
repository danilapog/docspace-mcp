import {deepEqual as eq} from "node:assert/strict"
import {test} from "node:test"
import {error, ok, safeAsync, safeNew, safeSync} from "./result.ts"

await test("ok(): creates a new Ok result", () => {
	let r = ok("ok")
	eq(Object.keys(r), ["v", "err"])
	eq(r, {v: "ok", err: undefined})
})

await test("error(): creates a new Error result", () => {
	let r = error("error")
	eq(Object.keys(r), ["v", "err"])
	eq(r, {v: undefined, err: "error"})
})

await test("safeSync(): calls a function and wraps its return value in a Result", async(t) => {
	await t.test("returns an Ok result when the function succeeds", () => {
		let r = safeSync(fn)
		eq(r.err, undefined)
		eq(r.v, "ok")

		function fn(): string {
			return "ok"
		}
	})

	await t.test("returns an Error result when the function throws", () => {
		let r = safeSync(fn)
		eq(r.err instanceof Error && r.err.message === "error", true)
		eq(r.v, undefined)

		function fn(): void {
			throw new Error("error")
		}
	})

	await t.test("returns an unknown Error result when the function throws non-Error value", () => {
		let r = safeSync(fn)
		eq(r.err instanceof Error && r.err.message === "Unknown error.", true)
		eq(r.err instanceof Error && r.err.cause === "error", true)
		eq(r.v, undefined)

		function fn(): void {
			// eslint-disable-next-line typescript/only-throw-error
			throw "error"
		}
	})
})

await test("safeAsync(): calls an async function and wraps its return value in a Result", async(t) => {
	await t.test("returns an Ok result when the function succeeds", async() => {
		let r = await safeAsync(fn)
		eq(r.err, undefined)
		eq(r.v, "ok")

		// eslint-disable-next-line typescript/require-await
		async function fn(): Promise<string> {
			return "ok"
		}
	})

	await t.test("returns an Error result when the function throws", async() => {
		let r = await safeAsync(fn)
		eq(r.err instanceof Error && r.err.message === "error", true)
		eq(r.v, undefined)

		// eslint-disable-next-line typescript/require-await
		async function fn(): Promise<void> {
			throw new Error("error")
		}
	})

	await t.test("returns an unknown Error result when the function throws non-Error value", async() => {
		let r = await safeAsync(fn)
		eq(r.err instanceof Error && r.err.message === "Unknown error.", true)
		eq(r.err instanceof Error && r.err.cause === "error", true)
		eq(r.v, undefined)

		// eslint-disable-next-line typescript/require-await
		async function fn(): Promise<void> {
			// eslint-disable-next-line typescript/only-throw-error
			throw "error"
		}
	})
})

await test("safeNew(): calls a constructor and wraps its return value in a Result", async(t) => {
	await t.test("returns an Ok result when the constructor succeeds", () => {
		class Foo {}

		let r = safeNew(Foo)
		eq(r.err, undefined)
		eq(r.v, "ok")
	})

	await t.test("returns an Error result when the constructor throws", () => {
		class Foo {
			constructor() {
				throw new Error("error")
			}
		}

		let r = safeNew(Foo)
		eq(r.err instanceof Error && r.err.message === "error", true)
		eq(r.v, undefined)
	})

	await t.test("returns an unknown Error result when the constructor throws non-Error value", () => {
		class Foo {
			constructor() {
				// eslint-disable-next-line typescript/only-throw-error
				throw "error"
			}
		}

		let r = safeNew(Foo)
		eq(r.err instanceof Error && r.err.message === "Unknown error.", true)
		eq(r.err instanceof Error && r.err.cause === "error", true)
		eq(r.v, undefined)
	})
})
