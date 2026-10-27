// Shared intake contract for the Instagram landing.
export function buildBioIntake({submissionId,lang,caseType,fields,driveIndex,insuranceIndex,photos=[],url,referrer=''}) {
  const clean=value=>String(value||'').trim();
  const name=clean(fields.name),vehicle=clean(fields.vehicle),contact=clean(fields.contact),details=clean(fields.details),detail=clean(fields.detailType),situation=clean(fields.situation),insurance=clean(fields.insurance);
  if(name.length<2||!vehicle||!details||!detail||!situation)throw new Error('fields');
  const email=(contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';
  const phoneCandidate=contact.replace(email,'').match(/[+(]?\d[\d\s().-]{5,}/)?.[0]?.trim()||'';
  const phoneDigits=phoneCandidate.replace(/\D/g,'');
  const phone=phoneDigits.length>=7&&phoneDigits.length<=15?phoneCandidate:'';
  if(!phone&&!email)throw new Error('contact');
  if(photos.length>5)throw new Error('photos');
  const u=new URL(url);
  const utmSource=clean(u.searchParams.get('utm_source')).slice(0,80);
  const description=[situation,detail,insurance,details].filter(Boolean).join(' · ').slice(0,3000);
  return {submissionId,name,phone,email,vehicle:{raw:vehicle},description,preferredLanguage:lang,
    intakeType:caseType==='insurance'?'insurance':caseType==='body'?'body_paint':'collision',
    ...(caseType==='collision'&&detail?{damageArea:detail.slice(0,120)}:{}),
    ...(caseType==='collision'&&driveIndex===1?{drivable:true}:caseType==='collision'&&driveIndex===2?{drivable:false}:{}),
    ...(caseType!=='body'&&insuranceIndex===1?{hasClaim:true}:caseType!=='body'&&insuranceIndex===3?{hasClaim:false}:{}),
    photos,attribution:{source:utmSource||'instagram_bio',medium:'bio_landing',landing:u.origin+u.pathname,
      referrer:clean(referrer).slice(0,500),...(utmSource?{utm_source:utmSource}:{}),
      ...(u.searchParams.get('utm_medium')?{utm_medium:clean(u.searchParams.get('utm_medium')).slice(0,120)}:{}),
      ...(u.searchParams.get('utm_campaign')?{utm_campaign:clean(u.searchParams.get('utm_campaign')).slice(0,120)}:{})}};
}
export async function uploadBioPhotos(files,fetcher=fetch,cache=new Map()) {
  if(files.length>5)throw new Error('photos');
  const results=[];
  for(const file of files){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('photo_format');
    if(cache.has(file)){results.push(cache.get(file));continue}
    let r;try{r=await fetcher('/api/intake-upload/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}catch{throw new Error('photo_unavailable')}
    if(!r.ok)throw new Error('photo_unavailable');
    const cfg=await r.json();
    const form=new FormData();form.set('file',file);
    for(const k of ['timestamp','signature','api_key','folder'])form.set(k,cfg[k]);
    let uploaded;try{uploaded=await fetcher(cfg.url,{method:'POST',body:form,signal:AbortSignal.timeout(45000)});}catch{throw new Error('photo_unavailable')}
    if(!uploaded.ok)throw new Error('photo_unavailable');
    const photo=await uploaded.json();if(!photo.secure_url)throw new Error('photo_unavailable');
    const saved={url:photo.secure_url,publicId:photo.public_id};cache.set(file,saved);results.push(saved);
  }
  return results;
}
export async function sendBioIntake(payload,fetcher=fetch) {
  let response;try{response=await fetcher('/api/intake/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(22000)});}catch{throw new Error('send_failed')}
  let data;try{data=await response.json()}catch{throw new Error('send_failed')}
  if(!response.ok||data.ok!==true||!data.caseNumber)throw new Error('send_failed');
  return data;
}
