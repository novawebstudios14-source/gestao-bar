import { getBarDb } from "@/db/d1";
import { requireBarAuth } from "@/app/bar-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  const denied = await requireBarAuth(request);
  if (denied) return denied;
  const db = getBarDb();
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || "0000-01-01";
    const to = url.searchParams.get("to") || "9999-12-31";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return Response.json({ error: "Período inválido" }, { status: 400 });
    const [products, movements, summary, byTable, byDay, tables, sessions, sessionSales] = await Promise.all([
      db.prepare("SELECT * FROM products ORDER BY name COLLATE NOCASE").all(),
      db.prepare("SELECT m.*, p.name AS product_name, p.unit FROM movements m JOIN products p ON p.id=m.product_id WHERE m.business_date BETWEEN ? AND ? ORDER BY m.business_date DESC, m.id DESC").bind(from,to).all(),
      db.prepare("SELECT COALESCE(SUM(CASE WHEN kind='sale' THEN quantity*unit_price_cents ELSE 0 END),0) AS revenue, COALESCE(SUM(CASE WHEN kind='sale' THEN quantity*unit_cost_cents ELSE 0 END),0) AS cost, COALESCE(SUM(CASE WHEN kind='purchase' THEN quantity*unit_cost_cents ELSE 0 END),0) AS invested, COALESCE(SUM(CASE WHEN kind='adjust_out' THEN quantity*unit_cost_cents ELSE 0 END),0) AS losses, COALESCE(SUM(CASE WHEN kind='sale' THEN quantity ELSE 0 END),0) AS units FROM movements WHERE business_date BETWEEN ? AND ?").bind(from,to).first(),
      db.prepare("SELECT table_name, SUM(quantity*unit_price_cents) AS revenue, SUM(quantity*unit_cost_cents) AS cost, SUM(quantity) AS units FROM movements WHERE kind='sale' AND business_date BETWEEN ? AND ? GROUP BY table_name ORDER BY revenue DESC").bind(from,to).all(),
      db.prepare("SELECT business_date, SUM(quantity*unit_price_cents) AS revenue, SUM(quantity*unit_cost_cents) AS cost FROM movements WHERE kind='sale' AND business_date BETWEEN ? AND ? GROUP BY business_date ORDER BY business_date").bind(from,to).all(),
      db.prepare("SELECT id,name FROM bar_tables ORDER BY name COLLATE NOCASE").all(),
      db.prepare("SELECT s.id,s.table_id,s.opened_at,s.closed_at,s.paid_at,COALESCE(SUM(m.quantity*m.unit_price_cents),0) AS total_cents,COUNT(m.id) AS item_count FROM table_sessions s LEFT JOIN movements m ON m.session_id=s.id AND m.kind='sale' GROUP BY s.id ORDER BY s.opened_at DESC,s.id DESC").all(),
      db.prepare("SELECT m.id,m.session_id,m.product_id,m.quantity,m.unit_price_cents,m.unit_cost_cents,m.business_date,m.created_at,p.name AS product_name,p.unit FROM movements m JOIN products p ON p.id=m.product_id WHERE m.kind='sale' AND m.session_id IS NOT NULL ORDER BY m.created_at ASC,m.id ASC").all(),
    ]);
    return Response.json({ products: products.results, movements: movements.results, summary, byTable: byTable.results, byDay: byDay.results, tables: tables.results, sessions: sessions.results, sessionSales: sessionSales.results });
  } catch (e) { console.error(e); return Response.json({ error: "Não foi possível carregar os dados. Tente novamente." }, { status: 500 }); }
}
