(() => {
 const years=['2026','2025','2024','2023','2022'];
 const sources=['2026-01.jpg','2025-01.jpeg','2024-01.jpg','2023-01.png','2022-01.png'];
 const titles=['Design for ZERO, DIALOGUE, MENDING','Design for Play, Co-, Emotion','Design for Future, Philosophy, Sustainability','Design for Saver, Survival, Diversity','How We Function'];
 const sites=['https://d.yonsei.ac.kr/2026/index.html','https://d.yonsei.ac.kr/2025/index.html','https://d.yonsei.ac.kr/2024/','https://d.yonsei.ac.kr/2023/','https://d.yonsei.ac.kr/2022/'];
 const display=document.querySelector('.poster-display');
 const posterLink=display.querySelector('.poster-link');
 const posterTitle=display.querySelector('.poster-title');
 const cursorHint=document.createElement('span');
 cursorHint.className='poster-cursor-hint';cursorHint.textContent='go to site';cursorHint.setAttribute('aria-hidden','true');document.body.append(cursorHint);
 const hideCursorHint=()=>cursorHint.classList.remove('is-visible');
 const moveCursorHint=event=>{
  if(event.pointerType==='touch')return;
  const x=Math.max(8,Math.min(event.clientX+16,innerWidth-cursorHint.offsetWidth-8));
  const y=Math.max(8,Math.min(event.clientY+18,innerHeight-cursorHint.offsetHeight-8));
  cursorHint.style.transform=`translate(${x}px,${y}px)`;
  cursorHint.classList.add('is-visible');
 };
 posterLink.addEventListener('pointerenter',moveCursorHint);
 posterLink.addEventListener('pointermove',moveCursorHint);
 posterLink.addEventListener('pointerleave',hideCursorHint);
 posterLink.addEventListener('pointerdown',hideCursorHint);
 window.addEventListener('blur',hideCursorHint);
 window.addEventListener('designx:show-onboarding',hideCursorHint);

 const image=document.querySelector('.selected-poster');
 const archive=document.querySelector('.archive-display');
 const more=document.querySelector('.more-stars');
 const buttons=[...document.querySelectorAll('.year-star[data-year]')];
 const viewAll=document.querySelector('.view-all-star');
 const stars=document.querySelector('.year-stars');
 const stage=document.querySelector('.x-stage');
 const allPosters=document.querySelector('.all-posters-display');
 years.forEach((year,i)=>{
  const item=document.createElement('li'),link=document.createElement('a'),poster=document.createElement('img');
  link.className='all-poster-link';link.href=sites[i];link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',year+' '+titles[i]+' 전시 사이트 열기');
  poster.src='images/'+sources[i];poster.alt=year+' 졸업전시 포스터';poster.draggable=false;link.append(poster);item.append(link);allPosters.querySelector('ul').append(item);
  link.addEventListener('pointerenter',moveCursorHint);link.addEventListener('pointermove',moveCursorHint);link.addEventListener('pointerleave',hideCursorHint);link.addEventListener('pointerdown',hideCursorHint);
 });
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const motionStyle=getComputedStyle(stage);
 const motionDuration=parseFloat(motionStyle.getPropertyValue('--exhibition-motion-duration'))||700;
 const motionEasing=motionStyle.getPropertyValue('--exhibition-motion-easing').trim()||'cubic-bezier(.45,0,.2,1)';
 let index=-1, animation=null, revision=0, visiblePanel=null, cycleComplete=false, leaving=false;
 const animate=(element,opening)=>{
  if(reducedMotion.matches)return Promise.resolve();
  animation=element.animate(opening?[
   {opacity:0,transform:'translateY(22px) scale(.96)'},
   {opacity:1,transform:'translateY(0) scale(1)'}
  ]:[
   {opacity:1,transform:'translateY(0) scale(1)'},
   {opacity:0,transform:'translateY(12px) scale(.98)'}
  ],{duration:motionDuration,easing:motionEasing});
  return animation.finished.catch(()=>{});
 };
 const positionStars=()=>{
  if(index<0||!visiblePanel||visiblePanel.hidden)return;
  const mobile=matchMedia('(max-width:650px)').matches;
  const stageHeight=stage.clientHeight;
  // One shared navigation anchor, independent of each poster's aspect ratio.
  const previousCenter=mobile?stageHeight*.34+90:stageHeight*.35+40;
  const referenceHeight=stageHeight*(mobile?.5:.54);
  const panelTop=previousCenter-referenceHeight/2;
  const gap=mobile?16:24;
  const restingTop=mobile?stageHeight*.7+50:stageHeight*.727;
  const targetTop=Math.max(16,panelTop-stars.offsetHeight-gap)+80;
  stars.style.setProperty('--stars-offset',(targetTop-restingTop)+'px');
  stars.classList.add('is-above-poster');
  stage.classList.add('has-exhibition');
 };
 const starLayoutObserver=new ResizeObserver(positionStars);
 [stage,stars,display,allPosters,archive].forEach(element=>starLayoutObserver.observe(element));
 const nextStep=direction=>{
  if(index===6){cycleComplete=false;return direction>0?0:5;}
  if(direction>0&&index===-1&&cycleComplete)return -2;
  if(direction>0&&index===-1)return 6;
  if(direction<0&&index===0)return 6;
  if(direction>0&&index===years.length){cycleComplete=true;return -1;}
  cycleComplete=false;
  return Math.max(-1,Math.min(years.length,index+direction));
 };
 async function select(next) {
  if(next===-2) {
   if(leaving)return;leaving=true;
   window.dispatchEvent(new Event('designx:show-onboarding'));return;
  }
  hideCursorHint();
  const overviewOrigin=next===0&&visiblePanel===allPosters&&!reducedMotion.matches
   ?allPosters.querySelector('img').getBoundingClientRect():null;
  const current=++revision;
  index=next;animation?.cancel();animation=null;
  stars.classList.toggle('has-selection',next>=0);
  if(next<0)stage.classList.remove('has-exhibition');
  if(next<0)stars.classList.remove('is-above-poster');
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===next)));
  more.setAttribute('aria-pressed',String(next===years.length));
  viewAll.setAttribute('aria-pressed',String(next===6));
  if(matchMedia('(max-width:650px)').matches&&next>=0) {
   const active=next<years.length?buttons[next]:next===6?viewAll:more;
   active.scrollIntoView({behavior:'auto',block:'nearest',inline:'center'});
  }
  if(visiblePanel&&!overviewOrigin) {
   const previous=visiblePanel;
   await animate(previous===display?image:previous.querySelector('ul'),false);
   if(current!==revision)return;
   previous.hidden=true;visiblePanel=null;
  }
  if(next<0)return;
  if(next<years.length) {
   posterLink.href=sites[next];posterLink.setAttribute('aria-label',years[next]+' '+titles[next]+' 전시 사이트 열기');posterTitle.textContent=titles[next];
   image.src='images/'+sources[next];image.alt=years[next]+' 통합디자인학과 졸업전시 포스터';
   try {await image.decode();} catch {return;}
   if(current!==revision)return;
   display.hidden=false;
   if(overviewOrigin) {
    allPosters.hidden=true;
    const target=image.getBoundingClientRect();
    const dx=overviewOrigin.left-target.left,dy=overviewOrigin.top-target.top;
    animation=image.animate([
     {transformOrigin:'0 0',transform:`translate(${dx}px,${dy}px) scale(${overviewOrigin.width/target.width},${overviewOrigin.height/target.height})`,opacity:1},
     {transformOrigin:'0 0',transform:'translate(0,0) scale(1,1)',opacity:1}
    ],{duration:motionDuration,easing:motionEasing});
    animation.finished.catch(()=>{});
   } else animate(image,true);
   visiblePanel=display;positionStars();
  } else if(next===6) {
   allPosters.hidden=false;visiblePanel=allPosters;positionStars();animate(allPosters.querySelector('ul'),true);
  } else {
   archive.hidden=false;visiblePanel=archive;positionStars();animate(archive.querySelector('ul'),true);
  }
 }
 if(matchMedia('(max-width:650px)').matches) {
  const carousel=document.querySelector('.year-stars');
  let snapTimer;
  const settleCarousel=()=>{
   clearTimeout(snapTimer);
   const center=innerWidth/2;
   const item=[...carousel.children].reduce((nearest,child)=>{
    const box=child.getBoundingClientRect();
    return Math.abs(box.left+box.width/2-center)<Math.abs(nearest.getBoundingClientRect().left+nearest.getBoundingClientRect().width/2-center)?child:nearest;
   },carousel.firstElementChild);
   const next=item===viewAll?6:item===more?years.length:buttons.indexOf(item);
   if(next>=0&&next!==index)select(next);
  };
  carousel.addEventListener('scroll',()=>{clearTimeout(snapTimer);snapTimer=setTimeout(settleCarousel,240);},{passive:true});
  carousel.addEventListener('scrollend',settleCarousel,{passive:true});
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>select(index===i?-1:i)));
 viewAll.addEventListener('click',()=>select(index===6?-1:6));
 more.addEventListener('click',()=>select(index===years.length?-1:years.length));
 document.addEventListener('keydown',event=>{
  if(document.body.classList.contains('is-onboarding')||document.querySelector('.x-stage').classList.contains('is-about'))return;
  if(event.key==='Escape'&&index>=0)select(-1);
  if(event.key==='PageDown'||event.key==='PageUp') {event.preventDefault();select(nextStep(event.key==='PageDown'?1:-1));}
 });
 let scrollAmount=0, lastStep=performance.now(), wheelReset, wheelGestureHandled=false;
 document.querySelector('.x-stage').addEventListener('wheel',event=>{
  if(document.body.classList.contains('is-onboarding')||document.querySelector('.x-stage').classList.contains('is-about'))return;
  if(matchMedia('(max-width:650px)').matches)return;
  if(event.target.closest('.external-sites,.external-footer'))return;
  // Allow the archive itself to scroll when its list exceeds the screen height.
  if(event.target.closest('.archive-display')&&archive.scrollHeight>archive.clientHeight) {
   const canScroll=event.deltaY>0?archive.scrollTop+archive.clientHeight<archive.scrollHeight-1:archive.scrollTop>1;
   if(canScroll)return;
  }
  event.preventDefault();
  const now=performance.now();
  // Trackpad inertia belongs to the same gesture until wheel events stop.
  clearTimeout(wheelReset);
  wheelReset=setTimeout(()=>{scrollAmount=0;wheelGestureHandled=false;},250);
  if(wheelGestureHandled||now-lastStep<720)return;
  const factor=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
  if(Math.sign(scrollAmount)!==Math.sign(event.deltaY))scrollAmount=0;
  scrollAmount+=event.deltaY*factor;
  
  if(Math.abs(scrollAmount)<70)return;
  const next=nextStep(Math.sign(scrollAmount));
  scrollAmount=0;lastStep=now;wheelGestureHandled=true;
  if(next!==index)select(next);
 },{passive:false});
 let touchY=null;
 document.querySelector('.x-stage').addEventListener('touchstart',event=>{
  if(matchMedia('(max-width:650px)').matches||document.body.classList.contains('is-onboarding')||document.querySelector('.x-stage').classList.contains('is-about')){touchY=null;return;}
  touchY=event.target.closest('#design-x-canvas,.archive-display')?null:event.touches[0].clientY;
 },{passive:true});
 document.querySelector('.x-stage').addEventListener('touchend',event=>{
  if(touchY===null)return;
  const delta=touchY-event.changedTouches[0].clientY;touchY=null;
  if(Math.abs(delta)>45)select(nextStep(Math.sign(delta)));
 },{passive:true});
 window.addEventListener('designx:main-opened',event=>{cycleComplete=false;leaving=false;scrollAmount=0;lastStep=performance.now();wheelGestureHandled=true;clearTimeout(wheelReset);wheelReset=setTimeout(()=>{wheelGestureHandled=false;},250);const requested=event.detail?.exhibition;select(Number.isInteger(requested)&&requested>=0&&requested<=6?requested:-1);});
})();
