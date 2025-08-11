/**
 * (c) Copyright Ascensio System SIA 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

/* eslint-disable no-underscore-dangle */

import * as z from "zod"

export function wrapUnion<
	A extends [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]],
>(v: z.ZodUnion<A>, f: string): z.ZodUnion<A> {
	let a = [] as unknown as A
	for (let o of v.options) {
		let c = z.literal(`${f}.${o._def.value}`)
		if (o._def.description !== undefined) {
			c = c.describe(o._def.description)
		}
		a.push(c)
	}
	return z.union(a)
}

export function stringUnionToEnum<
	A extends [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]],
>(u: z.ZodUnion<A>, d: string): z.ZodEnum<[string, ...string[]]> {
	let a = [] as unknown as [string, ...string[]]
	let c = ""

	for (let o of u.options) {
		a.push(o._def.value)
		if (o._def.description !== undefined) {
			c += `${o._def.value} - ${o._def.description}\n`
		}
	}

	if (c !== "") {
		c = c.slice(0, -1)
	}

	if (d !== "" && c !== "") {
		c = `${d}\n\n${c}`
	} else if (d !== "") {
		c = d
	}

	let e = z.enum(a)

	if (c !== "") {
		e = e.describe(c)
	}

	return e
}

export function numberUnionToEnum<
	A extends [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]],
>(u: z.ZodUnion<A>, d: string): z.ZodNativeEnum<z.EnumLike> {
	let r: z.EnumLike = {}
	let c = ""

	for (let o of u.options) {
		r[`_${o._def.value}`] = o._def.value
		if (o._def.description !== undefined) {
			c += `${o._def.value} - ${o._def.description}\n`
		}
	}

	if (c !== "") {
		c = c.slice(0, -1)
	}

	if (d !== "" && c !== "") {
		c = `${d}\n\n${c}`
	} else if (d !== "") {
		c = d
	}

	let e = z.nativeEnum(r)

	if (c !== "") {
		e = e.describe(c)
	}

	return e
}

export function envBoolean(): (v: string, c: z.RefinementCtx) => boolean | never {
	return (v, c) => {
		let t = v.trim().toLowerCase()

		if (t === "yes" || t === "y" || t === "true" || t === "1") {
			return true
		}

		if (t === "no" || t === "n" || t === "false" || t === "0") {
			return false
		}

		c.addIssue({
			code: z.ZodIssueCode.custom,
			message: `Expected one of: yes, y, true, 1, no, n, false, 0, but got ${v}`,
			fatal: true,
		})

		return z.NEVER
	}
}

export function envNumber(): (v: string, c: z.RefinementCtx) => number | never {
	return (v, c) => {
		let n = Number.parseInt(v.trim(), 10)

		if (Number.isNaN(n)) {
			c.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Expected a number, but got ${v}`,
				fatal: true,
			})
			return z.NEVER
		}

		return n
	}
}

export function envUnion<T extends string>(a: T[]): (v: string, c: z.RefinementCtx) => T | never {
	return (v, c) => {
		v = v.trim().toLowerCase()

		for (let t of a) {
			if (t === v) {
				return t
			}
		}

		c.addIssue({
			code: z.ZodIssueCode.custom,
			message: `Expected one of: ${a.join(", ")}, but got ${v}`,
			fatal: true,
		})

		return z.NEVER
	}
}

export function envOptions(a: string[]): (v: string, c: z.RefinementCtx) => string[] | never {
	return (v, c) => {
		let x: string[] = []
		let y: string[] = []

		for (let u of v.split(",")) {
			u = u.trim().toLowerCase()
			if (u === "") {
				continue
			}

			let h = false
			for (let n of a) {
				if (n === u) {
					h = true
					break
				}
			}

			if (!h && !y.includes(u)) {
				y.push(u)
			}
			if (h && !x.includes(u)) {
				x.push(u)
			}
		}

		if (y.length !== 0) {
			for (let u of y) {
				c.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Unknown value: ${u}`,
				})
			}
			return z.NEVER
		}

		return x
	}
}

export function envList(): (v: string, c: z.RefinementCtx) => string[] {
	return (v) => {
		let a: string[] = []

		for (let u of v.split(",")) {
			u = u.trim()
			if (u === "") {
				continue
			}

			if (!a.includes(u)) {
				a.push(u)
			}
		}

		return a
	}
}
