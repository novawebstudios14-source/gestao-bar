// Dados inventados para visualizar o painel. Nenhum lançamento é persistido.
export type Product = { id:number; name:string; category:string; unit:string; price_cents:number; promo_price_cents:number|null; stock:number; avg_cost_cents:number; min_stock:number; kind:"stock"|"untracked"|"prepared" };
export type Movement = { id:number; session_id?:number; product_id:number; product_name:string; kind:string; quantity:number; table_name:string|null; unit:string; unit_price_cents:number; unit_cost_cents:number; business_date:string; created_at:string; note:string|null };
export type BarTable = {id:number;name:string};
export type TableSession = {id:number;table_id:number;opened_at:string;closed_at:string|null;paid_at:string|null;total_cents:number;item_count:number};
export type SessionSale = {id:number;session_id:number;product_id:number;quantity:number;unit_price_cents:number;unit_cost_cents:number;business_date:string;created_at:string;product_name:string;unit:string};
export type Data = { tables:BarTable[];sessions:TableSession[];sessionSales:SessionSale[];products:Product[]; movements:Movement[]; summary:{revenue:number;cost:number;invested:number;losses:number;units:number}; byTable:{table_name:string;revenue:number;cost:number;units:number}[]; byDay:{business_date:string;revenue:number;cost:number}[] };

const products: Product[] = [
  {id:1,name:"Cerveja Skol lata 350 ml",category:"Cervejas",unit:"un",price_cents:600,promo_price_cents:null,stock:48,avg_cost_cents:320,min_stock:12,kind:"stock"},
  {id:2,name:"Cerveja Brahma lata 350 ml",category:"Cervejas",unit:"un",price_cents:650,promo_price_cents:null,stock:36,avg_cost_cents:350,min_stock:12,kind:"stock"},
  {id:3,name:"Cerveja Heineken long neck 330 ml",category:"Cervejas",unit:"un",price_cents:1400,promo_price_cents:null,stock:18,avg_cost_cents:750,min_stock:8,kind:"stock"},
  {id:4,name:"Coca-Cola lata 350 ml",category:"Refrigerantes",unit:"un",price_cents:550,promo_price_cents:null,stock:24,avg_cost_cents:280,min_stock:12,kind:"stock"},
  {id:5,name:"Coca-Cola 2 L",category:"Refrigerantes",unit:"un",price_cents:1300,promo_price_cents:null,stock:10,avg_cost_cents:750,min_stock:5,kind:"stock"},
  {id:6,name:"Guaraná Antarctica lata 350 ml",category:"Refrigerantes",unit:"un",price_cents:550,promo_price_cents:null,stock:8,avg_cost_cents:280,min_stock:12,kind:"stock"},
  {id:7,name:"Água mineral 500 ml",category:"Águas",unit:"un",price_cents:500,promo_price_cents:null,stock:22,avg_cost_cents:200,min_stock:8,kind:"stock"},
  {id:8,name:"Porção de batata frita",category:"Porções",unit:"un",price_cents:2800,promo_price_cents:null,stock:0,avg_cost_cents:1100,min_stock:0,kind:"untracked"},
  {id:9,name:"Porção de calabresa",category:"Porções",unit:"un",price_cents:3200,promo_price_cents:null,stock:0,avg_cost_cents:1350,min_stock:0,kind:"untracked"},
  {id:10,name:"Hambúrguer da casa",category:"Pratos",unit:"un",price_cents:3400,promo_price_cents:null,stock:0,avg_cost_cents:1450,min_stock:0,kind:"untracked"},
  {id:11,name:"Caipirinha",category:"Outros",unit:"un",price_cents:2200,promo_price_cents:null,stock:0,avg_cost_cents:800,min_stock:0,kind:"untracked"},
];
const tables: BarTable[] = Array.from({length:8},(_,index)=>({id:index+1,name:`Mesa ${String(index+1).padStart(2,"0")}`}));

function dayAt(base: Date, offset: number) {
  const date = new Date(base.getFullYear(),base.getMonth(),base.getDate()+offset);
  return date.toLocaleDateString("sv-SE");
}
function timestamp(day: string, hour: number, minute=0) {
  // UTC explícito para que os horários da comanda sejam estáveis entre navegador e build.
  const [year,month,date]=day.split("-").map(Number);
  return new Date(Date.UTC(year,month-1,date,hour+3,minute)).toISOString();
}

export function createDemoData(base=new Date()): Data {
  const today=dayAt(base,0);
  const yesterday=dayAt(base,-1);
  const weekStart=dayAt(base,-((base.getDay()+6)%7));
  const monthStart=dayAt(new Date(base.getFullYear(),base.getMonth(),1),0);
  const previousMonth=dayAt(new Date(base.getFullYear(),base.getMonth()-1,15),0);
  const days=[today,today,yesterday,weekStart,monthStart,previousMonth];
  const tableIds=[1,3,2,4,5,1];
  const sessions:TableSession[]=days.map((day,index)=>{
    const opened_at=timestamp(day,index===0?18:index===1?19:17);
    const paid=index>=1;
    return {id:index+1,table_id:tableIds[index],opened_at,closed_at:paid?timestamp(day,21):null,paid_at:paid?timestamp(day,21):null,total_cents:0,item_count:0};
  });
  const sessionSales:SessionSale[]=[];
  const movements:Movement[]=[];
  const addSale=(sessionId:number,productId:number,quantity:number,hour:number,minute=0)=>{
    const session=sessions[sessionId-1], product=products.find(p=>p.id===productId)!;
    const business_date=days[sessionId-1], created_at=timestamp(business_date,hour,minute), id=movements.length+1;
    sessionSales.push({id,session_id:sessionId,product_id:productId,quantity,unit_price_cents:product.price_cents,unit_cost_cents:product.avg_cost_cents,business_date,created_at,product_name:product.name,unit:product.unit});
    movements.push({id,session_id:sessionId,product_id:productId,product_name:product.name,kind:"sale",quantity,table_name:tables[session.table_id-1].name,unit:product.unit,unit_price_cents:product.price_cents,unit_cost_cents:product.avg_cost_cents,business_date,created_at,note:null});
    session.total_cents+=quantity*product.price_cents;
    session.item_count++;
  };
  addSale(1,1,3,18,12); addSale(1,8,1,18,20); addSale(1,4,2,18,32);
  addSale(2,3,2,19,6); addSale(2,10,2,19,10); addSale(2,7,2,19,17);
  addSale(3,2,4,17,15); addSale(3,9,1,17,42); addSale(3,6,2,18,10);
  addSale(4,1,6,17,20); addSale(4,8,2,17,38); addSale(4,11,2,18,15);
  addSale(5,5,2,17,30); addSale(5,10,3,18,5); addSale(5,4,4,18,40);
  addSale(6,3,3,17,14); addSale(6,9,2,17,35); addSale(6,7,3,18,20);
  const addPurchase=(productId:number,quantity:number,day:string,note:string)=>{
    const product=products.find(p=>p.id===productId)!;
    movements.push({id:movements.length+1,product_id:productId,product_name:product.name,kind:"purchase",quantity,table_name:null,unit:product.unit,unit_price_cents:0,unit_cost_cents:product.avg_cost_cents,business_date:day,created_at:timestamp(day,10),note});
  };
  addPurchase(1,72,weekStart,"3 caixas de 24 unidades");
  addPurchase(4,48,weekStart,"4 caixas de 12 unidades");
  addPurchase(3,24,monthStart,"1 caixa de 24 unidades");
  addPurchase(5,12,previousMonth,"12 unidades avulsas");
  movements.push({id:movements.length+1,product_id:6,product_name:products[5].name,kind:"adjust_out",quantity:2,table_name:null,unit:"un",unit_price_cents:0,unit_cost_cents:280,business_date:yesterday,created_at:timestamp(yesterday,13),note:"Latas amassadas"});
  movements.sort((a,b)=>b.business_date.localeCompare(a.business_date)||b.id-a.id);
  sessions.sort((a,b)=>b.opened_at.localeCompare(a.opened_at)||b.id-a.id);
  return filterDemoData({products,tables,sessions,sessionSales,movements,summary:{revenue:0,cost:0,invested:0,losses:0,units:0},byTable:[],byDay:[]},["0000-01-01","9999-12-31"]);
}

export function filterDemoData(source:Data,[from,to]:string[]):Data {
  const movements=source.movements.filter(m=>m.business_date>=from&&m.business_date<=to);
  // Receita e custo entram no caixa somente após a confirmação do pagamento.
  const paidSessions=new Map(source.sessions.filter(s=>s.paid_at).map(s=>[s.id,s]));
  const sales=source.sessionSales.flatMap(s=>{
    const session=paidSessions.get(s.session_id);
    if(!session?.paid_at) return [];
    const paidDate=new Date(session.paid_at).toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"});
    if(paidDate<from||paidDate>to) return [];
    const table_name=source.tables.find(t=>t.id===session.table_id)?.name;
    return table_name?[{...s,table_name,business_date:paidDate}]:[];
  });
  const summary={
    revenue:sales.reduce((sum,m)=>sum+m.quantity*m.unit_price_cents,0),
    cost:sales.reduce((sum,m)=>sum+m.quantity*m.unit_cost_cents,0),
    invested:movements.filter(m=>m.kind==="purchase").reduce((sum,m)=>sum+m.quantity*m.unit_cost_cents,0),
    losses:movements.filter(m=>m.kind==="adjust_out").reduce((sum,m)=>sum+m.quantity*m.unit_cost_cents,0),
    units:sales.reduce((sum,m)=>sum+m.quantity,0),
  };
  const byTable=Array.from(new Set(sales.map(m=>m.table_name).filter((name):name is string=>!!name)),table_name=>{
    const rows=sales.filter(m=>m.table_name===table_name);
    return {table_name,revenue:rows.reduce((sum,m)=>sum+m.quantity*m.unit_price_cents,0),cost:rows.reduce((sum,m)=>sum+m.quantity*m.unit_cost_cents,0),units:rows.reduce((sum,m)=>sum+m.quantity,0)};
  }).sort((a,b)=>b.revenue-a.revenue);
  const byDay=Array.from(new Set(sales.map(m=>m.business_date)),business_date=>{
    const rows=sales.filter(m=>m.business_date===business_date);
    return {business_date,revenue:rows.reduce((sum,m)=>sum+m.quantity*m.unit_price_cents,0),cost:rows.reduce((sum,m)=>sum+m.quantity*m.unit_cost_cents,0)};
  }).sort((a,b)=>a.business_date.localeCompare(b.business_date));
  return {...source,movements,summary,byTable,byDay};
}
