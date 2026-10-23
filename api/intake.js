import { randomUUID } from 'node:crypto';
const limits=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 const es=req.body?.preferredLanguage==='es';
 try {
  const host=req.headers.host;const origin=req.headers.origin;
  if(origin&&new URL(origin).host!==host)return res.status(403).json({error:'Invalid origin'});
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0];const now=Date.now();
  for(const[k,v]of limits)if(v.until<now)limits.delete(k);
  const count=limits.get(ip)||{count:0,until:now+60000};if(count.count>=10)return res.status(429).json({error:es?'Esperá un minuto y reintentá.':'Wait a minute and retry.'});count.count++;limits.set(ip,count);
  const raw=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!raw||JSON.stringify(raw).length>40000)return res.status(400).json({error:'Invalid request'});
  const url=process.env.CRM_INTAKE_URL;const secret=process.env.INTAKE_SHARED_SECRET;
  if(!url||!secret)return res.status(503).json({error:es?'La recepción está temporalmente fuera de servicio. Contactá al taller por teléfono o SMS.':'Online intake is temporarily unavailable. Please call or text the shop.'});
  const endpoint=new URL(url);if(endpoint.protocol!=='https:')throw new Error('CRM endpoint must use HTTPS');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-intake-secret':secret},body:JSON.stringify(raw),signal:AbortSignal.timeout(18000)});
  const result=await response.json();if(!response.ok)return res.status(response.status>=500?503:response.status).json({error:response.status>=500?(es?'No pudimos confirmar el envío. Conservamos tus datos para reintentar.':'We could not confirm submission. Your details remain available to retry.'):(es?'Revisá tu nombre, teléfono o email y los datos del vehículo.':'Check your name, phone or email and vehicle details.')});
  return res.status(response.status).json({ok:true,caseId:result.caseId,caseNumber:result.caseNumber,duplicate:Boolean(result.duplicate)});
 }catch(error){console.error('CRM intake failed',error?.name||'Error');return res.status(503).json({error:es?'No pudimos confirmar el envío. Reintentá o llamá al taller.':'We could not confirm submission. Please retry or call the shop.'});}
}
