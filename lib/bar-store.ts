import { filterDemoData, type Data, type Product, type Movement, type TableSession } from "./demo-data";

const url = "https://ktgbyjuttlriaasqyzvt.supabase.co/rest/v1/bar_state";
// Chave publicável; permissões efetivas são definidas pelas políticas RLS do banco.
const key = "sb_publishable_j4hNM6LDx3y7zk8LLTcTkQ_ABH_d1-v";
const headers = { apikey: key };
type Payload = Pick<Data, "products" | "tables" | "sessions" | "sessionSales" | "movements">;
type State = { version: number; payload: Payload };
const emptySummary = { revenue: 0, cost: 0, invested: 0, losses: 0, units: 0 };
const iso = () => new Date().toISOString();
const nextId = (items: { id: number }[]) => Math.max(0, ...items.map(item => item.id)) + 1;
const integer = (value: unknown, name: string, minimum = 1) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) throw new Error(`${name} inválido.`);
  return number;
};
const cents = (value: unknown, name: string, allowZero = false) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0) || number > 1000000) throw new Error(`${name} inválido.`);
  return Math.round(number * 100);
};
const required = (value: unknown, name: string) => {
  const text = String(value ?? "").trim();
  if (!text || text.length > 100) throw new Error(`${name} inválido.`);
  return text;
};
const date = (value: unknown) => {
  const text = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) throw new Error("Data inválida.");
  return text;
};
export function toData(payload: Payload): Data {
  return filterDemoData({ ...payload, summary: emptySummary, byTable: [], byDay: [] }, ["0000-01-01", "9999-12-31"]);
}
export async function readState(): Promise<State> {
  const response = await fetch(`${url}?id=eq.1&select=version,payload`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Banco indisponível (${response.status}).`);
  const rows = await response.json() as State[];
  if (rows.length !== 1) throw new Error("Estado do bar não encontrado no banco.");
  return rows[0];
}
export async function saveOperation(type: string, body: Record<string, unknown>): Promise<Data> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readState();
    const payload: Payload = structuredClone(current.payload);
    applyOperation(payload, type, body);
    const response = await fetch(`${url}?id=eq.1&version=eq.${current.version}&select=version`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ version: current.version + 1, payload }),
    });
    if (!response.ok) throw new Error(`Não foi possível salvar (${response.status}).`);
    const rows = await response.json() as { version: number }[];
    if (rows.length === 1) return toData(payload);
  }
  throw new Error("Outro atendimento alterou os dados. Tente novamente.");
}
function applyOperation(state: Payload, type: string, body: Record<string, unknown>) {
  const productById = (id: unknown) => {
    const product = state.products.find(item => item.id === integer(id, "Produto"));
    if (!product) throw new Error("Produto não encontrado.");
    return product;
  };
  const sessionById = (id: unknown) => {
    const session = state.sessions.find(item => item.id === integer(id, "Comanda"));
    if (!session) throw new Error("Comanda não encontrada.");
    return session;
  };
  if (type === "tableCreate") {
    const number = integer(body.name, "Número da mesa");
    if (number > 50 || state.tables.some(t => Number(t.name.replace(/^Mesa\s+/i, "")) === number)) throw new Error("Mesa já existe ou está fora do intervalo.");
    state.tables.push({ id: nextId(state.tables), name: `Mesa ${String(number).padStart(2, "0")}` });
  } else if (type === "sessionOpen") {
    const tableId = integer(body.tableId, "Mesa");
    if (!state.tables.some(t => t.id === tableId) || state.sessions.some(s => s.table_id === tableId && !s.closed_at)) throw new Error("Mesa indisponível.");
    state.sessions.unshift({ id: nextId(state.sessions), table_id: tableId, opened_at: iso(), closed_at: null, paid_at: null, total_cents: 0, item_count: 0 });
  } else if (type === "sessionClose" || type === "sessionPay") {
    const session = sessionById(body.sessionId);
    if (session.paid_at || (type === "sessionClose" && session.closed_at)) throw new Error("Comanda já finalizada.");
    if (type === "sessionPay" && session.item_count < 1) throw new Error("A comanda está vazia.");
    session.closed_at ??= iso();
    if (type === "sessionPay") session.paid_at = iso();
  } else if (type === "product") {
    const kind = body.kind === "stock" ? "stock" : "untracked";
    const product: Product = { id: nextId(state.products), name: required(body.name, "Nome"), unit: "un", category: required(body.category, "Seção"), kind, price_cents: cents(body.price, "Preço"), promo_price_cents: null, stock: 0, avg_cost_cents: kind === "stock" ? 0 : cents(body.cost, "Custo", true), min_stock: kind === "stock" ? integer(body.minStock, "Estoque mínimo", 0) : 0 };
    if (state.products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) throw new Error("Produto já cadastrado.");
    state.products.push(product);
  } else if (type === "productEdit") {
    const product = productById(body.productId);
    product.name = required(body.name, "Nome");
    product.category = required(body.category, "Seção");
    product.price_cents = cents(body.price, "Preço");
    product.promo_price_cents = body.promoPrice == null ? null : cents(body.promoPrice, "Preço promocional");
    if (product.kind === "stock") product.min_stock = integer(body.minStock, "Estoque mínimo", 0);
    else product.avg_cost_cents = cents(body.cost, "Custo", true);
  } else if (type === "sale") {
    const session = sessionById(body.sessionId);
    const product = productById(body.productId);
    const quantity = integer(body.quantity, "Quantidade");
    if (session.closed_at || (product.kind === "stock" && product.stock < quantity)) throw new Error("Comanda fechada ou estoque insuficiente.");
    const price = product.promo_price_cents ?? product.price_cents;
    const businessDate = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const table = state.tables.find(t => t.id === session.table_id)!;
    const movement: Movement = { id: nextId(state.movements), session_id: session.id, product_id: product.id, product_name: product.name, kind: "sale", quantity, table_name: table.name, unit: product.unit, unit_price_cents: price, unit_cost_cents: product.avg_cost_cents, business_date: businessDate, created_at: iso(), note: null };
    state.movements.unshift(movement);
    state.sessionSales.push({ id: nextId(state.sessionSales), session_id: session.id, product_id: product.id, quantity, unit_price_cents: price, unit_cost_cents: product.avg_cost_cents, business_date: businessDate, created_at: movement.created_at, product_name: product.name, unit: product.unit });
    if (product.kind === "stock") product.stock -= quantity;
    session.total_cents += quantity * price;
    session.item_count++;
  } else if (type === "purchase" || type === "adjust") {
    const product = productById(body.productId);
    if (product.kind !== "stock") throw new Error("Produto sem contagem de estoque.");
    const quantity = integer(body.quantity, "Quantidade") * (type === "purchase" ? integer(body.boxSize, "Formato") : 1);
    const business_date = date(body.date);
    const direction = type === "purchase" ? "purchase" : body.direction === "add" ? "adjust_in" : "adjust_out";
    if (type === "purchase" && ![1, 12, 24].includes(Number(body.boxSize))) throw new Error("Formato inválido.");
    if (direction === "adjust_out" && product.stock < quantity) throw new Error("Estoque insuficiente.");
    const cost = type === "purchase" ? cents(body.cost, "Custo") : product.avg_cost_cents;
    const before = product.stock;
    if (direction === "purchase") { product.stock += quantity; product.avg_cost_cents = Math.round((before * product.avg_cost_cents + quantity * cost) / product.stock); }
    else product.stock += direction === "adjust_in" ? quantity : -quantity;
    state.movements.unshift({ id: nextId(state.movements), product_id: product.id, product_name: product.name, kind: direction, quantity, table_name: null, unit: product.unit, unit_price_cents: 0, unit_cost_cents: cost, business_date, created_at: iso(), note: type === "purchase" ? `${body.quantity} ${Number(body.boxSize) === 1 ? "unidades" : `caixas de ${body.boxSize}`}` : required(body.note, "Motivo") });
  } else throw new Error("Operação desconhecida.");
}
