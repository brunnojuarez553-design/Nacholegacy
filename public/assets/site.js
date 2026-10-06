// Start decorative videos before initializing any other interface components.
document.querySelectorAll('video[data-autoplay]').forEach(video=>{
  video.defaultMuted=true;video.muted=true;video.autoplay=true;video.loop=true;video.playsInline=true;video.controls=false;
  for(const attribute of ['autoplay','muted','playsinline','webkit-playsinline'])video.setAttribute(attribute,'');
  video.removeAttribute('controls');
  let pending=false;
  const start=()=>{
    if(document.hidden||pending||!video.paused)return;
    video.muted=true;
    pending=true;
    Promise.resolve(video.play()).catch(()=>{}).finally(()=>{pending=false;});
  };
  for(const event of ['loadedmetadata','loadeddata','canplay'])video.addEventListener(event,start);
  window.addEventListener('pageshow',start);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))start();},{threshold:0.01}).observe(video);
  }
  // Automatic retries handle media becoming ready after initial rendering.
  start();[250,750,1500,3000].forEach(delay=>setTimeout(start,delay));
  // Recovery when a browser explicitly requires a user gesture.
  for(const event of ['pointerdown','touchstart','keydown'])document.addEventListener(event,start,{passive:true});
});
// Preserve links to sections from the former single-page site.
const oldSections={why:'about',work:'our-work',faq:'faq',process:'repair-process'};
const oldSection=oldSections[location.hash.slice(1)];if(oldSection&&!document.getElementById(location.hash.slice(1)))location.replace((document.documentElement.lang==='es'?'/es/':'/')+oldSection+'/');
function readSession(key,fallback){try{const value=JSON.parse(sessionStorage.getItem(key));return value&&typeof value==='object'&&Array.isArray(value)===Array.isArray(fallback)?value:fallback}catch{return fallback}}

    const galleryItems=[...document.querySelectorAll('.gallery-grid.editorial .gallery-item')],galleryLightbox=document.getElementById('galleryLightbox'),lightboxImage=document.getElementById('lightboxImage'),lightboxCount=document.getElementById('lightboxCount');function closeLightbox(){galleryLightbox.classList.remove('open');galleryLightbox.setAttribute('aria-hidden','true');document.body.classList.remove('locked')}galleryItems.forEach((item,index)=>item.addEventListener('click',()=>{const image=item.querySelector('img');lightboxImage.src=image.src.replace(/w_\d+\//,'w_1800/');lightboxImage.alt=image.alt;lightboxCount.textContent=`${String(index+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')}`;galleryLightbox.classList.add('open');galleryLightbox.setAttribute('aria-hidden','false');document.body.classList.add('locked')}));document.getElementById('lightboxClose').addEventListener('click',closeLightbox);galleryLightbox.addEventListener('click',e=>{if(e.target===galleryLightbox)closeLightbox()});
    const nav=document.getElementById('nav'),menu=document.getElementById('menu');
    function setMenu(open){nav.classList.toggle('open',open);menu.classList.toggle('active',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?(language==='es'?'Cerrar menú':'Close menu'):(language==='es'?'Abrir menú':'Open menu'));document.body.classList.toggle('menu-open',open)}
    menu.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
    nav.querySelectorAll('a,.menu-estimate').forEach(item=>item.addEventListener('click',()=>setMenu(false)));
    const language=document.documentElement.lang;
    function applyLanguage(lang){if(window.chatCopy){document.getElementById('chatTitle').textContent=chatCopy[lang].title;document.getElementById('chatStatus').textContent=chatCopy[lang].status;document.getElementById('chatNote').textContent=chatCopy[lang].note;document.getElementById('chatInput').placeholder=chatCopy[lang].placeholder}}
    const modal=document.getElementById('estimateModal');function setModal(open){modal.classList.toggle('open',open);modal.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('locked',open)}
    document.querySelectorAll('.open-estimate').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();setModal(true)}));document.getElementById('closeModal').addEventListener('click',()=>setModal(false));modal.addEventListener('click',e=>{if(e.target===modal)setModal(false)});document.addEventListener('keydown',e=>{if(e.key==='Escape')setModal(false)});
    document.getElementById('estimateForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const labels=language==='es'?['Nombre','Teléfono','Email','Idioma','Vehículo','Puede circular','Seguro','Aseguradora','Daños']:['Name','Phone','Email','Language','Vehicle','Drivable','Insurance','Insurer','Damage'];const keys=['name','phone','email','preferredLanguage','vehicle','drivable','insurance','insurer','damage'];const summary=(language==='es'?'Solicitud de evaluación':'Assessment request')+'\n\n'+keys.map((key,i)=>labels[i]+': '+String(data.get(key)||'')).join('\n');location.href='sms:+14843625873?&body='+encodeURIComponent(summary)});
    // Reveal individual content blocks once, keeping video backgrounds stationary.
    if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const targets=new Map();
      const addReveal=(selector,direction,stagger=false)=>document.querySelectorAll(selector).forEach((el,index)=>{if(!targets.has(el))targets.set(el,{direction:typeof direction==='function'?direction(index):direction,delay:stagger?(index%4)*70:0});});
      addReveal('.section-head .eyebrow','down');
      addReveal('.section-head h2,.section-head>p:not(.eyebrow)','up');
      addReveal('.service-card','up',true);
      addReveal('.split-photo,.service-detail>img','left');
      addReveal('.split-copy>*','right',true);
      addReveal('.gallery-item',i=>i%2?'right':'left',true);
      addReveal('.steps article','up',true);
      addReveal('.deductible>div',i=>i?'right':'left');
      addReveal('.faq details','up',true);
      addReveal('.contact>div:first-child>*','left',true);
      addReveal('.map,.contact-actions','right');
      addReveal('.local-seo>div,.accident-card','up',true);
      addReveal('.page-intro>*,.service-detail>div>*,.page-cta>*','up',true);
      const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('scroll-visible');revealObserver.unobserve(entry.target);}
      }),{threshold:.08,rootMargin:'0px 0px -35px 0px'});
      targets.forEach(({direction,delay},el)=>{
        // Already passed content stays visible when opening an anchored section.
        if(el.getBoundingClientRect().bottom<=0)return;
        el.dataset.scrollReveal=direction;el.style.setProperty('--reveal-delay',delay+'ms');revealObserver.observe(el);
      });
    }
    let lastScroll=0;const siteHeader=document.querySelector('.header');window.addEventListener('scroll',()=>{const current=window.scrollY;siteHeader.classList.toggle('hidden',!nav.classList.contains('open')&&current>lastScroll&&current>180);siteHeader.classList.toggle('scrolled',current>50);lastScroll=current},{passive:true});
    const chatTeaser=document.getElementById('chatTeaser');setTimeout(()=>{if(!sessionStorage.getItem('nachos-teaser-closed'))chatTeaser.classList.remove('hidden')},45000);document.getElementById('teaserClose').addEventListener('click',()=>{chatTeaser.classList.add('hidden');sessionStorage.setItem('nachos-teaser-closed','1')});chatTeaser.addEventListener('click',e=>{if(e.target.id!=='teaserClose'){chatTeaser.classList.add('hidden');openChat()}});
    document.querySelectorAll('.service-card').forEach(card=>{card.style.cursor='pointer';card.addEventListener('click',e=>{if(!e.target.closest('a'))card.querySelector('.service-more')?.click()})});
    const chatLauncher=document.getElementById('chatLauncher'),chatPanel=document.getElementById('chatPanel'),chatClose=document.getElementById('chatClose'),chatReset=document.getElementById('chatReset'),chatMessages=document.getElementById('chatMessages'),chatOptions=document.getElementById('chatOptions'),chatForm=document.getElementById('chatForm'),chatInput=document.getElementById('chatInput');
    let chatStarted=false,chatBusy=false,chatAbortController=null;let chatHistory=readSession('nachos-chat-history-v4',[]);let lead=readSession('nachos-chat-lead-v4',{name:'',vehicle:'',damage:'',insurance:'',contact:''});
    const chatCopy={en:{title:"Nacho's Virtual Assistant",status:'Online · Replies instantly',note:'Your information is used only to prepare your consultation with the shop.',placeholder:'Type your answer...',welcome:"Hi! I'm the Nacho's Legacy assistant. I can answer common questions or help prepare your collision repair consultation. What do you need?",initial:['Get an estimate','Ask a question','Call the shop'],name:"Perfect. What's your name?",vehicle:'What vehicle do you need help with? Please include year, make and model.',damage:'Briefly tell me what happened and where the vehicle is damaged.',insurance:'Do you already have an insurance claim?',insuranceOptions:['Yes, claim is open','Not yet','Paying directly'],contact:'What is the best phone number or email to reach you?',ready:'Everything is ready. Tap below to send the complete consultation to the shop by iMessage or SMS.',send:'Send by iMessage / SMS',question:'You can ask about repair times, insurance, structural repairs, paint or deductible assistance.',call:'Call (484) 362-5873'},es:{title:'Asistente Virtual de Nacho',status:'En línea · Responde al instante',note:'Tus datos solo se utilizan para preparar la consulta con el taller.',placeholder:'Escribí tu respuesta...',welcome:'¡Hola! Soy el asistente de Nacho\'s Legacy. Puedo responder dudas o ayudarte a preparar una consulta por la reparación de tu vehículo. ¿Qué necesitás?',initial:['Solicitar evaluación','Hacer una pregunta','Llamar al taller'],name:'Perfecto. ¿Cuál es tu nombre?',vehicle:'¿Con qué vehículo necesitás ayuda? Indicá año, marca y modelo.',damage:'Contame brevemente qué ocurrió y en qué parte está dañado el vehículo.',insurance:'¿Ya tenés un reclamo abierto con el seguro?',insuranceOptions:['Sí, ya está abierto','Todavía no','Pago particular'],contact:'¿Cuál es el mejor teléfono o email para contactarte?',ready:'Todo está listo. Tocá el botón para enviar la consulta completa al taller por iMessage o SMS.',send:'Enviar por iMessage / SMS',question:'Podés consultar sobre tiempos, seguros, reparaciones estructurales, pintura o asistencia con el deducible.',call:'Llamar al (484) 362-5873'}};
    window.chatCopy=chatCopy;applyLanguage(language);function c(){return chatCopy[language]}
    function bubble(text,type='bot'){const el=document.createElement('div');el.className='bubble '+type;el.textContent=text;chatMessages.appendChild(el);chatMessages.scrollTop=chatMessages.scrollHeight;return el}
    const actionLabels={en:{call:'Call the shop',sms:'Send a message',email:'Send an email',maps:'Open location',estimate:'Request an estimate'},es:{call:'Llamar al taller',sms:'Enviar mensaje',email:'Enviar email',maps:'Abrir ubicación',estimate:'Solicitar evaluación'}};
    function renderActions(actions=[]){const valid=['call','sms','email','maps','estimate'];const clean=actions.filter(action=>action&&valid.includes(action.type)).slice(0,3);if(!clean.length)return;const wrap=document.createElement('div');wrap.className='chat-message-actions';clean.forEach(action=>{const button=document.createElement('button');button.type='button';button.textContent=action.label||actionLabels[language][action.type];button.addEventListener('click',()=>{if(action.type==='call')location.href='tel:+14843625873';if(action.type==='sms')location.href='sms:+14843625873';if(action.type==='email')location.href='mailto:contact@nachoslegacybodyshop.com';if(action.type==='maps')window.open('https://maps.app.goo.gl/hBEDC8jrUhNDCYGq8','_blank','noopener');if(action.type==='estimate'){closeChat();setModal(true)}});wrap.appendChild(button)});chatMessages.appendChild(wrap);chatMessages.scrollTop=chatMessages.scrollHeight}
    function options(items,handler){chatOptions.innerHTML='';items.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=item;b.onclick=()=>{chatOptions.innerHTML='';bubble(item,'user');handler(item)};chatOptions.appendChild(b)})}
    async function requestAssistant(message,{welcome=false}={}){if(chatBusy)return;chatBusy=true;chatInput.disabled=true;chatAbortController=new AbortController();const controller=chatAbortController;const typing=document.createElement('div');typing.className='bubble bot';typing.textContent=language==='es'?'Escribiendo…':'Typing…';chatMessages.appendChild(typing);chatMessages.scrollTop=chatMessages.scrollHeight;try{const response=await fetch('/api/chat/',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({message,language,history:chatHistory.slice(-12),lead})});if(!response.ok)throw new Error('Assistant unavailable');const data=await response.json();if(controller!==chatAbortController)return;typing.remove();document.getElementById('chatStatus').textContent=data.mode==='fallback'?(language==='es'?'Modo básico · Podés continuar':'Basic mode · You can continue'):c().status;bubble(data.reply);if(data.lead)lead={...lead,...data.lead};if(data.readyToSend)showHandoff();else renderActions(data.actions);if(!welcome)chatHistory.push({role:'user',content:message});chatHistory.push({role:'assistant',content:data.reply,actions:data.readyToSend?[]:(data.actions||[]),readyToSend:Boolean(data.readyToSend)});sessionStorage.setItem('nachos-chat-history-v4',JSON.stringify(chatHistory.slice(-20)));sessionStorage.setItem('nachos-chat-lead-v4',JSON.stringify(lead))}catch(error){typing.remove();if(error.name!=='AbortError'){bubble(language==='es'?'No pude conectarme en este momento. Podés intentar nuevamente o usar uno de estos accesos.':'I could not connect right now. You can try again or use one of these shortcuts.');if(welcome)renderActions([{type:'call',label:actionLabels[language].call},{type:'email',label:actionLabels[language].email},{type:'estimate',label:actionLabels[language].estimate}])}}finally{if(controller===chatAbortController){chatBusy=false;chatAbortController=null;chatInput.disabled=false;chatInput.focus()}}}
    function sendToAssistant(message){return requestAssistant(message)}
    function openChat(){chatTeaser.classList.add('hidden');chatPanel.classList.add('open');chatPanel.setAttribute('aria-hidden','false');chatLauncher.setAttribute('aria-expanded','true');if(!chatStarted){chatStarted=true;if(chatHistory.length){chatHistory.forEach(item=>{bubble(item.content,item.role==='user'?'user':'bot');if(item.role==='assistant'){if(item.readyToSend)showHandoff();else renderActions(item.actions)}})}else requestAssistant('__WELCOME__',{welcome:true})}}
    function closeChat(){chatPanel.classList.remove('open');chatPanel.setAttribute('aria-hidden','true');chatLauncher.setAttribute('aria-expanded','false')}
    function resetConversation(reopen=chatPanel.classList.contains('open')){chatAbortController?.abort();chatAbortController=null;chatBusy=false;chatInput.disabled=false;chatMessages.innerHTML='';chatOptions.innerHTML='';chatHistory=[];lead={name:'',vehicle:'',damage:'',insurance:'',contact:''};chatStarted=false;sessionStorage.removeItem('nachos-chat-history-v4');sessionStorage.removeItem('nachos-chat-lead-v4');if(reopen){chatStarted=true;requestAssistant('__WELCOME__',{welcome:true})}}
    chatLauncher.addEventListener('click',()=>chatPanel.classList.contains('open')?closeChat():openChat());chatClose.addEventListener('click',closeChat);chatReset.addEventListener('click',()=>resetConversation(true));document.addEventListener('languagechange',()=>{if(chatStarted||chatHistory.length)resetConversation(chatPanel.classList.contains('open'))});
    function showHandoff(){const summary=language==='es'?`Nueva consulta desde la web\n\nNombre: ${lead.name||'No indicado'}\nVehículo: ${lead.vehicle||'No indicado'}\nDaño/consulta: ${lead.damage||'No indicado'}\nSeguro: ${lead.insurance||'No indicado'}\nContacto: ${lead.contact||'No indicado'}`:`New website consultation\n\nName: ${lead.name||'Not provided'}\nVehicle: ${lead.vehicle||'Not provided'}\nDamage/question: ${lead.damage||'Not provided'}\nInsurance: ${lead.insurance||'Not provided'}\nContact: ${lead.contact||'Not provided'}`;options([c().send],()=>{window.location.href=`sms:+14843625873?&body=${encodeURIComponent(summary)}`})}
    chatForm.addEventListener('submit',e=>{e.preventDefault();const value=chatInput.value.trim();if(!value||chatBusy)return;bubble(value,'user');chatInput.value='';sendToAssistant(value)});
  
// Dialog keyboard navigation and focus restoration.
let dialogTrigger=null;
const dialogs=[document.getElementById('estimateModal'),document.getElementById('galleryLightbox')];
for(const dialog of dialogs){new MutationObserver(()=>{if(dialog.classList.contains('open')){dialogTrigger=document.activeElement;dialog.querySelector('button,input')?.focus()}else dialogTrigger?.focus()}).observe(dialog,{attributes:true,attributeFilter:['class']})}
document.addEventListener('keydown',event=>{const dialog=dialogs.find(el=>el.classList.contains('open'));if(event.key==='Escape'){closeLightbox();closeChat();setMenu(false)}if(event.key==='Tab'&&dialog){const items=[...dialog.querySelectorAll('button,a[href],input,select,textarea')].filter(el=>!el.disabled);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}});

for(const answer of document.querySelectorAll('.faq details')){answer.addEventListener('toggle',()=>{if(answer.open)for(const other of document.querySelectorAll('.faq details'))if(other!==answer)other.open=false;});}
