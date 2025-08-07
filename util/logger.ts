import logfmt from "logfmt"
import * as moreerrors from "./format.ts"
import * as morestrings from "./morestrings.ts"

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
	logfmt.log(format({time: new Date().toISOString(), level, msg, ...o}))
}

function format(v: object): Record<string, unknown> {
	let s: Record<string, unknown> = {}
	for (let [p, e] of Object.entries(v)) {
		next(s, p, e)
	}
	return s

	function next(o: Record<string, unknown>, k: string, v: unknown): void {
		if (v === null || v === undefined) {
			return
		}

		if (typeof v === "boolean" || typeof v === "number") {
			o[morestrings.camelCaseToSnakeCase(k)] = v
			return
		}

		if (typeof v === "string") {
			o[morestrings.camelCaseToSnakeCase(k)] = morestrings.escapeWhitespace(v)
			return
		}

		if (Array.isArray(v)) {
			for (let [i, e] of v.entries()) {
				next(o, `${k}[${i}]`, e)
			}
			return
		}

		if (v instanceof Error) {
			o[morestrings.camelCaseToSnakeCase(k)] = moreerrors.format(v)
			return
		}

		if (typeof v === "object") {
			for (let [p, e] of Object.entries(v)) {
				next(o, `${k}.${p}`, e)
			}
			return
		}
	}
}
