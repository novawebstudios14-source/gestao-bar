import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const framework = fileURLToPath(new URL("./run-framework.mjs", import.meta.url));
const build = spawnSync(process.execPath, [framework, "build"], { stdio: "inherit" });
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

// Cloudflare Builds authenticates Wrangler in its own environment. Local builds
// continue using the placeholder D1 binding for offline compilation.
if (!process.env.WORKERS_CI) process.exit(0);

const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const run = (...args) => execFileSync(process.execPath, [wrangler, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const databaseName = "gestao-bar-d1";
const workerName = "gestao-bar";
const databases = () => {
  const parsed = JSON.parse(run("d1", "list", "--json"));
  return Array.isArray(parsed) ? parsed : parsed.result;
};

let database = databases().find(item => item.name === databaseName);
if (!database) {
  run("d1", "create", databaseName);
  database = databases().find(item => item.name === databaseName);
}
if (!database?.uuid || !/^[0-9a-f-]{36}$/i.test(database.uuid)) throw new Error("Não foi possível localizar o ID do D1 criado na conta Cloudflare.");

const configPath = "dist/server/wrangler.json";
const config = JSON.parse(readFileSync(configPath, "utf8"));
const binding = config.d1_databases?.find(item => item.binding === "DB");
if (!binding) throw new Error("Binding DB ausente do build.");
binding.database_id = database.uuid;
binding.database_name = databaseName;
config.name = workerName;
config.topLevelName = workerName;
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

run("d1", "execute", databaseName, "--remote", "--file", "drizzle/cloudflare-fresh.sql", "--yes");
console.log(`D1 ${databaseName} configurado e esquema aplicado. Worker ${workerName} pronto para deploy.`);
