import { createHash } from 'node:crypto';
const requests=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Invalid origin'});
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0];const now=Date.now();for(const[k,v]of requests)if(v.until<now)requests.delete(k);const rate=requests.get(ip)||{count:0,until:now+60000};if(rate.count>=20)return res.status(429).json({error:'Too many uploads'});rate.count++;requests.set(ip,rate);
 const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;if(!cloud||!key||!secret)return res.status(503).json({error:'Photos are not configured yet'});
 const timestamp=Math.floor(Date.now()/1000),folder='nachos-intake';const signature=createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');return res.status(200).json({timestamp,folder,signature,api_key:key,url:`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`});
 }catch{return res.status(400).json({error:'Invalid request'});}
}
