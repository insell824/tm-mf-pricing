import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const SCRIPT_NAME = "tm-mf-pricing";
const VERSION_PLACEHOLDER = "{{version}}";
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const NAME_LINE_PATTERN = /^(\/\/\s*@name\s+.*?)\s*$/m;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(rootDir, "release");
const entryPoint = path.join(rootDir, "src", "main.ts");
const headerPath = path.join(rootDir, "header.user.js");
const packageJsonPath = path.join(rootDir, "package.json");

async function readVersion(): Promise<string> {
  const pkg: unknown = JSON.parse(await readFile(packageJsonPath, "utf8"));
  if (
    typeof pkg !== "object" ||
    pkg === null ||
    !("version" in pkg) ||
    typeof pkg.version !== "string" ||
    !SEMVER_PATTERN.test(pkg.version)
  ) {
    throw new Error('package.json must have a semver "version" field');
  }
  return pkg.version;
}

async function renderHeader(version: string, debug: boolean): Promise<string> {
  const template = await readFile(headerPath, "utf8");
  if (!template.includes(VERSION_PLACEHOLDER)) {
    throw new Error(`header.user.js must contain ${VERSION_PLACEHOLDER}`);
  }
  let header = template.replaceAll(VERSION_PLACEHOLDER, version);
  if (debug) {
    // A distinct name keeps the debug build from overwriting the installed release script.
    if (!NAME_LINE_PATTERN.test(header)) {
      throw new Error("header.user.js must contain an @name line");
    }
    header = header.replace(NAME_LINE_PATTERN, "$1 (debug)");
  }
  return `${header.trimEnd()}\n\n`;
}

function createBuildOptions(debug: boolean, outfile: string): esbuild.BuildOptions {
  return {
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: "iife",
    target: "es2022",
    charset: "utf8",
    legalComments: "none",
    sourcemap: debug ? "inline" : false,
    define: { __DEBUG__: String(debug) },
    write: false,
  };
}

function getBundledCode(result: esbuild.BuildResult): string {
  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error("esbuild produced no output");
  }
  return output.text;
}

async function buildRelease(): Promise<void> {
  const version = await readVersion();
  const header = await renderHeader(version, false);
  const fileNames = [`${SCRIPT_NAME}.latest.user.js`, `${SCRIPT_NAME}.${version}.user.js`];

  const result = await esbuild.build(createBuildOptions(false, path.join(releaseDir, fileNames[0]!)));
  const userscript = header + getBundledCode(result);

  await mkdir(releaseDir, { recursive: true });
  for (const fileName of fileNames) {
    await writeFile(path.join(releaseDir, fileName), userscript);
    console.log(`Wrote release/${fileName}`);
  }
}

async function watchDebug(): Promise<void> {
  const fileName = `${SCRIPT_NAME}.debug.user.js`;
  const outfile = path.join(releaseDir, fileName);

  const debugUserscriptPlugin: esbuild.Plugin = {
    name: "debug-userscript",
    setup(build) {
      // Rebuild when the header template or the version changes, not only the sources.
      build.onLoad({ filter: /[\\/]src[\\/]main\.ts$/ }, async (args) => ({
        contents: await readFile(args.path, "utf8"),
        loader: "ts",
        watchFiles: [headerPath, packageJsonPath],
      }));

      build.onEnd(async (result) => {
        if (result.errors.length > 0) {
          return;
        }
        try {
          const header = await renderHeader(await readVersion(), true);
          await writeFile(outfile, header + getBundledCode(result));
          console.log(`[${new Date().toLocaleTimeString()}] Wrote release/${fileName}`);
        } catch (error) {
          console.error("Failed to write debug userscript:", error);
        }
      });
    },
  };

  await mkdir(releaseDir, { recursive: true });
  const context = await esbuild.context({
    ...createBuildOptions(true, outfile),
    logLevel: "warning",
    plugins: [debugUserscriptPlugin],
  });
  await context.watch();
  console.log("Watching for changes...");
}

try {
  if (process.argv.includes("--watch")) {
    await watchDebug();
  } else {
    await buildRelease();
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
