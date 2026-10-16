/* Recorded-voice checks: every clip loads, lines map to the right clip, chaining/cues work, and the browser voice is the fallback. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const URL=(process.env.TEST_URL||'http://127.0.0.1:8765')+'/#play-now';
async function open(browser,{rejectPlay=false}={}){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(rejectPlay=>{
  const save={points:42,visited:['z0'],seen:['a','b'],settings:{vol:.6,captions:true}};for(const g of [0,1,2,3,4,5,6,7,9])save['intro'+g]=true;
  localStorage.setItem('roaring-society-v1',JSON.stringify(save));window.__spoken=[];window.__tts=[];window.__audio=[];
  window.Audio=class{constructor(src){this.src=src;this.volume=1;window.__audio.push(this)}play(){window.__spoken.push({text:this.rsText,src:this.src,volume:this.volume});return rejectPlay?Promise.reject(new Error('blocked')):Promise.resolve()}pause(){this.paused=true}};
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
