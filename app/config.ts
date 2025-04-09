import * as z from "zod"
import pack from "../package.json" with {type: "json"}

export type Config = z.infer<typeof ConfigSchema>

export const ConfigSchema = z.
	object({
		DOCSPACE_BASE_URL: z.string().url(),
		DOCSPACE_ORIGIN: z.string().url().optional(),
		DOCSPACE_USER_AGENT: z.string().optional().default(`${pack.name} v${pack.version}`),
		DOCSPACE_API_KEY: z.string().optional(),
		DOCSPACE_AUTH_TOKEN: z.string().optional(),
		DOCSPACE_USERNAME: z.string().optional(),
		DOCSPACE_PASSWORD: z.string().optional(),
	}).
	refine(
		(o) => {
			let a = Boolean(o.DOCSPACE_USERNAME)
			let b = Boolean(o.DOCSPACE_PASSWORD)
			return a && b || !a && !b
		},
		{
			path: ["DOCSPACE_USERNAME", "DOCSPACE_PASSWORD"],
			message: "Both DOCSPACE_USERNAME and DOCSPACE_PASSWORD must be set or both must be unset.",
		},
	).
	refine(
		(o) => {
			let a = Boolean(o.DOCSPACE_API_KEY)
			let b = Boolean(o.DOCSPACE_AUTH_TOKEN)
			let c = Boolean(o.DOCSPACE_USERNAME) && Boolean(o.DOCSPACE_PASSWORD)
			return Number(a) + Number(b) + Number(c) <= 1
		},
		{
			path: ["DOCSPACE_API_KEY", "DOCSPACE_AUTH_TOKEN", "DOCSPACE_USERNAME", "DOCSPACE_PASSWORD"],
			message: "Only one of DOCSPACE_API_KEY, DOCSPACE_AUTH_TOKEN, or (DOCSPACE_USERNAME and DOCSPACE_PASSWORD) must be set.",
		},
	).
	transform((o) => ({
		baseUrl: ensureTrailingSlash(o.DOCSPACE_BASE_URL),
		origin: o.DOCSPACE_ORIGIN,
		userAgent: o.DOCSPACE_USER_AGENT,
		apiKey: o.DOCSPACE_API_KEY,
		authToken: o.DOCSPACE_AUTH_TOKEN,
		username: o.DOCSPACE_USERNAME,
		password: o.DOCSPACE_PASSWORD,
	}))

function ensureTrailingSlash(u: string): string {
	if (!u.endsWith("/")) {
		u = `${u}/`
	}
	return u
}
