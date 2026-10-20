import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const cwd = path.join(root, "vendor/opengym/frontend");
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", ...options });
  if (result.status !== 0) process.exit(result.status || 1);
}
run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"]);
run("npm", ["run", "build", "--", "--outDir", path.join(root, "public/opengym-app"), "--emptyOutDir"]);
mkdirSync(path.join(root, "public/opengym-app/licenses"), { recursive: true });
for (const name of ["LICENSE", "NOTICE.md", "DATASET-LICENSE.txt", "INTEGRATION.md"]) {
  copyFileSync(path.join(root, "vendor/opengym", name), path.join(root, "public/opengym-app/licenses", name));
}
// AGPL corresponding source includes the adapter, migrations, lockfiles and build scripts.
run("tar", ["--exclude=node_modules", "--exclude=.git", "--exclude=.next", "--exclude=./public/opengym-app", "--exclude=./public/opengym-source.tar.gz", "--exclude=*.tsbuildinfo", "--exclude=.env*", "--exclude=.vercel", "--exclude=.codex", "--exclude=.temp", "--exclude=*.pem", "-czf", "public/opengym-source.tar.gz", "."], { cwd: root });
const html = path.join(root, "public/opengym-app/index.html");
writeFileSync(html, readFileSync(html, "utf8").replace('<html lang="en">', '<html lang="es">'));
