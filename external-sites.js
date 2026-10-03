(() => {
 const toggle=document.querySelector('.external-toggle');
 const panel=document.querySelector('.external-footer');
 const hint=document.querySelector('.external-sites-hint');
 function updateHeight(){document.documentElement.style.setProperty('--external-footer-height',panel.hidden?'0px':panel.getBoundingClientRect().height+'px');}
 function setOpen(open) {
  panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'외부 사이트 링크 닫기':'외부 사이트 링크 열기');
  hint.textContent=open?'close':'for more';
  updateHeight();
  if(open&&!matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{opacity:0,transform:'translateY(100%)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
 }
 toggle.addEventListener('click',()=>setOpen(panel.hidden));
 new ResizeObserver(updateHeight).observe(panel);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){setOpen(false);toggle.focus();}});
})();
