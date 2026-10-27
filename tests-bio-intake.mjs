import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBioIntake,sendBioIntake,uploadBioPhotos} from './public/assets/bio-intake.js';
const base={submissionId:'00000000-0000-4000-8000-000000000001',lang:'es',caseType:'collision',fields:{name:'Ana Cliente',vehicle:'2020 Toyota Corolla',details:'Daño trasero',detailType:'Parte trasera',situation:'Accidente',insurance:'Necesito orientación',contact:'ana@example.com'},driveIndex:2,insuranceIndex:2,photos:[],url:'https://www.nachoslegacy.com/bio/?utm_source=instagram&utm_campaign=organic',referrer:'https://instagram.com/'};
test('bio assessment preserves details, origin, language and drivable status for CRM',()=>{const p=buildBioIntake(base);assert.equal(p.email,'ana@example.com');assert.equal(p.drivable,false);assert.equal(p.damageArea,'Parte trasera');assert.equal(p.preferredLanguage,'es');assert.equal(p.intakeType,'collision');assert.equal(p.attribution.medium,'bio_landing');assert.equal(p.attribution.source,'instagram');assert.equal(p.attribution.utm_campaign,'organic');assert.match(p.description,/Necesito orientación/);assert.equal(p.hasClaim,undefined)});
test('case categories, contact choices, and claim answers match CRM contract',()=>{const p=buildBioIntake({...base,lang:'en',caseType:'insurance',insuranceIndex:1,fields:{...base.fields,contact:'(484) 555-0100'}});assert.equal(p.phone,'(484) 555-0100');assert.equal(p.hasClaim,true);assert.equal(p.intakeType,'insurance');assert.equal(p.drivable,undefined);assert.equal(buildBioIntake({...base,caseType:'body'}).intakeType,'body_paint');assert.throws(()=>buildBioIntake({...base,fields:{...base.fields,contact:'not valid'}}),/contact/)});
test('failure never confirms and a retry keeps the same submission ID',async()=>{const payload=buildBioIntake(base);const requests=[];const fail=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:false,json:async()=>({error:'unavailable'})}};await assert.rejects(sendBioIntake(payload,fail),/send_failed/);const success=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,caseNumber:'NL-REFERENCE',duplicate:true})}};assert.equal((await sendBioIntake(payload,success)).duplicate,true);assert.equal(requests[0].submissionId,requests[1].submissionId)});
test('photos are optional and unsupported images are rejected before uploading',async()=>{let calls=0;assert.deepEqual(await uploadBioPhotos([],async()=>{calls++}),[]);assert.equal(calls,0);await assert.rejects(uploadBioPhotos([{type:'application/pdf',size:1}],async()=>{calls++}),/photo_format/);assert.equal(calls,0)});
test('unavailable photo service fails without submitting a partial request',async()=>{const file={type:'image/jpeg',size:100};await assert.rejects(uploadBioPhotos([file],async()=>({ok:false})),/photo_unavailable/)});

test('landing HTML provides working module syntax and direct CRM submission',async()=>{
 const {readFile}=await import('node:fs/promises');const {spawnSync}=await import('node:child_process');
 const html=await readFile('public/bio/index.html','utf8');
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert(script,'landing module must be present');
 const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:script,encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);assert.match(script,/sendBioIntake\(payload\)/);
 assert.doesNotMatch(script,/location\.href\s*=\s*`sms:/);assert.match(html,/name="consent"/);
});
