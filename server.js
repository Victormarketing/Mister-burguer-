// Mister Burguer — Fase 1. Node 22+, sem dependências: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(process.env.DB||path.join(__dirname,'data.db'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT,pos INT);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,cat INT,name TEXT,descr TEXT,price REAL,active INT DEFAULT 1,img TEXT,pos INT);
CREATE TABLE IF NOT EXISTS addons(id INTEGER PRIMARY KEY,name TEXT,price REAL,active INT DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,created TEXT,status TEXT,type TEXT,name TEXT,phone TEXT,addr TEXT,table_no TEXT,pay TEXT,change_for REAL,notes TEXT,subtotal REAL,fee REAL,total REAL,items TEXT);
CREATE TABLE IF NOT EXISTS sessions(t TEXT PRIMARY KEY,exp INT);`);
const get=k=>db.prepare('SELECT v FROM settings WHERE k=?').get(k)?.v;
const set=(k,v)=>db.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k,String(v));
const hash=(p,s=crypto.randomBytes(16).toString('hex'))=>s+':'+crypto.scryptSync(p,s,32).toString('hex');
const check=(p,h)=>{const[s,x]=h.split(':');return crypto.timingSafeEqual(Buffer.from(hash(p,s).split(':')[1],'hex'),Buffer.from(x,'hex'))};

// ---- seed inicial (tudo editável depois no admin) ----
if(!db.prepare('SELECT 1 FROM categories').get()){
 const S={
 'Lanches':`AMERICANO|14|Ovo, presunto, mussarela e alface.;MISTO QUENTE|14|2 presuntos, 2 mussarelas.;BAURU|14|2 presuntos, 2 mussarelas e tomate.;X-BAGUNÇA|30|Hambúrguer, presunto, mussarela, bacon, calabresa, ovo, 2 salsichas, milho, batata, alface e tomate.;X-FRANGO|26|Filé de frango, presunto, mussarela, milho, alface e tomate.;X-CALABRESA|26|Hambúrguer, presunto, mussarela, calabresa, alface e tomate.;X-BACON|26|Hambúrguer, presunto, mussarela, bacon, alface e tomate.;X-EGG BACON|27|Hambúrguer, presunto, mussarela, bacon, ovo, alface e tomate.;X-EGG|25|Hambúrguer, presunto, mussarela, ovo, alface e tomate.;X-SALADA|23|Hambúrguer, presunto, mussarela, alface e tomate.;X-SALADA ESPECIAL|27|Hambúrguer, presunto, mussarela, ovo, salsicha, milho, batata, alface e tomate.;X-BURGUER|21.5|Hambúrguer, presunto e mussarela.;X-CAMPO GRANDE|30|Filé de frango, presunto, mussarela, ovo, milho, bacon, alface e tomate.;X-MEGA PIT BULL|36|2 hambúrgueres, 2 salsichas, 2 ovos, 2 presuntos, 2 mussarelas, bacon, calabresa, milho, batata, alface e tomate.;X-FRANGO CATUPIRY|28|Filé de frango, presunto, mussarela, milho, batata, catupiry, alface e tomate.;X-GOSTOSO|27|Hambúrguer, presunto, mussarela, milho, batata, catupiry, alface e tomate.;X-LIGHT|25|Pão prensado, filé de frango, milho, alface e tomate.;X-PAULISTINHA|32|Filé mignon, milho, batata, bacon, ovo, presunto, mussarela, alface e tomate.;X-MIGNON|30|Filé mignon, milho, batata, presunto, 2 mussarelas, alface e tomate.;X-PONTA DE COSTELA|27|Hambúrguer de ponta de costela 150g, presunto, duplo queijo, alface e tomate.;X-MISTER BURGUER|40|Hambúrguer, 2 salsichas, filé de frango, filé mignon, 2 ovos, bacon, calabresa, 2 presuntos, 2 mussarelas, milho, batata, alface e tomate.;X-VEGETARIANO|25|Ovo, catupiry, duplo queijo, milho, batata, alface e tomate.`,
 'Hot Dogs / Prensados':`PRENSADO SIMPLES|22|2 salsichas, milho, batata, presunto e mussarela.;PRENSADO ESPECIAL|24|2 salsichas, milho, batata, presunto, mussarela, bacon, calabresa, alface e tomate.;HOT DOG|12|Molho, 1 salsicha, milho e batata.;HOT DOG À MODA DA CASA|15|Molho, 2 salsichas, milho, batata e mussarela.;HOT DOG ESPECIAL|16|Molho, 2 salsichas, milho, batata, presunto, mussarela e bacon.;HOT DOG SUPER ESPECIAL|18|Molho, 2 salsichas, milho, batata, presunto, mussarela, bacon e catupiry.`,
 'Combos':`COMBO CAMPO GRANDE|76.9|2 X-Campo Grande, 1 batata 300g, 1 refrigerante 1L (Coca ou Guaraná).;COMBO SALADA ESPECIAL|71.9|2 X-Salada Especial, 1 refrigerante 1L, 1 batata 300g.;COMBO BAGUNÇA|76.9|2 X-Bagunça, 1 batata 300g, 1 refrigerante 1L.;COMBO HOT DOG SUPER ESPECIAL|55.9|2 Hot Dog Super Especial, 2 refrigerantes mini, 1 batata 300g.;COMBO ESPECIAL|39.9|1 X-Salada Especial, 1 refrigerante mini, 1 batata 150g.;COMBO MEGA PITBULL|56.9|1 X-Mega Pitbull, 1 Coca ou Guaraná 1L, 1 batata 300g.;COMBO SALADA|35.9|1 X-Salada, 1 refrigerante mini, 1 batata 150g.`,
 'Batatas':`Batata Frita 150g|0|Defina o preço no admin.|0;Batata Frita 300g|0|Defina o preço no admin.|0`,
 'Bebidas':`Coca-Cola 1L|9|;Coca-Cola 1,5L|14|;Refrigerante lata 350ml|6.5|;Refrigerante mini|5.5|;Refrigerante 2L|16|;Suco Del Valle 290ml|6|Uva ou pêssego.`,
 'Cervejas':`Skol lata 269ml|6|;Brahma lata 269ml|6|;Amstel lata 269ml|6|`};
 let ci=0;for(const[n,l]of Object.entries(S)){const c=db.prepare('INSERT INTO categories(name,pos) VALUES(?,?)').run(n,ci++).lastInsertRowid;let p=0;
  for(const row of l.split(';')){const[a,b,d,act]=row.split('|');db.prepare('INSERT INTO products(cat,name,descr,price,active,pos) VALUES(?,?,?,?,?,?)').run(c,a,d||'',+b,act===undefined?1:+act,p++)}}
 for(const r of 'Catupiry|7;Bacon|7;Hambúrguer|9;Cebola|3;Salsicha|5;Filé Mignon|12;Milho|3;Presunto|4;Ovo|4;Calabresa|7;Hambúrguer ponta de costela|11;Frango|7;Mussarela|4.5;Batata|3'.split(';')){const[a,b]=r.split('|');db.prepare('INSERT INTO addons(name,price) VALUES(?,?)').run(a,+b)}
 Object.entries({store_name:'Mister Burguer',slogan:'A qualidade faz a diferença',whatsapp:'5567991553835',pix:'67991553835',address:'Rua Ana Luiza de Souza, 271 — em frente ao Pet Shop 4 Patas',instagram:'@misterburguer.cg.ofc',open:'18:00',close:'00:00',mode:'auto',delivery_fee:'0',min_order:'0',eta:'40 min'}).forEach(([k,v])=>set(k,v));
}
// fotos reais (só preenche se o produto ainda não tem foto; depois o admin poderá trocar)
for(const[n,f]of Object.entries({'X-SALADA ESPECIAL':'x-salada-especial.jpg','X-MEGA PIT BULL':'x-mega-pit-bull.jpg','X-MISTER BURGUER':'x-mister-burguer.jpg','X-EGG BACON':'x-egg-bacon.jpg','X-SALADA':'x-salada.jpg'}))db.prepare('UPDATE products SET img=? WHERE name=? AND img IS NULL').run('/img/'+f,n);
// Acesso do dono: criado na tela de primeiro acesso (/admin). Opcional: ADMIN_EMAIL + ADMIN_PASSWORD no ambiente.
if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){set('admin_email',process.env.ADMIN_EMAIL.trim().toLowerCase());set('admin_hash',hash(process.env.ADMIN_PASSWORD))}

// ---- regras ----
const TZ='America/Campo_Grande';
function isOpen(){const m=get('mode');if(m==='open')return true;if(m==='closed')return false;
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).split(':').map(Number),n=p[0]*60+p[1];
 const t=s=>{const[h,mi]=s.split(':').map(Number);return h*60+mi},a=t(get('open')),b=t(get('close'))||1440;return a<=b?n>=a&&n<b:n>=a||n<b}
const STATUS=['NOVO','ACEITO','PREPARANDO','PRONTO','SAIU PARA ENTREGA','ENTREGUE','CANCELADO'];
const pub=()=>Object.fromEntries(['store_name','slogan','whatsapp','address','instagram','eta','min_order'].map(k=>[k,get(k)]));
const clean=(s,n=200)=>String(s??'').replace(/[<>]/g,'').trim().slice(0,n);

function createOrder(b){
 if(!isOpen())throw[409,'Estamos fechados no momento. Volte no horário de funcionamento.'];
 if(!['delivery','pickup','table'].includes(b.type))throw[400,'Modalidade inválida.'];
 const name=clean(b.name,80),phone=clean(b.phone,20).replace(/\D/g,'');
 if(name.length<2)throw[400,'Informe seu nome.'];if(phone.length<10)throw[400,'Informe um WhatsApp válido com DDD.'];
 let addr='',tbl='';
 if(b.type==='delivery'){const a=b.addr||{};if(!a.street||!a.number||!a.hood)throw[400,'Informe rua, número e bairro.'];addr=[a.street,a.number,a.hood,a.comp,a.ref&&('Ref: '+a.ref)].filter(Boolean).map(x=>clean(x,100)).join(', ')}
 if(b.type==='table'){tbl=clean(b.table,10);if(!tbl)throw[400,'Informe o número da mesa.']}
 if(!['PIX','DINHEIRO','DEBITO','CREDITO'].includes(b.pay))throw[400,'Forma de pagamento inválida.'];
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>40)throw[400,'Carrinho vazio.'];
 let sub=0;const items=b.items.map(i=>{
  const p=db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(+i.id),q=Math.floor(+i.qty);
  if(!p)throw[400,'Um item do carrinho não está mais disponível.'];if(!(q>=1&&q<=50))throw[400,'Quantidade inválida.'];
  const ad=(i.addons||[]).slice(0,20).map(id=>db.prepare('SELECT name,price FROM addons WHERE id=? AND active=1').get(+id)).filter(Boolean);
  const unit=p.price+ad.reduce((s,a)=>s+a.price,0),tot=Math.round(unit*q*100)/100;sub+=tot;
  return{name:p.name,qty:q,unit,addons:ad,note:clean(i.note,120),total:tot}});
 const fee=b.type==='delivery'?+get('delivery_fee'):0,total=Math.round((sub+fee)*100)/100;
 if(sub<+get('min_order'))throw[400,'Pedido abaixo do mínimo.'];
 let change=null;if(b.pay==='DINHEIRO'&&b.change){change=+b.change;if(!(change>=total))throw[400,'O troco deve ser para um valor maior ou igual ao total.']}
 db.exec('BEGIN');try{ // aqui entrarão também estoque e caixa na mesma transação (Fase 3)
  const id=db.prepare('INSERT INTO orders(created,status,type,name,phone,addr,table_no,pay,change_for,notes,subtotal,fee,total,items) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .run(new Date().toISOString(),'NOVO',b.type,name,phone,addr,tbl,b.pay,change,clean(b.notes,300),sub,fee,total,JSON.stringify(items)).lastInsertRowid;db.exec('COMMIT');
  return{id:Number(id),number:'#'+String(id).padStart(4,'0'),subtotal:sub,fee,total,items,eta:get('eta')}}catch(e){db.exec('ROLLBACK');throw e}}

// ---- http ----
const fails=new Map();
const cookie=req=>{const t=crypto.randomUUID();db.prepare('INSERT INTO sessions VALUES(?,?)').run(t,Date.now()+12*36e5);return `mb=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${req.headers['x-forwarded-proto']==='https'?'; Secure':''}`};
const body=req=>new Promise((ok,no)=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e6){no([413,'Muito grande']);req.destroy()}});req.on('end',()=>{try{ok(d?JSON.parse(d):{})}catch{no([400,'JSON inválido'])}})});
const send=(res,c,o,h={})=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store',...h});res.end(JSON.stringify(o))};
const authed=req=>{const t=(req.headers.cookie||'').match(/mb=([\w-]+)/)?.[1];return t&&db.prepare('SELECT 1 FROM sessions WHERE t=? AND exp>?').get(t,Date.now())};
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};

http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://x'),p=u.pathname,m=req.method;
 if(p==='/api/menu')return send(res,200,{open:isOpen(),store:pub(),categories:db.prepare('SELECT * FROM categories ORDER BY pos').all().map(c=>({...c,products:db.prepare('SELECT id,name,descr,price,img FROM products WHERE cat=? AND active=1 ORDER BY pos').all(c.id)})).filter(c=>c.products.length),addons:db.prepare('SELECT id,name,price FROM addons WHERE active=1').all()});
 if(p==='/api/order'&&m==='POST'){try{return send(res,201,createOrder(await body(req)))}catch(e){if(Array.isArray(e))return send(res,e[0],{error:e[1]});throw e}}
 if(p==='/api/admin/status')return send(res,200,{setup:!get('admin_hash')});
 if(p==='/api/admin/setup'&&m==='POST'){if(get('admin_hash'))return send(res,403,{error:'O acesso do dono já foi criado.'});const b=await body(req),em=String(b.email||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return send(res,400,{error:'Informe um e-mail válido.'});if(String(b.password||'').length<8)return send(res,400,{error:'A senha precisa ter pelo menos 8 caracteres.'});
  set('admin_email',em);set('admin_hash',hash(String(b.password)));return send(res,200,{ok:1},{'Set-Cookie':cookie(req)})}
 if(p==='/api/admin/login'&&m==='POST'){const ip=req.socket.remoteAddress,f=fails.get(ip)||[],now=Date.now(),r=f.filter(t=>now-t<6e5);
  if(r.length>=5)return send(res,429,{error:'Muitas tentativas. Aguarde 10 minutos.'});
  const b=await body(req),hh=get('admin_hash');if(!hh||String(b.email||'').trim().toLowerCase()!==get('admin_email')||!check(String(b.password||''),hh)){r.push(now);fails.set(ip,r);return send(res,401,{error:'E-mail ou senha incorretos.'})}
  return send(res,200,{ok:1},{'Set-Cookie':cookie(req)})}
 if(p.startsWith('/api/admin/')){
  if(!authed(req))return send(res,401,{error:'Não autorizado.'});
  if(p==='/api/admin/orders'&&m==='GET')return send(res,200,db.prepare("SELECT * FROM orders WHERE created>? ORDER BY id DESC LIMIT 300").all(new Date(Date.now()-3*864e5).toISOString()).map(o=>({...o,items:JSON.parse(o.items)})));
  let x;if(x=p.match(/^\/api\/admin\/orders\/(\d+)$/)){const b=await body(req);if(!STATUS.includes(b.status))return send(res,400,{error:'Status inválido.'});db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status,+x[1]);return send(res,200,{ok:1})}
  if(p==='/api/admin/products'&&m==='GET')return send(res,200,db.prepare('SELECT p.*,c.name cat_name FROM products p JOIN categories c ON c.id=p.cat ORDER BY c.pos,p.pos').all());
  if(x=p.match(/^\/api\/admin\/products\/(\d+)$/)){const b=await body(req);if(!(+b.price>=0)||clean(b.name).length<2)return send(res,400,{error:'Dados inválidos.'});
   db.prepare('UPDATE products SET name=?,descr=?,price=?,active=? WHERE id=?').run(clean(b.name,80),clean(b.descr,400),+b.price,b.active?1:0,+x[1]);return send(res,200,{ok:1})}
  if(p==='/api/admin/settings'){if(m==='PUT'){const b=await body(req);for(const k of['store_name','slogan','whatsapp','pix','address','instagram','open','close','mode','delivery_fee','min_order','eta'])if(b[k]!==undefined)set(k,clean(b[k],200))}
   return send(res,200,Object.fromEntries(db.prepare("SELECT k,v FROM settings WHERE k!='admin_hash'").all().map(r=>[r.k,r.v])))}
  return send(res,404,{error:'Não encontrado'})}
 const f=p==='/'?'index.html':p==='/admin'?'admin.html':p.slice(1),fp=path.join(__dirname,'public',f);
 if(!fp.startsWith(path.join(__dirname,'public'))||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);return res.end('Não encontrado')}
 res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);
}catch(e){console.error(e);send(res,Array.isArray(e)?e[0]:500,{error:Array.isArray(e)?e[1]:'Erro interno.'})}}).listen(process.env.PORT||3000,()=>console.log('Mister Burguer em http://localhost:'+(process.env.PORT||3000)));
