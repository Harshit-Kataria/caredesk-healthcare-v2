const express=require('express');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const rateLimit=require('express-rate-limit');
const cron=require('node-cron');
const{WebSocketServer}=require('ws');
const{z}=require('zod');
const{DatabaseSync}=require('node:sqlite');
const{createCache}=require('./src/services/cache');
const{createAssistant}=require('./src/services/ai');
const{createPaymentService}=require('./src/services/payment');
const{listAppointmentReport}=require('./src/repositories/appointmentReport');
const{createRequestTracker}=require('./src/concepts/javascriptConcepts');

const root=__dirname,dataDir=process.env.DATA_DIR||path.join(root,'data');fs.mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'caredesk.sqlite'));db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS doctors(id TEXT PRIMARY KEY,name TEXT NOT NULL,specialty TEXT NOT NULL,email TEXT,phone TEXT,ownerId TEXT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT,phone TEXT,dob TEXT,notes TEXT,ownerId TEXT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,doctorId TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,date TEXT NOT NULL,time TEXT NOT NULL,duration INTEGER NOT NULL,status TEXT NOT NULL,reason TEXT,ownerId TEXT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY,ownerId TEXT,event TEXT,entityType TEXT,entityId TEXT,createdAt INTEGER);
CREATE INDEX IF NOT EXISTS appointment_schedule ON appointments(ownerId,date,time,doctorId);`);
const id=()=>crypto.randomUUID(),secret=process.env.JWT_SECRET||'development-only-change-me';
const legacyHash=p=>{const salt=crypto.randomBytes(16).toString('hex');return`${salt}:${crypto.pbkdf2Sync(p,salt,150000,32,'sha256').toString('hex')}`};
const verifyPassword=async(p,s)=>{if(s.startsWith('$2'))return bcrypt.compare(p,s);const[a,b]=s.split(':');if(!a||!b)return false;return crypto.timingSafeEqual(crypto.pbkdf2Sync(p,a,150000,32,'sha256'),Buffer.from(b,'hex'))};
if(!db.prepare('SELECT id FROM users LIMIT 1').get())db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id(),process.env.ADMIN_EMAIL||'admin@caredesk.local',legacyHash(process.env.ADMIN_PASSWORD||'Admin@123'),'admin');
const originalOwner=db.prepare("SELECT id FROM users WHERE role='admin' ORDER BY rowid LIMIT 1").get()?.id;
for(const table of['doctors','patients','appointments']){if(!db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name==='ownerId'))db.exec(`ALTER TABLE ${table} ADD COLUMN ownerId TEXT REFERENCES users(id)`);db.prepare(`UPDATE ${table} SET ownerId=? WHERE ownerId IS NULL`).run(originalOwner);db.exec(`CREATE INDEX IF NOT EXISTS ${table}_owner ON ${table}(ownerId)`)}

const tables={doctors:['name','specialty','email','phone'],patients:['name','email','phone','dob','notes'],appointments:['patientId','doctorId','date','time','duration','status','reason']};
const emailSchema=z.string().trim().toLowerCase().email().max(200),authSchema=z.object({email:emailSchema,password:z.string().min(8).max(128)}),assistantSchema=z.object({question:z.string().min(2).max(1000)});
function validate(type,input,ownerId,recordId){
 if(type==='doctors'||type==='patients'){const item=Object.fromEntries(tables[type].map(k=>[k,String(input[k]??'').trim()]));if(!item.name||item.name.length>100)return'Name is required and must be under 100 characters.';if(item.email&&!emailSchema.safeParse(item.email).success)return'Enter a valid email address.';if(item.phone.length>30)return'Phone number is too long.';if(type==='doctors'&&!item.specialty)return'Specialty is required.';if(type==='patients'&&item.dob&&!/^\d{4}-\d{2}-\d{2}$/.test(item.dob))return'Enter a valid date of birth.';if(type==='patients'&&item.notes.length>2000)return'Notes must be under 2000 characters.';return item}
 const item={patientId:String(input.patientId||''),doctorId:String(input.doctorId||''),date:String(input.date||''),time:String(input.time||''),duration:Number(input.duration),status:String(input.status||''),reason:String(input.reason||'').trim()};
 if(!db.prepare('SELECT id FROM patients WHERE id=? AND ownerId=?').get(item.patientId,ownerId))return'Select a valid patient.';if(!db.prepare('SELECT id FROM doctors WHERE id=? AND ownerId=?').get(item.doctorId,ownerId))return'Select a valid doctor.';if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))return'Enter a valid date and time.';if(![15,30,45,60,90].includes(item.duration))return'Select a valid duration.';if(!['scheduled','completed','cancelled','no-show'].includes(item.status))return'Select a valid status.';if(item.reason.length>300)return'Reason must be under 300 characters.';
 if(item.status!=='cancelled'){const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3)),start=minutes(item.time),end=start+item.duration;const clash=db.prepare('SELECT * FROM appointments WHERE ownerId=? AND date=? AND status<>?').all(ownerId,item.date,'cancelled').find(a=>a.id!==recordId&&(a.doctorId===item.doctorId||a.patientId===item.patientId)&&start<minutes(a.time)+a.duration&&end>minutes(a.time));if(clash)return clash.doctorId===item.doctorId?'This doctor has another appointment during that time.':'This patient has another appointment during that time.'}
 return item;
}
const memoryCacheData=new Map();
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,path:'/ws'}),clients=new Map(),usage={tokens:0,costUsd:0},assistant=createAssistant({usageStore:usage}),payments=createPaymentService(),trackRequest=createRequestTracker();let cache={kind:'memory',async get(k){return memoryCacheData.get(k)||null},async set(k,v){memoryCacheData.set(k,v)},async delPrefix(prefix){for(const key of memoryCacheData.keys())if(key.startsWith(prefix))memoryCacheData.delete(key)}};
app.disable('x-powered-by');app.use(express.json({limit:'100kb'}));app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});next()});
app.use((req,res,next)=>{req.requestNumber=trackRequest();next()});
const authLimiter=rateLimit({windowMs:60_000,limit:10,standardHeaders:'draft-8',legacyHeaders:false});
function issue(user){return jwt.sign({sub:user.id,email:user.email,role:user.role},secret,{expiresIn:'7d',jwtid:id(),issuer:'caredesk'})}
function auth(req,res,next){try{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)throw Error();const payload=jwt.verify(token,secret,{issuer:'caredesk'});if(db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires_at>?').get(crypto.createHash('sha256').update(token).digest('hex'),Date.now())){req.user={id:payload.sub,email:payload.email,role:payload.role};req.token=token;return next()}throw Error()}catch{return res.status(401).json({error:'Please sign in.'})}}
const audit=(owner,event,type,entity)=>db.prepare('INSERT INTO audit_events VALUES(?,?,?,?,?,?)').run(id(),owner,event,type,entity,Date.now());
function storeSession(token,userId){db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(crypto.createHash('sha256').update(token).digest('hex'),userId,Date.now()+7*86400000)}
async function signup(req,res){const parsed=authSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Enter a valid email and an 8–128 character password.'});if(db.prepare('SELECT id FROM users WHERE email=?').get(parsed.data.email))return res.status(409).json({error:'An account with this email already exists.'});const user={id:id(),email:parsed.data.email,role:'owner'};db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(user.id,user.email,await bcrypt.hash(parsed.data.password,12),user.role);const token=issue(user);storeSession(token,user.id);res.status(201).json({token,user})}
async function login(req,res){const parsed=authSchema.safeParse(req.body);if(!parsed.success)return res.status(401).json({error:'Incorrect email or password.'});const user=db.prepare('SELECT * FROM users WHERE email=?').get(parsed.data.email);if(!user||!await verifyPassword(parsed.data.password,user.password_hash))return res.status(401).json({error:'Incorrect email or password.'});const token=issue(user);storeSession(token,user.id);res.json({token,user:{id:user.id,email:user.email,role:user.role}})}
app.post(['/api/auth/signup','/api/signup'],authLimiter,signup);app.post(['/api/auth/login','/api/login'],authLimiter,login);app.get(['/api/auth/me','/api/me'],auth,(req,res)=>res.json({user:req.user}));app.post(['/api/auth/logout','/api/logout'],auth,(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(crypto.createHash('sha256').update(req.token).digest('hex'));res.json({ok:true})});
app.get('/api/dashboard',auth,async(req,res)=>{const key=`dashboard:${req.user.id}`,hit=await cache.get(key);if(hit)return res.json(hit);const today=new Date().toISOString().slice(0,10),result={today_appointments:db.prepare("SELECT COUNT(*) n FROM appointments WHERE ownerId=? AND date=? AND status<>'cancelled'").get(req.user.id,today).n,total_appointments:db.prepare('SELECT COUNT(*) n FROM appointments WHERE ownerId=?').get(req.user.id).n,total_patients:db.prepare('SELECT COUNT(*) n FROM patients WHERE ownerId=?').get(req.user.id).n,active_doctors:db.prepare('SELECT COUNT(*) n FROM doctors WHERE ownerId=?').get(req.user.id).n};await cache.set(key,result,30);res.json(result)});
app.get('/api/reports/appointments',auth,(req,res)=>res.json(listAppointmentReport(db,req.user.id)));
for(const type of Object.keys(tables)){
 app.get(`/api/${type}`,auth,(req,res)=>res.json(db.prepare(`SELECT * FROM ${type} WHERE ownerId=?`).all(req.user.id)));
 app.post(`/api/${type}`,auth,async(req,res)=>{const value=validate(type,req.body,req.user.id);if(typeof value==='string')return res.status(400).json({error:value});const recordId=id(),fields=tables[type];db.prepare(`INSERT INTO ${type}(id,${fields.join(',')},ownerId) VALUES(${Array(fields.length+2).fill('?').join(',')})`).run(recordId,...fields.map(k=>value[k]),req.user.id);audit(req.user.id,'created',type,recordId);await cache.delPrefix(`dashboard:${req.user.id}`);broadcast(req.user.id,{event:'created',type,id:recordId});res.status(201).json({id:recordId,...value})});
 app.put(`/api/${type}/:id`,auth,async(req,res)=>{if(!db.prepare(`SELECT id FROM ${type} WHERE id=? AND ownerId=?`).get(req.params.id,req.user.id))return res.status(404).json({error:'Record not found.'});const value=validate(type,req.body,req.user.id,req.params.id);if(typeof value==='string')return res.status(400).json({error:value});const fields=tables[type];db.prepare(`UPDATE ${type} SET ${fields.map(k=>`${k}=?`).join(',')} WHERE id=? AND ownerId=?`).run(...fields.map(k=>value[k]),req.params.id,req.user.id);audit(req.user.id,'updated',type,req.params.id);broadcast(req.user.id,{event:'updated',type,id:req.params.id});res.json({id:req.params.id,...value})});
 app.delete(`/api/${type}/:id`,auth,(req,res)=>{if(!db.prepare(`SELECT id FROM ${type} WHERE id=? AND ownerId=?`).get(req.params.id,req.user.id))return res.status(404).json({error:'Record not found.'});if(type!=='appointments'&&db.prepare(`SELECT id FROM appointments WHERE ${type==='patients'?'patientId':'doctorId'}=? AND ownerId=?`).get(req.params.id,req.user.id))return res.status(409).json({error:'This record has linked appointments. Delete those appointments first.'});db.prepare(`DELETE FROM ${type} WHERE id=? AND ownerId=?`).run(req.params.id,req.user.id);audit(req.user.id,'deleted',type,req.params.id);broadcast(req.user.id,{event:'deleted',type,id:req.params.id});res.json({ok:true})});
}
app.post('/api/ai/assist',auth,async(req,res)=>{const parsed=assistantSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Question must contain 2–1000 characters.'});const result=await assistant.agent(parsed.data,{get_dashboard_summary:async()=>({appointments:db.prepare('SELECT COUNT(*) n FROM appointments WHERE ownerId=?').get(req.user.id).n})});res.json(result)});
app.post('/api/ai/stream',auth,async(req,res)=>{const parsed=assistantSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid question.'});res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});for await(const token of assistant.stream(parsed.data))res.write(`data: ${JSON.stringify({token})}\n\n`);res.write('data: [DONE]\n\n');res.end()});
app.get('/api/ai/usage',auth,(req,res)=>res.json(usage));
app.post('/api/payments/intents',auth,async(req,res)=>{try{res.status(201).json(await payments.createIntent({ownerId:req.user.id,amount:Number(req.body.amount),currency:req.body.currency,appointmentId:req.body.appointmentId}))}catch(e){res.status(400).json({error:e.message})}});
app.post('/api/payments/intents/:id/confirm',auth,async(req,res)=>{try{const intent=await payments.confirm(req.params.id,req.user.id);intent?res.json(intent):res.status(404).json({error:'Sandbox payment intent not found.'})}catch(e){res.status(400).json({error:e.message})}});
app.get('/health',(req,res)=>res.json({status:'ok',database:'sqlite',cache:cache.kind,ai:process.env.AI_PROVIDER||'mock',payments:'sandbox'}));
app.get('/about',(req,res)=>{const React=require('react'),{renderToString}=require('react-dom/server');const html=renderToString(React.createElement('main',null,React.createElement('h1',null,'CareDesk'),React.createElement('p',null,'Server-rendered healthcare administration overview.')));res.type('html').send(`<!doctype html><html><title>About CareDesk</title><body>${html}</body></html>`)});
const dist=path.join(root,'dist');if(fs.existsSync(dist)){app.use(express.static(dist));app.get('/*path',(req,res)=>res.sendFile(path.join(dist,'index.html')))}
app.use((req,res)=>res.status(404).json({error:'Not found.'}));app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Server error.'})});
function broadcast(ownerId,message){for(const[ws,user]of clients)if(user.id===ownerId&&ws.readyState===1)ws.send(JSON.stringify(message))}
wss.on('connection',(ws,req)=>{try{const token=new URL(req.url,'http://local').searchParams.get('token'),payload=jwt.verify(token,secret,{issuer:'caredesk'});clients.set(ws,{id:payload.sub});ws.send(JSON.stringify({event:'connected'}));ws.on('close',()=>clients.delete(ws))}catch{ws.close(1008,'Unauthorized')}});
const maintenanceJob=cron.schedule('0 2 * * *',()=>{db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());console.log('Scheduled maintenance: expired sessions removed')});
async function initialize(){cache=await createCache();return server}
if(require.main===module)initialize().then(()=>server.listen(Number(process.env.PORT)||3000,()=>console.log(`CareDesk running at http://localhost:${process.env.PORT||3000}`))).catch(e=>{console.error(e);process.exit(1)});
module.exports={app,server,db,initialize,assistant,payments,maintenanceJob};
