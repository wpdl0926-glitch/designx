(() => {
 const panel=document.querySelector('.onboarding-stage');
 const main=document.querySelector('.x-stage');
 const brand=panel.querySelector('.onboarding-brand-group');
 const shapes=panel.querySelector('.onboarding-shapes');
 const cylinder=shapes.querySelector('.onboarding-cylinder');
 const resizeCylinder=()=>{
  const {width,height}=shapes.getBoundingClientRect();if(!width||!height)return;
  const radiusX=506*(height/982)/(width/1512);
  // Keep the original right edge plus 50 CSS px; adjust only the straight section.
  const end=1001+50*1512/width-radiusX;
  cylinder.setAttribute('d',`M0 -15H${end}A${radiusX} 506 0 0 1 ${end} 997H0Z`);
 };
 new ResizeObserver(resizeCylinder).observe(shapes);resizeCylinder();
 const images=[...panel.querySelectorAll('.onboarding-image')];
 const stars=[...panel.querySelectorAll('.onboarding-star:not(.onboarding-all)')];
 if(matchMedia('(max-width:650px)').matches) {
  const carousel=panel.querySelector('.onboarding-stars');
  requestAnimationFrame(()=>stars[current]?.scrollIntoView({behavior:'auto',block:'nearest',inline:'center'}));
  let snapTimer;
  const settleCarousel=()=>{
   clearTimeout(snapTimer);
   const center=innerWidth/2;
   const item=[...carousel.children].reduce((nearest,child)=>{
    const box=child.getBoundingClientRect();
    return Math.abs(box.left+box.width/2-center)<Math.abs(nearest.getBoundingClientRect().left+nearest.getBoundingClientRect().width/2-center)?child:nearest;
   },carousel.firstElementChild);
   carousel.querySelectorAll('.onboarding-star').forEach(star=>star.setAttribute('aria-pressed',String(star===item)));
  };
  carousel.addEventListener('scroll',()=>{clearTimeout(snapTimer);snapTimer=setTimeout(settleCarousel,240);},{passive:true});
  carousel.addEventListener('scrollend',settleCarousel,{passive:true});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let isOnboarding=true,busy=false,current=0,photoTimer,animation,scrollAmount=0,wheelReset,enteredAt=performance.now(),press=null,dragged=false,touchY=null;
 function photos() {
  clearInterval(photoTimer);
  if(!isOnboarding||document.hidden||reduced.matches)return;
  photoTimer=setInterval(async()=>{
   const next=(current+1)%images.length;
   try {await images[next].decode();}catch{return;}
   if(!isOnboarding)return;
   images[current].classList.remove('is-active');current=next;images[current].classList.add('is-active');
   stars.forEach((star,i)=>star.setAttribute('aria-pressed',String(i===current)));
  },6000);
 }
 async function enterMain(exhibition=-1) {
  if(busy||!isOnboarding)return;busy=true;isOnboarding=false;photos();
  document.body.classList.remove('is-onboarding');main.inert=false;panel.inert=true;
  window.dispatchEvent(new CustomEvent('designx:main-opened',{detail:{exhibition}}));
  if(!reduced.matches){animation=panel.animate([{opacity:1},{opacity:0}],{duration:700,easing:'ease-in-out'});await animation.finished.catch(()=>{});}
  panel.hidden=true;panel.inert=false;busy=false;resetIdle();
 }
 async function showOnboarding() {
  if(busy||isOnboarding)return;busy=true;isOnboarding=true;clearTimeout(idleTimer);
  const footerToggle=document.querySelector('.external-toggle');
  if(footerToggle.getAttribute('aria-expanded')==='true')footerToggle.click();
  const closeAbout=document.querySelector('.about-back');
  if(!document.querySelector('.about-category').hidden)closeAbout.click();
  const returningFromPoster=main.classList.contains('has-exhibition');
  panel.hidden=false;panel.inert=false;main.inert=true;
  if(!reduced.matches){
   const easing='cubic-bezier(.45,0,.2,1)';
   animation=panel.animate([{opacity:0},{opacity:1}],{duration:900,easing});
   const reveal=brand.animate([
    {opacity:0,transform:`scale(${returningFromPoster?.7:1})`},
    {opacity:1,transform:'scale(1)'}
   ],{duration:1000,easing});
   await Promise.all([animation.finished.catch(()=>{}),reveal.finished.catch(()=>{})]);
  }
  document.body.classList.add('is-onboarding');busy=false;enteredAt=performance.now();scrollAmount=0;photos();
 }
 panel.addEventListener('pointerdown',event=>{press={x:event.clientX,y:event.clientY};dragged=false;});
 panel.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>8)dragged=true;});
 panel.addEventListener('pointerup',()=>{press=null;});
 panel.addEventListener('pointercancel',()=>{press=null;dragged=true;});
 panel.addEventListener('click',event=>{if(event.defaultPrevented||event.target.closest('.onboarding-about-link'))return;event.preventDefault();if(dragged&&event.detail!==0){dragged=false;return;}const star=event.target.closest('.onboarding-star');enterMain(star?Number(star.dataset.slide):event.target.closest('.onboarding-more')?5:-1);});
 panel.addEventListener('wheel',event=>{
  if(event.target.closest('.onboarding-stars')&&Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();if(busy||performance.now()-enteredAt<720)return;
  const factor=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
  if(Math.sign(scrollAmount)!==Math.sign(event.deltaY))scrollAmount=0;
  scrollAmount+=event.deltaY*factor;clearTimeout(wheelReset);wheelReset=setTimeout(()=>scrollAmount=0,250);
  if(Math.abs(scrollAmount)>=70)enterMain();
 },{passive:false});
 panel.addEventListener('touchstart',event=>{touchY=event.touches[0].clientY;},{passive:true});
 panel.addEventListener('touchend',event=>{if(touchY!==null&&Math.abs(touchY-event.changedTouches[0].clientY)>45)enterMain();touchY=null;},{passive:true});
 document.addEventListener('keydown',event=>{if(isOnboarding&&document.querySelector('.about-category').hidden&&(event.key==='PageDown'||event.key==='PageUp')){event.preventDefault();enterMain();}});
 window.addEventListener('designx:show-onboarding',showOnboarding);
 let idleTimer=null,lastActivity=Date.now();
 function idleCheck() { if(isOnboarding)return;const remaining=20_000-(Date.now()-lastActivity);if(remaining<=0)showOnboarding();else idleTimer=setTimeout(idleCheck,remaining); }
 function resetIdle() {lastActivity=Date.now();clearTimeout(idleTimer);if(!isOnboarding)idleTimer=setTimeout(idleCheck,20_000);}
 ['pointermove','pointerdown','wheel','keydown','touchstart','touchmove'].forEach(type=>window.addEventListener(type,resetIdle,{passive:true}));
 document.addEventListener('visibilitychange',()=>{photos();clearTimeout(idleTimer);if(!document.hidden)idleCheck();});
 reduced.addEventListener('change',photos);
 if(location.hash==='#about'){isOnboarding=false;panel.hidden=true;document.body.classList.remove('is-onboarding');resetIdle();}else main.inert=true;
 photos();
})();
