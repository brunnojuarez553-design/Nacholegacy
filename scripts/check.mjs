import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));
const titles=new Set(),descriptions=new Set();
for(const page of manifest){
 const html=await readFile(page.path,'utf8');
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${page.url}: one H1`);
 assert(html.includes(`<html lang="${page.lang}">`));
 assert(html.includes(`<link rel="canonical" href="${page.url}">`));
 assert.equal((html.match(/hreflang=/g)||[]).length,3);
 const title=html.match(/<title>(.*?)<\/title>/s)[1];assert(!titles.has(title),`${page.url}: duplicate title`);titles.add(title);
 const description=html.match(/<meta name="description" content="([^"]+)"/)[1];assert(!descriptions.has(description),`${page.url}: duplicate description`);descriptions.add(description);
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert(graph['@graph'].some(x=>x['@type']==='AutoBodyShop'));
 assert(!/PHOTO PLACEHOLDER|PHOTO PENDING|Visual demo completed|Google Business Profile setup pending|{{/.test(html),`${page.url}: placeholder`);
 for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
  const link=match[1];const file=path.join('dist',link.endsWith('/')?link+'index.html':link);await access(file);
 }
 for(const id of ['nav','menu','chatLauncher','chatPanel','chatInput','estimateModal','estimateForm','galleryLightbox'])assert(html.includes(`id="${id}"`),`${page.url}: ${id}`);
}
const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,26);
for(const p of manifest)assert(sitemap.includes(`<loc>${p.url}</loc>`));
// Exercise the existing API with an in-memory provider, without sending visitor data.
const {default:handler}=await import('../api/chat.js');
const originalFetch=globalThis.fetch;process.env.GROQ_API_KEY='test-only';
function response(){return{code:200,status(code){this.code=code;return this},json(body){this.body=body;return this},setHeader(){}}}
let res=response();await handler({method:'GET'},res);assert.equal(res.code,405);
res=response();await handler({method:'POST',body:{message:''}},res);assert.equal(res.code,400);
globalThis.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({reply:'Hello',lead:{},readyToSend:false,actions:[{type:'invented'},{type:'call',label:'Call'}]})}}]})});
res=response();await handler({method:'POST',body:{message:'Hi'}},res);assert.equal(res.code,200);assert.equal(res.body.actions.length,1);assert.equal(res.body.actions[0].type,'call');
globalThis.fetch=async()=>({ok:false,status:503});res=response();await handler({method:'POST',body:{message:'Hi'}},res);assert.equal(res.code,200);assert(res.body.reply.includes('shop'));
res=response();await handler({method:'POST',body:{message:'__WELCOME__',language:'es'}},res);assert.equal(res.code,200);assert(res.body.reply.includes('Hola'));assert.equal(res.body.actions.length,3);
globalThis.fetch=originalFetch;delete process.env.GROQ_API_KEY;
console.log(`Verified ${manifest.length} pages: HTML SEO, bilingual alternates, schema, local links, sitemap, shared controls and API validation/fallback.`);
