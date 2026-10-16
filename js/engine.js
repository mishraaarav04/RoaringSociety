/* Engine, part 1: scene construction (Three.js). Pixel art lives in the textures, the screen is rendered at full resolution. */
(function(){
'use strict';
const RS=window.RS,D=RS.D,W=window.World,A=window.Atlas,Pr=window.Props;
const E=window.Engine={};const S=E._={};
const N=W.N;
E.N=N;E.ORIGIN=W.ORIGIN;E.map=W.map;E.floorId=W.floorId;E.blockAt=W.blockAt;E.roomAt=W.roomAt;E.signs=W.signs;E.secretDoor=W.secretDoor;
const sprites=E.sprites=[],npcs=E.npcs=[];E.artCells={};E.stationSprites={};E.itemSprites={};
const ITEM_ICON=E.ITEM_ICON={weevil:'🪲',ledger:'📒',ticket:'🎫',timecard:'⏱️',directory:'📑',dossier:'📁',handbill:'📃',warrant:'📜',aclucard:'🪪',scopes:'📘',trunklabel:'🏷️',quotacard:'📇',unioncard:'💳',leaflet:'📄',strikeposter:'🚩',manifesto:'📰',typeblock:'🔤',sketch:'✏️',brief:'📑',plate:'🗜️',password:'🔑',flask:'🍵',payoff:'📒',label:'🏷️',repeal:'🔖',stack1:'🗂️',stack2:'📼',stack3:'🪪'};
const STATION_ICON={directory:'📍',passport:'🛂',migration:'🗺️',hearing:'📂',source3:'📰',quota:'📊',board:'📌',courtroom:'⚖️',policy:'🏛️',bib:'📚',radio:'📻',terminal:'💻',microfilm:'🎞️',eval:'🔍',pedestals:'🏛️',atrium:'📝',curator:'🎖️',fountain:'⛲',cafe:'☕',paper:'📰',newsstand:'🗞️',bandstand:'🎺',telescope:'🔭',nickelodeon:'🎬',raid:'🚨',vaultcredits:'📜'};

/* ---------- small canvas helpers ---------- */
function nearest(t){t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}
const emojiCache={};
function emojiTex(e){if(emojiCache[e])return emojiCache[e];
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;
 x.font='22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,16,17);
 const id=x.getImageData(0,0,32,32);for(let i=0;i<id.data.length;i+=4)id.data[i+3]=id.data[i+3]>110?255:0;x.putImageData(id,0,0);
 return emojiCache[e]=nearest(new THREE.CanvasTexture(c))}
function icon(e,size){const m=new THREE.SpriteMaterial({map:emojiTex(e),transparent:true,alphaTest:.3,depthWrite:true});const s=new THREE.Sprite(m);s.scale.set(size||.55,size||.55,1);return s}

/* Small museum labels replace floating pixel emoji at the main exhibits. */
function stationLabel(text){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
 x.fillStyle='#24372f';x.fillRect(0,0,1024,256);x.strokeStyle='#b9a172';x.lineWidth=6;x.strokeRect(6,6,1012,244);x.fillStyle='#eee4cb';x.font='500 48px "Libre Franklin",Arial';x.textAlign='center';
 const words=text.replace(/^.*?: /,'').split(' ');let line='',lines=[];for(const word of words){if(x.measureText(line+' '+word).width>940&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);
 lines.slice(0,3).forEach((l,i)=>x.fillText(l,512,128-(Math.min(lines.length,3)-1)*29+i*58));const texture=new THREE.CanvasTexture(c);texture.encoding=THREE.sRGBEncoding;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.scale.set(1.5,.375,1);return sprite;
}

/* ---------- artwork paintings ---------- */
const AW=128,AH=94;
const art=S.art=[];
function wrap(x,text,maxW,maxLines){const w=String(text||'').split(' ');const L=[];let cur='';w.forEach(t=>{const n=cur?cur+' '+t:t;if(x.measureText(n).width>maxW&&cur){L.push(cur);cur=t}else cur=n});if(cur)L.push(cur);return L.slice(0,maxLines)}
/* readable stand-in shown until (or instead of) the real archive image */
function placeholder(x,a){
 const T=a.type||'document',ink='#2b2013';x.textAlign='center';x.textBaseline='alphabetic';
 const title=RS.strip?RS.strip(a.title):a.title;
 const lines=(y0,n,x0,x1,col)=>{x.fillStyle=col||'#8b7d5f';for(let k=0;k<n;k++){const ww=(x1-x0)*(k%3===2?.6:1);x.fillRect(x0,y0+k*4,ww,1)}};
 if(T==='newspaper'||T==='article'||T==='ad'){x.fillStyle='#e6dcc0';x.fillRect(0,0,AW,AH);x.fillStyle=ink;x.font='bold 11px serif';x.fillText('THE DAILY '+(a.date||'').slice(0,4),AW/2,14);x.fillRect(6,17,AW-12,1);x.fillRect(6,19,AW-12,1);
  x.font='bold 9px serif';wrap(x,title.toUpperCase(),AW-14,3).forEach((l,k)=>x.fillText(l,AW/2,32+k*10));lines(64,6,8,60);lines(64,6,68,AW-8);x.fillStyle='#b9ab88';x.fillRect(8,AH-14,52,8)}
 else if(T==='photo'||T==='portrait'||T==='evidence'){const g=x.createLinearGradient(0,0,0,AH);g.addColorStop(0,'#9d8d72');g.addColorStop(1,'#4a3f2d');x.fillStyle=g;x.fillRect(0,0,AW,AH);
  x.fillStyle='#3a3124';if(T==='portrait'){x.beginPath();x.arc(AW/2,38,15,0,7);x.fill();x.fillRect(AW/2-26,56,52,40)}else{for(let k=0;k<7;k++){const h=18+((k*37)%26);x.fillRect(k*19-4,AH-h-14,16,h)}x.beginPath();x.arc(98,22,7,0,7);x.fillStyle='#d6c79f';x.fill()}
  x.fillStyle='rgba(20,14,6,.78)';x.fillRect(0,AH-24,AW,24);x.fillStyle='#f3e4bf';x.font='bold 8px sans-serif';wrap(x,title,AW-10,2).forEach((l,k)=>x.fillText(l,AW/2,AH-13+k*9))}
 else if(T==='map'){x.fillStyle='#d9cfa8';x.fillRect(0,0,AW,AH);x.fillStyle='#7fa6b8';x.fillRect(0,0,AW,AH);x.fillStyle='#a9b57d';x.beginPath();x.moveTo(14,26);x.lineTo(60,12);x.lineTo(100,30);x.lineTo(112,60);x.lineTo(70,80);x.lineTo(24,66);x.closePath();x.fill();x.strokeStyle='#6b5a3a';x.setLineDash([3,3]);x.beginPath();x.moveTo(30,60);x.lineTo(60,40);x.lineTo(96,30);x.stroke();x.setLineDash([]);
  x.fillStyle='rgba(20,14,6,.78)';x.fillRect(0,AH-20,AW,20);x.fillStyle='#f3e4bf';x.font='bold 8px sans-serif';wrap(x,title,AW-10,2).forEach((l,k)=>x.fillText(l,AW/2,AH-10+k*8-(l?0:0)))}
 else if(T==='chart'){x.fillStyle='#efe6cc';x.fillRect(0,0,AW,AH);x.fillStyle=ink;x.font='bold 8px sans-serif';wrap(x,title,AW-10,2).forEach((l,k)=>x.fillText(l,AW/2,12+k*9));x.fillRect(12,70,AW-24,1);x.fillRect(12,28,1,42);['#9b2335','#4a6a9b','#d99a1e','#3f7d4e','#9b2335','#4a6a9b'].forEach((c,k)=>{x.fillStyle=c;const h=12+((k*29)%28);x.fillRect(18+k*16,70-h,11,h)})}
 else if(T==='poster'||T==='cartoon'||T==='diagram'){x.fillStyle='#d9b45a';x.fillRect(0,0,AW,AH);x.fillStyle='#8c2f39';x.fillRect(5,5,AW-10,AH-10);x.fillStyle='#f3e4bf';x.fillRect(8,8,AW-16,AH-16);x.fillStyle='#8c2f39';x.font='bold 10px serif';wrap(x,title.toUpperCase(),AW-24,4).forEach((l,k)=>x.fillText(l,AW/2,26+k*12))}
 else{x.fillStyle='#ece2c6';x.fillRect(0,0,AW,AH);x.fillStyle='#d4c8a4';x.fillRect(0,0,AW,3);x.fillStyle=ink;x.font='bold 9px serif';wrap(x,title,AW-20,3).forEach((l,k)=>x.fillText(l,AW/2,18+k*10));x.fillRect(20,44,AW-40,1);lines(50,7,14,AW-14);x.fillStyle='#8c2f39';x.beginPath();x.arc(AW-22,AH-14,6,0,7);x.fill()}
 x.font='bold 7px sans-serif';x.fillStyle='rgba(43,32,19,.55)';x.textAlign='right';if(a.date)x.fillText(a.date,AW-4,AH-3);
}
function paintArt(i){
 const a=D.A[i],o=art[i];const x=o.ctx;
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.fillStyle='#e9dcc0';x.fillRect(0,0,AW,AH);
 if(o.img){const im=o.img,ar=im.width/im.height,w=AW,h=AH;let sx=0,sy=0,sw=im.width,sh=im.height;if(ar>w/h){sw=im.height*w/h;sx=(im.width-sw)/2}else{sh=im.width*h/w;sy=(im.height-sh)/2}x.drawImage(im,sx,sy,sw,sh,0,0,w,h)}
 else placeholder(x,a);
 if(RS.S.seen.includes(a.id)){x.fillStyle='#2ecc71';x.fillRect(AW-14,AH-14,12,12);x.fillStyle='#fff';x.fillRect(AW-11,AH-8,2,2);x.fillRect(AW-9,AH-6,2,2);x.fillRect(AW-7,AH-10,2,5)}
 o.tex.needsUpdate=true;
}
const thumbReq={},thumbUrl={};
function loadImg(i,url,fallback){const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{art[i].img=im;paintArt(i)};im.onerror=()=>{if(fallback)loadImg(i,fallback)};im.src=url}
E.loadGallery=function(g){
 if(thumbReq[g])return;thumbReq[g]=1;
 const list=[];D.A.forEach((a,i)=>{if(a.g===g&&a.f&&a.f[0]&&art[i])list.push([i,a.f[0]])});if(!list.length)return;
 const direct=f=>RS.fileUrl(f,330);
 // ask the Commons API for real thumbnail URLs (served with CORS headers), fall back to Special:FilePath
 const titles=list.map(l=>'File:'+l[1].replace(/_/g,' ')).join('|');
 fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url&iiurlwidth=330&titles='+encodeURIComponent(titles))
  .then(r=>r.json()).then(j=>{const by={};const norm={};((j.query&&j.query.normalized)||[]).forEach(n=>norm[n.from]=n.to);
   Object.values((j.query&&j.query.pages)||{}).forEach(p=>{if(p.imageinfo&&p.imageinfo[0])by[p.title]=p.imageinfo[0].thumburl||p.imageinfo[0].url});
   list.forEach(([i,f])=>{const t='File:'+f.replace(/_/g,' ');const u=by[norm[t]||t];loadImg(i,u||direct(f),u?direct(f):null)})})
  .catch(()=>list.forEach(([i,f])=>loadImg(i,direct(f))));
};
E.refreshSeen=()=>{art.forEach((o,i)=>{if(o)paintArt(i)})};

/* ---------- sign textures ---------- */
function signTex(text,g,opts){
 const c=document.createElement('canvas');c.width=512;c.height=320;const x=c.getContext('2d');x.scale(8,8);x.imageSmoothingEnabled=true;
 const acc=D.G[g].accent;x.fillStyle='#1b140c';x.fillRect(0,0,64,40);x.fillStyle=acc;x.fillRect(2,2,60,36);x.fillStyle='#1b140c';x.fillRect(4,4,56,32);
 x.fillStyle='#f3e4bf';x.font='600 7px "Libre Franklin",Arial';x.textAlign='center';
 const words=text.split(' ');const lines=[];let cur='';words.forEach(w=>{if((cur+' '+w).trim().length>11){lines.push(cur);cur=w}else cur=(cur+' '+w).trim()});lines.push(cur);
 const n=Math.min(lines.length,3);const by=(opts&&opts.legend)?15:21;lines.slice(0,3).forEach((l,i)=>x.fillText(l.slice(0,12),32,by-(n-1)*4+i*9));
 if(opts&&opts.legend){x.fillStyle={gold:'#d4af37',silver:'#c3c9cf',green:'#2f8f58'}[opts.legend];x.fillRect(24,32,16,3)}
 const tex=new THREE.CanvasTexture(c);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;return tex;
}

/* ---------- build ---------- */
E.build=function(){
 const scene=S.scene,mat=S.mat;
 W.layout();Pr.place();W.mesh();
 // chunk meshes
 const CH=W._chunks();
 Object.keys(CH).forEach(k=>{const ch=CH[k];if(!ch.n)return;const m=new THREE.Mesh(W.buildGeometry(ch),k==='water'?S.waterMat:mat);m.matrixAutoUpdate=false;scene.add(m)});
 // paintings
 Object.values(W.artSpots).forEach(sp=>{
  const i=sp.i;const c=document.createElement('canvas');c.width=AW*4;c.height=AH*4;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.scale(4,4);
  const tex=new THREE.CanvasTexture(c);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;art[i]={canvas:c,ctx,tex,img:null};
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(sp.w,sp.h),new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(sp.light*.98,sp.light*.98,sp.light*.98)}));
  const off=.03;mesh.position.set(sp.x+sp.nx*off,sp.z,sp.y+sp.ny*off);
  mesh.rotation.y=sp.nx===1?Math.PI/2:sp.nx===-1?-Math.PI/2:sp.ny===1?0:Math.PI;scene.add(mesh);paintArt(i);
  E.artCells[i]=sp.cell;
 });
 // signs
 W.signs.forEach((sg,k)=>{const d=W.DIRV[sg.dir];const x=sg.x+.5+(sg.dir==='E'?.5:sg.dir==='W'?-.5:0),y=sg.y+.5+(sg.dir==='S'?.5:sg.dir==='N'?-.5:0);
  const tex=signTex(sg.text,sg.g,sg.opts);
  sg.px=x;sg.py=y;sg.pz=1.9;sg.pw=1.3;sg.ph=.82;sg.nx=d[0];sg.ny=d[1];
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.82),new THREE.MeshBasicMaterial({map:tex,color:0xf0f0f0}));
  m.position.set(x+d[0]*.03,1.9,y+d[1]*.03);m.rotation.y=d[0]===1?Math.PI/2:d[0]===-1?-Math.PI/2:d[1]===1?0:Math.PI;scene.add(m);
 });
 // hanging staircase signs
 (W.hang||[]).forEach(h=>{const tex=signTex(h.text,h.g);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.81),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(h.x,h.z,h.y);m.rotation.y=-Math.PI/2;scene.add(m)});
 // front banner
 {const c=document.createElement('canvas');c.width=1024;c.height=160;const x=c.getContext('2d');x.scale(8,8);x.fillStyle='#1b140c';x.fillRect(0,0,128,20);x.fillStyle='#d4af37';x.fillRect(1,1,126,18);x.fillStyle='#1b140c';x.fillRect(3,3,122,14);x.fillStyle='#f3d98a';x.font='600 10px "Libre Franklin",Arial';x.textAlign='center';x.fillText('THE ROARING SOCIETY',64,14);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.88),new THREE.MeshBasicMaterial({map:nearest(new THREE.CanvasTexture(c))}));m.position.set(30,4.55,60.05);scene.add(m);}
 // door leaves
 S.doors=[];const leafGeo=W.boxGeo(.86,3.28,.08,'door',.95);
 W.doorways.forEach(d=>{
  const mk=(hx,hy,thC,thO)=>{const g=new THREE.Group();g.position.set(hx,0,hy);const m=new THREE.Mesh(leafGeo,S.mat);m.position.set(.43,1.64,0);g.add(m);scene.add(g);return {g,c:thC,o:thO,t:0}};
  let la,lb;
  if(d.along==='y'){la=mk(d.cx,d.cy-.88,Math.PI/2,0);lb=mk(d.cx,d.cy+.88,-Math.PI/2,0)}
  else{la=mk(d.cx-.88,d.cy,0,Math.PI/2);lb=mk(d.cx+.88,d.cy,Math.PI,Math.PI/2)}
  [la,lb].forEach(l=>{l.g.rotation.y=-l.c});
  S.doors.push({cx:d.cx,cy:d.cy,a:la,b:lb,open:0,front:d.cx===30&&d.cy===59.5});
 });
 // secret doors: flush, hinged panels dressed as part of each hall (plate, cabinet, trunk, bookcase, cask rack, library shelves, vault door)
 S.secret={};
 const DISGUISE={1:['wains_1','plate19'],2:['cabinet','cabinet'],3:['trunk','trunk'],4:['wains_6','wall_6'],5:['cask','cask'],6:['wains_6','wall_6'],7:['vaultdoor','vaultdoor']};
 for(const g in W.secretDoor){const d=W.secretDoor[g];
  const grp=new THREE.Group();grp.position.set(d.x+1-.045,0,d.y+.02);
  (DISGUISE[g]||['wains_'+g,'wall_'+g]).forEach((t,k)=>{const m=new THREE.Mesh(W.boxGeo(.09,1,.96,t,W.lightAt(d.x+1.5,d.y+.5,1)),S.mat);m.position.set(0,.5+k,.48);grp.add(m)});
  scene.add(grp);
  const solid=W.addSolid({x0:d.x,x1:d.x+1,y0:d.y,y1:d.y+1,b:0,t:W.H.sdoor,kind:'wall'});
  S.secret[g]={grp,solid,p:0,open:false};
 }
 // entities
 buildEntities();
 Object.keys(RS.S.secretOpen).forEach(g=>{if(RS.S.secretOpen[g])E.openSecret(+g,true)});
};
function addSprite(o){const s=Object.assign({solid:false,visible:true,r:.3,pick:.9,z:0},o);sprites.push(s);return s}
function buildEntities(){
 const scene=S.scene,NPC=window.NPC;
 // stations
 W.stations.forEach(st=>{
  const s=addSprite({id:st.id,kind:'station',gal:st.g,x:st.x,y:st.y,label:st.label,pick:st.pick,reach:st.reach,zc:Math.min(st.iconZ-.9,1.7)});
  const em=st.id.startsWith('tp')?'✨':STATION_ICON[st.id]||'📍';
  s.mesh=stationLabel(st.label);s.mesh.position.set(st.x,st.iconZ,st.y);s.base=st.iconZ;scene.add(s.mesh);E.stationSprites[st.id]=s});
 // hidden-room extras
 const ex=W.extras;
 [['raid',ex.raid,'Back office: Raid! mini-game',5],['vaultcredits',ex.vault,'Credits & behind-the-scenes notes',7]].forEach(([id,p,label,g])=>{
  const s=addSprite({id,kind:'station',gal:g,x:p.x,y:p.y,label,pick:.7,zc:1.1,visible:!!RS.S.secretOpen[g]});s.mesh=icon(STATION_ICON[id],.5);s.base=1.3;s.mesh.position.set(p.x,1.3,p.y);scene.add(s.mesh);E.stationSprites[id]=s});
 // items
 for(let g=1;g<=6;g++){(D.ITEMS[g]||[]).forEach(it=>{const p=W.itemSpots[it[0]];if(!p)return;
  const s=addSprite({id:'item:'+it[0],kind:'item',gal:g,key:it[0],x:p.x,y:p.y,label:it[1]+' (replica)',pick:.45,zc:p.z,visible:!!RS.S.secretOpen[g]&&!RS.S.items.includes(it[0])});
  s.mesh=icon(ITEM_ICON[it[0]]||'📦',.42);s.base=p.z;s.mesh.position.set(p.x,p.z,p.y);scene.add(s.mesh);E.itemSprites[it[0]]=s})}
 // seats
 W.seats.forEach((st,i)=>{addSprite({id:'seat'+i,kind:'seat',x:st.x,y:st.y,z:st.z,seat:st,label:st.label,pick:.5,zc:st.z+.25,mesh:null})});
 // docents and the clerk
 W.docentSpots.forEach(d=>{
  const m=NPC.make(NPC.PALS[d.g%NPC.PALS.length],{hat:'#b08d57',gold:true,seed:d.g*5+1});scene.add(m);m.position.set(d.x,0,d.y);
  const s=addSprite({id:'docent'+d.g,kind:'docent',gal:d.g,x:d.x,y:d.y,label:d.label,solid:true,r:.3,pick:.55,zc:1.0,talk:0,model:m,face:Math.PI/2});
  W.addSolid({x0:d.x-.3,x1:d.x+.3,y0:d.y-.3,y1:d.y+.3,b:0,t:1.8,kind:'npc'});
 });
 {const c=ex.clerk;const m=NPC.make(NPC.PALS[4],{hat:'#222',seed:77,role:'clerk'});scene.add(m);m.position.set(c.x,0,c.y);
  addSprite({id:'bartender',kind:'npc-talk',gal:5,x:c.x,y:c.y,label:'Cigar-shop clerk',solid:true,pick:.55,zc:1.0,model:m,face:Math.PI/2});
  W.addSolid({x0:c.x-.3,x1:c.x+.3,y0:c.y-.3,y1:c.y+.3,b:0,t:1.8,kind:'npc'})}
 // wandering visitors
 let seed=42;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const mkVisitor=(g,n)=>{for(let i=0;i<n;i++){
  const pal=NPC.PALS[(rnd()*NPC.PALS.length)|0];const m=NPC.make(pal,{hat:rnd()<.5?'#222':null,seed:(rnd()*1e6)|0});scene.add(m);
  let x,y,tries=0;const o=W.ORIGIN[g];
  do{x=o[0]+3+rnd()*14;y=o[1]+3+rnd()*14;tries++}while(!window.Phys.walkable(x,y,.3)&&tries<80);
  const s=addSprite({id:'visitor'+npcs.length,kind:'visitor',gal:g,x,y,label:'Visitor',model:m,speed:.7+rnd()*.5,state:'wait',t:rnd()*3,tx:x,ty:y,heading:rnd()*6.28});
  npcs.push(s)}};
 for(let g=0;g<=7;g++)mkVisitor(g,g===0||g===6?1:2);
 mkVisitor(9,6);
}
E.openSecret=function(g,silent){
 const o=S.secret&&S.secret[g];if(!o)return;
 if(!o.open){o.open=true;o.solid.dead=true;if(silent)o.p=1}
 W.map[W.secretDoor[g].y*N+W.secretDoor[g].x]=0;RS.S.secretOpen[g]=true;
 (D.ITEMS[g]||[]).forEach(it=>{const s=E.itemSprites[it[0]];if(s&&!RS.S.items.includes(it[0]))s.visible=true});
 if(g===6&&E.stationSprites.makers)E.stationSprites.makers.visible=true;
 if(g===7&&E.stationSprites.vaultcredits)E.stationSprites.vaultcredits.visible=true;
 if(g===5&&E.stationSprites.raid)E.stationSprites.raid.visible=true;
 if(!silent){RS.S.secret[g]=true;RS.save();RS.emit('secret',g)}
};
E.hideItem=key=>{const s=E.itemSprites[key];if(s)s.visible=false};
RS.on('artwork.viewed',()=>{if(S.scene)E.refreshSeen()});
})();
