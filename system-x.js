(() => {
  'use strict';
  const canvas = document.querySelector('#system-x-canvas');
  const stage = document.querySelector('.system-content');
  const gl = canvas.getContext('webgl', {antialias:true, alpha:true});
  if (!gl) { canvas.hidden=true; return; }
  const shader = (type, source) => {
    const result=gl.createShader(type); gl.shaderSource(result,source); gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  };
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`
    attribute vec3 aPosition, aNormal;
    uniform mat4 uModel, uProjection;
    varying vec3 vWorld, vNormal, vLocal;
    void main(){ vec4 p=uModel*vec4(aPosition,1.0); vLocal=aPosition; vWorld=p.xyz; vNormal=mat3(uModel)*aNormal; p.z-=4.6; gl_Position=uProjection*p; }
  `));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
    precision highp float;
    uniform float uHover, uEntryAge, uSeedCircle;
    varying vec3 vWorld, vNormal, vLocal;
    void main(){
      if(uSeedCircle>.5){
        if(uEntryAge<0.0 || uEntryAge>=1.60)discard;
        float alpha=smoothstep(0.0,.04,uEntryAge)*(1.0-smoothstep(1.52,1.60,uEntryAge));
        gl_FragColor=vec4(vec3(.2,.42353,1.0)*alpha,alpha);return;
      }
      vec3 normal=normalize(vNormal);
      vec3 light=normalize(vec3(-.45,.75,1.2));
      vec3 view=normalize(vec3(0.0,0.0,4.6)-vWorld);
      float diffuse=max(dot(normal,light),0.0);
      float rim=max(dot(normal,normalize(vec3(.8,-.3,.4))),0.0);
      float highlight=pow(max(dot(normal,normalize(light+view)),0.0),48.0);
      float shade=.018+.10*diffuse+.035*rim+(.10+.08*uHover)*highlight;
      // A circle matching the SVG cap grows into the arm, then the full X.
      if(uEntryAge<.34)discard;
      float reveal=1.0;
      if(uEntryAge<1.60){
        vec2 cap=vec2(1.314,.346);
        float lengthToCenter=length(cap);
        float progress=clamp((uEntryAge-.34)/1.23,0.0,1.0);
        // One continuous curve avoids stopping at the central junction.
        progress=progress*progress*progress*(progress*(progress*6.0-15.0)+10.0);
        float travel=(lengthToCenter+1.65)*progress;
        vec2 head=cap*(1.0-min(travel/lengthToCenter,1.0));
        vec2 segment=head-cap;
        float fraction=clamp(dot(vLocal.xy-cap,segment)/max(dot(segment,segment),.00001),0.0,1.0);
        float capsuleDistance=length(vLocal.xy-(cap+segment*fraction));
        float inward=1.0-smoothstep(.180,.213,capsuleDistance);
        // Extend each remaining arm lengthwise instead of revealing a disk.
        // At zero length every arm shares the same central circle, so the
        // handoff from the incoming stem has no change in shape or speed.
        reveal=inward;
        if(travel>=lengthToCenter){
          float armLength=travel-lengthToCenter;
          for(int i=1;i<=5;i++){
            float angle=.25746+float(i)*1.04719755;
            vec2 axis=vec2(cos(angle),sin(angle));
            vec2 closest=axis*clamp(dot(vLocal.xy,axis),0.0,armLength);
            float armDistance=length(vLocal.xy-closest);
            reveal=max(reveal,1.0-smoothstep(.180,.213,armDistance));
          }
        }
        if(reveal<.005)discard;
      }
      float finished=smoothstep(1.60,2.10,uEntryAge);
      gl_FragColor=vec4(mix(vec3(.2,.42353,1.0),vec3(shade),finished)*reveal,reveal);
    }
  `));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const positionLocation=gl.getAttribLocation(program,'aPosition');
  const normalLocation=gl.getAttribLocation(program,'aNormal');
  const modelLocation=gl.getUniformLocation(program,'uModel');
  const projectionLocation=gl.getUniformLocation(program,'uProjection');
  const hoverLocation=gl.getUniformLocation(program,'uHover');
  const entryLocation=gl.getUniformLocation(program,'uEntryAge');
  const seedLocation=gl.getUniformLocation(program,'uSeedCircle');
  let hoverTarget=0, hoverAmount=0, draggedClick=false;
  const updateHover=()=>{hoverTarget=canvas.matches(':hover,:focus-visible')?1:0;draw();};
  ['pointerenter','pointerleave','focus','blur'].forEach(event=>canvas.addEventListener(event,updateHover));
  let meshReady=false, vertexCount=0, frame=null, previousTime=null, inView=true, drag=null;
  // Both screens render one shared orientation and advance it once per animation frame.
  const motion={
    rotationX:-.20, rotationY:-.32, rotationZ:-.025,
    spin:[Math.random()<.5?-.14175:.14175,Math.random()<.5?-.315:.315,Math.random()<.5?-.0756:.0756],
    previousTime:null, frameTime:null, dragging:false
  };
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
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
    // Flat normals preserve the sharp front/side junction: no bevel or fillet.
    const face=(a,b,c)=>{
      const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
      const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      const length=Math.hypot(...normal);
      const n=normal.map(v=>v/length);
      for(const vertex of [a,b,c])verts.push(...vertex,...n);
    };
    // The six SVG arms are approximately 39.3 units wide at the 1/100 mesh scale.
    // Match extrusion to that width for an almost square arm cross-section.
    const halfDepth=.1965;
    for(const [a,b,c] of triangulate(points)) {
      face(at(a,halfDepth),at(b,halfDepth),at(c,halfDepth));
      face(at(c,-halfDepth),at(b,-halfDepth),at(a,-halfDepth));
    }
    for(let i=0;i<points.length;i++) {
      const j=(i+1)%points.length;
      face(at(i,-halfDepth),at(j,-halfDepth),at(j,halfDepth));
      face(at(i,-halfDepth),at(j,halfDepth),at(i,halfDepth));
    }
    vertexCount=verts.length/6;
    // A complete disk is drawn independently, so the SVG cannot clip the seed.
    const center=[1.314,.346,halfDepth+.001],radius=.1965;
    for(let i=0;i<64;i++){
      const a=i*Math.PI*2/64,b=(i+1)*Math.PI*2/64;
      face(center,[center[0]+Math.cos(a)*radius,center[1]+Math.sin(a)*radius,center[2]],
        [center[0]+Math.cos(b)*radius,center[1]+Math.sin(b)*radius,center[2]]);
    }
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(normalLocation);gl.vertexAttribPointer(normalLocation,3,gl.FLOAT,false,24,12);
    meshReady=true;
  }
  function draw(){if(frame===null)frame=requestAnimationFrame(render);}
  function render(time) {
    frame=null;if(!meshReady)return;
    const elapsed=previousTime===null?0:Math.min((time-previousTime)/1000,.05);previousTime=time;
    if(shouldAnimate()&&!motion.dragging&&motion.frameTime!==time){
      const step=motion.previousTime===null?0:Math.min((time-motion.previousTime)/1000,.05);
      motion.previousTime=time;motion.frameTime=time;
      const entryAge=motion.entryStartedAt===undefined?Infinity:time-motion.entryStartedAt;
      const ramp=Math.max(0,Math.min(1,(entryAge-2600)/450));
      const speed=ramp*ramp*(3-2*ramp);
      motion.rotationX+=motion.spin[0]*step*speed;motion.rotationY+=motion.spin[1]*step*speed;motion.rotationZ+=motion.spin[2]*step*speed;
    }
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);
    hoverAmount += (hoverTarget-hoverAmount)*Math.min(1,elapsed*12);
    gl.uniform1f(hoverLocation,hoverAmount);
    const entryAge=motion.entryStartedAt===undefined?Infinity:time-motion.entryStartedAt;
    gl.uniform1f(entryLocation,motionPreference.matches?4:entryAge/1000);
    const cx=Math.cos(motion.rotationX),sx=Math.sin(motion.rotationX),cy=Math.cos(motion.rotationY),sy=Math.sin(motion.rotationY),cz=Math.cos(motion.rotationZ),sz=Math.sin(motion.rotationZ);
    const rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1];
    const ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1];
    const rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];
    const aspect=w/h,f=Math.min(1/Math.tan(43*Math.PI/360)*.93,aspect*2.3);
    gl.uniformMatrix4fv(modelLocation,false,multiply(ry,multiply(rx,rz)));
    gl.uniformMatrix4fv(projectionLocation,false,new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(seedLocation,0);gl.drawArrays(gl.TRIANGLES,0,vertexCount);
    gl.uniform1f(seedLocation,1);gl.drawArrays(gl.TRIANGLES,vertexCount,64*3);
    if(shouldAnimate()||Math.abs(hoverTarget-hoverAmount)>.001)draw();
  }
  window.addEventListener('designx:system-opened',event=>{
    motion.rotationX=0;motion.rotationY=0;motion.rotationZ=0;
    motion.entryStartedAt=performance.now()+(event.detail?.delay||0);motion.previousTime=null;
    draw();
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
