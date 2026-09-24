// Run locally with Node 22+ against a copy of the original SQLite database.
// The resulting SQL contains operational data: keep it outside the repository.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error("Uso: node scripts/export-to-d1.mjs backup.sqlite|export.sql /local/fora-do-repositorio/import.sql");
const database = source.endsWith(".sql") ? new DatabaseSync(":memory:") : new DatabaseSync(source, { readOnly: true });
if (source.endsWith(".sql")) database.exec(readFileSync(source, "utf8"));
const tables = ["products", "bar_tables", "table_sessions", "recipes", "movements"];
const quote = value => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
const statements = [];
const counts = {};
for (const table of tables) {
  const rows = database.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
  counts[table] = rows.length;
  for (const row of rows) {
    const columns = Object.keys(row);
    statements.push(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(column => quote(row[column])).join(",")});`);
  }
}
statements.push("PRAGMA foreign_key_check;");
writeFileSync(destination, statements.join("\n") + "\n", { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ counts, foreignKeyErrors: database.prepare("PRAGMA foreign_key_check").all().length }));
