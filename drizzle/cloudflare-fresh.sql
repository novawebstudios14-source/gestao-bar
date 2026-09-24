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
