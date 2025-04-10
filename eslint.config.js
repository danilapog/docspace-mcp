import config from "@vanyauhalin/eslint-config"

for (let c of config) {
	if (!c.rules) {
		continue
	}

	if ("no-inline-comments" in c.rules) {
		c.rules["no-inline-comments"] = "off"
	}

	if ("jsdoc/tag-lines" in c.rules) {
		c.rules["jsdoc/tag-lines"] = "off"
	}

	if ("tsdoc/syntax" in c.rules) {
		c.rules["tsdoc/syntax"] = "off"
	}

	if ("typescript/ban-ts-comment" in c.rules) {
		c.rules["typescript/ban-ts-comment"] = "off"
	}

	if ("typescript/prefer-nullish-coalescing" in c.rules) {
		c.rules["typescript/prefer-nullish-coalescing"] = "off"
	}

	if ("typescript/switch-exhaustiveness-check" in c.rules) {
		c.rules["typescript/switch-exhaustiveness-check"] = "off"
	}

	if ("unicorn/no-useless-undefined" in c.rules) {
		c.rules["unicorn/no-useless-undefined"] = "off"
	}
}

export default [
	...config,
]
