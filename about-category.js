(() => {
 const panel=document.querySelector('.about-category');
 const closeButton=panel.querySelector('.about-back');
 const triggers=[...document.querySelectorAll('.about-x-link,.onboarding-about-link,.system-link')];
 let returnFocus=null;
 const canvas=document.querySelector('#design-x-canvas');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let animation=null,revision=0;
 function open(trigger) {
  const system=trigger?.classList.contains('system-link');
  returnFocus=system?trigger:trigger?.classList.contains('onboarding-about-link')?trigger:canvas;
  panel.querySelector('.about-content:not(.system-content)').hidden=!!system;
  panel.querySelector('.system-content').hidden=!system;
  panel.setAttribute('aria-label',system?'about System':'about X');
  closeButton.setAttribute('aria-label',system?'about System 창 닫기':'about X 창 닫기');
  triggers.forEach(link=>link.setAttribute('aria-expanded',String(system?link===trigger:!link.classList.contains('system-link'))));
  revision++;if(animation)animation.cancel();
  const wasHidden=panel.hidden;
  panel.hidden=false;canvas.setAttribute('aria-expanded',String(!system));document.querySelector('.onboarding-about-link').setAttribute('aria-expanded',String(!system));
  if(wasHidden&&!reducedMotion.matches)animation=panel.animate([
   {opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}
  ],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
  closeButton.focus({preventScroll:true});
 }
 async function close() {
  const current=++revision;if(animation)animation.cancel();
  if(!reducedMotion.matches) {
   animation=panel.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:180,easing:'ease-in'});
   await animation.finished.catch(()=>{});
  }
  if(current!==revision)return;
  panel.hidden=true;triggers.forEach(link=>link.setAttribute('aria-expanded','false'));canvas.setAttribute('aria-expanded','false');document.querySelector('.onboarding-about-link').setAttribute('aria-expanded','false');if(returnFocus&&!returnFocus.closest('[inert]'))returnFocus.focus({preventScroll:true});
 }
 triggers.forEach(trigger=>trigger.addEventListener('click',event=>{if(event.defaultPrevented)return;event.preventDefault();open(trigger);}));
 closeButton.addEventListener('click',close);
 panel.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
 panel.addEventListener('touchstart',event=>event.stopPropagation(),{passive:true});
 panel.addEventListener('touchend',event=>event.stopPropagation(),{passive:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close();}});
 function legacyHash() { if(location.hash==='#about'){history.replaceState(null,'',location.pathname+location.search);open();} }
 window.addEventListener('hashchange',legacyHash);legacyHash();
})();
