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
