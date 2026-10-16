/* Props, part 2: stations, hall furnishings, secret chambers, courtyard, forecourt. */
(function(){
'use strict';
const W=window.World,D=window.DATA,H=W.H,N=W.N,B=W.B,ORIGIN=W.ORIGIN,P=window.Props;
const ix=(x,y)=>y*N+x;
const C=(g,lx,ly)=>[ORIGIN[g][0]+lx+.5,ORIGIN[g][1]+ly+.5];
W.hang=[];W.stations=[];W.docentSpots=[];W.itemSpots={};W.extras={};

/* is a footprint free of solids at floor level? */
function free(x0,y0,x1,y1,zb,zt){
 for(let cx=Math.floor(x0);cx<=Math.floor(x1);cx++)for(let cy=Math.floor(y0);cy<=Math.floor(y1);cy++)for(const s of W.solidsAt(cx,cy)){if(s.dead)continue;if(s.x1>x0&&s.x0<x1&&s.y1>y0&&s.y0<y1&&s.t>zb&&s.b<zt)return false}
 return true}
P.free=free;

function station(id,g,x,y,label,iconZ,pick,reach){W.stations.push({id,g,x,y,label,iconZ:iconZ||2.2,pick:pick||.9,reach:reach})}

/* ---------- reusable furniture ---------- */
P.visualPlants=[];
function plant(ch,x,y){P.visualPlants.push([x,y]);W.addSolid({x0:x-.22,x1:x+.22,y0:y-.22,y1:y+.22,b:0,t:.45,kind:'plant'})}
P.plant=plant;
function desk(ch,x0,y0,x1,y1,h){h=h||1.0;W.box(ch,x0,y0,0,x1,y1,h-.06,{all:'wood_dark'},{kind:'table'});W.box(ch,x0-.05,y0-.05,h-.06,x1+.05,y1+.05,h,{all:'wood_light',top:'leather'},{solid:false})}
function pedestal(ch,x,y,h,tile){tile=tile||'marble_white';W.box(ch,x-.4,y-.4,0,x+.4,y+.4,h-.08,{all:tile,top:tile},{solid:true,noTop:true});W.box(ch,x-.46,y-.46,h-.08,x+.46,y+.46,h,{all:tile},{solid:false});W.box(ch,x-.46,y-.46,0,x+.46,y+.46,.1,{all:tile},{solid:false})}
function lamp(ch,x,y,z){W.box(ch,x-.03,y-.03,z,x+.03,y+.03,z+.3,'iron',{solid:false});W.box(ch,x-.1,y-.1,z+.3,x+.1,y+.1,z+.5,'lamp',{solid:false,light:1.2})}
function papers(ch,x,y,z){W.box(ch,x-.2,y-.14,z,x+.2,y+.14,z+.02,'paper',{solid:false});W.box(ch,x-.1,y-.1,z+.02,x+.3,y+.2,z+.04,'news',{solid:false})}
function shelfUnit(ch,x0,y0,x1,y1,h,facing){ // bookcase, front tile faces `facing` (facing 'SN' or 'EW' = double-sided)
 const t={top:'wood_dark',bot:'wood_dark',side:'shelf_side'};[...facing].forEach(f=>{t[({E:'e',W:'w',S:'s',N:'n'})[f]]='book_row'});
 W.box(ch,x0,y0,0,x1,y1,h,t,{kind:'shelf'});
 // book rows stacked
}
function monitor(ch,x,y,z,facing){const s=.34;W.box(ch,x-s/2,y-.12,z,x+s/2,y+.12,z+.3,{all:'iron',[({E:'e',W:'w',S:'s',N:'n'})[facing]]:'screen'},{solid:false});W.box(ch,x-.06,y-.06,z-.12,x+.06,y+.06,z+.1,'iron',{solid:false,noBot:true})}

/* ---------- gallery stations ---------- */
const MODELS={
 directory(g,x,y){W.box(g,x-.6,y-.3,0,x+.6,y+.3,1.0,{all:'wood_dark'},{kind:'table'});W.box(g,x-.65,y-.35,1.0,x+.65,y+.35,1.08,{all:'wood_light',top:'maptable'},{solid:false});
  W.box(g,x-.6,y+.1,1.08,x+.6,y+.18,2.2,{all:'sign_board',s:'sign_board',n:'brass'},{solid:false});W.box(g,x-.64,y+.06,2.2,x+.64,y+.22,2.3,'brass',{solid:false});
  W.box(g,x-.5,y-.25,1.08,x-.2,y,1.12,'paper',{solid:false});},
 passport(g,x,y){desk(g,x-1.6,y-.4,x+1.6,y+.4,1.05);shelfUnit(g,x-1.7,y+1.1,x+1.7,y+1.5,2.3,'N');
  W.box(g,x-1.0,y-.2,1.05,x-.6,y+.1,1.3,'brass',{solid:false});W.box(g,x+.4,y-.2,1.05,x+.9,y+.2,1.1,'paper',{solid:false});},
 tp(g,x,y){pedestal(g,x,y,.75);W.box(g,x-.2,y-.2,.8,x+.2,y+.2,1.2,{all:'lamp'},{solid:false,light:1.35});
  W.box(g,x-.3,y-.3,1.25,x+.3,y+.3,1.3,{all:'brass'},{solid:false})},
 migration(g,x,y){P.table(g,x-1.6,y-1,x+1.6,y+1,.85,'wood_dark','maptable');
  [[-.6,-1.25,'S'],[.6,-1.25,'S'],[-.6,1.25,'N'],[.6,1.25,'N']].forEach(([dx,dy,f])=>P.chair(g,x+dx,y+dy,f));},
 hearing(g,x,y){desk(g,x-1.3,y-.5,x+1.3,y+.5,1.0);papers(g,x-.6,y,1.0);papers(g,x+.5,y+.1,1.0);P.chair(g,x,y+1.0,'N');P.chair(g,x-.8,y-1.0,'S');P.chair(g,x+.8,y-1.0,'S');lamp(g,x+1.0,y-.3,1.0)},
 source3(g,x,y){[[-1.2,0],[0,0],[1.2,0]].forEach(([dx])=>{W.box(g,x+dx-.4,y-.3,0,x+dx+.4,y+.3,.9,{all:'wood_dark'},{kind:'table'});W.box(g,x+dx-.42,y-.34,.9,x+dx+.42,y+.34,1.0,{all:'wood_light',top:'paper'},{solid:false});W.box(g,x+dx-.3,y-.2,1.0,x+dx+.3,y+.2,1.04,'news',{solid:false})})},
 quota(g,x,y){W.box(g,x-.55,y-.4,0,x+.55,y+.4,1.15,{all:'brass',top:'brass'},{kind:'table'});W.box(g,x-.4,y-.42,.8,x+.4,y-.4,1.1,'screen',{solid:false});W.box(g,x-.4,y-.1,1.15,x+.4,y+.3,1.3,'iron',{solid:false});for(let k=0;k<4;k++)W.box(g,x-.4+k*.2,y-.38,.5,x-.25+k*.2,y-.3,.6,'steel',{solid:false})},
 board(g,x,y){W.box(g,x-1.0,y-.06,0,x+1.0,y+.06,2.3,{all:'wood_light',n:'felt',s:'felt',top:'wood_dark'},{kind:'wall'});[[-.6,.8],[.1,1.2],[.6,.6],[-.2,1.7],[.7,1.5]].forEach(([dx,z])=>{W.box(g,x+dx-.18,y-.09,z,x+dx+.18,y-.06,z+.26,'paper',{solid:false});W.box(g,x+dx-.18,y+.06,z,x+dx+.18,y+.09,z+.26,'news',{solid:false})})},
 courtroom(g,x,y){W.box(g,x-1.6,y-.5,0,x+1.6,y+.5,1.3,{all:'wood_dark',top:'wood_light'},{kind:'table'});W.box(g,x-1.7,y-.55,1.3,x+1.7,y+.55,1.38,'wood_light',{solid:false});W.box(g,x-1.7,y-.55,1.38,x+1.7,y-.4,1.7,'wood_dark',{solid:false});
  P.chair(g,x,y-1.0,'S','wood_dark');W.box(g,x-.3,y-.15,1.38,x+.3,y+.1,1.42,'paper',{solid:false});W.box(g,x+.8,y-.1,1.38,x+1.0,y+.1,1.5,'wood_light',{solid:false});W.box(g,x-1.0,y+1.3,0,x+1.0,y+1.5,.5,'wood_dark',{solid:false})},
 policy(g,x,y){P.table(g,x-1.1,y-1.1,x+1.1,y+1.1,.8,'wood_dark','felt');for(let k=0;k<3;k++){const o=-.8+k*.8;P.chair(g,x+o,y-1.5,'S');P.chair(g,x+o,y+1.5,'N')}papers(g,x,y,.8)},
 bib(g,x,y){shelfUnit(g,x-1.3,y-.3,x+1.3,y+.3,2.4,'SN');W.box(g,x-1.35,y-.35,2.4,x+1.35,y+.35,2.5,'brass',{solid:false})},
 radio(g,x,y){desk(g,x-.5,y-.3,x+.5,y+.3,.8);W.box(g,x-.35,y-.2,.8,x+.35,y+.15,1.15,{all:'wood_dark',s:'iron'},{solid:false});W.box(g,x-.2,y+.15,.9,x-.05,y+.17,1.05,'brass',{solid:false});W.box(g,x+.05,y+.15,.9,x+.25,y+.17,1.05,'lamp',{solid:false,light:1.2})},
 terminal(g,x,y){desk(g,x-.8,y-.4,x+.8,y+.4,.8);monitor(g,x,y,.8,'S');P.chair(g,x,y+.9,'N');W.box(g,x-.3,y+.05,.8,x+.3,y+.3,.84,'iron',{solid:false})},
 microfilm(g,x,y){W.box(g,x-.5,y-.4,0,x+.5,y+.4,.9,{all:'iron'},{kind:'table'});W.box(g,x-.45,y-.35,.9,x+.45,y+.35,1.4,{all:'steel',s:'screen'},{solid:false});W.box(g,x-.15,y-.38,.9,x+.15,y-.35,1.2,'screen',{solid:false});W.box(g,x-.6,y-.3,.9,x-.45,y+.3,1.5,'iron',{solid:false});},
 eval(g,x,y){desk(g,x-1.0,y-.55,x+1.0,y+.55,.95);W.box(g,x-.15,y-.15,.95,x+.15,y+.15,.99,'glass',{solid:false});W.box(g,x-.02,y+.15,.95,x+.02,y+.4,.99,'brass',{solid:false});papers(g,x+.5,y,.95);P.chair(g,x,y+1.0,'N')},
 pedestals(g,x,y){[[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]].forEach(([dx,dy])=>{pedestal(g,x+dx,y+dy,1.0,'marble_white');W.box(g,x+dx-.18,y+dy-.18,1.05,x+dx+.18,y+dy+.18,1.4,'glass',{solid:false})});W.box(g,x-.5,y-.5,0,x+.5,y+.5,.5,'marble_white',{kind:'table'});W.box(g,x-.4,y-.4,.5,x+.4,y+.4,.54,'gold',{solid:false})},
 atrium(g,x,y){P.table(g,x-1.7,y-.55,x+1.7,y+.55,.8,'wood_dark','felt');for(let k=0;k<4;k++){const o=-1.2+k*.8;P.chair(g,x+o,y-1.0,'S');P.chair(g,x+o,y+1.0,'N')}papers(g,x-.7,y,.8);papers(g,x+.7,y,.8)},
 curator(g,x,y){desk(g,x-1.2,y-.55,x+1.2,y+.55,1.0);P.chair(g,x,y-1.0,'S','wood_dark');lamp(g,x+.8,y,1.0);papers(g,x-.5,y,1.0);W.box(g,x+1.5,y-.3,0,x+2.1,y+.3,1.4,{all:'wood_dark'},{kind:'shelf'})}
};
/* new station layout (local cell coordinates) */
const ST=[
 ['directory',0,10,8,'Visitor Directory'],['passport',0,4,13,'Museum store & Visitor Passport'],['tp0',0,15,8,'Teleport pedestal'],
 ['migration',1,10,10,'Migration Map table'],['tp1',1,15,15,'Teleport pedestal'],
 ['hearing',2,10,10,'Review desk: Civil-Liberties Hearing'],['tp2',2,15,15,'Teleport pedestal'],
 ['source3',3,8,11,'Source Analysis stations'],['quota',3,12,16,'Quota Calculator'],['board',3,15,10,'Attitudes & Policy Board'],['tp3',3,15,15,'Teleport pedestal'],
 ['courtroom',4,10,10,'Take the bench: Supreme Court Simulation'],['tp4',4,15,15,'Teleport pedestal'],
 ['policy',5,10,10,'Policy Council table'],['tp5',5,15,15,'Teleport pedestal'],
 ['bib',6,13,4,'Bibliography Wall'],['radio',6,14,14,'Radio'],['terminal',6,5,14,'Evidence Journal terminal'],['microfilm',6,12,16,'Microfilm reader'],['eval',6,10,10,'Source Evaluation Desk'],['tp6',6,15,8,'Teleport pedestal'],
 ['pedestals',7,10,10,'Hall of Evidence pedestals'],['atrium',7,12,5,'Guiding Questions argument table'],['curator',7,14,14,'Curator’s Office desk'],['tp7',7,5,15,'Teleport pedestal']];
const DOC={0:[13,14],1:[14,12],2:[12,16],3:[11,14],4:[4,12],5:[4,12],6:[12,3],7:[12,3]};
const ICON_Z={directory:2.7,passport:2.9,pedestals:2.2,board:2.9,bib:3.1,courtroom:2.4,microfilm:2.1,quota:1.9};
function placeHallStations(){
 ST.forEach(([id,g,lx,ly,label])=>{const [x,y]=C(g,lx,ly);const m=id.startsWith('tp')?'tp':id;if(MODELS[m])MODELS[m](g,x,y);station(id,g,x,y,label,ICON_Z[id]||(id.startsWith('tp')?1.9:2.1),id==='pedestals'?2.6:1.0)});
 for(let g=0;g<=7;g++){const [x,y]=C(g,...DOC[g]);W.docentSpots.push({g,x,y,label:g===0?'Ticket-desk attendant':'Docent'})}
 const bt=C(5,14,6);W.extras.clerk={g:5,x:bt[0],y:bt[1]};
 // clerk's counter
 desk(5,bt[0]-1.4,bt[1]+.7,bt[0]+.2,bt[1]+1.3,1.0);
 // ticket desk in entrance hall (attendant stands behind)
 desk(0,ORIGIN[0][0]+11.2,ORIGIN[0][1]+15.2,ORIGIN[0][0]+15.2,ORIGIN[0][1]+16,1.05);
 W.box(0,ORIGIN[0][0]+11.4,ORIGIN[0][1]+15.3,ORIGIN[0][0]+11.9,ORIGIN[0][1]+15.7,1.05,'brass',{solid:false});
}
/* ---------- hall dressing ---------- */
function dressHalls(){
 for(let g=0;g<=7;g++){
  const [ox,oy]=ORIGIN[g];
  P.columns(g);P.chandeliers(g);P.stairs(g);P.rails(g);
  W.hang.push({x:ox+17.4,y:oy+10.5,z:3.7,g,text:'Upstairs: sources + evidence'});W.box(g,ox+17.35,oy+10.0,3.2,ox+17.45,oy+10.06,H.slabB,'iron',{solid:false});W.box(g,ox+17.35,oy+10.94,3.2,ox+17.45,oy+11.0,H.slabB,'iron',{solid:false});
  // plants in the four corners of the void
  [[5.2,5.2],[14.6,5.2],[5.2,14.6],[14.6,14.6]].forEach(([lx,ly])=>{if(g>=1&&lx<7&&ly<7)return;if(free(ox+lx-.9,oy+ly-.9,ox+lx+.9,oy+ly+.9,0,2))plant(g,ox+lx,oy+ly)});
  // benches facing artwork
  const mine=Object.values(W.artSpots).filter(s=>s.g===g&&s.level===0);
  let nb=0;mine.forEach((s,k)=>{if(nb>=3||k%2)return;const bx=s.x+s.nx*1.8,by=s.y+s.ny*1.8;const f=P.OPP[s.dir];const along=s.ny!==0;
   const w=along?1.8:.5,d=along?.5:1.8;if(!free(bx-w/2-.2,by-d/2-.2,bx+w/2+.2,by+d/2+.2,0,1.2))return;
   P.bench(g,bx,by,f,1.8);nb++});
  // rug fringe is handled by floor tiles
 }
 // Upstairs signposts: banner on the column nearest the stair
}
/* ---------- secret chambers ---------- */
const CH_ITEM=[[1.9,1.7],[3.1,1.7],[4.3,1.7],[1.7,3.0],[3.0,3.4]];
function chambers(){
 for(let g=1;g<=7;g++){const [ox,oy]=ORIGIN[g];
  // furniture inside: rug, shelf along west wall, lantern
  W.box(g,ox+1.5,oy+1.5,0,ox+4.5,oy+4.5,.02,{top:'rugfringe',side:'rugfringe'},{solid:false,light:.7});
  W.box(g,ox+1,oy+4.6,0,ox+4.9,oy+4.95,.9,{all:'wood_dark',top:'wood_light'},{solid:true,kind:'table',light:.7});
  const items=(D.ITEMS[g]||[]);
  items.forEach((it,k)=>{const p=CH_ITEM[k]||[3,3];const x=ox+p[0],y=oy+p[1];W.box(g,x-.18,y-.18,0,x+.18,y+.18,.85,{all:'marble_white'},{solid:true,kind:'table',light:.7});W.itemSpots[it[0]]={g,x,y,z:1.15}});
  W.box(g,ox+2.9,oy+2.9,3.1,ox+3.1,oy+3.1,H.chamB,'iron',{solid:false});W.box(g,ox+2.75,oy+2.75,2.85,ox+3.25,oy+3.25,3.1,'lamp',{solid:false,light:1.2});
  if(g===5){W.extras.raid={g:5,x:ox+4.2,y:oy+3.9}}
  if(g===7){W.extras.vault={g:7,x:ox+4.2,y:oy+3.9}}
 }
}
/* ---------- courtyard ---------- */
/* The courtyard is the 20x20 square x,y in [20,40]. A cross of cobbled paths runs from the four doors to a paved plaza that holds the fountain;
   the four lawn quarters each carry one feature, and clipped hedge beds line the building walls between the doors. Nothing overlaps. */
function tree(x,y,s){s=s||1;W.box(9,x-.22,y-.22,0,x+.22,y+.22,3.2*s,{all:'log',top:'log'},{solid:true,kind:'tree'});
 W.box(9,x-1.3,y-1.3,2.4*s,x+1.3,y+1.3,3.6*s,'leaves',{solid:false});W.box(9,x-.9,y-.9,3.6*s+.02,x+.9,y+.9,4.5*s,'leaves2',{solid:false,noBot:true});W.box(9,x-.4,y-.4,4.5*s+.02,x+.4,y+.4,5.1*s,'leaves',{solid:false,noBot:true})}
function lampPost(x,y,ch){ch=ch===undefined?9:ch;W.box(ch,x-.07,y-.07,0,x+.07,y+.07,3.4,'iron',{solid:true,kind:'post'});W.box(ch,x-.12,y-.12,3.4,x+.12,y+.12,3.5,'iron',{solid:false});W.box(ch,x-.2,y-.2,3.5,x+.2,y+.2,3.9,'lamp',{solid:false,light:1.3});W.box(ch,x-.25,y-.25,3.9,x+.25,y+.25,3.98,'iron',{solid:false})}
function hedge(x0,y0,x1,y1,ch){W.box(ch===undefined?9:ch,x0,y0,0,x1,y1,.95,{all:'hedge',top:'hedge'},{solid:true,kind:'hedge',light:1})}
function courtyard(){
 const cx=30,cy=30,F={all:'fount'};
 // ---- fountain: square basin, tiered column, upper bowl and four spouts. Water is a plane hovering just above each solid surface.
 const ring=(r,z0,z1,t)=>[[cx-r,cy-r,cx+r,cy-r+t],[cx-r,cy+r-t,cx+r,cy+r],[cx-r,cy-r+t,cx-r+t,cy+r-t],[cx+r-t,cy-r+t,cx+r,cy+r-t]].forEach(q=>W.box(9,q[0],q[1],z0,q[2],q[3],z1,{all:'fount',top:'fount_rim'},{solid:false,noBot:true,light:1}));
 W.box(9,cx-2.4,cy-2.4,0,cx+2.4,cy+2.4,.55,F,{solid:false,noTop:true,light:1});
 ring(2.4,.55,.9,.4);
 W.quad(W.chunk(9),[cx-2,.7,cy-2],[0,0,1],[1,0,0],4,4,'water',1);
 W.addSolid({x0:cx-2.4,x1:cx+2.4,y0:cy-2.4,y1:cy+2.4,b:0,t:1.3,kind:'fountain'});
 W.box(9,cx-1,cy-1,.55,cx+1,cy+1,1.4,F,{solid:false,noTop:true,light:1});
 ring(1,1.4,1.7,.3);
 W.quad(W.chunk(9),[cx-.7,1.55,cy-.7],[0,0,1],[1,0,0],1.4,1.4,'water',1);
 W.box(9,cx-.3,cy-.3,1.4,cx+.3,cy+.3,2.4,{all:'fount',top:'fount'},{solid:false,light:1});
 W.box(9,cx-.7,cy-.7,2.4,cx+.7,cy+.7,2.6,{all:'fount',top:'fount_rim'},{solid:false,light:1});
 W.quad(W.chunk(9),[cx-.5,2.63,cy-.5],[0,0,1],[1,0,0],1,1,'water',1);
 W.box(9,cx-.12,cy-.12,2.63,cx+.12,cy+.12,3.3,{all:'water',top:'water'},{solid:false,light:1.1});
 [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>W.box(9,cx+dx*1.65-.08,cy+dy*1.65-.08,.6,cx+dx*1.65+.08,cy+dy*1.65+.08,1.2,{all:'water',top:'water'},{solid:false,light:1.1}));
 station('fountain',9,cx,cy,'Fountain',3.9,2.2,7);
 // ---- benches around the plaza, facing the fountain
 P.bench(9,26.6,27.4,'E',1.8);P.bench(9,26.6,32.6,'E',1.8);P.bench(9,33.4,27.4,'W',1.8);P.bench(9,33.4,32.6,'W',1.8);
 // ---- NW lawn: cafe
 const ca=[24,24];P.table(9,ca[0]-.5,ca[1]-.5,ca[0]+.5,ca[1]+.5,.76,'wood_light');P.chair(9,ca[0]-1,ca[1],'E');P.chair(9,ca[0]+1,ca[1],'W');P.chair(9,ca[0],ca[1]-1,'S');
 W.box(9,ca[0]-.12,ca[1]-.12,.76,ca[0]+.12,ca[1]+.12,.86,'brass',{solid:false});
 station('cafe',9,ca[0],ca[1],'Cafe table',1.8,1.1);
 const pp=[26.6,22.6];P.table(9,pp[0]-.4,pp[1]-.3,pp[0]+.4,pp[1]+.3,.7,'wood_dark');W.box(9,pp[0]-.25,pp[1]-.2,.7,pp[0]+.25,pp[1]+.2,.73,'news',{solid:false});station('paper',9,pp[0],pp[1],'Morning newspaper',1.3,.8);
 // ---- NE lawn: nickelodeon booth against the north wall, newsstand
 const ni=[35,20.8];W.box(9,ni[0]-1.3,ni[1]-.8,0,ni[0]+1.3,ni[1]+.8,2.5,{all:'wood_dark',top:'wood_dark'},{kind:'wall'});W.box(9,ni[0]-1.15,ni[1]+.8,1.0,ni[0]+1.15,ni[1]+.83,2.0,'screen',{solid:false,light:1.15});
 W.box(9,ni[0]-1.4,ni[1]-.8,2.5,ni[0]+1.4,ni[1]+.95,2.9,{all:'cloth_red',top:'cloth_red'},{solid:false});for(let k=0;k<7;k++)W.box(9,ni[0]-1.2+k*.4,ni[1]+.95,2.52,ni[0]-1.05+k*.4,ni[1]+1.0,2.62,'lamp',{solid:false,light:1.3});
 W.box(9,ni[0]-.5,ni[1]+.83,0,ni[0]+.5,ni[1]+1.1,.8,'wood_light',{solid:false});
 station('nickelodeon',9,ni[0],ni[1]+1.5,'Nickelodeon',3.2,1.5);
 const ns=[37.2,26];W.box(9,ns[0]-1.1,ns[1]-.6,0,ns[0]+1.1,ns[1]+.6,1.0,{all:'wood_dark',top:'wood_light'},{kind:'table'});
 W.box(9,ns[0]-1.2,ns[1]-.7,2.4,ns[0]+1.2,ns[1]+.7,2.5,{all:'awn_a',top:'awn_a'},{solid:false});
 [[-1.1,-.65],[1.02,-.65],[-1.1,.58],[1.02,.58]].forEach(([dx,dy])=>W.box(9,ns[0]+dx,ns[1]+dy,0,ns[0]+dx+.08,ns[1]+dy+.07,2.4,'wood_dark',{solid:false}));
 W.box(9,ns[0]-1,ns[1]-.55,1.0,ns[0]+1,ns[1]-.35,1.9,{all:'news',s:'news',n:'news'},{solid:false});
 station('newsstand',9,ns[0],ns[1],'Newsstand',2.8,1.3);
 // ---- SE lawn: bandstand
 const bs=[36,36],R=2.2;W.box(9,bs[0]-R,bs[1]-R,0,bs[0]+R,bs[1]+R,.45,{all:'wood_light',top:'wood_light'},{solid:true,kind:'stage'});
 W.box(9,bs[0]-R-.4,bs[1]-1,0,bs[0]-R,bs[1]+1,.2,{all:'stair_top',top:'stair_top'},{solid:true,kind:'step'});
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{const px=bs[0]+sx*(R-.2),py=bs[1]+sy*(R-.2);W.box(9,px-.075,py-.075,.45,px+.075,py+.075,3.4,'column',{solid:true,kind:'post'})});
 W.box(9,bs[0]-R-.3,bs[1]-R-.3,3.4,bs[0]+R+.3,bs[1]+R+.3,3.7,{all:'awn_b',top:'awn_b',bot:'wood_dark'},{solid:false});W.box(9,bs[0]-1.5,bs[1]-1.5,3.7,bs[0]+1.5,bs[1]+1.5,4.3,{all:'awn_b',top:'awn_b',bot:'awn_b'},{solid:false,noBot:true});W.box(9,bs[0]-.7,bs[1]-.7,4.3,bs[0]+.7,bs[1]+.7,4.8,{all:'awn_b',top:'awn_b'},{solid:false,noBot:true});W.box(9,bs[0]-.05,bs[1]-.05,4.8,bs[0]+.05,bs[1]+.05,5.5,'iron',{solid:false});
 [-1,0,1].forEach(k=>{P.chair(9,bs[0]+1.0,bs[1]+k*.95,'W',null,.45);W.box(9,bs[0]+.25,bs[1]+k*.95-.15,.45,bs[0]+.4,bs[1]+k*.95+.15,1.1,'iron',{solid:false,noBot:true})});
 station('bandstand',9,bs[0],bs[1],'Bandstand',5.8,2.6,6);
 // ---- SW lawn: telescope and a bench against the west bed
 const te=[24.6,35.4];W.box(9,te[0]-.05,te[1]-.05,0,te[0]+.05,te[1]+.05,1.2,'wood_dark',{solid:true,kind:'post'});[[-.4,-.3],[.4,-.3],[0,.45]].forEach(([dx,dy])=>W.box(9,te[0]+dx-.03,te[1]+dy-.03,0,te[0]+dx+.03,te[1]+dy+.03,.7,'wood_dark',{solid:false}));
 W.box(9,te[0]-.12,te[1]-.45,1.2,te[0]+.12,te[1]+.45,1.45,{all:'brass',top:'brass'},{solid:false});W.box(9,te[0]-.17,te[1]-.55,1.18,te[0]+.17,te[1]-.4,1.47,'iron',{solid:false,noBot:true});
 station('telescope',9,te[0],te[1],'Telescope',2.1,1.1);
 P.bench(9,22.3,35,'E',1.8);
 // ---- trees, path lamps and hedge beds
 [[22.2,22.4],[38.2,22.4,.9],[22.2,38.0,.9],[27.0,37.6,.85]].forEach(t=>tree(t[0],t[1],t[2]||1));
 [[28.4,23.2],[31.6,23.2],[28.4,36.8],[31.6,36.8],[23.2,28.4],[23.2,31.6],[36.8,28.4],[36.8,31.6],[25.4,25.4],[34.6,25.4],[25.4,34.6]].forEach(p=>lampPost(p[0],p[1]));
 const T=.7;
 [[20,28.6],[31.4,33.4],[36.6,40]].forEach(([a,b])=>hedge(a,20,b,20+T));          // north bed
 [[20,28.6],[31.4,40]].forEach(([a,b])=>hedge(a,40-T,b,40));                          // south bed
 [[20+T,28.6],[31.4,40-T]].forEach(([a,b])=>hedge(20,a,20+T,b));                      // west bed
 [[20+T,28.6],[31.4,40-T]].forEach(([a,b])=>hedge(40-T,a,40,b));                      // east bed
 W.floorHook=function(x,y){
  if(y>=N)return null;const g=W.floorId[ix(x,y)];if(g!==9)return null;
  const cx=x+.5-30,cy=y+.5-30;
  if(Math.abs(cx)<5&&Math.abs(cy)<5)return ((x+y)&1)?'plaza':'plaza2';
  if(Math.abs(cx)<1.6||Math.abs(cy)<1.6)return 'cobble';
  const h=(x*73856093^y*19349663)>>>0;
  return (h%13===0)?'flower':(h&1)?'grass':'grass2'};
}
/* ---------- forecourt (outside the front door) ---------- */
function forecourt(){
 const ch=W.chunk('out');
 for(let y=60;y<68;y++)for(let x=18;x<42;x++){const t=(x>=27&&x<=32&&y<62)?'stair_top':(((x+y)&1)?'plaza':'plaza2');W.quad(ch,[x,0,y],[0,0,1],[1,0,0],1,1,t,1)}
 // portico: two columns, entablature and a banner board either side of the door
 [[27.3,60.6],[32.7,60.6]].forEach(([x,y])=>{W.box('out',x-.4,y-.4,.3,x+.4,y+.4,5.6,{all:'column',top:'marble_white'},{solid:true,kind:'column',noTop:true});W.box('out',x-.55,y-.55,5.6,x+.55,y+.55,5.9,'marble_white',{solid:false});W.box('out',x-.55,y-.55,0,x+.55,y+.55,.3,'marble_white',{solid:true,kind:'column'})});
 W.box('out',27.0,60.1,5.9,33.0,60.95,6.4,{all:'cornice_ext',top:'cornice_ext'},{solid:false});
 // hedge boundary hugging the plaza edge and the museum front
 W.box('out',18,67.2,0,42,68,.95,{all:'hedge',top:'hedge'},{solid:true,kind:'hedge'});
 W.box('out',17.2,60,0,18,68,.95,{all:'hedge',top:'hedge'},{solid:true,kind:'hedge'});
 W.box('out',42,60,0,42.8,68,.95,{all:'hedge',top:'hedge'},{solid:true,kind:'hedge'});
 [[24,62],[36,62],[24,66],[36,66]].forEach(([x,y])=>lampPost(x,y,'out'));
 P.bench('out',26,65.2,'N',2);P.bench('out',34,65.2,'N',2);
 [[21,63.5],[39,63.5]].forEach(([x,y])=>tree2(x,y));
 W.forecourt={x0:17.2,x1:42.8,y0:60,y1:67.2};
}
function tree2(x,y){W.box('out',x-.22,y-.22,0,x+.22,y+.22,3,{all:'log',top:'log'},{solid:true,kind:'tree'});W.box('out',x-1.2,y-1.2,2.3,x+1.2,y+1.2,3.4,'leaves',{solid:false});W.box('out',x-.8,y-.8,3.4+.02,x+.8,y+.8,4.2,'leaves2',{solid:false,noBot:true})}

P.place=function(){
 P.signs();P.art();P.doorFrames();
 placeHallStations();dressHalls();chambers();courtyard();forecourt();
};
})();
