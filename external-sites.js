(() => {
 const toggle=document.querySelector('.external-toggle');
 const panel=document.querySelector('.external-footer');
 const hint=document.querySelector('.external-sites-hint');
 const mobile=matchMedia('(max-width:650px)');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 function updateHeight(){document.documentElement.style.setProperty('--external-footer-height',panel.hidden?'0px':panel.getBoundingClientRect().height+'px');}
 function syncMobileFooter(){
  if(mobile.matches){panel.hidden=false;toggle.setAttribute('aria-expanded','false');}
  else if(!panel.hidden)panel.hidden=true;
  updateHeight();
 }
 function setOpen(open) {
  panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',mobile.matches?(open?'맨 위로 돌아가기':'외부 사이트 링크 아래로 보기'):(open?'외부 사이트 링크 닫기':'외부 사이트 링크 열기'));
  hint.textContent=mobile.matches?(open?'top':'for more'):(open?'close':'for more');
  updateHeight();
  if(open&&!reducedMotion.matches) panel.animate([{opacity:0,transform:'translateY(100%)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
 }
 toggle.addEventListener('click',()=>setOpen(panel.hidden));
 mobile.addEventListener('change',syncMobileFooter);
 syncMobileFooter();
 new ResizeObserver(updateHeight).observe(panel);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){setOpen(false);toggle.focus();}});
})();
