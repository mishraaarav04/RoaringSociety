/* Game layer: HUD, input glue, quests UI, inventory, map, teleport, settings, audio */
(function(){
'use strict';
const RS=window.RS,D=RS.D,E=window.Engine,S=RS.S;
const $=RS.$,el=RS.el;
const G=window.Game={};

/* ---------------- audio ---------------- */
let AC=null,master,musicGain,musicTimer=null;
function audio(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=S.settings.vol;master.connect(AC.destination);musicGain=AC.createGain();musicGain.gain.value=S.settings.music*0.25;musicGain.connect(master)}catch(e){AC=null}return AC}
function tone(f,t0,d,type,g,dest){const a=AC;const o=a.createOscillator(),v=a.createGain();o.type=type||'sine';o.frequency.value=f;v.gain.setValueAtTime(0,t0);v.gain.linearRampToValueAtTime(g,t0+.01);v.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(v);v.connect(dest||master);o.start(t0);o.stop(t0+d+.05)}
RS.sfx=function(n){if(!audio())return;const t=AC.currentTime;
 if(n==='quest'){tone(660,t,.15,'triangle',.2);tone(880,t+.12,.2,'triangle',.2)}
 else if(n==='done'){[523,659,784,1047].forEach((f,i)=>tone(f,t+i*.1,.2,'triangle',.22))}
 else if(n==='item'){tone(988,t,.1,'square',.12);tone(1319,t+.08,.18,'square',.12)}
 else if(n==='open'){tone(300,t,.12,'sawtooth',.1);tone(200,t+.1,.2,'sawtooth',.1)}
 else if(n==='click'){tone(520,t,.05,'square',.06)}
 else if(n==='step'){tone(90,t,.06,'triangle',.05)}
};
const CH=[[196,247,294,370],[220,277,330,415],[175,220,262,330],[196,247,294,392]]; // Gmaj7, Amaj7ish, F, G jazz-ish
/* Background music: recorded 1920s tracks play in a loop, quietly, for the whole visit. The volume follows the Music setting
   (about 20% of full at the default). If a track cannot load, the built-in synth music below is used instead. */
const TRACKS=['assets/music/whispering.mp3','assets/music/charleston-rag.mp3','assets/music/i-wanna-be-loved.mp3','assets/music/two-to-two.mp3','assets/music/wheres-that-band.mp3'];
const BGM_LEVEL=.4;let bgm=null,bgmIdx=-1,bgmFailed=false;
const bgmVol=()=>Math.max(0,Math.min(1,S.settings.music*BGM_LEVEL));
function playBgm(){
 if(bgm){bgm.volume=bgmVol();if(bgm.paused)bgm.play().catch(()=>{});return}
 if(bgmIdx<0)bgmIdx=Math.floor(Math.random()*TRACKS.length);
 const a=new Audio(TRACKS[bgmIdx]);a.volume=bgmVol();a.preload='auto';bgm=a;
 a.onended=()=>{if(bgm===a){bgm=null;bgmIdx=(bgmIdx+1)%TRACKS.length;if(S.settings.music>0&&!$('#game').hidden)playBgm()}};
 a.onerror=()=>{if(bgm===a){bgm=null;bgmFailed=true;startSynthMusic()}};
 const p=a.play();if(p&&p.catch)p.catch(()=>{});
}
function startMusic(){if(S.settings.music<=0)return;if(!bgmFailed&&typeof Audio==='function'){try{playBgm();return}catch(e){bgmFailed=true}}startSynthMusic()}
function startSynthMusic(){if(!audio()||musicTimer||S.settings.music<=0)return;let step=0;
 musicTimer=setInterval(()=>{if(!AC||AC.state!=='running')return;const t=AC.currentTime;const ch=CH[((step/8)|0)%4];const sw=(step%2)?0.08:0;
  tone(ch[0]/2,t+sw,.45,'triangle',.5,musicGain);if(step%2===0)tone(ch[step%4],t+sw,.4,'sine',.35,musicGain);if(step%4===3)tone(ch[(step+1)%4]*2,t+sw,.3,'sine',.2,musicGain);step++},300)}
function stopMusic(){clearInterval(musicTimer);musicTimer=null;if(bgm)bgm.pause()}
RS.setAudio=()=>{if(RS._clip){if(S.settings.vol>0)RS._clip.volume=Math.min(1,S.settings.vol);else{RS._clip.pause();RS._clip=null}}if(master)master.gain.value=S.settings.vol;if(musicGain)musicGain.gain.value=S.settings.music*.25;if(bgm)bgm.volume=bgmVol();if(S.settings.music<=0)stopMusic();else if(!E.paused||(G.seenStart&&!$('#game').hidden))startMusic()};
/* narration with captions */
RS.narrate=function(text,clip,onend){
 if(!text)return;const cap=$('#captions');clearTimeout(RS._capT);if(cap){cap.hidden=!S.settings.captions;if(S.settings.captions){cap.textContent=text;RS._capT=setTimeout(()=>{cap.hidden=true},Math.max(4000,text.length*70))}}
 // Stop the previous recording before starting the next line.
 try{if(RS._clip){const old=RS._clip;RS._clip=null;old.onended=old.onerror=null;old.pause()}}catch(e){}
 if(!(S.settings.vol>0))return;
 const tts=()=>{try{if('speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.resume();const u=new SpeechSynthesisUtterance(text);u.rate=1;u.volume=Math.min(1,S.settings.vol);RS._narration=u;u.onend=()=>{if(RS._narration===u)RS._narration=null;if(onend)onend()};u.onerror=()=>{if(RS._narration===u)RS._narration=null};speechSynthesis.speak(u)}}catch(e){}};
 // Recorded voice: assets/voice/line-NN.mp3. If a clip is missing or blocked, the browser voice reads the same text.
 if(clip&&typeof Audio==='function'){
  try{
   const a=new Audio('assets/voice/line-'+String(clip).padStart(2,'0')+'.mp3');a.volume=Math.min(1,S.settings.vol);a.rsText=text;RS._clip=a;
   const fallback=()=>{if(RS._clip===a){RS._clip=null;tts()}};
   a.onerror=fallback;a.onended=()=>{if(RS._clip===a){RS._clip=null;if(onend)onend()}};
   try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
   const p=a.play();if(p&&p.catch)p.catch(fallback);
   return;
  }catch(e){}
 }
 tts();
};
const INTRO={0:'Welcome to The Roaring Society. Gold frames hold primary sources, silver frames secondary sources, and green plaques hold evidence. Press T to teleport at any time.',
 1:'Gallery I. During the First World War, factory jobs in the North and oppression in the South set the Great Migration in motion. That movement sharpened racial conflict.',
 2:'Gallery II. Wartime and postwar repression, from the Espionage Act to the Palmer Raids, led citizens to found the A C L U in 1920.',
 3:'Gallery III. Fear of foreigners and radicals shaped immigration restriction and anti-labor policy.',
 4:'Gallery IV. Gitlow versus New York lost his case, yet it changed the Constitution by applying free speech to the states.',
 5:'Gallery V. Prohibition aimed to solve social problems. See how its intended effects differed from the actual consequences.',
 6:'The Digital Research Room. Here you will find the bibliography and learn to judge primary and secondary sources.',
 7:'The Synthesis Gallery. Bring your evidence together to answer the museum’s two Guiding Questions.',
 9:'The central courtyard. Doors lead to every wing of the museum.'};

/* ---------------- HUD ---------------- */
const banner=$('#banner'),prompt_=$('#prompt'),cross=$('#cross'),tracker=$('#tracker'),mini=$('#minimap'),mctx=mini.getContext('2d');
let fog=new Uint8Array(E.N*E.N);try{const f=RS.ls.get('rs-fog');if(f&&f.length===E.N*E.N)for(let i=0;i<f.length;i++)fog[i]=f.charCodeAt(i)-48}catch(e){}
function saveFog(){let s='';for(let i=0;i<fog.length;i++)s+=fog[i];RS.ls.set('rs-fog',s)}
let bannerT=0,narratedGallery=null;
// Room lines play the first time each room is entered during a visit; the gallery intro still plays on gallery entry.
const roomsHeard=new Set();
function roomClip(g,room){const V=RS.VOICE;if(!V||!V.rooms||g===9)return 0;const list=V.rooms[g],c=list&&list[room],k=g+':'+room;if(!c||roomsHeard.has(k))return 0;roomsHeard.add(k);return c}
function cue(k){const V=RS.VOICE;if(V&&V.events&&V.events[k])RS.narrate(V.text[V.events[k]],V.events[k])}
let cardCued=false;
RS.on('credits.start',()=>{try{if(RS._clip){RS._clip.pause();RS._clip=null}if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}stopMusic()});
RS.on('credits.end',()=>{if(S.settings.music>0&&G.seenStart&&!$('#game').hidden)startMusic()});
RS.on('quest.complete',()=>cue('quest'));RS.on('secret',()=>cue('secret'));
RS.on('artwork.viewed',()=>{if(!cardCued&&S.seen.length===1){cardCued=true;cue('card')}});
function showBanner(t,acc){banner.textContent=t;banner.style.setProperty('--acc',acc);banner.classList.add('show');clearTimeout(bannerT);bannerT=setTimeout(()=>banner.classList.remove('show'),3500)}
RS.on('zone',z=>{
 const g=z.g;
 let name,acc;
 if(g===9){name='Central Courtyard';acc='#6a9a4a';S.visited.includes('z9')||S.visited.push('z9')}
 else if(g===0){name='Entrance Hall';acc=D.G[0].accent;S.visited.includes('z0')||S.visited.push('z0')}
 else{name=D.G[g].n+' — '+D.G[g].rooms[z.room]+(z.level?' · Upper level':'');acc=D.G[g].accent;['z'+g,'z'+g+'-'+z.room].forEach(id=>{if(!S.visited.includes(id))S.visited.push(id)})}
 showBanner(name,acc);
 if(g!==9&&g<8)E.loadGallery(g);
 // preload neighbours
 const nb={1:[0,2],2:[1,3],3:[2,4],4:[3,5],5:[4]}[g]||[];nb.forEach(n=>n>0&&E.loadGallery(n));
 // Speak once per gallery entry; room changes and in-gallery teleports stay quiet.
 const V=RS.VOICE||{},rc=roomClip(g,z.room);
 if(g!==narratedGallery){narratedGallery=g;RS.narrate(INTRO[g],V.intro&&V.intro[g],rc?()=>{if(E.zoneG===g&&E.zoneRoom===z.room)RS.narrate(V.text[rc],rc)}:undefined)}
 else if(rc)RS.narrate(V.text[rc],rc);
 RS.save();RS.emit('zone.entered',z);
});

/* minimap */
function drawMini(){
 const P=E.player,R=16,Z=mini.width/(R*2);
 mctx.fillStyle='#14100a';mctx.fillRect(0,0,mini.width,mini.height);
 const px=Math.floor(P.x),py=Math.floor(P.y);
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
  const x=px+dx,y=py+dy;if(x<0||y<0||x>=E.N||y>=E.N)continue;
  // fog of war: reveal within radius 5
  const i=y*E.N+x;if(dx*dx+dy*dy<=26&&!fog[i])fog[i]=1;
  if(!fog[i])continue;
  const v=E.map[i];const fx=(dx+R-(P.x-px-.5)+.0)*Z,fy=(dy+R-(P.y-py-.5))*Z;
  if(v===0){const fg=E.floorId[i];mctx.fillStyle=fg===9?'#3f5a2e':fg===255?'#000':'#3a2d1e';mctx.fillRect(fx,fy,Z+1,Z+1)}
  else if(v>=100&&v<200){mctx.fillStyle=D.A[v-100].frame==='gold'?'#d4af37':D.A[v-100].frame==='silver'?'#c3c9cf':'#2f8f58';mctx.fillRect(fx,fy,Z+1,Z+1)}
  else if(v===90){mctx.fillStyle=D.G[E.floorId[i]].accent;mctx.globalAlpha=.7;mctx.fillRect(fx,fy,Z+1,Z+1);mctx.globalAlpha=1}
  else{const g=Math.max(0,Math.min(7,(v>=200?E.signs[v-200].g:v-1)));mctx.fillStyle=D.G[g].accent;mctx.globalAlpha=.7;mctx.fillRect(fx,fy,Z+1,Z+1);mctx.globalAlpha=1}
 }
 // pinned quest markers & stations
 E.sprites.forEach(s=>{if(!s.visible||s.kind!=='station'&&s.kind!=='docent')return;const dx=s.x-P.x,dy=s.y-P.y;if(Math.abs(dx)>R||Math.abs(dy)>R)return;const i=Math.floor(s.y)*E.N+Math.floor(s.x);if(!fog[i])return;
  mctx.fillStyle=s.kind==='docent'?'#ff9f43':(s.id.startsWith('tp')?'#a29bfe':'#fff');mctx.fillRect((dx+R)*Z-2,(dy+R)*Z-2,4,4)});
 pinned().forEach(q=>{const pos=questMarker(q);if(!pos)return;const dx=pos[0]-P.x,dy=pos[1]-P.y;const cx=Math.max(-R+1,Math.min(R-1,dx)),cy=Math.max(-R+1,Math.min(R-1,dy));mctx.fillStyle='#ffd34e';mctx.beginPath();mctx.arc((cx+R)*Z,(cy+R)*Z,4,0,7);mctx.fill()});
 // player
 mctx.save();mctx.translate(mini.width/2,mini.height/2);mctx.rotate(P.a+Math.PI/2);mctx.fillStyle='#ff5252';mctx.beginPath();mctx.moveTo(0,-6);mctx.lineTo(5,5);mctx.lineTo(-5,5);mctx.closePath();mctx.fill();mctx.restore();
}
function questMarker(q){const p=RS.questPlace(q);return p&&p.x!==undefined?[p.x,p.y]:null}
const pinned=()=>(S.pins||[]).map(id=>RS.quests.find(q=>q.id===id)).filter(q=>q&&S.quests[q.id]==='active');
function drawTracker(){
 const p=pinned();tracker.innerHTML='';tracker.hidden=!p.length;
 p.forEach(q=>{const d=el('div',{class:'tq'},[el('b',{},[q.title])]);q.obj.forEach(o=>d.append(el('div',{class:RS.objDone(o)?'ok':''},[(RS.objDone(o)?'✓ ':'○ ')+o.l])));d.append(el('div',{class:'quest-location'},[RS.questPlace(q).text]));tracker.append(d)});
}
RS.on('quests.changed',drawTracker);
RS.on('artwork.viewed',drawTracker);RS.on('act.completed',drawTracker);RS.on('sim.completed',drawTracker);RS.on('item.collected',drawTracker);RS.on('station',drawTracker);

/* ---------------- interaction ---------------- */
let bubbleT=0,lastBubble=0;
function bubble(text){const b=$('#bubble');b.textContent=text;b.hidden=false;clearTimeout(bubbleT);bubbleT=setTimeout(()=>b.hidden=true,4200)}
G.bubble=bubble;
function targetInfo(t){
 if(!t)return null;
 if(t.type==='wall'){
  if(t.cell>=200){const s=E.signs[t.cell-200];return {text:s.opts.tele?'E: Teleport menu':'E: Read sign'}}
  if(t.cell>=100){const a=D.A[t.cell-100];const seen=S.seen.includes(a.id);return {text:'E: Examine — '+RS.strip(a.title)+(seen?' ✓':''),shape:a.frame}}
  if(t.cell===90){return {text:'E: Inspect joinery'}}
 }
 if(t.type==='sprite'){const s=t.s;if(s.kind==='item')return {text:'E: Pick up — '+s.label};if(s.kind==='docent')return {text:'E: Talk to docent'};if(s.kind==='npc-talk')return {text:'E: Talk'};return {text:'E: '+s.label}}
}
let lastKey='';
function updatePrompt(){
 const t=E.target;const key=t?(t.type==='wall'?'w'+t.cell+t.x+t.y:'s'+t.s.id):'';
 if(key===lastKey)return;lastKey=key;
 const i=targetInfo(t);
 if(i){prompt_.textContent=i.text;prompt_.hidden=false;cross.className='clickable '+(i.shape||'')}else{prompt_.hidden=true;cross.className=''}
}
const GATE_MSG={1:'The plate marked “Track 19” is loose. A passage opens to the Pullman Platform.',2:'The filing cabinet swings aside, revealing the Hidden Files Room.',3:'The steamer trunk slides away, revealing the Processing Hall.',4:'The bookcase swings open. Beyond it: an old print shop.',6:'A shelf slides back to reveal the Archive Stacks.',5:''};
E.onInteract=function(t){
 RS.sfx('click');
 if(t.type==='wall'){
  if(t.cell>=200)return sign(E.signs[t.cell-200]);
  if(t.cell>=100){document.exitPointerLock&&document.exitPointerLock();return RS.openArtwork(D.A[t.cell-100].id)}
  if(t.cell===90){const g=E.blockAt(t.x,t.y);return secret(g)}
 }else{
  const s=t.s;
  if(s.kind==='item'){RS.collect(s.gal,s.key);s.visible=false;return}
  if(s.kind==='docent')return docent(s);
  if(s.kind==='npc-talk'){RS.markStation('rumor');RS.overlay('Cigar-shop clerk',el('div',{class:'prose'},[el('p',{},['“Psst. Looking for the Blind Pig? Knock twice quick, then once slow. Then say the password.”'])]));S.clue5=true;RS.save();return}
  if(s.kind==='station')return station(s.id);
 }
};
function sign(s){
 if(s.opts.tele)return G.teleportMenu();
 if(s.opts.legend){RS.markStation('frames');return RS.overlay('Frame colors',frameGuide())}
 if(s.opts.gal){const g=D.G[s.opts.gal];return RS.overlay(g.n,el('div',{class:'prose'},[el('h3',{},[g.t]),el('p',{},[el('b',{},['Research question: ']),g.q||'']),el('p',{},['Wing: '+g.wing+'.'])]))}
 bubble(s.text);
}
function frameGuide(){const w=el('div',{class:'prose'});
 [['gold','Gold frame','Primary source: made at the time (photos, laws, newspapers, speeches).'],['silver','Silver frame','Secondary source: written later to explain or interpret.'],['green','Green plaque','Evidence panel: statistics and facts gathered by the curators.']].forEach(r=>w.append(el('div',{class:'frame-row'},[el('span',{class:'swatch '+r[0]}),el('div',{},[el('b',{},[r[1]]),el('div',{},[r[2]])])])));return w}
function docent(s){
 const lines=D.DIALOGUE.docent[s.gal];s.talk=(s.talk||0);
 const line=lines[Math.min(s.talk,lines.length-1)];if(s.talk<lines.length)s.talk++;
 RS.overlay('Museum docent',el('div',{class:'prose'},[el('p',{},['Docent: “'+line+'”'])]));RS.markStation('docent'+s.gal);
}
function secret(g){
 if(S.secretOpen[g])return;
 if(g===5){return Sims.knock()}
 if(g===7){if(S.keys.filter(k=>k>=1&&k<=5).length>=5){E.openSecret(7);RS.sfx('open');bubble('The five Gallery Keys turn together. The Curator’s Vault opens.');return}else{bubble('The Curator’s Vault needs all five Gallery Keys ('+S.keys.filter(k=>k>=1&&k<=5).length+'/5).');return}}
 E.openSecret(g);RS.sfx('open');bubble(GATE_MSG[g]||'A hidden passage opens.');
}
G.secretOpen=g=>{E.openSecret(g);RS.sfx('open')};

/* stations that live here */
function station(id){
 RS.markStation(id);
 if(id.startsWith('tp'))return G.teleportMenu();
 const fn=window.Sims&&Sims.open&&Sims.open(id);
 if(fn)return;
 switch(id){
  case 'directory':return G.directory();
  case 'passport':return G.passport();
  case 'cafe':bubble('You sit for a moment at the cafe table. A newspaper lies open on the table.');return;
  case 'paper':return G.morningPaper();
  case 'newsstand':return G.newsstand();
  case 'bandstand':return G.bandstand();
  case 'telescope':return G.telescope();
  case 'nickelodeon':return G.nickelodeon();
  case 'fountain':bubble('A pixel fountain splashes quietly.');return;
  case 'makers':return G.makers();
  case 'vaultcredits':return G.credits();
  default:bubble('Nothing to do here yet.');
 }
}

/* ---------------- Directory / Teleport / Map ---------------- */
const TELE=[
 ['Entrance Hall',28.5,54.5,-Math.PI/2,0],['Courtyard (fountain)',29.5,35.2,-Math.PI/2,9],
 ['Gallery I — Hall of Departures',15.5,49.5,Math.PI,1],['Gallery II — Red Scare Hall',9.5,35.5,-Math.PI/2,2],['Gallery III — Hall of Fear',7.5,14.5,-Math.PI/2,3],
 ['Gallery IV — Courtroom Lobby',24.5,9.5,0,4],['Gallery V — Temperance Hall',44.5,9.5,0,5],['Research Room — Reading Room',49.5,24.5,Math.PI/2,6],
 ['Synthesis Gallery — Hall of Evidence',49.5,44.5,Math.PI/2,7],['Rooftop — Timeline Terrace',0,0,0,'roof']];
G.teleportMenu=function(){
 const w=el('div',{class:'tele'},[el('p',{},['Teleporting never skips content: entering a gallery still triggers its quests.'])]);
 TELE.forEach(t=>w.append(el('button',{class:'btn tele-btn',style:'--acc:'+(D.G[t[4]]?D.G[t[4]].accent:'#6a9a4a'),onclick:()=>{RS.closeOverlay();G.goto(t)}},[t[0]])));
 RS.overlay('Teleport',w);document.exitPointerLock&&document.exitPointerLock();
};
G.goto=function(t){
 if(t[4]==='roof'){RS.markStation('terrace');return Sims.timeline()}
 const f=$('#fade');if(!S.settings.reducedMotion){f.classList.add('on');setTimeout(()=>{E.teleport(t[1],t[2],t[3]);f.classList.remove('on')},500)}else E.teleport(t[1],t[2],t[3]);
 RS.save();
};
G.directory=function(){
 const w=el('div',{class:'prose'},[el('h3',{},['Welcome to The Roaring Society']),
  el('p',{},['A 3D museum about social conflict and civil liberties in 1920s America. Five galleries tell the story, the Research Room holds the sources, and the Synthesis Gallery asks you to answer the Guiding Questions.']),frameGuide()]);
 const list=el('div',{class:'dir-list'});D.G&&[1,2,3,4,5,6,7].forEach(g=>list.append(el('div',{class:'dir-row',style:'--acc:'+D.G[g].accent},[el('b',{},[D.G[g].n+': '+D.G[g].t]),el('span',{},[' ('+D.G[g].wing+' wing)'])])));
 w.append(el('h4',{},['Wings']),list,el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.teleportMenu()}},['Open teleport menu']));
 RS.overlay('Visitor Directory',w);document.exitPointerLock&&document.exitPointerLock();
};
G.fullMap=function(){
 const c=el('canvas',{width:420,height:420,class:'fullmap','aria-label':'Full museum map. Click a gallery to teleport.'});const x=c.getContext('2d');
 const draw=()=>{x.fillStyle='#1c150d';x.fillRect(0,0,420,420);const u=7;
  for(let by=0;by<3;by++)for(let bx=0;bx<3;bx++){const key=bx+','+by;const g={'1,2':0,'0,2':1,'0,1':2,'0,0':3,'1,0':4,'2,0':5,'2,1':6,'2,2':7,'1,1':9}[key];
   const vis=g===9?S.visited.includes('z9'):S.visited.includes('z'+g);
   x.fillStyle=g===9?'#3f5a2e':D.G[g].accent;x.globalAlpha=vis?1:.35;x.fillRect(bx*140+4,by*140+4,132,132);x.globalAlpha=1;
   x.fillStyle='#fff';x.font='bold 13px sans-serif';x.textAlign='center';const label=g===9?'Courtyard':D.G[g].short;
   x.fillText(label,bx*140+70,by*140+74);
   x.font='11px sans-serif';x.fillText(g===9?'':(D.G[g].wing),bx*140+70,by*140+90)}
  const P=E.player;x.fillStyle='#ff5252';x.beginPath();x.arc(P.x*7,P.y*7,6,0,7);x.fill();x.fillStyle='#fff';x.fillText('You are here',Math.min(370,Math.max(50,P.x*7)),P.y*7-10)};
 draw();
 c.addEventListener('click',ev=>{const r=c.getBoundingClientRect();const mx=(ev.clientX-r.left)*420/r.width,my=(ev.clientY-r.top)*420/r.height;const bx=Math.floor(mx/140),by=Math.floor(my/140);const key=bx+','+by;const g={'1,2':0,'0,2':1,'0,1':2,'0,0':3,'1,0':4,'2,0':5,'2,1':6,'2,2':7,'1,1':9}[key];
  const t=TELE.find(t=>t[4]===g);if(t&&confirm('Teleport to '+t[0]+'?')){RS.closeOverlay();G.goto(t)}});
 const w=el('div',{class:'prose'},[el('p',{},['The ring has eight wings around an open-air courtyard. Every wing has a ground floor and an upper mezzanine reached by the grand staircase: primary sources hang downstairs, secondary sources and evidence panels hang upstairs. Hidden passages are secret rooms, and the Timeline Terrace is reached from the teleport menu.']),c]);
 RS.overlay('Museum map',w);document.exitPointerLock&&document.exitPointerLock();
};

/* ---------------- Courtyard & misc stations ---------------- */
G.morningPaper=function(){
 const w=el('div',{class:'newspaper'},[el('h1',{},['The Daily Courier']),el('div',{class:'np-date'},['Late edition · A museum recreation (not an archival page)']),
  el('div',{class:'np-cols'},[
   el('div',{},[el('h3',{},['WOMEN GAIN THE VOTE']),el('p',{},['The 19th Amendment, giving women the right to vote, was ratified in August 1920.'])]),
   el('div',{},[el('h3',{},['PROHIBITION IN EFFECT']),el('p',{},['The nation went “dry” in January 1920, and the speakeasy followed soon after.'])]),
   el('div',{},[el('h3',{},['RADIO COMES HOME']),el('p',{},['In November 1920, Pittsburgh station KDKA broadcast presidential election returns, one of the first widely noted commercial broadcasts.'])]),
   el('div',{},[el('h3',{},['FEARS OF “REDS”']),el('p',{},['Raids and deportations make front pages. Civil libertarians warn that rights are being trampled.'])])
  ])]);
 RS.overlay('Morning paper',w,{});RS.markStation('paper');document.exitPointerLock&&document.exitPointerLock();
};
G.newsstand=function(){
 const done=[1,2,3,4,5].filter(g=>S.stamps.includes(g));
 const heads={1:'MIGRANTS FILL NORTHBOUND TRAINS',2:'NEW GROUP FORMED TO DEFEND CIVIL LIBERTIES',3:'CONGRESS TIGHTENS IMMIGRATION',4:'HIGH COURT SPLITS ON FREE SPEECH',5:'DRY LAW BRINGS GANGSTERS, CRITICS SAY'};
 const w=el('div',{class:'newsstand'},[el('p',{},['Collectible newspapers appear here as you finish galleries ('+done.length+'/5).'])]);
 [1,2,3,4,5].forEach(g=>w.append(el('div',{class:'np-card'+(done.includes(g)?'':' locked')},[done.includes(g)?heads[g]+' — '+D.G[g].short:'???'])));
 RS.overlay('Newsstand',w);document.exitPointerLock&&document.exitPointerLock();
};
G.bandstand=function(){
 S.settings.music=S.settings.music>0?S.settings.music:.5;audio();startMusic();bubble('The bandstand plays period-style music. (Change volume in Settings.)');
};
let telViews=new Set();
G.telescope=function(){
 const spots=[['The fountain','The fountain anchors the courtyard, which is visible from windows on every floor.'],['The newsstand','Racks of headlines. New papers appear as you complete galleries.'],['The bandstand','Musicians play while visitors listen and chat.'],['The Nickelodeon','Archival clips and newsreels play here.'],['The cafe','Visitors sit and read the Morning Paper.']];
 const w=el('div',{class:'prose'},[el('p',{},['Look through the telescope. Choose three courtyard spots.'])]);
 const out=el('p',{class:'tele-out'},['']);
 spots.forEach(s=>w.append(el('button',{class:'btn',onclick:()=>{telViews.add(s[0]);out.textContent=s[0]+': '+s[1];if(telViews.size>=3){RS.markStation('telescope3')}}},[s[0]])));
 w.append(out);RS.overlay('Telescope',w);RS.markStation('telescope');document.exitPointerLock&&document.exitPointerLock();
};
G.nickelodeon=function(){
 const clips=[
  {t:'Klan march, Washington, D.C.',f:'Ku Klux Klan marching down Pennsylvania Ave., Washington, D.C LCCN2016888117.jpg',c:'Hooded marchers parade down Pennsylvania Avenue in the mid-1920s.'},
  {t:'Seattle General Strike, 1919',f:'Seattle General Strike 1919 Participants Leaving Shipyard.jpg',c:'Workers leave a Seattle shipyard at the start of the 1919 general strike.'},
  {t:'Prohibition agents pour out liquor',f:'Prohibition agents destroying barrels of alcohol (United States, prohibition era).jpg',c:'Federal agents destroy confiscated alcohol during Prohibition.'},
  {t:'Scopes Trial, 1925',f:'W. J. Bryan at Scopes Trial, 1925 photo by United News Pictures.jpg',c:'William Jennings Bryan at the Scopes Trial in Dayton, Tennessee.'}];
 const w=el('div',{class:'newsreel'},[el('p',{class:'small'},['A silent-era “newsreel” built from archival photographs with captions. (Archival film is not embedded; no rights-cleared clip files were bundled.)'])]);
 const stage=el('div',{class:'nr-stage'});const cap=el('p',{class:'nr-cap'},['']);let i=0,timer=null;
 const show=()=>{const c=clips[i%clips.length];stage.innerHTML='';const im=new Image();im.alt=c.t;im.src=RS.fileUrl(c.f,900);stage.append(im);cap.textContent=c.t+' — '+c.c;i++;if(i===2)RS.markStation('newsreel')};
 const btn=el('button',{class:'btn',onclick:()=>{show()}},['Next reel']);
 w.append(stage,cap,btn);show();RS.overlay('Nickelodeon — Newsreel',w);document.exitPointerLock&&document.exitPointerLock();
 RS.markStation('newsreel');
};
G.credits=function(){
 const w=el('div',{class:'prose'},[el('h3',{},['Credits & behind-the-scenes']),el('p',{},['Created by '+RS.CREATORS.join(', ')+'.']),el('p',{},['The Roaring Society is a browser-based museum game built from a research project on social conflict and civil liberties in 1920s America. All items are labeled replicas. Images come from Wikimedia Commons and the Library of Congress and National Archives collections hosted there; each image credit appears on its Source Card.']),
  el('h4',{},['Full bibliography (MLA)']),G.bibList()]);
 RS.overlay('Curator’s Vault',w);document.exitPointerLock&&document.exitPointerLock();
};
G.makers=function(){RS.award('easter-egg:makers',20,'Found the makers’ signature');RS.overlay('The makers’ signature',el('div',{class:'prose'},[el('p',{},['Tucked behind the Archive Stacks is a small dedication.']),el('h3',{},['Roaring Society']),el('p',{},['Created by '+RS.CREATORS.join(', ')+'.']),el('p',{},['Thank you for exploring our museum.'])]))};
G.bibList=function(){const w=el('div',{});['primary','secondary'].forEach(k=>{w.append(el('h5',{},[k==='primary'?'Primary sources':'Secondary sources']));D.BIB.filter(b=>b.kind===k).forEach(b=>w.append(el('p',{class:'bib',html:b.mla})))});return w};
G.passport=function(){
 const w=el('div',{class:'prose'},[el('h3',{},['Visitor Passport']),el('p',{},['Earn a stamp by completing each gallery’s main quests (hidden passages are optional for the stamp).'])]);
 const row=el('div',{class:'stamps'});[1,2,3,4,5].forEach(g=>row.append(el('div',{class:'stamp'+(S.stamps.includes(g)?' on':''),style:'--acc:'+D.G[g].accent},[el('b',{},['Gallery '+['I','II','III','IV','V'][g-1]]),el('span',{},[S.stamps.includes(g)?'STAMPED':'—'])])));
 w.append(row,el('p',{},['Curator Points: '+S.points+' · Souvenirs: '+((S.rewards||[]).length)]));
 RS.overlay('Museum store & Passport',w);RS.markStation('passport');document.exitPointerLock&&document.exitPointerLock();
};
const STAMPABLE=g=>RS.quests.filter(q=>q.g===g&&!(q.disc.k==='secret'||q.obj.some(o=>o.k==='items'||o.k==='secret')||q.id==='q5-4'||q.id==='q5-3'));
RS.on('quest.complete',id=>{
 const q=RS.quests.find(x=>x.id===id);
 S.rewards=S.rewards||[];
 const m=/Gallery (I|II|III|IV|V) Key/.exec(q.reward);if(m){const n=['I','II','III','IV','V'].indexOf(m[1])+1;if(!S.keys.includes(n)){S.keys.push(n);RS.toast('You earned the Gallery '+m[1]+' Key!','done')}}
 else if(/Research Key/.test(q.reward)){if(!S.keys.includes(6))S.keys.push(6)}
 else if(q.reward!=='Curator Points'&&!/Credits|Certificate/.test(q.reward))S.rewards.push(q.reward);
 for(let g=1;g<=5;g++){if(!S.stamps.includes(g)&&STAMPABLE(g).every(x=>S.quests[x.id]==='complete')){S.stamps.push(g);RS.toast('Passport stamp earned: '+D.G[g].short,'done');RS.sfx('done')}}
 RS.save();RS.checkQuests();
});

/* ---------------- Quest book ---------------- */
let qbTab=1;
G.questBook=function(tab){
 if(tab!==undefined)qbTab=tab;
 const tabs=[[0,'Courtyard & Extras'],[1,'Gallery I'],[2,'Gallery II'],[3,'Gallery III'],[4,'Gallery IV'],[5,'Gallery V'],[6,'Research']];
 const disc=Object.keys(S.quests).length;
 const w=el('div',{class:'qb'});
 w.append(el('p',{class:'qb-count'},['Discovered '+disc+' of '+RS.quests.length+' · Curator Points: '+S.points]));
 const tb=el('div',{class:'qb-tabs',role:'tablist'});tabs.forEach(t=>tb.append(el('button',{role:'tab','aria-selected':t[0]===qbTab,class:'tab'+(t[0]===qbTab?' on':''),onclick:()=>G.questBook(t[0])},[t[1]])));
 tb.append(el('button',{role:'tab',class:'tab'+(qbTab===7?' on':''),onclick:()=>G.questBook(7)},['Synthesis']));
 w.append(el('p',{class:'score-rules'},['Earn 25 points per completed quest, 5 per newly explored area and 25 per hidden room. Each reward is counted once. Pin a quest to see its next destination on your minimap.']),tb);
 const list=el('div',{class:'qb-list'});
 const qs=RS.quests.filter(q=>qbTab===7?q.id==='q0-6':(q.g===qbTab&&q.id!=='q0-6'));
 qs.forEach(q=>{const st=RS.questState(q.id);
  if(st==='undiscovered'){list.append(el('div',{class:'quest undis'},['???']));return}
  const c=el('div',{class:'quest '+st});
  c.append(el('div',{class:'q-title'},[(st==='complete'?'✅ ':'▶ ')+q.title,el('span',{class:'q-type'},[q.type])]));
  q.obj.forEach(o=>{
   const d=RS.objDone(o);const row=el('div',{class:'q-obj'+(d?' ok':'')},[(d?'✓ ':'○ ')+o.l]);
   if(!d&&o.k==='act')row.append(el('button',{class:'btn sm',onclick:()=>{RS.closeOverlay();Sims.activity(o.id,()=>G.questBook())}},['Start activity']));
   row.append(el('div',{class:'quest-location'},[RS.questDirections(q,o)]));c.append(row)});
  c.append(el('div',{class:'q-reward'},['Reward: 25 Curator Points'+(q.reward==='Curator Points'?'':' · '+q.reward)]));
  if(st==='active'){const pb=el('button',{class:'btn sm',onclick:()=>{S.pins=S.pins||[];const i=S.pins.indexOf(q.id);if(i>=0)S.pins.splice(i,1);else{S.pins.push(q.id);if(S.pins.length>3)S.pins.shift()}RS.save();drawTracker();G.questBook()}},[(S.pins||[]).includes(q.id)?'Unpin from HUD':'Pin to HUD']);c.append(pb)}
  else{c.append(el('div',{class:'q-learn'},[el('b',{},['What you learned: ']),q.journal]));
   const links=el('div',{});q.obj.forEach(o=>(o.ids||[]).forEach(id=>{const a=D.byId[id];if(a)links.append(el('button',{class:'link',onclick:()=>{RS.closeOverlay();RS.openArtwork(id)}},[RS.strip(a.title)]))}));c.append(links)}
  list.append(c)});
 w.append(list);
 RS.overlay('Quest Book',w);document.exitPointerLock&&document.exitPointerLock();
};

/* ---------------- Inventory ---------------- */
const CAT={weevil:'Artifacts',ledger:'Documents',ticket:'Souvenirs',timecard:'Documents',directory:'Documents',dossier:'Documents',handbill:'Documents',warrant:'Documents',aclucard:'Souvenirs',scopes:'Documents',trunklabel:'Artifacts',quotacard:'Documents',unioncard:'Souvenirs',leaflet:'Documents',strikeposter:'Documents',manifesto:'Documents',typeblock:'Artifacts',sketch:'Documents',brief:'Documents',plate:'Artifacts',password:'Souvenirs',flask:'Artifacts',payoff:'Documents',label:'Souvenirs',repeal:'Souvenirs',stack1:'Documents',stack2:'Artifacts',stack3:'Souvenirs'};
const IDESC={weevil:'A glass jar holding a boll weevil, the insect that wrecked Southern cotton crops.',ledger:'A page of figures showing a family’s debt to the landlord’s store.',ticket:'A one-way train ticket north.',timecard:'A factory time card listing hours and a weekly wage.',directory:'A page listing Greenwood businesses before 1921.',dossier:'A surveillance file on a suspected radical.',handbill:'A handbill announcing a protest meeting.',warrant:'A blank warrant. Raids often proceeded without one.',aclucard:'An early membership card of the American Civil Liberties Union.',scopes:'A program from the 1925 trial in Dayton, Tennessee.',trunklabel:'A label from an immigrant’s steamer trunk.',quotacard:'A card showing a national quota number.',unioncard:'A union membership card from the early 1920s.',leaflet:'A leaflet from a defense committee.',strikeposter:'A strike poster announcing a walkout.',manifesto:'A replica page of the Left Wing Manifesto, as printed in 1919.',typeblock:'A block of metal type.',sketch:'A sketch of a courtroom scene.',brief:'A legal brief for the Court.',plate:'A printing plate for a newspaper page.',password:'A card with the speakeasy password.',flask:'A replica flask filled with cold tea.',payoff:'A page from a ledger of payoffs.',label:'A bootleg bottle label.',repeal:'A stamp marking the end of Prohibition.',stack1:'A finding aid for archive stacks.',stack2:'A reel of microfilm.',stack3:'A library card.'};
G.inventory=function(){
 const w=el('div',{class:'inv'});
 const tabs=['Artifacts','Documents','Keys','Souvenirs','Collection'];let tab=G._invTab||'Artifacts';
 const body=el('div',{class:'inv-body'});
 const draw=()=>{body.innerHTML='';
  if(tab==='Keys'){const g=el('div',{class:'inv-grid'});[1,2,3,4,5,6].forEach(n=>{const has=S.keys.includes(n);g.append(el('div',{class:'inv-item'+(has?'':' sil')},[el('span',{class:'ico'},[has?'🗝️':'❓']),el('b',{},[has?D.KEYS[n]:'???']),has&&n<=5?el('small',{},['Use at the Curator’s Vault'])  :null].filter(Boolean)))});body.append(g);return}
  const all=Object.keys(D.ITEMS).flatMap(k=>D.ITEMS[k].map(i=>[...i,+k]));
  const g=el('div',{class:'inv-grid'});
  if(tab==='Souvenirs'){(S.rewards||[]).forEach(r=>g.append(el('div',{class:'inv-item'},[el('span',{class:'ico'},['🎟️']),el('b',{},[r]),el('small',{},['Quest reward (replica)'])])))}
  all.forEach(it=>{const has=S.items.includes(it[0]);const cat=CAT[it[0]];
   if(tab==='Collection'||cat===tab){const card=el('div',{class:'inv-item'+(has?'':' sil'),tabindex:0,role:'button',onclick:()=>has&&examine(it)},[el('span',{class:'ico'},[has?(E.ITEM_ICON[it[0]]||'📦'):'❓']),el('b',{},[has?it[1]:'???']),has?el('small',{},['REPLICA · click to examine']):null].filter(Boolean));
    card.addEventListener('keydown',e=>{if(e.key==='Enter')card.click()});g.append(card)}});
  if(!g.children.length)g.append(el('p',{},['Nothing here yet. Find hidden passages in each gallery.']));
  body.append(g)};
 const tb=el('div',{class:'qb-tabs'});tabs.forEach(t=>tb.append(el('button',{class:'tab'+(t===tab?' on':''),onclick:()=>{tab=t;G._invTab=t;tb.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.textContent===t));draw()}},[t])));
 w.append(tb,body);draw();RS.overlay('Inventory',w);document.exitPointerLock&&document.exitPointerLock();
};
function examine(it){
 const w=el('div',{class:'examine'},[el('div',{class:'ex-obj',style:'transform:rotateY(0deg)'},[E.ITEM_ICON[it[0]]||'📦']),el('label',{},['Rotate ',el('input',{type:'range',min:0,max:360,value:0,'aria-label':'Rotate',oninput:e=>{w.firstChild.style.transform='rotateY('+e.target.value+'deg)'}})]),
  el('label',{},['Zoom ',el('input',{type:'range',min:1,max:3,step:.1,value:1,'aria-label':'Zoom',oninput:e=>{w.firstChild.style.fontSize=(80*e.target.value)+'px'}})]),
  el('p',{},[IDESC[it[0]]||'']),el('p',{class:'replica'},['REPLICA — made for this museum.'])]);
 RS.overlay(it[1],w);
}

/* ---------------- Settings / pause ---------------- */
G.settings=function(){
 const s=S.settings;
 const slider=(label,key,min,max,step,fmt)=>{const out=el('output',{},[(fmt?fmt(s[key]):s[key])]);return el('label',{class:'set-row'},[label+' ',el('input',{type:'range',min,max,step,value:s[key],oninput:e=>{s[key]=+e.target.value;out.textContent=fmt?fmt(s[key]):s[key];applySettings();RS.save()}}),out])};
 const check=(label,key)=>el('label',{class:'set-row'},[el('input',{type:'checkbox',checked:s[key]?'checked':false,onchange:e=>{s[key]=e.target.checked;applySettings();RS.save()}}),' '+label]);
 const w=el('div',{class:'settings'},[
  slider('Mouse / turn sensitivity','sens',.3,2.5,.1),slider('Text size','text',.9,1.6,.05,v=>Math.round(v*100)+'%'),slider('Master volume','vol',0,1,.05,v=>Math.round(v*100)+'%'),slider('Music volume','music',0,1,.05,v=>Math.round(v*100)+'%'),
  check('Captions for narration and audio','captions'),check('Reduced motion (no head bob, fades)','reducedMotion'),check('High-contrast interface','contrast'),check('Head bob','bob'),
  el('label',{class:'set-row'},['Render quality ',el('select',{onchange:e=>{s.quality=+e.target.value;E.resize();RS.save()}},[el('option',{value:1,selected:s.quality===1?'selected':false},['Smooth (recommended)']),el('option',{value:0,selected:s.quality===0?'selected':false},['Fast (lower resolution)'])])]),
  el('div',{class:'set-actions'},[el('button',{class:'btn ghost',onclick:()=>{if(confirm('Erase all saved progress?'))RS.reset()}},['Reset progress'])]),
  el('p',{class:'small'},['Colorblind-safe: markers use shape and color. Full keyboard support: Tab through menus, Enter to select, Esc to close.'])]);
 RS.overlay('Settings',w);
};
function applySettings(){const s=S.settings;document.documentElement.style.setProperty('--ui-scale',s.text);document.body.classList.toggle('hc',!!s.contrast);document.body.classList.toggle('rm',!!s.reducedMotion);RS.setAudio()}
G.applySettings=applySettings;
G.pause=function(){
 if(RS.isModal()||G.paused)return;
 const w=el('div',{class:'pause'},[
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.resume()}},['Resume']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.questBook()}},['Quest Book (Q)']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.inventory()}},['Inventory (I)']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.fullMap()}},['Map (M)']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.teleportMenu()}},['Teleport (T)']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.settings()}},['Settings']),
  el('button',{class:'btn',onclick:()=>{RS.closeOverlay();G.help()}},['Controls']),
  el('button',{class:'btn ghost',onclick:()=>{RS.closeOverlay();G.exit()}},['Exit to website'])]);
 RS.overlay('Paused',w,{onClose:()=>{}});
};
G.resume=function(){const cv=E.canvas;try{if(!E.touch)cv.requestPointerLock()}catch(e){}};
G.help=function(){
 const rows=[['W A S D / arrows','Move'],['Mouse','Look around, up and down (click the screen to capture; Esc releases)'],['Space','Jump'],['Shift','Walk faster'],['E or left click','Interact, or sit on a bench or chair (move to stand up)'],['Q','Quest Book'],['I','Inventory'],['M','Full map'],['T','Teleport menu'],['Esc','Pause and settings']];
 const t=el('table',{class:'ctl'});rows.forEach(r=>t.append(el('tr',{},[el('th',{},[r[0]]),el('td',{},[r[1]])])));
 RS.overlay('Controls',el('div',{class:'prose'},[t,el('p',{},['Gold frames are primary sources, silver frames are secondary sources, and green plaques are evidence panels.'])]));
};
G.exit=function(){narratedGallery=null;roomsHeard.clear();cue('farewell');E.paused=true;saveAll();$('#game').hidden=true;document.body.classList.remove('playing');document.exitPointerLock&&document.exitPointerLock();stopMusic();window.scrollTo(0,0)};
function saveAll(){E.savePos();saveFog();RS.save()}

/* ---------------- boot ---------------- */
G.start=function(){
 $('#game').hidden=false;document.body.classList.add('playing');
 if(!G.booted){G.booted=true;E.init($('#view'));applySettings();E.start();drawTracker();setInterval(()=>{if(!E.paused)saveAll()},6000);setInterval(()=>{if(!E.paused)drawMini()},100);}
 E.paused=false;
 $('#start-card').hidden=!!G.seenStart;
 if(!G.seenStart){E.paused=true}
};
G.begin=function(){G.seenStart=true;$('#start-card').hidden=true;E.paused=false;audio();if(AC&&AC.state==='suspended')AC.resume();startMusic();if(!E.touch)G.resume();E.notifyZone(true)};
document.addEventListener('pointerlockchange',()=>{
 if(!G.booted||$('#game').hidden)return;
 if(document.pointerLockElement!==E.canvas&&!E.paused&&!RS.isModal()&&!G.skipPause&&!E.touch)G.pause();
});
document.addEventListener('keydown',e=>{
 if($('#game').hidden||!G.booted||G.seenStart===undefined&&false)return;
 const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
 if(RS.isModal())return; if(E.paused)return;
 const k=e.key.toLowerCase();
 if(k==='e'){E.interact()}
 else if(k==='q'){G.questBook()}else if(k==='i'){G.inventory()}else if(k==='m'){G.fullMap()}else if(k==='t'){G.teleportMenu()}
 else if(k==='escape'){G.pause()}
});
// Closing a dialog leaves the pointer free; clicking the view resumes mouse look.
RS.on('overlay.close',()=>{E.target=null});
RS.on('viewer.close',()=>{E.target=null});
/* per-frame HUD */
(function hudLoop(){updatePrompt();requestAnimationFrame(hudLoop)})();
/* visitor remarks */
setInterval(()=>{if(E.paused||RS.isModal())return;const now=Date.now();if(now-lastBubble<9000)return;
 for(const n of E.npcs){if(n.state!=='look'||!n.remark||!n.visible)continue;const d=Math.hypot(n.x-E.player.x,n.y-E.player.y);if(d<3.2){n.remark=false;const g=n.gal===9?0:n.gal;const lines=D.DIALOGUE.remarks[g]||[];if(lines.length){bubble('Visitor: “'+lines[(Math.random()*lines.length)|0]+'”');lastBubble=now;return}}
  if(d<.9&&Math.random()<.02){bubble('Visitor: “Excuse me.”');lastBubble=now;return}}},700);
/* touch controls */
function setupTouch(){
 E.touch=true;document.body.classList.add('touch');
 const joy=$('#joy'),knob=$('#joyknob'),look=$('#lookzone');let jid=null,lid=null,lx=0;
 joy.addEventListener('touchstart',e=>{const t=e.changedTouches[0];jid=t.identifier;e.preventDefault()},{passive:false});
 joy.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===jid){const r=joy.getBoundingClientRect();let x=(t.clientX-r.left-r.width/2)/(r.width/2),y=(t.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}E.joy={x,y};knob.style.transform=`translate(${x*30}px,${y*30}px)`}e.preventDefault()},{passive:false});
 const end=e=>{for(const t of e.changedTouches)if(t.identifier===jid){jid=null;E.joy=null;knob.style.transform=''}};joy.addEventListener('touchend',end);joy.addEventListener('touchcancel',end);
 let ly=0;look.addEventListener('touchstart',e=>{const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY;e.preventDefault()},{passive:false});
 look.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===lid){E.lookDelta=(t.clientX-lx)*0.006*S.settings.sens;E.lookDeltaY=(t.clientY-ly)*0.006*S.settings.sens;lx=t.clientX;ly=t.clientY}e.preventDefault()},{passive:false});
 look.addEventListener('touchend',()=>{lid=null});
 $('#btn-e').addEventListener('click',()=>E.interact());const bj=$('#btn-j');if(bj)bj.addEventListener('click',()=>{E.player.jumpReq=true});$('#btn-q').addEventListener('click',()=>G.questBook());$('#btn-m').addEventListener('click',()=>G.pause());
}
if(window.matchMedia&&matchMedia('(pointer:coarse)').matches)setupTouch();
window.addEventListener('beforeunload',()=>{if(G.booted)saveAll()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.booted)saveAll()});
RS.on('station',()=>{});
G.INTRO=INTRO;
})();
