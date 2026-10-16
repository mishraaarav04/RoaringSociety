/* World: floor plan, solid geometry, collision boxes and the mesher that turns it into textured 3D.
   Map space: x east, y south, z up (metres).  Three.js space: X=x, Y=z, Z=y. */
(function(){
'use strict';
const D=window.DATA,A=window.Atlas;
const N=60,B=20;
const H={slabT:5.0,slabB:4.75,roofB:9.8,roofT:10.2,par:11.0,door:3.4,sdoor:2.0,chamB:3.4,chamT:3.6};
const W=window.World={N,B,H};

/* ---- block layout (same ring as before) ---- */
const BLOCK={'1,2':0,'0,2':1,'0,1':2,'0,0':3,'1,0':4,'2,0':5,'2,1':6,'2,2':7,'1,1':9};
const ORIGIN={};Object.keys(BLOCK).forEach(k=>{const [bx,by]=k.split(',').map(Number);ORIGIN[BLOCK[k]]=[bx*B,by*B]});
const ENTRY_SIDE={1:'R',2:'B',3:'B',4:'L',5:'L',6:'T',7:'T'};
const QSEQ={R:['SE','SW','NW','NE'],B:['SW','NW','NE','SE'],L:['NW','NE','SE','SW'],T:['NE','SE','SW','NW']};
const quad=(lx,ly)=>(ly<10?(lx<10?'NW':'NE'):(lx<10?'SW':'SE'));
const roomOf=(g,lx,ly)=>{const i=QSEQ[ENTRY_SIDE[g]||'B'].indexOf(quad(lx,ly));return i<0?0:i};
W.BLOCK=BLOCK;W.ORIGIN=ORIGIN;W.roomOf=roomOf;
W.blockAt=(wx,wy)=>{if(wy>=N)return 0;for(const k in BLOCK){const [bx,by]=k.split(',').map(Number);if(wx>=bx*B&&wx<bx*B+B&&wy>=by*B&&wy<by*B+B)return BLOCK[k]}return 9};
W.roomAt=(g,wx,wy)=>roomOf(g,wx-ORIGIN[g][0],wy-ORIGIN[g][1]);

/* ---- per-cell data ---- */
const map=new Int16Array(N*N),floorId=new Uint8Array(N*N).fill(255);
const ctype=new Uint8Array(N*N);      // 0 open, 1 wall, 2 chamber wall
const slab=new Uint8Array(N*N);       // balcony slab present
const lintel=new Uint8Array(N*N);     // doorway cell (lintel above)
const chamber=new Uint8Array(N*N);    // inside a secret chamber
const stairc=new Uint8Array(N*N);     // stair opening
Object.assign(W,{map,floorId,ctype,slab,lintel,chamber,stairc});
const inb=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
const ix=(x,y)=>y*N+x;
W.inb=inb;
W.isWall=(x,y)=>inb(x,y)&&ctype[ix(x,y)]>0;
W.spaceAt=(x,y)=>{if(!inb(x,y))return 255;return floorId[ix(x,y)]};
W.doorways=[];W.secretDoor={};W.artSpots=[];W.signSpots=[];

/* ---- collision solids (AABB) with a spatial hash ---- */
const solids=[];const hash=new Map();
const hk=(cx,cy)=>(cx+200)*1024+(cy+200);
function addSolid(s){s.id=solids.length;solids.push(s);
 for(let cx=Math.floor(s.x0);cx<=Math.floor(s.x1-1e-6);cx++)for(let cy=Math.floor(s.y0);cy<=Math.floor(s.y1-1e-6);cy++){const k=hk(cx,cy);let a=hash.get(k);if(!a){a=[];hash.set(k,a)}a.push(s)}
 return s}
W.solids=solids;W.addSolid=addSolid;
W.solidsAt=(cx,cy)=>hash.get(hk(cx,cy))||[];
W.removeSolid=s=>{s.dead=true};

/* ---- geometry chunks ---- */
const chunks={};
function chunk(id){return chunks[id]||(chunks[id]={pos:[],uv:[],col:[],idx:[],n:0})}
W.chunk=chunk;W._chunks=()=>chunks;
const SHADE={top:1,bot:.55,x:.84,z:.92};
/* one quad: origin o (three coords), unit vectors du,dv (three coords), lengths, tile rect, v-fractions f0..f1, u-fractions */
function qd(ch,o,du,dv,lu,lv,tile,light,fv0,fv1,fu0,fu1,aoBottom){
 if(tile==='water')ch=chunk('water');
 const r=tile==='water'?[0,0,1,1]:A.uv(tile);fv0=fv0||0;fv1=fv1===undefined?1:fv1;fu0=fu0||0;fu1=fu1===undefined?1:fu1;
 const u0=r[0]+(r[2]-r[0])*fu0,u1=r[0]+(r[2]-r[0])*fu1,v0=r[1]+(r[3]-r[1])*fv0,v1=r[1]+(r[3]-r[1])*fv1;
 const P=[[o[0],o[1],o[2]],[o[0]+du[0]*lu,o[1]+du[1]*lu,o[2]+du[2]*lu],[o[0]+du[0]*lu+dv[0]*lv,o[1]+du[1]*lu+dv[1]*lv,o[2]+du[2]*lu+dv[2]*lv],[o[0]+dv[0]*lv,o[1]+dv[1]*lv,o[2]+dv[2]*lv]];
 const UV=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
 // face shade from normal
 const nx=du[1]*dv[2]-du[2]*dv[1],ny=du[2]*dv[0]-du[0]*dv[2],nz=du[0]*dv[1]-du[1]*dv[0];
 const sh=ny>.5?SHADE.top:ny<-.5?SHADE.bot:(Math.abs(nx)>.5?SHADE.x:SHADE.z);
 const L=light*sh;const base=ch.n;
 for(let i=0;i<4;i++){const l=(aoBottom&&i<2)?L*aoBottom:L;ch.pos.push(P[i][0],P[i][1],P[i][2]);ch.uv.push(UV[i][0],UV[i][1]);ch.col.push(l,l,l)}
 ch.idx.push(base,base+1,base+2,base,base+2,base+3);ch.n+=4;
}
W.quad=qd;
/* tile a rectangle with 1m tiles. o,du,dv in three coords; lu,lv lengths (m). tileOf(i,j,fu,fv)->name (optional) */
function rect(ch,o,du,dv,lu,lv,tile,light,opts){
 opts=opts||{};
 const nu=Math.ceil(lu-1e-6),nv=Math.ceil(lv-1e-6);
 for(let i=0;i<nu;i++){const su=Math.min(1,lu-i);
  for(let j=0;j<nv;j++){const sv=Math.min(1,lv-j);
   const t=typeof tile==='function'?tile(i,j):tile;if(!t)continue;
   const oo=[o[0]+du[0]*i+dv[0]*j,o[1]+du[1]*i+dv[1]*j,o[2]+du[2]*i+dv[2]*j];
   const l=typeof light==='function'?light(oo[0]+du[0]*su/2+dv[0]*sv/2,oo[2]+du[2]*su/2+dv[2]*sv/2,oo[1]+du[1]*su/2+dv[1]*sv/2):light;
   qd(ch,oo,du,dv,su,sv,t,l,opts.vtop?1-sv:0,opts.vtop?1:sv,0,su,opts.ao)}}
}
W.rect=rect;

/* ---- lighting model ---- */
function lightAt(x,y,z){
 const cx=Math.floor(x),cy=Math.floor(y);
 if(!inb(cx,cy))return 1;
 const g=floorId[ix(cx,cy)];
 if(g===9||g===255)return 1;
 if(chamber[ix(cx,cy)])return .72;
 if(slab[ix(cx,cy)]&&z<H.slabB+.01)return .74;
 if(z>=H.slabT-.01)return .96;
 return .94;
}
W.lightAt=lightAt;

/* ---- generic box: visual + optional collision ---- */
/* tiles: string | {top,bot,side,n,s,e,w}. coordinates in map space (x,y) and z. */
function box(chId,x0,y0,z0,x1,y1,z1,tiles,o){
 o=o||{};const ch=chunk(chId);
 const T=typeof tiles==='string'?{all:tiles}:tiles;const tt=k=>T[k]||T.side||T.all;
 const w=x1-x0,d=y1-y0,h=z1-z0;const lm=o.light!==undefined?o.light:lightAt((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
 const mk=(f)=>({vtop:false});
 const ao=o.ao;
 if(!o.noTop&&tt('top'))rect(ch,[x0,z1,y0],[0,0,1],[1,0,0],d,w,tt('top'),lm);
 if(!o.noBot&&tt('bot'))rect(ch,[x0,z0,y0],[1,0,0],[0,0,1],w,d,tt('bot'),lm*.8);
 if(tt('e'))rect(ch,[x1,z0,y1],[0,0,-1],[0,1,0],d,h,tt('e'),lm,{ao});
 if(tt('w'))rect(ch,[x0,z0,y0],[0,0,1],[0,1,0],d,h,tt('w'),lm,{ao});
 if(tt('s'))rect(ch,[x0,z0,y1],[1,0,0],[0,1,0],w,h,tt('s'),lm,{ao});
 if(tt('n'))rect(ch,[x1,z0,y0],[-1,0,0],[0,1,0],w,h,tt('n'),lm,{ao});
 if(o.solid!==false){return addSolid({x0,x1,y0,y1,b:z0,t:z1,kind:o.kind||'prop'})}
}
W.box=box;
/* thin vertical plane facing a direction (used for art, signs). dir: 'E','W','S','N' = outward normal in map space */
W.plane=function(chId,dir,x,y,z,w,h,tile,light,extra){
 const ch=chunk(chId);const hw=w/2;
 if(dir==='S')qd(ch,[x-hw,z,y],[1,0,0],[0,1,0],w,h,tile,light);
 if(dir==='N')qd(ch,[x+hw,z,y],[-1,0,0],[0,1,0],w,h,tile,light);
 if(dir==='E')qd(ch,[x,z,y+hw],[0,0,-1],[0,1,0],w,h,tile,light);
 if(dir==='W')qd(ch,[x,z,y-hw],[0,0,1],[0,1,0],w,h,tile,light);
};
const DIRV={E:[1,0],W:[-1,0],S:[0,1],N:[0,-1]};W.DIRV=DIRV;

/* ---- three.js geometry for a chunk ---- */
W.buildGeometry=function(ch){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(ch.pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(ch.uv,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(ch.col,3));
 g.setIndex(ch.n>65000?new THREE.Uint32BufferAttribute(ch.idx,1):new THREE.Uint16BufferAttribute(ch.idx,1));
 g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();return g;
};
/* standalone textured box geometry (for animated doors, NPC parts): tile string, size in metres, centred on origin */
W.boxGeo=function(w,h,d,tile,light){
 const ch={pos:[],uv:[],col:[],idx:[],n:0};const l=light===undefined?1:light;
 const hw=w/2,hh=h/2,hd=d/2;
 qd(ch,[-hw,hh,-hd],[0,0,1],[1,0,0],d,w,tile,l);
 qd(ch,[-hw,-hh,-hd],[1,0,0],[0,0,1],w,d,tile,l);
 qd(ch,[hw,-hh,hd],[0,0,-1],[0,1,0],d,h,tile,l);
 qd(ch,[-hw,-hh,-hd],[0,0,1],[0,1,0],d,h,tile,l);
 qd(ch,[-hw,-hh,hd],[1,0,0],[0,1,0],w,h,tile,l);
 qd(ch,[hw,-hh,-hd],[-1,0,0],[0,1,0],w,h,tile,l);
 return W.buildGeometry(ch);
};
})();
