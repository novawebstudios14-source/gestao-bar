import { env } from "cloudflare:workers";

function money(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) throw new Error("Valor inválido");
  return Math.round(n * 100);
}
function positive(value: unknown) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000000) throw new Error("Quantidade inválida");
  return n;
}
function date(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new Error("Data inválida");
  return value;
}
type Item = {id:number;kind:string;stock:number;avg_cost_cents:number;name:string};
const categories = ["Cervejas", "Refrigerantes", "Águas", "Porções", "Pratos", "Outros"];
function category(value: unknown) {
  if (typeof value !== "string" || !categories.includes(value)) throw new Error("Escolha uma seção válida");
  return value;
}
export async function POST(request: Request) {
  try {
    const db = env.DB;
    if (!db) throw new Error("Banco indisponível");
    const body = await request.json() as Record<string, unknown>;
    const now = new Date().toISOString();
    if (body.type === "tableCreate") {
      const name = String(body.name || "").trim().slice(0,50);
      if (!name) throw new Error("Informe o número da mesa");
      const number = Number(name.replace(/^Mesa\s+/i,""));
      if (!Number.isSafeInteger(number) || number < 1 || number > 50) throw new Error("Escolha uma mesa de 01 a 50");
      const normalized = `Mesa ${String(number).padStart(2,"0")}`;
      const existing = await db.prepare("SELECT id FROM bar_tables WHERE name=? OR lower(name)=lower(?)").bind(String(number),normalized).first();
      if (existing) throw new Error("Esta mesa já está cadastrada");
      await db.prepare("INSERT INTO bar_tables (name,created_at) VALUES (?,?)").bind(normalized,now).run();
    } else if (body.type === "sessionOpen") {
      const tableId = positive(body.tableId);
      const result = await db.prepare("INSERT INTO table_sessions (table_id,opened_at) SELECT id,? FROM bar_tables WHERE id=? AND NOT EXISTS (SELECT 1 FROM table_sessions WHERE table_id=? AND closed_at IS NULL)").bind(now,tableId,tableId).run();
      if (!result.meta.changes) throw new Error("Mesa não encontrada ou já está com comanda aberta");
    } else if (body.type === "sessionClose") {
      const sessionId = positive(body.sessionId);
      const result = await db.prepare("UPDATE table_sessions SET closed_at=? WHERE id=? AND closed_at IS NULL").bind(now,sessionId).run();
      if (!result.meta.changes) throw new Error("Comanda já encerrada ou não encontrada");
    } else if (body.type === "sessionPay") {
      const sessionId = positive(body.sessionId);
      const result = await db.prepare("UPDATE table_sessions SET paid_at=?,closed_at=COALESCE(closed_at,?) WHERE id=? AND paid_at IS NULL AND EXISTS (SELECT 1 FROM movements WHERE session_id=? AND kind='sale')").bind(now,now,sessionId,sessionId).run();
      if (!result.meta.changes) throw new Error("Comanda já paga, vazia ou não encontrada");
    } else if (body.type === "product") {
      const name = String(body.name || "").trim().slice(0,100);
      if (!name) throw new Error("Informe o produto");
      const section = category(body.category);
      const price = money(body.price);
      if (!price) throw new Error("Informe o preço de venda");
      const min = Number(body.minStock || 0);
      if (!Number.isSafeInteger(min) || min < 0 || min > 1000000) throw new Error("Estoque mínimo inválido");
      const kind = body.kind === "untracked" ? "untracked" : "stock";
      const unitCost = kind === "untracked" ? money(body.cost || 0) : 0;
      await db.prepare("INSERT INTO products (name,category,unit,price_cents,stock,avg_cost_cents,min_stock,kind,created_at) VALUES (?,?,?,?,0,?,?,?,?)").bind(name,section,"un",price,unitCost,kind === "untracked" ? 0 : min,kind,now).run();
    } else if (body.type === "productEdit") {
      const id = positive(body.productId);
      const name = String(body.name || "").trim().slice(0,100);
      if (!name) throw new Error("Informe o nome do produto");
      const section = category(body.category);
      const price = money(body.price);
      if (!price) throw new Error("Informe o preço normal por unidade");
      const promo = body.promoPrice === null || body.promoPrice === "" || body.promoPrice === undefined ? null : money(body.promoPrice);
      if (promo !== null && (!promo || promo >= price)) throw new Error("O preço promocional deve ser menor que o preço normal");
      const min = Number(body.minStock || 0);
      if (!Number.isSafeInteger(min) || min < 0 || min > 1000000) throw new Error("Estoque mínimo inválido");
      const item = await db.prepare("SELECT kind FROM products WHERE id=?").bind(id).first<{kind:string}>();
      if (!item) throw new Error("Produto não encontrado");
      const cost = item.kind === "stock" ? null : money(body.cost || 0);
      await db.prepare("UPDATE products SET name=?,category=?,price_cents=?,promo_price_cents=?,min_stock=CASE WHEN kind='stock' THEN ? ELSE min_stock END,avg_cost_cents=CASE WHEN kind='stock' THEN avg_cost_cents ELSE ? END WHERE id=?").bind(name,section,price,promo,min,cost,id).run();
    } else if (body.type === "purchase" || body.type === "sale" || body.type === "adjust") {
      const id = positive(body.productId), qty = positive(body.quantity), day = body.type === "sale" ? new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : date(body.date);
      const p = await db.prepare("SELECT id,kind,stock,avg_cost_cents,name FROM products WHERE id=?").bind(id).first<Item>();
      if (!p) throw new Error("Produto não encontrado");
      if (body.type === "purchase") {
        if (p.kind !== "stock") throw new Error("Registre a compra de um ingrediente ou produto de estoque");
        const boxSize = body.boxSize === undefined ? 1 : Number(body.boxSize);
        if (![1,12,24].includes(boxSize)) throw new Error("Escolha unidade avulsa, caixa de 12 ou caixa de 24");
        const units = qty * boxSize;
        if (!Number.isSafeInteger(units) || units > 1000000) throw new Error("Quantidade total inválida");
        const cost = money(body.cost);
        if (!cost) throw new Error("Informe o custo unitário");
        await db.batch([
          db.prepare("UPDATE products SET avg_cost_cents=ROUND((stock*avg_cost_cents+?*?)*1.0/(stock+?)), stock=stock+? WHERE id=?").bind(units,cost,units,units,id),
          db.prepare("INSERT INTO movements (product_id,kind,quantity,table_name,unit_price_cents,unit_cost_cents,business_date,created_at,note) VALUES (?,'purchase',?,NULL,0,?,?,?,?)").bind(id,units,cost,day,now,boxSize===1?null:`${qty} ${qty===1?"caixa":"caixas"} de ${boxSize}`),
        ]);
      } else if (body.type === "adjust") {
        if (p.kind !== "stock") throw new Error("Ajuste o estoque de um ingrediente ou produto físico");
        const direction = body.direction === "add" ? "add" : body.direction === "remove" ? "remove" : null;
        const note = String(body.note || "").trim().slice(0,200);
        if (!direction || !note) throw new Error("Informe o tipo e o motivo do ajuste");
        const delta = direction === "add" ? qty : -qty;
        const result = await db.batch([
          db.prepare("INSERT INTO movements (product_id,kind,quantity,table_name,unit_price_cents,unit_cost_cents,business_date,created_at,note) SELECT id,?,?,NULL,0,avg_cost_cents,?,?,? FROM products WHERE id=? AND stock+?>=0").bind(direction === "add" ? "adjust_in" : "adjust_out",qty,day,now,note,id,delta),
          db.prepare("UPDATE products SET stock=stock+? WHERE id=? AND stock+?>=0").bind(delta,id,delta),
        ]);
        if (!result[0].meta.changes) throw new Error("Saldo insuficiente para este ajuste");
      } else {
        const sessionId = positive(body.sessionId);
        const session = await db.prepare("SELECT t.name FROM table_sessions s JOIN bar_tables t ON t.id=s.table_id WHERE s.id=? AND s.closed_at IS NULL").bind(sessionId).first<{name:string}>();
        if (!session) throw new Error("Abra a comanda da mesa antes de registrar a venda");
        const table = session.name;
        const key = crypto.randomUUID();
        if (p.kind === "untracked" || p.kind === "prepared") {
          const result = await db.prepare("INSERT INTO movements (product_id,kind,quantity,table_name,unit_price_cents,unit_cost_cents,business_date,created_at,sale_key,session_id) SELECT id,'sale',?,?,COALESCE(promo_price_cents,price_cents),avg_cost_cents,?,?,?,? FROM products WHERE id=? AND kind IN ('untracked','prepared') AND EXISTS (SELECT 1 FROM table_sessions WHERE id=? AND closed_at IS NULL)").bind(qty,table,day,now,key,sessionId,id,sessionId).run();
          if (!result.meta.changes) throw new Error("Comanda encerrada ou item indisponível");
        } else {
          if (p.stock < qty) throw new Error("Estoque insuficiente para esta venda");
          const result = await db.batch([
            db.prepare("INSERT INTO movements (product_id,kind,quantity,table_name,unit_price_cents,unit_cost_cents,business_date,created_at,sale_key,session_id) SELECT id,'sale',?,?,COALESCE(promo_price_cents,price_cents),avg_cost_cents,?,?,?,? FROM products WHERE id=? AND stock>=? AND EXISTS (SELECT 1 FROM table_sessions WHERE id=? AND closed_at IS NULL)").bind(qty,table,day,now,key,sessionId,id,qty,sessionId),
            db.prepare("UPDATE products SET stock=stock-? WHERE id=? AND EXISTS (SELECT 1 FROM movements WHERE sale_key=?)").bind(qty,id,key),
          ]);
          if (!result[0].meta.changes) throw new Error("Comanda encerrada ou estoque insuficiente para esta venda");
        }
      }
    } else throw new Error("Operação inválida");
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao salvar";
    console.error(e);
    return Response.json({ error: message }, { status: 400 });
  }
}
