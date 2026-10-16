/* Engine, part 2: renderer, input, player movement, picking, NPC behaviour and the frame loop. */
(function(){
'use strict';
const RS=window.RS,D=RS.D,W=window.World,A=window.Atlas,Phys=window.Phys,NPC=window.NPC,E=window.Engine,S=E._;
const N=W.N;
const P=E.player={x:30.5,y:56.5,z:0,vz:0,a:-Math.PI/2,pitch:0,stepOff:0,grounded:true,speed:3.0};
const keys=E.keys={};E.paused=true;E.target=null;
let renderer,scene,camera,canvas,sky,ground,clouds=[],lights;
const SKY_TOP=new THREE.Color('#5aa6e8'),SKY_HOR=new THREE.Color('#cfe6f5');
const FOG_IN=new THREE.Color('#2a2016'),FOG_OUT=new THREE.Color('#cfe6f5');

E.init=function(cv){
 canvas=cv;E.canvas=cv;
 renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
 renderer.setClearColor(0xcfe6f5);
 renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 scene=S.scene=new THREE.Scene();
 const ec=document.createElement('canvas');ec.width=512;ec.height=256;const ex=ec.getContext('2d');const eg=ex.createLinearGradient(0,0,0,256);eg.addColorStop(0,'#e6e8e5');eg.addColorStop(.48,'#c3bda8');eg.addColorStop(1,'#4d4637');ex.fillStyle=eg;ex.fillRect(0,0,512,256);ex.fillStyle='#fffff5';for(const xx of [25,180,350])ex.fillRect(xx,55,35,90);const et=new THREE.CanvasTexture(ec);et.encoding=THREE.sRGBEncoding;et.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(et).texture;pmrem.dispose();et.dispose();
 camera=S.camera=new THREE.PerspectiveCamera(72,1,.12,320);camera.rotation.order='YXZ';
 scene.fog=new THREE.Fog(0x2a2016,20,80);
 // atlas material
 const tex=new THREE.CanvasTexture(A.canvas);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());A.texture=tex;
 const roughnessMap=A.roughnessCanvas?new THREE.CanvasTexture(A.roughnessCanvas):null,metalnessMap=A.metalnessCanvas?new THREE.CanvasTexture(A.metalnessCanvas):null;
 for(const map of [roughnessMap,metalnessMap])if(map){map.generateMipmaps=false;map.minFilter=map.magFilter=THREE.LinearFilter}
 const waterTexture=new THREE.CanvasTexture(A.waterCanvas);waterTexture.encoding=THREE.sRGBEncoding;waterTexture.wrapS=waterTexture.wrapT=THREE.RepeatWrapping;A.waterTexture=waterTexture;
 S.waterMat=new THREE.MeshStandardMaterial({map:waterTexture,vertexColors:true,roughness:.25,metalness:.15});
 S.waterMat.onBeforeCompile=shader=>{shader.uniforms.waterTime=A.waterTime;shader.fragmentShader='uniform float waterTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('texture2D( map, vUv )','texture2D( map, vUv + vec2(sin(waterTime + vUv.y * 12.0), cos(waterTime * .8 + vUv.x * 10.0)) * .015 )'))};
 S.waterMat.customProgramCacheKey=()=> 'museum-water';
 S.mat=new THREE.MeshStandardMaterial({map:tex,vertexColors:true,roughness:roughnessMap?1:.75,metalness:metalnessMap?1:.025,roughnessMap,metalnessMap,bumpMap:tex,bumpScale:.009});
 // lights for the blocky people
 scene.add(new THREE.HemisphereLight(0xe5edf6,0x77634d,1.15));const dl=new THREE.DirectionalLight(0xfff2d8,.55);dl.position.set(-3,6,4);scene.add(dl);
 // sky dome
 {const g=new THREE.SphereGeometry(300,16,10);const col=[];const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const t=Math.max(0,pos.getY(i)/300);const c=SKY_HOR.clone().lerp(SKY_TOP,Math.pow(t,.6));col.push(c.r,c.g,c.b)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));sky=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-10;scene.add(sky)}
 // ground (grass) beyond the building
 {const c=document.createElement('canvas');c.width=c.height=A.TS;const x=c.getContext('2d');x.drawImage(A.canvas,A.idx.grass%A.COLS*A.TS,Math.floor(A.idx.grass/A.COLS)*A.TS,A.TS,A.TS,0,0,A.TS,A.TS);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(300,300);
  ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshBasicMaterial({map:t,color:0xdddddd}));ground.rotation.x=-Math.PI/2;ground.position.set(30,-.07,30);scene.add(ground)}
 // blocky clouds
 {const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,fog:false});for(let i=0;i<14;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),m);c.scale.set(18+Math.random()*22,2+Math.random()*2,8+Math.random()*10);c.position.set(Math.random()*400-200+30,70+Math.random()*25,Math.random()*400-200+30);scene.add(c);clouds.push(c)}}
 E.build();
 scene.traverse(o=>{if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m.isMeshStandardMaterial)m.envMapIntensity=.28})}});
 const st=RS.S.pos;if(st&&isFinite(st.x)){P.x=st.x;P.y=st.y;P.a=st.a||P.a}
 unstick();E.resetMotion();
 E.npcs.forEach(n=>{const pos=Phys.safePosition(n.x,n.y,{gallery:n.gal,radius:.4});if(pos){n.x=pos.x;n.y=pos.y}n.state='wait';n.path=[];n.moving=false});
 // input
 window.addEventListener('keydown',e=>{if(RS.isModal()||E.paused)return;const k=e.key.toLowerCase();keys[k]=true;if(k===' '){P.jumpReq=true}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault()});
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
 window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===cv&&!E.paused&&!RS.isModal()){const k=.0022*RS.S.settings.sens;P.a+=e.movementX*k;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*k))}});
 cv.addEventListener('click',()=>{if(E.paused||RS.isModal())return;if(document.pointerLockElement!==cv&&!E.touch){try{cv.requestPointerLock()}catch(e){}}else if(E.target)E.interact()});
 window.addEventListener('resize',E.resize);
 E.resize();
};
E.resize=function(){
 if(!renderer)return;const q=RS.S.settings.quality;const dpr=window.devicePixelRatio||1;
 const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
 // Keep high-density screens from multiplying the fragment workload fourfold.
 renderer.setPixelRatio(q===0?Math.min(.85,dpr):Math.min(dpr,1.5,Math.sqrt(2000000/(w*h))));
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
};
function unstick(){
 let pos=Phys.safePosition(P.x,P.y,{escape:true});
 if(!pos)pos=Phys.safePosition(28.5,54.5,{gallery:0,escape:true});
 if(pos){P.x=pos.x;P.y=pos.y}P.z=0;P.vz=0;P.vxs=0;P.vys=0;
}
E.teleport=function(x,y,a){
 const pos=Phys.safePosition(x,y,{escape:true});
 if(!pos){RS.toast('This landing is obstructed. Please choose another destination.');return false}
 P.sit=null;P.x=pos.x;P.y=pos.y;if(a!==undefined)P.a=a;P.pitch=0;P.z=0;P.vz=0;P.vxs=0;P.vys=0;P.stepOff=0;
 for(const k in keys)keys[k]=false;E.resetMotion();E.notifyZone(true);return true;
};
E.savePos=()=>{RS.S.pos={x:P.x,y:P.y,a:P.a};RS.save()};
E.interact=function(){
 const t=E.target;if(!t)return;
 if(t.type==='sprite'&&t.s.kind==='seat'){return sit(t.s.seat)}
 if(E.onInteract)E.onInteract(t);
};
function sit(st){P.sit=st;P.x=st.x;P.y=st.y;P.z=st.z;P.vz=0;P.a=st.a;P.pitch=-.12;RS.sfx&&RS.sfx('click')}
function stand(){const st=P.sit;P.sit=null;const dx=Math.cos(st.a),dy=Math.sin(st.a);
 for(const d of [.65,.5,-.65,.8]){const nx=st.x+dx*d,ny=st.y+dy*d;const r=Phys.probe(nx,ny,0,.26);if(r.ok&&r.fl<.45){P.x=nx;P.y=ny;P.z=r.fl;return}}
 const r=Phys.probe(st.x,st.y,st.z);P.z=r.fl}

/* ---------- picking ---------- */
function pickTarget(){
 const cy=Math.cos(P.pitch);const dx=Math.cos(P.a)*cy,dy=Math.sin(P.a)*cy,dz=Math.sin(P.pitch);
 const ox=P.x,oy=P.y,oz=P.z+eye();
 let best=null,bt=99;
 const plane=(px,py,pz,nx,ny,w,h,reach,mk)=>{ // vertical rectangle facing (nx,ny)
  const den=dx*nx+dy*ny;if(den>=-1e-4)return;const t=((px-ox)*nx+(py-oy)*ny)/den;if(t<.1||t>reach||t>=bt)return;
  const hx=ox+dx*t,hy=oy+dy*t,hz=oz+dz*t;const along=(hx-px)*(-ny)+(hy-py)*nx;
  if(Math.abs(along)>w/2+.1||Math.abs(hz-pz)>h/2+.15)return;
  if(!Phys.los(ox,oy,oz,hx+nx*.05,hy+ny*.05,hz))return;
  best=mk();bt=t};
 for(const k in W.artSpots){const s=W.artSpots[k];plane(s.x,s.y,s.z,s.nx,s.ny,s.w,s.h,3.6,()=>({type:'wall',cell:100+s.i,x:s.cell[0],y:s.cell[1],dist:0}))}
 W.signs.forEach((sg,i)=>plane(sg.px,sg.py,sg.pz,sg.nx,sg.ny,sg.pw,sg.ph,3.2,()=>({type:'wall',cell:200+i,x:sg.x,y:sg.y,dist:0})));
 for(const g in W.secretDoor){const d=W.secretDoor[g];if(RS.S.secretOpen[g])continue;plane(d.x+1,d.y+.5,1.1,1,0,.14,.2,1.15,()=>({type:'wall',cell:90,x:d.x,y:d.y,dist:0}))}
 for(const s of E.sprites){if(!s.visible||!s.kind||s.kind==='visitor')continue;
  const cz=(s.zc!==undefined?s.zc:1);const ex=s.x-ox,ey=s.y-oy,ez=cz-oz;const t=ex*dx+ey*dy+ez*dz;
  const reach=s.reach||(s.kind==='station'?3.2:2.8);if(t<.1||t>reach||t>=bt)continue;
  const px=ex-dx*t,py=ey-dy*t,pz=ez-dz*t;const d2=px*px+py*py+pz*pz;const rad=s.pick||.8;if(d2>rad*rad)continue;
  if(!Phys.los(ox,oy,oz,s.x,s.y,Math.min(cz,oz+.3)))continue;
  best={type:'sprite',s,dist:t};bt=t}
 if(best)best.dist=bt;E.target=best;
}
function eye(){return P.sit?.8:Phys.EYE}

/* ---------- NPC behaviour ---------- */
let routeBudget=1;
function updateNpc(n,dt){
 const radius=.38;n.t-=dt;n.moving=false;
 if(n.state==='wait'){
  if(n.t>0||routeBudget<=0)return;routeBudget--;const g=n.gal;let tx,ty;n.admire=false;
  if(g!==9&&Math.random()<.6){const list=Object.values(W.artSpots).filter(s=>s.g===g&&s.level===0);if(list.length){const s=list[Math.floor(Math.random()*list.length)];tx=s.x+s.nx*1.9;ty=s.y+s.ny*1.9;n.admire=true;n.look=Math.atan2(-s.ny,-s.nx)}}
  if(tx===undefined){const o=W.ORIGIN[g];tx=o[0]+3+Math.random()*14;ty=o[1]+3+Math.random()*14}
  n.path=Phys.route(n.x,n.y,tx,ty,g,radius);n.state=n.path.length?'walk':'wait';n.t=n.path.length?40:1+Math.random()*2;
 }else if(n.state==='walk'){
  if(!n.path||!n.path.length||n.t<=0){n.state='look';n.t=3+Math.random()*5;n.remark=Math.random()<.4;return}
  const target=n.path[0],dx=target.x-n.x,dy=target.y-n.y,d=Math.hypot(dx,dy);
  if(d<.06){n.path.shift();return}
  const step=Math.min(n.speed*dt,d),sx=n.x+dx/d*step,sy=n.y+dy/d*step;
  const nearPlayer=Math.abs(P.z)<2&&Math.hypot(sx-P.x,sy-P.y)<.85;
  const nearVisitor=E.npcs.some(other=>other!==n&&Math.hypot(sx-other.x,sy-other.y)<.78);
  if(nearPlayer||nearVisitor){n.blocked=(n.blocked||0)+dt;if(n.blocked>1.8){n.state='wait';n.t=.5+Math.random();n.path=[];n.blocked=0}return}
  if(!Phys.clearSegment(n.x,n.y,sx,sy,radius)){n.state='wait';n.t=.5;n.path=[];return}
  n.x=sx;n.y=sy;n.moving=true;n.heading=Math.atan2(dy,dx);n.blocked=0;
 }else if(n.state==='look'){
  if(n.admire&&n.look!==undefined)n.heading=n.look;
  if(n.t<=0){n.state='wait';n.t=.5+Math.random()*2}
 }
}
E.updateVisitors=function(dt){routeBudget=1;E.npcs.forEach(n=>updateNpc(n,dt))};

/* ---------- per-frame ---------- */
let lastZone='',time=0;
function updatePlayer(dt){
 if(P.sit){
  if(keys['w']||keys['s']||keys['a']||keys['d']||P.jumpReq||(E.joy&&Math.hypot(E.joy.x,E.joy.y)>.4)||keys['arrowup']||keys['arrowdown']){stand();P.jumpReq=false}
 }
 if(E.lookDelta){P.a+=E.lookDelta;E.lookDelta=0}
 if(E.lookDeltaY){P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-E.lookDeltaY));E.lookDeltaY=0}
 let mv=0,st=0,rot=0;
 if(!P.sit){
  if(keys['w']||keys['arrowup'])mv+=1;if(keys['s']||keys['arrowdown'])mv-=1;
  if(keys['a'])st-=1;if(keys['d'])st+=1;
  if(keys['arrowleft'])rot-=1;if(keys['arrowright'])rot+=1;
  if(E.joy){mv+=-E.joy.y;st+=E.joy.x}
  P.a+=rot*2.2*dt*RS.S.settings.sens;
  const sp=P.speed*(keys['shift']?1.7:1);
  const dx=Math.cos(P.a),dy=Math.sin(P.a);
  let vx=dx*mv-dy*st,vy=dy*mv+dx*st;const l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l}
  // some air control only
  const gnd=P.grounded;const ax=gnd?1:.6;
  P.vxs=(P.vxs||0)+(vx*sp-(P.vxs||0))*(1-Math.exp(-dt*(gnd?18:3)));P.vys=(P.vys||0)+(vy*sp-(P.vys||0))*(1-Math.exp(-dt*(gnd?18:3)));
  Phys.step(P,P.vxs,P.vys,dt,P.jumpReq);P.jumpReq=false;
  E.moving=l>.05&&P.grounded;
 }else{E.moving=false}
 P.stepOff*=Math.exp(-dt*12);
}
function updateWorld(dt){
 E.updateVisitors(dt);
 E.notifyZone();
 pickTarget();
}
// Walking, teleporting and beginning a visit share the same entry event.
E.notifyZone=function(force){
 const gx=Math.floor(P.x),gy=Math.floor(P.y),g=W.blockAt(gx,gy),level=P.z>=4.4?1:0;
 const room=g===9||g===0?0:W.roomAt(g,gx,gy),key=g+':'+room+':'+(g===9?0:level);
 if(force||key!==lastZone){lastZone=key;E.zoneG=g;E.zoneRoom=room;E.level=level;RS.emit('zone',{g,room,level})}
};
// Stable 120Hz movement preserves distance through normal frame stalls.
const movement={step:1/120,accumulator:0,previous:{x:P.x,y:P.y,z:P.z,stepOff:0}};
E.resetMotion=function(){movement.accumulator=0;Object.assign(movement.previous,{x:P.x,y:P.y,z:P.z,stepOff:P.stepOff})};
E.advance=function(dt){
 movement.accumulator+=Math.max(0,Math.min(.25,dt));
 while(movement.accumulator+1e-9>=movement.step){Object.assign(movement.previous,{x:P.x,y:P.y,z:P.z,stepOff:P.stepOff});updatePlayer(movement.step);movement.accumulator-=movement.step}
 updateWorld(dt);
};
E.renderPosition=function(){const a=Math.max(0,Math.min(1,movement.accumulator/movement.step)),prev=movement.previous;return {x:prev.x+(P.x-prev.x)*a,y:prev.y+(P.y-prev.y)*a,z:prev.z+(P.z-prev.z)*a,stepOff:prev.stepOff+(P.stepOff-prev.stepOff)*a}};
let lightTick=0;
function animate(dt){
 time+=dt;
 A.animate(dt);
 lightTick-=dt;if(lightTick<=0&&S.galleryLights){lightTick=.5;const near=S.galleryLights.map(l=>({l,d:(l.position.x-P.x)**2+(l.position.z-P.y)**2})).sort((a,b)=>a.d-b.d);S.galleryLights.forEach(l=>l.visible=l===near[0].l||l===near[1].l)}
 // doors open as you approach
 S.doors.forEach(d=>{const dist=Math.hypot(P.x-d.cx,P.y-d.cy);const tgt=dist<(d.front?5.5:4.2)?1:0;d.open+=(tgt-d.open)*Math.min(1,dt*6);
  [d.a,d.b].forEach(l=>{const th=l.c+(l.o-l.c)*d.open;l.g.rotation.y=-th})});
 for(const g in S.secret){const o=S.secret[g];if(o.open&&o.p<1){o.p=Math.min(1,o.p+dt*1.6)}o.grp.rotation.y=Math.PI/2*o.p}
 // icons bob
 for(const s of E.sprites){if(!s.mesh)continue;s.mesh.visible=s.visible;if(s.visible&&s.base!==undefined&&s.kind==='item')s.mesh.position.y=s.base+Math.sin(time*2+s.x)*.06}
 // people
 const pt=time;
 for(const s of E.sprites){if(!s.model)continue;
  const dxp=P.x-s.x,dyp=P.y-s.y,dp=Math.hypot(dxp,dyp);
  // Refresh body visibility periodically; walls hide visitors in other wings.
  s.cullTimer=(s.cullTimer||0)-dt;
  if(s.cullTimer<=0){s.cullTimer=.18;s.model.visible=dp<30&&(Phys.los(P.x,P.y,P.z+Phys.EYE,s.x,s.y,1.65)||Phys.los(P.x,P.y,P.z+Phys.EYE,s.x,s.y,1.05))}
  if(!s.model.visible)continue;
  if(s.kind==='visitor'){s.model.position.set(s.x,0,s.y);const hd=s.heading||0;s.model.rotation.y=-hd;NPC.animate(s.model,pt+s.x,s.moving)}
  else{s.model.position.set(s.x,0,s.y);let face=s.face||0;if(dp<5){face=Math.atan2(dyp,dxp)}s.fa=(s.fa===undefined?face:s.fa+(((face-s.fa+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*6));s.model.rotation.y=-s.fa;NPC.animate(s.model,pt,false)}
 }
 // sky follows camera, clouds drift
 sky.position.copy(camera.position);clouds.forEach((c,i)=>{c.position.x+=dt*(1+i%3*.4);if(c.position.x>260)c.position.x=-170});
 // fog: bright and distant outdoors, warm and near indoors
 const out=(E.zoneG===9||(P.y>=60))?1:0;S.out=(S.out||0)+(out-(S.out||0))*Math.min(1,dt*2);
 scene.fog.color.copy(FOG_IN).lerp(FOG_OUT,S.out);scene.fog.near=65+S.out*40;scene.fog.far=180+S.out*100;
 renderer.setClearColor(scene.fog.color);
}
let last=0,running=false,fpsT=0,fpsN=0;
function frame(t){
 if(!running)return;requestAnimationFrame(frame);
 if(document.hidden||!canvas.offsetParent){last=t;E.resetMotion();return}
 const dt=Math.max(0,Math.min(.25,(t-last)/1000));last=t;
 if(canvas.clientWidth!==S.cw||canvas.clientHeight!==S.ch){S.cw=canvas.clientWidth;S.ch=canvas.clientHeight;E.resize()}
 if(!E.paused&&!RS.isModal())E.advance(dt);else E.resetMotion();
 animate(dt);
 const bob=(RS.S.settings.bob&&!RS.S.settings.reducedMotion&&E.moving)?Math.sin(time*8)*.012:0;
 const rp=E.renderPosition();
 const ey=P.sit?(P.sit.z+.8):(rp.z+Phys.EYE+rp.stepOff+bob);
 camera.position.set(rp.x,ey,rp.y);camera.rotation.y=-P.a-Math.PI/2;camera.rotation.x=P.pitch;
 renderer.render(scene,camera);
}
E.pick=function(){pickTarget();return E.target};
E.start=function(){if(running)return;running=true;last=performance.now();requestAnimationFrame(frame)};
E.stop=function(){running=false};
E.renderer=()=>renderer;
})();
