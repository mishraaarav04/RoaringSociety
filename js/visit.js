/* Visitor guidance is derived from the real exhibit positions, without rewriting history. */
(function(){
'use strict';
const RS=window.RS,D=RS.D,W=window.World,E=window.Engine;
RS.CREATORS=['Anish Mhaskar','Aarav Mishra','Manvi Mishra','Myra Mehrotra'];
const aliases={newsreel:'nickelodeon',telescope3:'telescope',final:'atrium',rumor:'bartender'};
const specialRooms={1:'Pullman Platform',2:'Hidden Files Room',3:'Processing Hall',4:'Print Shop',5:'The Blind Pig',6:'Archive Stacks',7:'Curator’s Vault'};
function place(g,x,y,level,label){
 const room=g===9?'Central Courtyard':g===0?'Grand Hall':D.G[g].rooms[W.roomAt(g,x,y)];
 return {x,y,level:level||0,text:(g===9?'Courtyard':D.G[g].n)+' · '+room+' · '+(level?'upper mezzanine':'ground floor')+(label?' — '+label:'')};
}
function station(id){
 id=aliases[id]||id;const s=E.sprites.find(s=>s.id===id)||W.stations.find(s=>s.id===id);
 if(s)return place(s.gal===undefined?s.g:s.gal,s.x,s.y,0,s.label);
 return null;
}
function artwork(id){
 const a=D.byId[id];if(!a)return null;const index=D.A.indexOf(a),s=W.artSpots[index];
 if(!s)return null;
 const wall={E:'west wall',W:'east wall',S:'north wall',N:'south wall'}[s.dir];
 return place(s.g,s.x+s.nx,s.y+s.ny,s.level,RS.strip(a.title)+' ('+wall+')');
}
function discovery(q){
 if(q.disc.k==='view')return artwork(q.disc.id);
 if(q.disc.k==='station'||q.disc.k==='sim')return station(q.disc.id);
 const room=q.disc.k==='zone'?Number(q.disc.id.split('-')[1]||0):0;
 const art=D.A.find(a=>a.g===q.g&&a.room===room);
 return art?artwork(art.id):station(q.g===6?'eval':q.g===7?'atrium':'directory');
}
RS.objectivePlaces=function(q,o){
 let places=[];
 if(o.k==='view')places=o.ids.map(artwork);
 else if(o.k==='station'||o.k==='sim')places=[station(o.id)];
 else if(o.k==='bib')places=[station('bib')];
 else if(o.k==='radio')places=[station('radio')];
 else if(o.k==='cite')places=[station('terminal')];
 else if(o.k==='stamps')return [{text:'Complete the main quests in Galleries I–V. Review all five stamps at the Museum Store & Visitor Passport in the Entrance Hall.'}];
 else if(o.k==='secret'||o.k==='items'){
  const g=o.gal||q.g,d=W.secretDoor[g];
  // Never reveal the coordinates of an unopened secret.
  return [{text:D.G[g].n+' · '+specialRooms[g]+' · '+(RS.S.secretOpen[g]?'inside the discovered hidden room':'hidden area; investigate the gallery closely'),...(RS.S.secretOpen[g]&&d?{x:d.x-1,y:d.y+.5,level:0}:{})}];
 }else if(o.k==='act'){
  const context=q.obj.find(v=>v.k==='view');
  places=context?context.ids.map(artwork):[discovery(q)];
  if(q.id==='q5-7')places=[station('policy')];
  places=places.filter(Boolean).map(p=>({...p,text:'Study here: '+p.text+'. Answer with “Start activity” in the Quest Book.'}));
 }
 places=places.filter(Boolean);
 return places.length?places:[discovery(q)].filter(Boolean);
};
RS.questPlace=function(q){
 const objective=q.obj.find(o=>!RS.objDone(o))||q.obj[0];
 if(objective.k==='view'){const next=objective.ids.find(id=>!RS.S.seen.includes(id));if(next&&artwork(next))return artwork(next)}
 return RS.objectivePlaces(q,objective)[0]||{text:'Visit the '+D.G[q.g].n};
};
RS.questDirections=function(q,o){return RS.objectivePlaces(q,o).map(p=>p.text).join('\n')};

// Migration marks previously visited ground-floor areas as rewarded without changing old scores.
const S=RS.S;
if(!S.explored){S.explored={};S.visited.forEach(id=>{const m=/^z(\d+)(?:-(\d+))?$/.exec(id);if(m)S.explored[m[1]+':'+(m[2]||0)+':0']=true})}
RS.on('zone',z=>{
 const key=z.g+':'+(z.room||0)+':'+(z.g===9?0:(z.level||0));
 if(!S.explored[key]){S.explored[key]=true;RS.award('area:'+key,5,'New area discovered')}
});
RS.updateScore=function(){const score=document.querySelector('#score');if(score)score.textContent=S.points+' Curator Points'};
RS.on('score.changed',RS.updateScore);
RS.updateScore();
})();
