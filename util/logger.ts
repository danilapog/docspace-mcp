import logfmt from "logfmt"
import * as moreerrors from "./format.ts"

export function info(msg: string, o?: object): void {
	log("INF", msg, o)
}

export function warn(msg: string, o?: object): void {
	log("WRN", msg, o)
}

export function error(msg: string, o?: object): void {
	log("ERR", msg, o)
}

export function mute(): void {
	// @ts-ignore
	// eslint-disable-next-line no-func-assign
	log = function log() {}
}

function log(level: string, msg: string, o?: object): void {
	logfmt.log(format({time: new Date().toISOString(), level, msg, ...o}) as object)
}

function format(v: unknown): unknown {
	if (v === null || v === undefined) {
		return
	}

	if (typeof v === "string") {
		return v.replaceAll("\n", String.raw`\n`).replaceAll("\t", String.raw`\t`)
	}

	if (Array.isArray(v)) {
		let a: unknown[] = []
		for (let e of v) {
			a.push(format(e))
		}
		return a
	}

	if (v instanceof Error) {
		return format(moreerrors.format(v))
	}

	if (typeof v === "object") {
		let r: Record<string, unknown> = {}
		for (let p of Object.entries(v)) {
			r[toSnakeCase(p[0])] = format(p[1])
		}
		return r
	}

	return v
}

function toSnakeCase(s: string): string {
	return s.replaceAll(/(?<=[a-z])(?=[A-Z])/g, "_").toLowerCase()
}
