/* Photo-style material surfaces. Atlas addresses remain compatible with the existing museum. */
(function(){
'use strict';
THREE.ColorManagement.legacyMode=false;
const A=window.Atlas,TS=256,old=A.canvas,cv=document.createElement('canvas');
cv.width=cv.height=TS*A.COLS;const x=cv.getContext('2d');x.drawImage(old,0,0,cv.width,cv.height);
A.canvas=cv;A.TS=TS;const maps=RS.museumMaps={};
function tile(name,paint){const id=A.idx[name];if(id===undefined)return;x.save();x.translate(id%A.COLS*TS,Math.floor(id/A.COLS)*TS);x.beginPath();x.rect(0,0,TS,TS);x.clip();paint();x.restore()}
function border(inset,color,width){x.strokeStyle=color;x.lineWidth=width;x.strokeRect(inset,inset,TS-2*inset,TS-2*inset)}
const photo=new Image();
A.ready=new Promise(resolve=>{
 photo.onload=()=>{
  const w=photo.naturalWidth/2,h=photo.naturalHeight/2;
  function surface(part,tint){const sx=part%2*w,sy=Math.floor(part/2)*h;x.drawImage(photo,sx+2,sy+2,w-4,h-4,0,0,TS,TS);if(tint){x.fillStyle=tint;x.fillRect(0,0,TS,TS)}}
  ['stone','plinth','sandstone','plaza','plaza2','fount','fount_rim','marble_a','marble_b','marble_white','tile_white','column','pilaster','slab_edge','stair_top','stair_riser','roof_cap'].forEach(n=>tile(n,()=>{surface(0,n==='marble_b'?'rgba(51,54,50,.35)':null);if(['marble_a','marble_b','tile_white','plaza','plaza2'].includes(n))border(.5,'rgba(65,52,40,.3)',1)}));
  const woods=['wood','wood_dark','wood_light','wood_v','plank_floor','parq_a','parq_b','parq_dark','beam','rail','baluster','shelf_side','doorframe','chamber_wall','chamber_ceil','log'];
  woods.forEach(n=>tile(n,()=>{if(n==='wood_v'||n==='baluster'||n==='doorframe'){x.translate(TS,0);x.rotate(Math.PI/2)}surface(2,n.includes('dark')?'rgba(12,8,5,.27)':null);if(n.startsWith('parq')||n==='plank_floor'){for(let k=0;k<4;k++){x.fillStyle='rgba(20,11,6,.45)';x.fillRect(0,k*64,TS,1);x.fillRect(k%2*128,k*64,1,64)}}}));
  ['brass','gold','chandelier'].forEach(n=>tile(n,()=>surface(3)));
  ['iron','steel','silver','vaultdoor'].forEach(n=>tile(n,()=>{surface(3);x.fillStyle=n==='iron'?'rgba(20,25,26,.85)':'rgba(124,135,140,.8)';x.fillRect(0,0,TS,TS);border(2,'rgba(230,235,231,.4)',2)}));
  for(let g=0;g<=7;g++){
   if(g!==6)tile('wall_'+g,()=>{surface(1);x.fillStyle=g===0?'rgba(248,244,226,.2)':'#'+new THREE.Color(DATA.G[g].accent).lerp(new THREE.Color('#a99e86'),.75).getHexString();x.globalAlpha=.72;x.fillRect(0,0,TS,TS);x.globalAlpha=1});
   tile('wains_'+g,()=>{surface(g===0?0:2,g===0?null:'rgba(15,8,4,.2)');for(const n of [5,11,17])border(n,n===11?'rgba(10,5,2,.65)':'rgba(230,199,150,.23)',n===11?4:2);x.fillStyle='rgba(10,6,2,.13)';x.fillRect(19,19,TS-38,TS-38)});
   tile('corn_'+g,()=>{surface(0);for(const [y,h,c] of [[0,12,'#ece5d5'],[12,3,'#9d9078'],[17,9,'#d2c7af'],[28,2,'#a08960'],[33,4,'#eee5d1'],[40,8,'#c9bca2']]){x.fillStyle=c;x.fillRect(0,y,TS,h)}});
   tile('rug_'+g,()=>{x.fillStyle=g===0?'#613239':'#'+new THREE.Color(DATA.G[g].accent).multiplyScalar(.44).getHexString();x.fillRect(0,0,TS,TS);for(let y=0;y<TS;y+=2){x.fillStyle=y%4?'rgba(255,235,210,.09)':'rgba(0,0,0,.12)';x.fillRect(0,y,TS,1)}for(let xx=0;xx<TS;xx+=2){x.fillStyle='rgba(255,255,255,.03)';x.fillRect(xx,0,1,TS)}border(5,'#a58a5c',1);border(11,'#a58a5c',1)});
  }
  tile('coffer',()=>{surface(0);x.fillStyle='rgba(94,76,52,.1)';x.fillRect(18,18,TS-36,TS-36);for(const n of [4,12,18])border(n,n===12?'rgba(75,57,34,.4)':'rgba(255,250,226,.65)',3)});
  ['door','door_front','secret'].forEach(n=>tile(n,()=>{surface(2,'rgba(17,8,3,.15)');border(8,'#37251a',3);for(const y of [20,138]){x.strokeStyle='#37251a';x.lineWidth=4;x.strokeRect(22,y,TS-44,96);x.strokeStyle='#ad8860';x.lineWidth=1;x.strokeRect(26,y+4,TS-52,88)}x.fillStyle='#b79a61';x.beginPath();x.arc(TS-20,TS/2,4,0,Math.PI*2);x.fill()}));
  ['leather','cloth_red','cloth_green','cloth_blue','felt','runner','rugfringe'].forEach(n=>tile(n,()=>{x.fillStyle={leather:'#562c27',cloth_red:'#66323b',cloth_green:'#37523d',cloth_blue:'#3c4d60',felt:'#34503c',runner:'#66323b',rugfringe:'#66323b'}[n];x.fillRect(0,0,TS,TS);for(let k=0;k<TS;k+=2){x.fillStyle=k%4?'#ffffff08':'#00000012';x.fillRect(0,k,TS,1);x.fillRect(k,0,1,TS)}}));
  tile('plate19',()=>{const id=A.idx.wall_1;x.drawImage(cv,id%A.COLS*TS,Math.floor(id/A.COLS)*TS,TS,TS,0,0,TS,TS);x.fillStyle='#8c7851';x.fillRect(98,105,60,32);x.fillStyle='#e2d2a3';x.textAlign='center';x.font='600 10px "Libre Franklin",Arial';x.fillText('TRACK 19',128,125)});
  tile('cabinet',()=>{x.fillStyle='#52605a';x.fillRect(0,0,TS,TS);for(let row=0;row<4;row++){x.strokeStyle='#283a30';x.lineWidth=2;x.strokeRect(9,row*64+6,238,52);x.fillStyle='#b7a176';x.fillRect(96,row*64+28,64,5);x.fillStyle='#dbd3ba';x.fillRect(175,row*64+18,50,22);x.fillStyle='#52605a';x.font='8px Arial';x.fillText('ARCHIVE',200,row*64+33)}});
  tile('trunk',()=>{surface(2);for(const xx of [20,230]){x.fillStyle='#302d26';x.fillRect(xx,0,8,TS)}for(const yy of [0,125,250]){x.fillStyle='#302d26';x.fillRect(0,yy,TS,6)}x.fillStyle='#b49a61';x.fillRect(112,115,32,28);x.fillStyle='#372b1b';x.fillRect(125,125,6,12)});
  tile('cask',()=>{surface(2,'rgba(15,6,0,.25)');for(const xx of [64,192])for(const yy of [64,192]){x.fillStyle='#3e3021';x.beginPath();x.arc(xx,yy,57,0,7);x.fill();x.strokeStyle='#99805a';x.lineWidth=4;x.stroke();for(let k=-35;k<=35;k+=17){x.strokeStyle='#2d251a';x.lineWidth=1;x.beginPath();x.moveTo(xx+k,yy-42);x.lineTo(xx+k,yy+42);x.stroke()}}});
  tile('sign_board',()=>{surface(2,'rgba(8,10,8,.76)');border(7,'#b79a65',2)});
  tile('book_row',()=>{surface(2);const colors=['#4b2a29','#273b45','#46503d','#735a34','#4e3b51'];for(let i=0;i<13;i++){const xx=i*20,hh=160+(i*17)%58;x.fillStyle=colors[i%5];x.fillRect(xx,TS-hh,18,hh);x.fillStyle='#b9a16f';x.fillRect(xx+2,TS-hh+12,14,2);x.fillRect(xx+2,TS-15,14,2);x.font='7px Arial';x.save();x.translate(xx+11,TS-35);x.rotate(-Math.PI/2);x.fillText('MUSEUM ARCHIVE',0,0);x.restore()}x.fillStyle='#302218';x.fillRect(0,TS-7,TS,7)});
  tile('wall_6',()=>{surface(2);for(let row=0;row<2;row++)for(let i=0;i<13;i++){const xx=i*20,yy=row*128,hh=95+(i*13)%21;x.fillStyle=['#4b2a29','#273b45','#46503d','#735a34','#4e3b51'][i%5];x.fillRect(xx,yy+120-hh,18,hh);x.fillStyle='#baa16a';x.fillRect(xx+2,yy+123-hh,14,1);x.fillRect(xx+2,yy+112,14,1)}for(const yy of [120,248]){x.fillStyle='#48301b';x.fillRect(0,yy,TS,8)}});
  ['skylight','glass','win_top','win_bot'].forEach(n=>tile(n,()=>{const grad=x.createLinearGradient(0,0,TS,TS);grad.addColorStop(0,'#b7d0d5');grad.addColorStop(.5,'#cddce0');grad.addColorStop(1,'#7897a0');x.fillStyle=grad;x.fillRect(0,0,TS,TS);x.fillStyle='#67716b';for(const xx of [0,125,251])x.fillRect(xx,0,5,TS);for(const yy of [0,125,251])x.fillRect(0,yy,TS,5);x.strokeStyle='#ffffff66';x.lineWidth=2;x.strokeRect(8,8,110,110);x.strokeRect(138,138,110,110)}));
  ['paper','news'].forEach(n=>tile(n,()=>{x.fillStyle='#e6dfca';x.fillRect(0,0,TS,TS);x.fillStyle='#39372e';x.textAlign='center';x.font='600 18px "Libre Franklin",Arial';x.fillText(n==='news'?'THE DAILY NEWS':'MUSEUM ARCHIVE',128,30);x.fillRect(15,40,TS-30,1);x.textAlign='left';for(let row=0;row<22;row++){x.fillStyle='#797465';x.fillRect(15,55+row*8,95-row%3*9,1);x.fillRect(140,55+row*8,98-row%4*7,1)}}));
  tile('lamp',()=>{const g=x.createRadialGradient(128,128,0,128,128,180);g.addColorStop(0,'#fff4cc');g.addColorStop(1,'#e4c692');x.fillStyle=g;x.fillRect(0,0,TS,TS)});
  ['grass','grass2','leaves','leaves2','hedge','dirt','path'].forEach(n=>tile(n,()=>{x.fillStyle=n==='dirt'?'#655038':n==='path'?'#b09b78':'#405c36';x.fillRect(0,0,TS,TS);for(let i=0;i<18000;i++){const xx=(i*73)%TS,yy=Math.floor(i*23.41)%TS;x.fillStyle=i%2?'rgba(210,208,161,.15)':'rgba(15,25,10,.18)';x.fillRect(xx,yy,1,1)}}));
  // Individual materials also dress the curved architectural details.
  for(const [name,part] of [['stone',0],['wood',2],['brass',3]]){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.drawImage(photo,part%2*w+2,Math.floor(part/2)*h+2,w-4,h-4,0,0,512,512);const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;maps[name]=tex}
  // Surface response follows the material rather than giving plaster and brass the same sheen.
  A.roughnessCanvas=document.createElement('canvas');A.metalnessCanvas=document.createElement('canvas');
  for(const c of [A.roughnessCanvas,A.metalnessCanvas])c.width=c.height=512;
  const rough=A.roughnessCanvas.getContext('2d'),metal=A.metalnessCanvas.getContext('2d');
  rough.fillStyle='#eeeeee';rough.fillRect(0,0,512,512);metal.fillStyle='#000000';metal.fillRect(0,0,512,512);
  for(const [name,id] of Object.entries(A.idx)){const isMetal=/^(brass|gold|silver|steel|iron|greenframe|vaultdoor)$/.test(name);const polish=/marble|tile_white|plaza/.test(name)?85:/wood|parq|door|wains|rail|baluster/.test(name)?135:230;rough.fillStyle='rgb('+[isMetal?105:polish,isMetal?105:polish,isMetal?105:polish].join(',')+')';rough.fillRect(id%A.COLS*32,Math.floor(id/A.COLS)*32,32,32);if(isMetal){metal.fillStyle='#cccccc';metal.fillRect(id%A.COLS*32,Math.floor(id/A.COLS)*32,32,32)}}
  A.photographic=true;if(A.texture)A.texture.needsUpdate=true;resolve();
 };
 photo.onerror=()=>{console.warn('Museum material image unavailable; using local procedural fallback.');resolve()};
 photo.src='assets/museum-materials.png';
});
// Water animates in its own shader; the 4096px museum atlas stays on the GPU.
A.waterCanvas=document.createElement('canvas');A.waterCanvas.width=A.waterCanvas.height=128;
const water=A.waterCanvas.getContext('2d'),wash=water.createLinearGradient(0,0,128,128);wash.addColorStop(0,'#658f91');wash.addColorStop(1,'#375f65');water.fillStyle=wash;water.fillRect(0,0,128,128);
for(let row=0;row<16;row++){water.beginPath();for(let xx=0;xx<=128;xx+=2){const yy=row*8+Math.sin(xx*.08+row)*2;xx?water.lineTo(xx,yy):water.moveTo(xx,yy)}water.strokeStyle='rgba(212,235,226,.16)';water.lineWidth=.7;water.stroke()}
A.waterTime={value:0};A.animate=function(dt){A.waterTime.value+=dt;return false};
})();
