import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

type BindValue = string | number | null;
type D1Result = { meta: { changes: number } };
let connection: DatabaseSync | undefined;

function database() {
  if (connection) return connection;
  const path = process.env.DATABASE_PATH;
  if (!path) throw new Error("Configure DATABASE_PATH em um volume persistente antes de iniciar o sistema.");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Outros',
      unit TEXT NOT NULL DEFAULT 'un',
      price_cents INTEGER NOT NULL,
      promo_price_cents INTEGER,
      stock INTEGER NOT NULL DEFAULT 0,
      avg_cost_cents INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      kind TEXT NOT NULL DEFAULT 'stock',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bar_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS table_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES bar_tables(id),
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      paid_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_one_open ON table_sessions(table_id) WHERE closed_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_table_sessions_table_opened ON table_sessions(table_id, opened_at);
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      kind TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      table_name TEXT,
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      business_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      note TEXT,
      sale_key TEXT UNIQUE,
      session_id INTEGER REFERENCES table_sessions(id)
    );
    CREATE INDEX IF NOT EXISTS idx_movements_date_kind ON movements(business_date, kind);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      ingredient_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      UNIQUE(product_id, ingredient_id)
    );
  `);
  connection = db;
  return db;
}

class Statement {
  constructor(private sql: string, private values: BindValue[] = []) {}
  bind(...values: BindValue[]) { return new Statement(this.sql, values); }
  first<T>() { return (database().prepare(this.sql).get(...this.values) ?? null) as T | null; }
  all<T>() { return { results: database().prepare(this.sql).all(...this.values) as T[] }; }
  run(): D1Result {
    const result = database().prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

export const db = {
  prepare(sql: string) { return new Statement(sql); },
  batch(statements: Statement[]) {
    const sqlite = database();
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const result = statements.map((statement) => statement.run());
      sqlite.exec("COMMIT");
      return result;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  },
};
