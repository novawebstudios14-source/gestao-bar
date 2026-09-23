import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { isNull } from "drizzle-orm";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default("Outros"),
  unit: text("unit").notNull().default("un"),
  priceCents: integer("price_cents").notNull(),
  promoPriceCents: integer("promo_price_cents"),
  stock: integer("stock").notNull().default(0),
  avgCostCents: integer("avg_cost_cents").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  kind: text("kind").notNull().default("stock"),
  createdAt: text("created_at").notNull(),
});

export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  kind: text("kind").notNull(),
  quantity: integer("quantity").notNull(),
  tableName: text("table_name"),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  unitCostCents: integer("unit_cost_cents").notNull().default(0),
  businessDate: text("business_date").notNull(),
  createdAt: text("created_at").notNull(),
  note: text("note"),
  saleKey: text("sale_key"),
  sessionId: integer("session_id").references(() => tableSessions.id),
}, (table) => [
  index("idx_movements_date_kind").on(table.businessDate, table.kind),
  index("idx_movements_product").on(table.productId),
  uniqueIndex("idx_movements_sale_key").on(table.saleKey),
]);

// Historical recipe records remain for older sales; new sales do not use them.
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  ingredientId: integer("ingredient_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
}, (table) => [
  uniqueIndex("idx_recipes_product_ingredient").on(table.productId, table.ingredientId),
]);

export const barTables = sqliteTable("bar_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_bar_tables_name").on(table.name),
]);

export const tableSessions = sqliteTable("table_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").notNull().references(() => barTables.id),
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
  paidAt: text("paid_at"),
}, (table) => [
  index("idx_table_sessions_table_opened").on(table.tableId, table.openedAt),
  uniqueIndex("idx_table_sessions_one_open").on(table.tableId).where(isNull(table.closedAt)),
]);
