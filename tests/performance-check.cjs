/* Verify frame-rate-independent walking and avoid recurring GPU texture uploads. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1019,height:759},deviceScaleFactor:2});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('THREE.WebGLProgram'))errors.push(m.text())});
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:8765')+'/#play-now');await page.waitForFunction(()=>window.Game?.booted&&Atlas.photographic);
 await page.evaluate(()=>{Engine.touch=true;Game.begin();Engine.paused=true});
 const movement=await page.evaluate(()=>{
  function walk(times){Engine.teleport(30,34.5,Math.PI/2);Engine.keys.w=true;const start=Engine.player.y;for(const dt of times)Engine.advance(dt);Engine.keys.w=false;return Engine.player.y-start}
  const rates=[30,60,144].map(hz=>({hz,distance:walk(Array(hz).fill(1/hz))}));
  const jitter=[];let elapsed=0;while(elapsed<1-1e-9){const dt=Math.min([.1,1/144,.025][jitter.length%3],1-elapsed);jitter.push(dt);elapsed+=dt}
  const jitterDistance=walk(jitter);
  let meshCount=0;Engine.sprites.find(s=>s.model).model.traverse(o=>{if(o.isMesh)meshCount++});
  const triangles=Engine._.scene.children.filter(m=>m.isMesh&&m.material===Engine._.waterMat).length;
  Engine.teleport(28.5,54.5,-Math.PI/2);Engine.resetMotion();return {rates,jitterDistance,meshCount,waterMeshes:triangles};
 });
 for(const r of movement.rates){assert.ok(r.distance>2.7&&r.distance<3.1);assert.ok(Math.abs(r.distance-movement.rates[0].distance)<1e-6)}
 assert.ok(Math.abs(movement.jitterDistance-movement.rates[0].distance)<1e-6);assert.ok(movement.meshCount<=6);assert.equal(movement.waterMeshes,1);
 const versions=await page.evaluate(()=>({atlas:Atlas.texture.version,water:Atlas.waterTexture.version,time:Atlas.waterTime.value}));
 await page.waitForTimeout(1200);
 const rendering=await page.evaluate(()=>({atlas:Atlas.texture.version,water:Atlas.waterTexture.version,time:Atlas.waterTime.value,calls:Engine.renderer().info.render.calls,dpr:Engine.renderer().getPixelRatio(),activeLights:Engine._.galleryLights.filter(l=>l.visible).length}));
 assert.equal(rendering.atlas,versions.atlas);assert.equal(rendering.water,versions.water);assert.ok(rendering.time>versions.time);assert.ok(rendering.calls<250);assert.equal(rendering.activeLights,2);assert.ok(rendering.dpr<=1.5);
 await page.evaluate(()=>{Engine.teleport(30,34.5,-Math.PI/2);Engine.player.pitch=-.2});await page.waitForTimeout(150);await page.screenshot({path:'work/water-performance.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({movement,rendering},null,2));console.log('Movement and rendering checks passed.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
