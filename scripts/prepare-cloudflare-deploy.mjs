// Run after pnpm build. Mutates only ignored build output, never tracked source.
import { readFileSync, writeFileSync } from "node:fs";

const [databaseId, databaseName, workerName] = process.argv.slice(2);
if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(databaseId || "") || !databaseName || !workerName) {
  throw new Error("Uso: node scripts/prepare-cloudflare-deploy.mjs <D1_DATABASE_ID> <D1_DATABASE_NAME> <WORKER_NAME>");
}
const path = "dist/server/wrangler.json";
const config = JSON.parse(readFileSync(path, "utf8"));
const binding = config.d1_databases?.find(entry => entry.binding === "DB");
if (!binding) throw new Error("Binding DB não encontrado no build.");
binding.database_id = databaseId;
binding.database_name = databaseName;
config.name = workerName;
config.topLevelName = workerName;
writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
console.log(`Configuração de publicação preparada em ${path}. Confira o ID do D1 antes de publicar.`);
