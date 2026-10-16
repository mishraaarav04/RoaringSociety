/* Run against a local HTTP server. Requires Playwright and Chromium or Edge. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1019,height:759}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.TEST_URL||'http://127.0.0.1:8765';const out=process.env.TEST_OUTPUT||'work/verification';fs.mkdirSync(out,{recursive:true});
 await page.goto(base+'/#play-now');await page.waitForFunction(()=>window.Game?.booted&&Atlas.photographic);
 await page.screenshot({path:path.join(out,'welcome.png')});
 assert.match(await page.locator('#start-card').innerText(),/Visitor Directory/);
 assert.match(await page.locator('#start-card').innerText(),/five gallery stamps/);
 assert.ok(await page.getByRole('button',{name:'Begin my visit'}).evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));
 const fonts=await page.evaluate(()=>['#start-card p','#start-card .btn','#start-card li','#score'].map(s=>{const c=getComputedStyle(document.querySelector(s));return {family:c.fontFamily,size:c.fontSize}}));
 assert.equal(new Set(fonts.map(x=>x.family)).size,1);assert.equal(new Set(fonts.map(x=>x.size)).size,1);
 await page.getByRole('button',{name:'Begin my visit'}).click();await page.waitForTimeout(250);
 // Real pointer lock must release for both kinds of text dialog.
 await page.locator('#view').click({position:{x:510,y:500},force:true});
 await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.evaluate(()=>{Engine.keys.w=true;Engine.player.vxs=3;Game.questBook(0)});
 await page.waitForFunction(()=>!document.pointerLockElement);
 assert.equal(await page.evaluate(()=>Engine.keys.w),false);assert.equal(await page.evaluate(()=>Engine.player.vxs),0);
 assert.match(await page.locator('.quest-location').first().innerText(),/Visitor Directory/);
 await page.screenshot({path:path.join(out,'quests.png')});
 await page.evaluate(()=>RS.closeOverlay());await page.locator('#view').click({position:{x:510,y:500},force:true});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.evaluate(()=>RS.openArtwork('g1-01'));await page.waitForFunction(()=>!document.pointerLockElement);
 await page.evaluate(()=>{RS.closeViewer();Engine.touch=true;Engine.paused=true});
 const result=await page.evaluate(()=>{
  const landings=[[28.5,54.5],[29.5,35.2],[15.5,49.5],[9.5,35.5],[7.5,14.5],[24.5,9.5],[44.5,9.5],[49.5,24.5],[49.5,44.5]];
  const teleports=landings.map(([x,y])=>{const expected=World.blockAt(x,y),success=Engine.teleport(x,y);const p=Engine.player;const exits=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>Phys.clearSegment(p.x,p.y,p.x+dx*.85,p.y+dy*.85,Phys.R)).length;return {expected,actual:World.blockAt(p.x,p.y),success,clear:Phys.probe(p.x,p.y,0).ok,exits}});
  // Run thirty simulated seconds, checking every complete visitor step.
  const starts=Engine.npcs.map(n=>[n.x,n.y]);let collisions=0;let firstCollision=null;
  for(let frame=0;frame<600;frame++){Engine.updateVisitors(.05);for(const n of Engine.npcs)if(!Phys.walkable(n.x,n.y,.38)){collisions++;firstCollision=firstCollision||{id:n.id,x:n.x,y:n.y}}}
  const moved=Engine.npcs.filter((n,i)=>Math.hypot(n.x-starts[i][0],n.y-starts[i][1])>.5).length;
  const panel=World.secretDoor[1];const aimPanel=distance=>{Object.assign(Engine.player,{x:panel.x+1+distance,y:panel.y+.5,z:0,a:Math.PI,pitch:Math.atan2(1.1-Phys.EYE,distance)});return Engine.pick()?.cell===90};const panelNear=aimPanel(.8),panelFar=aimPanel(2);
  const incomplete=RS.quests.flatMap(q=>q.obj.filter(o=>!RS.questDirections(q,o).trim()).map(o=>q.id+':'+o.k));
  const before=RS.S.points;RS.markStation('directory');const questPoints=RS.S.points-before;RS.markStation('directory');RS.checkQuests();const duplicateQuest=RS.S.points-before-questPoints;
  const secretBefore=RS.S.points;Engine.openSecret(6);const secretPoints=RS.S.points-secretBefore;Engine.openSecret(6);const duplicateSecret=RS.S.points-secretBefore-secretPoints;
  const makersVisible=Engine.stationSprites.makers.visible;const makersBefore=RS.S.points;Engine.onInteract({type:'sprite',s:Engine.stationSprites.makers});const makersPoints=RS.S.points-makersBefore;RS.closeOverlay();Game.makers();RS.closeOverlay();const duplicateMakers=RS.S.points-makersBefore-makersPoints;
  const areaBefore=RS.S.points;RS.emit('zone',{g:3,room:2,level:1});const areaPoints=RS.S.points-areaBefore;RS.emit('zone',{g:3,room:2,level:1});const duplicateArea=RS.S.points-areaBefore-areaPoints;
  return {panelNear,panelFar,teleports,collisions,firstCollision,moved,incomplete,questPoints,duplicateQuest,secretPoints,duplicateSecret,makersVisible,makersPoints,duplicateMakers,areaPoints,duplicateArea,points:RS.S.points,atlas:Atlas.canvas.width,photo:Atlas.photographic};
 });
 console.log(JSON.stringify(result,null,2));
 for(const t of result.teleports){assert.ok(t.success&&t.clear&&t.expected===t.actual&&t.exits>=2,JSON.stringify(t))}
 assert.ok(result.panelNear);assert.equal(result.panelFar,false);assert.equal(result.collisions,0);assert.ok(result.moved>=10,'Visitors must move as well as avoid obstacles');assert.deepEqual(result.incomplete,[]);
 assert.equal(result.questPoints,25);assert.equal(result.duplicateQuest,0);assert.equal(result.secretPoints,25);assert.equal(result.duplicateSecret,0);assert.equal(result.areaPoints,5);assert.equal(result.duplicateArea,0);assert.equal(result.makersPoints,20);assert.equal(result.duplicateMakers,0);assert.ok(result.makersVisible);
 await page.waitForTimeout(250);await page.reload();await page.waitForFunction(()=>window.Game?.booted);assert.equal(await page.evaluate(()=>RS.S.points),result.points);
 await page.evaluate(()=>{Engine.touch=true;Game.begin();RS.closeOverlay();Engine.teleport(28.5,50,-Math.PI/2);Engine.player.pitch=.18});await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'museum.png')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{Game.seenStart=false;Game.start()});await page.screenshot({path:path.join(out,'welcome-mobile.png')});
 assert.equal(await page.evaluate(()=>document.querySelector('#start-card .ov-card').scrollWidth>document.querySelector('#start-card .ov-card').clientWidth),false);
 const legacy=await browser.newPage();await legacy.addInitScript(()=>localStorage.setItem('roaring-society-v1',JSON.stringify({points:77,quests:{'q0-1':'complete'},visited:['z0'],secretOpen:{6:true},secret:{6:true}})));
 await legacy.goto(base+'/#play-now');await legacy.waitForFunction(()=>window.Game?.booted);const legacyScore=await legacy.evaluate(()=>{RS.markStation('directory');RS.emit('secret',6);RS.emit('zone',{g:0,room:0,level:0});return RS.S.points});assert.equal(legacyScore,77);await legacy.close();
 assert.deepEqual(errors,[]);console.log('All browser checks passed, including existing-save migration.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
