(() => {
 const panel=document.querySelector('.about-category');
 const closeButton=panel.querySelector('.about-back');
 const triggers=[...document.querySelectorAll('.about-x-link,.onboarding-about-link,.system-link')];
 const mobileWordmarks=[...document.querySelectorAll('.design-for-wordmark,.onboarding-wordmark')];
 let returnFocus=null;
 const canvas=document.querySelector('#design-x-canvas');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let animation=null,brandAnimation=null,revision=0;
 let backgroundInert=null;
 function isolateSystem(active) {
  if(active&&!backgroundInert){
   backgroundInert=[...document.querySelectorAll('.x-stage,.onboarding-stage,.external-footer')].map(element=>[element,element.inert]);
   backgroundInert.forEach(([element])=>{element.inert=true;});
  }else if(!active&&backgroundInert){
   backgroundInert.forEach(([element,inert])=>{element.inert=inert;});backgroundInert=null;
  }
 }
 function open(trigger) {
  const system=trigger?.classList.contains('system-link');
  const onboarding=document.body.classList.contains('is-onboarding');
  const sourceWordmark=document.querySelector(onboarding?'.onboarding-wordmark':'.design-for-wordmark');
  const sourceCanvas=document.querySelector(onboarding?'#onboarding-x-canvas':'#design-x-canvas');
  const wordRect=sourceWordmark.getBoundingClientRect(),xRect=sourceCanvas.getBoundingClientRect();
  brandAnimation?.cancel();
  panel.classList.toggle('is-system',!!system);
  document.body.classList.toggle('is-system',!!system);
  isolateSystem(!!system);
  if(!system)window.dispatchEvent(new Event('designx:system-closed'));
  returnFocus=system?trigger:trigger?.classList.contains('onboarding-about-link')?trigger:canvas;
  panel.querySelector('.about-content:not(.system-content)').hidden=!!system;
  panel.querySelector('.system-content').hidden=!system;
  panel.setAttribute('aria-label',system?'about System':'about X');
  closeButton.setAttribute('aria-label',system?'이전 화면으로 돌아가기':'about X 창 닫기');
  triggers.forEach(link=>link.setAttribute('aria-expanded',String(system?link===trigger:!link.classList.contains('system-link'))));
  revision++;if(animation)animation.cancel();
  const wasHidden=panel.hidden;
  panel.hidden=false;canvas.setAttribute('aria-expanded',String(!system));document.querySelector('.onboarding-about-link').setAttribute('aria-expanded',String(!system));
  if(!system&&wasHidden&&!reducedMotion.matches)animation=panel.animate([
   {opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}
  ],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
  if(system){
   const brand=panel.querySelector('.system-brand');
   const wordmark=panel.querySelector('.system-wordmark');
   const systemCanvas=panel.querySelector('#system-x-canvas');
   for(const [element,rect] of [[wordmark,wordRect],[systemCanvas,xRect]]){
    Object.assign(element.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
   }
   const lift=innerHeight/2-(xRect.top+xRect.height/2);
   const target=`translateY(${lift}px)`;
   brand.style.transform=target;
   const duration=reducedMotion.matches?0:700;
   if(duration)brandAnimation=brand.animate([{transform:'translateY(0)'},{transform:target}],{duration,easing:'cubic-bezier(.45,0,.2,1)'});
   window.dispatchEvent(new CustomEvent('designx:system-opened',{detail:{delay:duration}}));
  }
  closeButton.focus({preventScroll:true});
 }
 async function close() {
  const current=++revision;if(animation)animation.cancel();
  if(!reducedMotion.matches) {
   animation=panel.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:180,easing:'ease-in'});
   await animation.finished.catch(()=>{});
  }
  if(current!==revision)return;
  panel.hidden=true;panel.classList.remove('is-system');document.body.classList.remove('is-system');isolateSystem(false);window.dispatchEvent(new Event('designx:system-closed'));brandAnimation?.cancel();triggers.forEach(link=>link.setAttribute('aria-expanded','false'));canvas.setAttribute('aria-expanded','false');document.querySelector('.onboarding-about-link').setAttribute('aria-expanded','false');if(returnFocus&&!returnFocus.closest('[inert]'))returnFocus.focus({preventScroll:true});
 }
 triggers.forEach(trigger=>trigger.addEventListener('click',event=>{if(event.defaultPrevented)return;event.preventDefault();open(trigger);}));
 if(matchMedia('(max-width:650px)').matches) mobileWordmarks.forEach(wordmark=>{
  wordmark.setAttribute('role','button');wordmark.setAttribute('tabindex','0');wordmark.setAttribute('aria-label','about X 창 열기');
  const trigger=wordmark.classList.contains('onboarding-wordmark')?document.querySelector('.onboarding-about-link'):document.querySelector('.about-x-link');
  const openAbout=event=>{event.preventDefault();event.stopPropagation();trigger.click();};
  wordmark.addEventListener('click',openAbout);
  wordmark.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){openAbout(event);}});
 });
 closeButton.addEventListener('click',close);
 panel.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
 panel.addEventListener('touchstart',event=>event.stopPropagation(),{passive:true});
 panel.addEventListener('touchend',event=>event.stopPropagation(),{passive:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close();}});
 function legacyHash() { if(location.hash==='#about'){history.replaceState(null,'',location.pathname+location.search);open();} }
 window.addEventListener('hashchange',legacyHash);legacyHash();
})();
