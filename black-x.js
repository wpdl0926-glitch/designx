(() => {
  'use strict';
  const canvas = document.querySelector('#design-x-canvas');
  const stage = document.querySelector('.x-stage');
  const gl = canvas.getContext('webgl', {antialias:true, alpha:true});
  if (!gl) { canvas.hidden=true; return; }
  const shader = (type, source) => {
    const result=gl.createShader(type); gl.shaderSource(result,source); gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  };
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`
    attribute vec3 aPosition;
    uniform mat4 uModel, uProjection;
    varying vec3 vWorld;
    void main(){ vec4 p=uModel*vec4(aPosition,1.0); vWorld=p.xyz; p.z-=4.6; gl_Position=uProjection*p; }
  `));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
    precision mediump float;
    uniform float uHover;
    varying vec3 vWorld;
    void main(){
      float strip=exp(-pow((vWorld.x + .65*vWorld.y - .18)/.33,2.0));
      float reflection=uHover*(.018 + .20*strip);
      gl_FragColor=vec4(vec3(reflection),1.0);
    }
  `));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const positionLocation=gl.getAttribLocation(program,'aPosition');
  const modelLocation=gl.getUniformLocation(program,'uModel');
  const projectionLocation=gl.getUniformLocation(program,'uProjection');
  const hoverLocation=gl.getUniformLocation(program,'uHover');
  let hoverTarget=0, hoverAmount=0, draggedClick=false;
  document.querySelector('.about-x-link').addEventListener('click',event=>{if(draggedClick){event.preventDefault();draggedClick=false;}});
  const updateHover=()=>{hoverTarget=canvas.matches(':hover,:focus-visible')?1:0;draw();};
  ['pointerenter','pointerleave','focus','blur'].forEach(event=>canvas.addEventListener(event,updateHover));
  let meshReady=false, vertexCount=0, frame=null, previousTime=null, inView=true, drag=null;
  let rotationX=-.20, rotationY=-.32, rotationZ=-.025;
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const randomSign=()=>Math.random()<.5?-1:1;
  const spin=[randomSign()*.14175,randomSign()*.315,randomSign()*.0756];
  const shouldAnimate=()=>inView&&!document.hidden&&!motionPreference.matches;
  function cross(a, b, c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
  function triangulate(points) {
    const remaining = points.map((_, i) => i);
    const triangles = [];
    const inside = (p, a, b, c) => cross(a,b,p) >= -1e-8 && cross(b,c,p) >= -1e-8 && cross(c,a,p) >= -1e-8;
    while (remaining.length > 3) {
      let found = false;
      for (let i = 0; i < remaining.length; i++) {
        const a = remaining[(i+remaining.length-1)%remaining.length], b = remaining[i], c = remaining[(i+1)%remaining.length];
        if (cross(points[a],points[b],points[c]) <= 1e-9) continue;
        if (remaining.some(j => j !== a && j !== b && j !== c && inside(points[j],points[a],points[b],points[c]))) continue;
        triangles.push([a,b,c]); remaining.splice(i,1); found = true; break;
      }
      if (!found) throw new Error('SVG outline could not be triangulated.');
    }
    triangles.push(remaining.slice());
    return triangles;
  }
  function multiply(a,b) {
    const out=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];
    return out;
  }

  function buildMesh(points) {
    const verts=[];
    const at=(i,z)=>[...points[i],z];
    const face=(a,b,c)=>verts.push(...a,...b,...c);
    const halfDepth=.009;
    for(const [a,b,c] of triangulate(points)) {
      face(at(a,halfDepth),at(b,halfDepth),at(c,halfDepth));
      face(at(c,-halfDepth),at(b,-halfDepth),at(a,-halfDepth));
    }
    for(let i=0;i<points.length;i++) {
      const j=(i+1)%points.length;
      face(at(i,-halfDepth),at(j,-halfDepth),at(j,halfDepth));
      face(at(i,-halfDepth),at(j,halfDepth),at(i,halfDepth));
    }
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,0,0);
    vertexCount=verts.length/3;meshReady=true;
  }
  function draw(){if(frame===null)frame=requestAnimationFrame(render);}
  function render(time) {
    frame=null;if(!meshReady)return;
    const elapsed=previousTime===null?0:Math.min((time-previousTime)/1000,.05);previousTime=time;
    if(shouldAnimate()&&!drag){rotationX+=spin[0]*elapsed;rotationY+=spin[1]*elapsed;rotationZ+=spin[2]*elapsed;}
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);
    hoverAmount += (hoverTarget-hoverAmount)*Math.min(1,elapsed*12);
    gl.uniform1f(hoverLocation,hoverAmount);
    const cx=Math.cos(rotationX),sx=Math.sin(rotationX),cy=Math.cos(rotationY),sy=Math.sin(rotationY),cz=Math.cos(rotationZ),sz=Math.sin(rotationZ);
    const rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1];
    const ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1];
    const rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];
    const aspect=w/h,f=Math.min(1/Math.tan(43*Math.PI/360)*.93,aspect*2.3);
    gl.uniformMatrix4fv(modelLocation,false,multiply(ry,multiply(rx,rz)));
    gl.uniformMatrix4fv(projectionLocation,false,new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]));
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,vertexCount);
    if(shouldAnimate()||Math.abs(hoverTarget-hoverAmount)>.001)draw();
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    draggedClick=false;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>8)drag.moved=true;
    if(drag.moved){rotationY+=(e.clientX-drag.x)*.009;rotationX+=(e.clientY-drag.y)*.009;}
    drag.x=e.clientX;drag.y=e.clientY;draw();
  });
  const end=e=>{if(!drag||e.pointerId!==drag.id)return;draggedClick=drag.moved||e.type==='pointercancel';drag=null;canvas.classList.remove('is-dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('lostpointercapture',()=>{drag=null;canvas.classList.remove('is-dragging');});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();document.querySelector('.about-x-link').click();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();
    if(e.key==='ArrowLeft')rotationY-=.15;if(e.key==='ArrowRight')rotationY+=.15;
    if(e.key==='ArrowUp')rotationX-=.15;if(e.key==='ArrowDown')rotationX+=.15;
    if(e.key==='Home'){rotationX=-.2;rotationY=-.32;rotationZ=-.025;}draw();
  });
  const restart=()=>{previousTime=null;draw();};
  new ResizeObserver(draw).observe(stage);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;restart();}).observe(canvas);
  document.addEventListener('visibilitychange',restart);motionPreference.addEventListener('change',restart);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();meshReady=false;stage.classList.remove('is-ready');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  fetch('images/design-x.svg').then(r=>{if(!r.ok)throw new Error('SVG unavailable');return r.text();}).then(source=>{
    const svg=new DOMParser().parseFromString(source,'image/svg+xml');
    const path=svg.querySelector('path');
    if(!path)throw new Error('Missing SVG path');
    const length=path.getTotalLength();
    let points=Array.from({length:360},(_,i)=>{const p=path.getPointAtLength(i*length/360);return [(p.x-151.04)/100,(153.25-p.y)/100];});
    // Remove nearly collinear samples while retaining curved ends and corners.
    let changed=true;
    while(changed&&points.length>24){changed=false;for(let i=0;i<points.length;i++){
      const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length];
      if(Math.abs(cross(a,b,c))/Math.hypot(c[0]-a[0],c[1]-a[1])<0.0005){points.splice(i,1);changed=true;i--;}
    }}
    const area=points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0);
    if(area<0)points.reverse();
    buildMesh(points);stage.classList.add('is-ready');draw();
  }).catch(error=>{console.error(error);canvas.hidden=true;});
})();
