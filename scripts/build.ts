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

import esbuild from "esbuild"

await esbuild.build({
	bundle: true,
	banner: {
		js: `import __module from "node:module";
var require = __module.createRequire(import.meta.url);
`,
	},
	format: "esm",
	logLevel: "error",
	outfile: "bin/onlyoffice-docspace-mcp",
	platform: "node",
	target: "es2024",
	entryPoints: ["app/main.ts"],
})
