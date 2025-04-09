import * as z from "zod"

export function format(err: Error): string {
	let m = ""
	let l = 0

	loop(err)

	m = m.slice(0, -1)

	return m

	function loop(err: unknown): void {
		if (err instanceof z.ZodError) {
			if (err.issues.length === 1) {
				add(`${err.name}: ${err.issues.length} issue.`)
			} else {
				add(`${err.name}: ${err.issues.length} issues.`)
			}

			l += 1

			for (let i of err.issues) {
				let p = ""

				for (let e of i.path) {
					if (typeof e === "number") {
						p += `[${e}]`
					} else {
						p += `.${e}`
					}
				}

				if (p.length !== 0) {
					p = p.slice(1)
				}

				if (p.length === 0) {
					add(`${i.code}: ${i.message}`)
				} else {
					add(`${p}: ${i.code} ${i.message}`)
				}
			}

			l -= 1

			return
		}

		if (err instanceof Error) {
			add(`${err.name}: ${err.message}`)

			if (err.cause) {
				l += 1
				loop(err.cause)
				l -= 1
			}

			return
		}

		if (Array.isArray(err)) {
			for (let e of err) {
				loop(e)
			}

			return
		}
	}

	function add(s: string): void {
		m += `${"\t".repeat(l)}${s}\n`
	}
}
