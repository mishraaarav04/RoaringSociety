/* Player physics: a vertical capsule-ish box against axis-aligned solids, with gravity, jumping, step-up and head clearance. */
(function(){
'use strict';
const W=window.World;
const Phys=window.Phys={R:.26,HT:1.8,EYE:1.62,STEP:.38,G:21,JUMP:6.7};
const {R,HT,STEP}=Phys;
/* floor height and whether a body of radius r / height h fits at (x,y) with feet at z */
function probe(x,y,z,r,h){
 r=r||R;h=h||HT;
 let fl=0;const x0=x-r,x1=x+r,y0=y-r,y1=y+r;
 const cxa=Math.floor(x0),cxb=Math.floor(x1),cya=Math.floor(y0),cyb=Math.floor(y1);
 const cand=[];
 for(let cx=cxa;cx<=cxb;cx++)for(let cy=cya;cy<=cyb;cy++){const a=W.solidsAt(cx,cy);for(let i=0;i<a.length;i++){const s=a[i];if(s.dead||s.t<=s.b+1e-6&&s.kind==='void')continue;
  if(s.x1<=x0||s.x0>=x1||s.y1<=y0||s.y0>=y1)continue;cand.push(s);if(s.t<=z+STEP+1e-3&&s.t>fl)fl=s.t}}
 const zb=Math.max(fl,z);let ok=true;
 for(let i=0;i<cand.length;i++){const s=cand[i];if(s.t>zb+1e-3&&s.b<zb+h-1e-3){ok=false;break}}
 return {ok,fl};
}
Phys.probe=probe;
/* is the point inside any solid? (for line of sight) */
Phys.inSolid=function(x,y,z,kinds){
 const a=W.solidsAt(Math.floor(x),Math.floor(y));
 for(let i=0;i<a.length;i++){const s=a[i];if(s.dead)continue;if(kinds&&!kinds[s.kind])continue;if(x>=s.x0&&x<=s.x1&&y>=s.y0&&y<=s.y1&&z>=s.b&&z<=s.t)return true}
 return false};
const LOSK={wall:1,slab:1,column:1,stair:1,tree:1,stage:0};
Phys.los=function(ax,ay,az,bx,by,bz){
 const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz),n=Math.ceil(L/.12);
 for(let i=1;i<n;i++){const t=i/n;if(Phys.inSolid(ax+dx*t,ay+dy*t,az+dz*t,LOSK))return false}
 return true};
/* NPC / generic ground check */
Phys.walkable=function(x,y,r){const p=probe(x,y,0,r||.22,1.7);return p.ok&&p.fl<.08};
/* Keep a full body clear along the entire move, including diagonal corners. */
Phys.clearSegment=function(ax,ay,bx,by,r){
 const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/.12));
 for(let i=0;i<=steps;i++){const t=i/steps;if(!Phys.walkable(ax+(bx-ax)*t,ay+(by-ay)*t,r))return false}return true;
};
/* Teleports and NPC spawns use clearance beyond the body and room to walk away. */
Phys.safePosition=function(x,y,opts){
 opts=opts||{};const radius=opts.radius||.5,g=opts.gallery===undefined?W.blockAt(x,y):opts.gallery;
 const valid=(px,py)=>{
  if(W.blockAt(px,py)!==g||!Phys.walkable(px,py,radius))return false;
  if(!opts.escape)return true;
  return [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>Phys.clearSegment(px,py,px+dx*.85,py+dy*.85,Phys.R)).length>=2;
 };
 if(valid(x,y))return {x,y};
 const candidates=[];const range=opts.range||5;
 for(let dx=-range;dx<=range;dx+=.25)for(let dy=-range;dy<=range;dy+=.25)candidates.push({x:x+dx,y:y+dy,d:dx*dx+dy*dy});
 candidates.sort((a,b)=>a.d-b.d);
 return candidates.find(p=>valid(p.x,p.y))||null;
};
/* A* on half-metre nodes. Every edge is checked with the visitor's full radius. */
Phys.route=function(ax,ay,bx,by,g,r){
 r=r||.38;const goal=Phys.safePosition(bx,by,{radius:r,gallery:g,range:3});if(!goal)return [];
 if(Phys.clearSegment(ax,ay,goal.x,goal.y,r))return [goal];
 const size=120,point=id=>({x:(id%size)*.5+.25,y:Math.floor(id/size)*.5+.25});
 const idAt=(x,y)=>Math.floor(y*2)*size+Math.floor(x*2);
 const start=Phys.safePosition(point(idAt(ax,ay)).x,point(idAt(ax,ay)).y,{gallery:g,radius:r,range:1});
 if(!start)return [];
 const sid=idAt(start.x,start.y),tid=idAt(goal.x,goal.y),end=point(tid);
 if(!Phys.clearSegment(ax,ay,point(sid).x,point(sid).y,r)||!Phys.walkable(end.x,end.y,r))return [];
 const open=[sid],parent=new Map(),cost=new Map([[sid,0]]),closed=new Set(),valid=new Map();
 const walk=id=>{if(!valid.has(id)){const p=point(id);valid.set(id,W.blockAt(p.x,p.y)===g&&Phys.walkable(p.x,p.y,r))}return valid.get(id)};
 const heuristic=id=>{const p=point(id);return Math.hypot(p.x-end.x,p.y-end.y)};
 for(let attempts=0;open.length&&attempts<2200;attempts++){
  let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+heuristic(open[i])<cost.get(open[best])+heuristic(open[best]))best=i;
  const id=open.splice(best,1)[0];if(id===tid){const result=[end];let cur=id;while(parent.has(cur)){cur=parent.get(cur);result.unshift(point(cur))}return result}
  closed.add(id);const p=point(id);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const nx=id%size+dx,ny=Math.floor(id/size)+dy;if(nx<0||ny<0||nx>=size||ny>=size)continue;
   const next=ny*size+nx;if(closed.has(next)||!walk(next))continue;const q=point(next);
   if(!Phys.clearSegment(p.x,p.y,q.x,q.y,r))continue;
   const distance=cost.get(id)+Math.hypot(dx,dy)*.5;
   if(distance<(cost.get(next)===undefined?Infinity:cost.get(next))){cost.set(next,distance);parent.set(next,id);if(!open.includes(next))open.push(next)}
  }
 }return [];
};
/* advance player state P by dt given wish vector (vx,vy in m/s) */
Phys.step=function(P,vx,vy,dt,jump){
 // horizontal, axis separated, with sub-steps to avoid tunnelling
 const dist=Math.hypot(vx,vy)*dt;const n=Math.max(1,Math.ceil(dist/.15));
 for(let k=0;k<n;k++){
  const dx=vx*dt/n,dy=vy*dt/n;
  let r=probe(P.x+dx,P.y,P.z);if(r.ok){P.x+=dx;if(r.fl>P.z){P.stepOff+=P.z-r.fl;P.z=r.fl;if(P.vz<0)P.vz=0}}
  r=probe(P.x,P.y+dy,P.z);if(r.ok){P.y+=dy;if(r.fl>P.z){P.stepOff+=P.z-r.fl;P.z=r.fl;if(P.vz<0)P.vz=0}}
 }
 // vertical
 const f0=probe(P.x,P.y,P.z).fl;
 P.grounded=P.z<=f0+.03&&P.vz<=0;
 if(jump&&P.grounded){P.vz=Phys.JUMP;P.grounded=false}
 P.vz-=Phys.G*dt;if(P.vz<-30)P.vz=-30;
 let nz=P.z+P.vz*dt;
 if(P.vz>0){
  // head bump
  const x0=P.x-R,x1=P.x+R,y0=P.y-R,y1=P.y+R;
  for(let cx=Math.floor(x0);cx<=Math.floor(x1);cx++)for(let cy=Math.floor(y0);cy<=Math.floor(y1);cy++){const a=W.solidsAt(cx,cy);for(const s of a){if(s.dead||s.x1<=x0||s.x0>=x1||s.y1<=y0||s.y0>=y1)continue;if(s.b>=P.z+HT-.05&&s.b<nz+HT&&s.t>nz){nz=s.b-HT;P.vz=0}}}
 }else{
  const r=probe(P.x,P.y,nz);if(nz<=r.fl){nz=r.fl;P.vz=0;P.grounded=true}
 }
 P.z=nz;
};
})();
