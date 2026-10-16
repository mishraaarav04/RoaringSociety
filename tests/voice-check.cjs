/* Recorded-voice checks: every clip loads, lines map to the right clip, chaining/cues work, and the browser voice is the fallback. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const URL=(process.env.TEST_URL||'http://127.0.0.1:8765')+'/#play-now';
async function open(browser,{rejectPlay=false}={}){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(rejectPlay=>{
  const save={points:42,visited:['z0'],seen:['a','b'],settings:{vol:.6,captions:true}};for(const g of [0,1,2,3,4,5,6,7,9])save['intro'+g]=true;
  localStorage.setItem('roaring-society-v1',JSON.stringify(save));window.__spoken=[];window.__tts=[];window.__audio=[];
  window.Audio=class{constructor(src){this.src=src;this.volume=1;window.__audio.push(this)}play(){this.paused=false;this.played=(this.played||0)+1;if(this.rsText!==undefined)window.__spoken.push({text:this.rsText,src:this.src,volume:this.volume});return rejectPlay&&this.rsText!==undefined?Promise.reject(new Error('blocked')):Promise.resolve()}pause(){this.paused=true}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},resume(){},speak(u){window.__tts.push(u.text)}}});
 },rejectPlay);
 await page.goto(URL);await page.waitForFunction(()=>window.Game?.booted,null,{timeout:120000});return {page,errors};
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const {page,errors}=await open(browser);
 // 1. All 50 clips exist and are served as audio.
 const base=process.env.TEST_URL||'http://127.0.0.1:8765';const clips=[];
 for(let i=1;i<=50;i++){const r=await fetch(base+'/assets/voice/line-'+String(i).padStart(2,'0')+'.mp3');clips.push([i,r.status,r.headers.get('content-type'),(await r.arrayBuffer()).byteLength])}
 for(const [i,st,ct,len] of clips){assert.equal(st,200,'clip '+i);assert.ok(len>5000,'clip '+i+' size');assert.match(ct||'',/audio|mpeg|octet/)}
 // 1b. Background music: starts with the visit, is quiet, loops through the playlist, follows the Music setting.
 const mus=await page.evaluate(()=>{
  Engine.touch=true;Game.begin();Engine.paused=true;
  const tracks=__audio.filter(a=>/assets\/music\//.test(a.src));const first=tracks[0];
  const out={count:tracks.length,src:first&&first.src,vol:first&&first.volume,played:first&&first.played,paused:first&&first.paused};
  first.onended();const next=__audio.filter(a=>/assets\/music\//.test(a.src)).pop();out.nextSrc=next.src;out.nextPlayed=next.played;
  RS.S.settings.music=1;RS.setAudio();out.maxVol=next.volume;
  RS.S.settings.music=0;RS.setAudio();out.mutedPaused=next.paused;
  RS.S.settings.music=.5;RS.setAudio();out.resumed=next.paused===false;out.vol2=next.volume;
  return out;
 });
 assert.equal(mus.count,1);assert.match(mus.src,/assets\/music\/.+\.mp3$/);assert.ok(mus.played>=1&&mus.paused===false);
 assert.ok(mus.vol>0&&mus.vol<=0.25,'default music volume is quiet: '+mus.vol);assert.ok(mus.maxVol<=0.4+1e-9,'max music volume '+mus.maxVol);
 assert.notEqual(mus.nextSrc,mus.src);assert.ok(mus.nextPlayed>=1);assert.equal(mus.mutedPaused,true);assert.equal(mus.resumed,true);assert.ok(Math.abs(mus.vol2-0.2)<1e-9);
 // Music is never counted as narration.
 assert.equal(await page.evaluate(()=>__spoken.filter(x=>/assets\/music\//.test(x.src)).length),0);
 // 1c. Credits video easter egg: offered after the final quest, pauses the music while it plays, music returns on close.
 const vr=await fetch(base+'/assets/video/credits.mp4');assert.equal(vr.status,200);assert.ok((await vr.arrayBuffer()).byteLength>1000000);
 const cr=await page.evaluate(()=>{
  const gone=()=>!document.querySelector('video.credits-video');const out={noVideoBefore:gone()};
  RS.S.sims.final=true;Sims.finalDone();
  const b=[...document.querySelectorAll('.overlay button')].find(x=>/One more thing/.test(x.textContent));out.found=!!b;b.click();
  const v=document.querySelector('video.credits-video');out.src=v&&v.getAttribute('src');
  const bg=()=>__audio.filter(a=>/assets\/music\//.test(a.src)).pop();
  v.dispatchEvent(new Event('play'));out.pausedDuring=bg().paused;
  RS.closeOverlay();out.back=bg().paused===false;out.gone=gone();RS.S.sims.final=false;return out;
 });
 assert.ok(cr.noVideoBefore&&cr.found);assert.equal(cr.src,'assets/video/credits.mp4');assert.equal(cr.pausedDuring,true);assert.equal(cr.back,true);assert.ok(cr.gone);
 // 1d. Parody films: placed on the upper level of the right room, labelled as parodies, playable, and the music steps aside.
 for(const f of ['nosferatu-parody.mp4','temperance-parody.mp4','nosferatu-poster.jpg','temperance-poster.jpg']){const r=await fetch(base+'/assets/video/'+f);assert.equal(r.status,200,f);assert.ok((await r.arrayBuffer()).byteLength>5000,f)}
 const pf=await page.evaluate(()=>{
  const out={};const bg=()=>__audio.filter(a=>/assets\/music\//.test(a.src)).pop();
  for(const [id,g,room] of [['g3-16',3,0],['g5-14',5,2]]){
   const a=DATA.byId[id],idx=DATA.A.indexOf(a),sp=World.artSpots[idx];
   const o={kind:a.kind,frame:a.frame,placed:!!sp,level:sp&&sp.level,gal:sp&&sp.g,room:sp&&World.roomAt(g,Math.floor(sp.cell[0]),Math.floor(sp.cell[1]))};
   RS.openArtwork(id);const v=document.querySelector('.v-video');o.src=v&&v.getAttribute('src');o.poster=v&&v.getAttribute('poster');
   o.badge=(document.querySelector('.badge.parody')||{}).textContent;o.card=document.querySelector('.source-card').textContent;o.blurb=document.querySelector('.v-blurb').textContent;
   o.mla=document.querySelector('.cite p').textContent;
   v.dispatchEvent(new Event('play'));o.pausedDuring=bg().paused;RS.closeViewer();o.back=bg().paused===false;o.gone=!document.querySelector('.v-video');
   out[id]=o;
  }
  return out;
 });
 const N=pf['g3-16'],T=pf['g5-14'];
 for(const [o,g,room] of [[N,3,0],[T,5,2]]){assert.equal(o.kind,'secondary');assert.equal(o.frame,'silver');assert.ok(o.placed);assert.equal(o.level,1);assert.equal(o.gal,g);assert.equal(o.room,room);assert.match(o.badge,/Parody/);assert.match(o.card,/Secondary/);assert.equal(o.pausedDuring,true);assert.equal(o.back,true);assert.ok(o.gone)}
 assert.equal(N.src,'assets/video/nosferatu-parody.mp4');assert.match(N.blurb,/parody of Nosferatu/);assert.match(N.blurb,/1920s|early 1920s/);assert.match(N.mla,/Nosferatu/);
 assert.equal(T.src,'assets/video/temperance-parody.mp4');assert.match(T.blurb,/parody of speakeasies/);assert.match(T.mla,/Temperance/);
 // 2. Gallery intros use the recorded clips; welcome is clip 1 and gallery 1 is clip 2.
 const r=await page.evaluate(()=>{
  Engine.touch=true;Game.begin();Engine.paused=true;const welcome=__spoken.slice();
  __spoken.length=0;Engine.teleport(15.5,49.5);Engine.advance(.02);const g1=__spoken.slice();
  // 3. Room line chains after the intro finishes.
  __audio[__audio.length-1].onended();const chained=__spoken.slice(1);
  // Radio, quest, secret, farewell cues.
  __spoken.length=0;RS.emit('quest.complete','x');const quest=__spoken.slice();
  __spoken.length=0;RS.emit('secret',1);const secret=__spoken.slice();
  __spoken.length=0;Game.exit();const farewell=__spoken.slice();
  return {welcome,g1,chained,quest,secret,farewell,voice:{rooms:RS.VOICE.rooms,text:RS.VOICE.text}};
 });
 assert.match(r.welcome[0].src,/line-01\.mp3$/);assert.match(r.welcome[0].text,/Welcome to The Roaring Society/);
 assert.match(r.g1[0].src,/line-02\.mp3$/);
 assert.equal(r.chained.length,1);assert.match(r.chained[0].src,/line-(19|20|21|22)\.mp3$/);assert.ok(r.chained[0].text.length>10);
 assert.match(r.quest[0].src,/line-47\.mp3$/);assert.match(r.secret[0].src,/line-48\.mp3$/);assert.match(r.farewell[0].src,/line-50\.mp3$/);
 // Every room clip has caption text and a file number 15-46, with no duplicates.
 const all=Object.values(r.voice.rooms).flat();assert.equal(all.length,32);assert.equal(new Set(all).size,32);for(const c of all)assert.ok(r.voice.text[c],'caption '+c);
 // 4. Radio Room readings map to clips 10-14.
 await page.evaluate(()=>{Sims.radio()});
 const radio=[];for(let i=0;i<5;i++){await page.evaluate(i=>{const d=document.querySelector('.radio input[type=range]');d.value=i;d.dispatchEvent(new Event('input'))},i);await page.evaluate(()=>{__spoken.length=0});await page.locator('.radio button',{hasText:'Listen'}).click();radio.push(await page.evaluate(()=>__spoken[0].src))}
 radio.forEach((s,i)=>assert.match(s,new RegExp('line-'+(10+i)+'\\.mp3$')));
 // 5. First Source Card cue only when exactly one card has been seen.
 await page.evaluate(()=>{RS.S.seen=['only'];__spoken.length=0;RS.emit('artwork.viewed','only')});
 assert.match(await page.evaluate(()=>__spoken[0]?.src||''),/line-49\.mp3$/);
 assert.deepEqual(errors,[]);await page.close();
 // 6. If a clip cannot play, the browser voice reads the same text.
 const fb=await open(browser,{rejectPlay:true});
 const f=await fb.page.evaluate(async()=>{Engine.touch=true;Game.begin();Engine.paused=true;await new Promise(r=>setTimeout(r,50));return {tts:__tts.slice()}});
 assert.equal(f.tts.length,1);assert.match(f.tts[0],/Welcome to The Roaring Society/);assert.deepEqual(fb.errors,[]);await fb.page.close();
 // 7. Volume zero stays silent.
 const q=await open(browser);
 const m=await q.page.evaluate(()=>{Engine.touch=true;Game.begin();Engine.paused=true;__spoken.length=0;RS.S.settings.vol=0;Engine.teleport(15.5,49.5);return {n:__spoken.length,t:__tts.length}});
 assert.equal(m.n,0);assert.equal(m.t,0);
 console.log('Recorded-voice checks passed.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
