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

	if ("n/hashbang" in c.rules) {
		c.rules["n/hashbang"] = "off"
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
