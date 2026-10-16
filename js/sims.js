/* Interactive exhibits and simulations */
(function(){
'use strict';
const RS=window.RS,D=RS.D,S=RS.S,el=RS.el;
const Sims=window.Sims={};
const unlock=()=>{document.exitPointerLock&&document.exitPointerLock()};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const btn=(t,f,c)=>el('button',{class:'btn '+(c||''),onclick:f},[t]);
const art=id=>D.byId[id];
const thumb=(id,w)=>{const a=art(id);if(!a||!a.f||!a.f[0])return null;const i=new Image();i.alt=RS.strip(a.title);i.loading='lazy';i.src=RS.fileUrl(a.f[0],w||300);i.className='thumb';return i};
const linkArt=(id,label)=>el('button',{class:'link',onclick:()=>{RS.openArtwork(id)}},[label||RS.strip(art(id).title)]);

Sims.open=function(id){
 const m={migration:Sims.migration,hearing:Sims.hearing,source3:Sims.sources,quota:Sims.quota,board:Sims.board,courtroom:Sims.courtroom,policy:Sims.policy,raid:Sims.raid,bib:Sims.bib,radio:Sims.radio,terminal:Sims.terminal,microfilm:Sims.microfilm,eval:Sims.evaluation,pedestals:Sims.pedestals,atrium:Sims.atrium,curator:Sims.curator};
 if(m[id]){unlock();m[id]();return true}return false;
};

/* ================= Activity runner ================= */
Sims.activity=function(id,done){
 const a=D.ACT[id];if(!a)return;unlock();
 const w=el('div',{class:'act'});const finish=()=>{RS.markAct(id);w.innerHTML='';w.append(el('p',{class:'ok-big'},['✅ Complete! Your Quest Book has been updated.']),btn('Continue',()=>{RS.closeOverlay();done&&done()}))};
 const msg=el('p',{class:'act-msg','aria-live':'polite'},['']);
 if(a.note)w.append(el('p',{class:'small'},[a.note]));
 if(a.type==='sort'){
  const items=shuffle(a.items);let i=0,ok=0;
  const card=el('div',{class:'sort-card'});const prog=el('p',{class:'small'},['']);
  const show=()=>{if(i>=items.length)return finish();card.textContent=items[i][0];prog.textContent='Card '+(i+1)+' of '+items.length};
  const row=el('div',{class:'sort-btns'});a.buckets.forEach((b,bi)=>row.append(btn(b,()=>{if(items[i][1]===bi){ok++;msg.textContent='Correct.';i++;show()}else{msg.textContent='Not quite — try the other pile.'}})));
  w.append(prog,card,row,msg);show();
 }else if(a.type==='order'){
  let list=shuffle(a.items);const ul=el('ol',{class:'order'});
  const draw=()=>{ul.innerHTML='';list.forEach((t,i)=>ul.append(el('li',{},[el('span',{},[t]),el('button',{'aria-label':'Move up',class:'btn sm',onclick:()=>{if(i>0){[list[i-1],list[i]]=[list[i],list[i-1]];draw()}}},['▲']),el('button',{'aria-label':'Move down',class:'btn sm',onclick:()=>{if(i<list.length-1){[list[i+1],list[i]]=[list[i],list[i+1]];draw()}}},['▼'])])))};
  draw();w.append(el('p',{},['Put the events in order, earliest first.']),ul,btn('Check order',()=>{if(list.every((t,i)=>t===a.items[i]))finish();else msg.textContent='Not yet. Check the dates and try again.'}),msg);
 }else if(a.type==='match'){
  const rights=shuffle(a.pairs.map(p=>p[1]));const sels=[];
  a.pairs.forEach(p=>{const s=el('select',{'aria-label':p[0]},[el('option',{value:''},['— choose —'])].concat(rights.map(r=>el('option',{value:r},[r]))));sels.push(s);w.append(el('div',{class:'match-row'},[el('b',{},[p[0]]),s]))});
  w.append(btn('Check matches',()=>{if(a.pairs.every((p,i)=>sels[i].value===p[1]))finish();else{sels.forEach((s,i)=>s.classList.toggle('bad',s.value!==a.pairs[i][1]));msg.textContent='Some matches are off. Fix the highlighted ones.'}}),msg);
 }else if(a.type==='quiz'){
  let qi=0;const box=el('div');
  const show=()=>{if(qi>=a.qs.length)return finish();const q=a.qs[qi];box.innerHTML='';box.append(el('p',{class:'q'},[q[0]]));q[1].forEach((o,oi)=>box.append(btn(o,()=>{if(oi===q[2]){qi++;msg.textContent='Correct.';show()}else msg.textContent='Not quite. Try again.'}))) };
  w.append(box,msg);show();
 }else if(a.type==='pick'){
  const cbs=a.items.map(it=>el('input',{type:'checkbox'}));
  a.items.forEach((it,i)=>w.append(el('label',{class:'pick'},[cbs[i],' '+it[0]])));
  w.append(btn('Check',()=>{if(a.items.every((it,i)=>!!it[1]===cbs[i].checked))finish();else msg.textContent='Select exactly the '+a.need+' aims supporters actually had.'}),msg);
 }
 RS.overlay(a.title,w);
};

/* ================= Gallery I: Migration Map ================= */
Sims.migration=function(){
 const ORI={'Mississippi Delta':[290,265],'Alabama':[355,265],'Georgia':[405,255],'Carolinas / Virginia':[470,215],'Texas / Louisiana':[230,262]};
 const CIT={Chicago:[330,95],Detroit:[385,92],'New York':[505,105],Philadelphia:[485,130],Cleveland:[415,105],Pittsburgh:[440,118]};
 const JOBS={Chicago:'Meatpacking in the stockyards, steel mills, and railroads were major employers. Many Black workers also found jobs as Pullman porters.',Detroit:'Auto plants hired growing numbers of Black workers during and after the war, and Ford’s high wages drew migrants. Hiring was uneven and often limited to the roughest jobs.',
 'New York':'Opportunities were in service work, longshore labor, small business, and the entertainment world of Harlem. Factory work was scarcer than in the Midwest.',Philadelphia:'Shipyards, railroads, steel, and manufacturing hired migrants, and Black churches and newspapers helped newcomers settle.',Cleveland:'Steel, foundries, and auto-parts factories offered jobs, and the city’s Black population grew quickly.',Pittsburgh:'Steel mills and coal and railroad work drew many migrants, often to dangerous, hot jobs.'};
 const PP={Chicago:['Push: Mississippi cotton debts, Jim Crow courts.','Pull: stockyard wages, the Chicago Defender, relatives already there.'],Detroit:['Push: boll weevil and low cotton prices.','Pull: auto-factory wages and the chance to buy a home.'],'New York':['Push: segregation and violence in the Carolinas and Georgia.','Pull: Harlem’s community, churches, voting rights.'],Philadelphia:['Push: tenant-farm debt in Georgia and Virginia.','Pull: shipyard and railroad jobs, an established Black community.'],Cleveland:['Push: crop failures and discrimination.','Pull: steel jobs and better schools.'],Pittsburgh:['Push: low pay and political exclusion.','Pull: steel mill wages, though dangerous.']};
 const VOICES=[['Composite voice (paraphrase, not a verbatim quote)','Letters to Northern newspapers and employers often asked about jobs, schools, and whether a family could vote and live without fear.'],['Composite voice (paraphrase)','Many migrants wrote that they wanted wages high enough to pay off debts and educate their children.'],['Composite voice (paraphrase)','Some wrote that they feared telling their landlords they planned to leave.']];
 const st=S.stats=S.stats||{};
 const w=el('div',{class:'mig'});
 const sel1=el('select',{'aria-label':'Origin'},Object.keys(ORI).map(o=>el('option',{},[o])));
 const sel2=el('select',{'aria-label':'Destination'},Object.keys(CIT).map(o=>el('option',{},[o])));
 const sel3=el('select',{'aria-label':'Compare with'},[el('option',{value:''},['(none)'])].concat(Object.keys(CIT).map(o=>el('option',{},[o]))));
 const svgHost=el('div',{class:'mig-map'});const panel=el('div',{class:'mig-panel'});
 let tab='Movement';
 const drawMap=()=>{const o=ORI[sel1.value],c=CIT[sel2.value],c2=sel3.value?CIT[sel3.value]:null;
  svgHost.innerHTML=`<svg viewBox="0 0 560 300" role="img" aria-label="Map showing route from ${sel1.value} to ${sel2.value}" font-family="system-ui" font-size="11"><rect width="560" height="300" fill="#efe3c6"/><path d="M200 60 L520 70 L545 140 L500 210 L440 290 L220 290 L200 200 Z" fill="#e4d3a8" stroke="#a89060" stroke-width="2"/><line x1="200" y1="170" x2="545" y2="170" stroke="#a33" stroke-dasharray="5 4"/><text x="210" y="162" fill="#a33">Ohio River / Mason–Dixon (approx.)</text>`+
  Object.entries(CIT).map(([n,p])=>`<rect x="${p[0]-5}" y="${p[1]-5}" width="10" height="10" fill="${n===sel2.value?'#1f8a8a':n===sel3.value?'#c8902a':'#555'}"/><text x="${p[0]-20}" y="${p[1]-10}">${n}</text>`).join('')+
  Object.entries(ORI).map(([n,p])=>`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${n===sel1.value?'#9b2335':'#999'}"/><text x="${p[0]-26}" y="${p[1]+17}">${n}</text>`).join('')+
  `<path id="route" d="M${o[0]} ${o[1]} Q ${(o[0]+c[0])/2-30} ${(o[1]+c[1])/2} ${c[0]} ${c[1]}" fill="none" stroke="#1f8a8a" stroke-width="4" stroke-linecap="round" ${S.settings.reducedMotion?'':'stroke-dasharray="400" stroke-dashoffset="400"'}>${S.settings.reducedMotion?'':'<animate attributeName="stroke-dashoffset" from="400" to="0" dur="1.4s" fill="freeze"/>'}</path>`+
  (c2?`<path d="M${o[0]} ${o[1]} Q ${(o[0]+c2[0])/2-30} ${(o[1]+c2[1])/2} ${c2[0]} ${c2[1]}" fill="none" stroke="#c8902a" stroke-width="3" stroke-dasharray="6 4"/>`:'')+`</svg>`};
 const info=city=>{
  if(tab==='Movement'){const d=D.STATS.migration[city];const max=Math.max(...Object.values(D.STATS.migration).map(v=>v[1]));return el('div',{},[el('b',{},[city+': Black population, 1910 → 1920 (U.S. Census, rounded)']),
    el('div',{class:'barrow'},[el('span',{},['1910']),el('i',{style:`width:${d[0]/max*100}%`}),el('em',{},[d[0].toLocaleString()])]),el('div',{class:'barrow'},[el('span',{},['1920']),el('i',{class:'b2',style:`width:${d[1]/max*100}%`}),el('em',{},[d[1].toLocaleString()])]),el('small',{},['Growth: about '+Math.round((d[1]/d[0]-1)*100)+'%. Verify against census tables before quoting.'])])}
  if(tab==='Jobs')return el('p',{},[JOBS[city]]);
  if(tab==='Push and Pull')return el('ul',{},PP[city].map(x=>el('li',{},[x])));
  if(tab==='Photos and Documents')return el('div',{},[linkArt('g1-01'),linkArt('g1-07'),linkArt('g1-08'),linkArt('g1-10')]);
  return el('div',{},VOICES.map(v=>el('blockquote',{},[v[1],el('footer',{},[v[0]])])));
 };
 const drawPanel=()=>{panel.innerHTML='';const tb=el('div',{class:'qb-tabs'});['Movement','Jobs','Push and Pull','Photos and Documents','Voices'].forEach(t=>tb.append(el('button',{class:'tab'+(t===tab?' on':''),onclick:()=>{tab=t;drawPanel()}},[t])));panel.append(tb);
  const cols=el('div',{class:'cmp'+(sel3.value?' two':'')});cols.append(el('div',{},[el('h4',{},[sel2.value]),info(sel2.value)]));if(sel3.value){cols.append(el('div',{},[el('h4',{},[sel3.value+' (compare)']),info(sel3.value)]));st.cmp=true}panel.append(cols);
  panel.append(finish())};
 const reasons=['Jobs','Wages','Schools','Voting rights','Family nearby','Safety'];
 const finishBox=el('div',{class:'mig-finish'});
 function finish(){finishBox.innerHTML='';finishBox.append(el('h4',{},['Challenge: where would you go and why?']));
  const cbs=reasons.map(r=>el('label',{class:'pick'},[el('input',{type:'checkbox'}),' '+r]));cbs.forEach(c=>finishBox.append(c));
  const out=el('p',{class:'act-msg'},['']);finishBox.append(btn('Choose '+sel2.value,()=>{const picked=cbs.filter(c=>c.firstChild.checked).length;if(!st.cmp){out.textContent='First compare two cities using the Compare menu.';return}if(!picked){out.textContent='Pick at least one reason.';return}
   out.textContent='Real migrants weighed the same factors: wages, safety, schools, the right to vote, and relatives already settled. Cities also differed: some offered factory jobs, some more community, and all brought new tensions over housing and work.';RS.markSim('migration');RS.toast('Migration Map complete','done')}),out);return finishBox}
 [sel1,sel2,sel3].forEach(s=>s.addEventListener('change',()=>{drawMap();drawPanel()}));
 w.append(el('div',{class:'mig-ctl'},[el('label',{},['From ',sel1]),el('label',{},['To ',sel2]),el('label',{},['Compare mode: ',sel3])]),svgHost,panel);
 drawMap();drawPanel();RS.overlay('Migration Map',w);
};

/* ================= Gallery II: Civil-Liberties Hearing ================= */
Sims.hearing=function(){
 const cases=[
  {t:'Case 1: The union hall meeting',s:'Thirty men are arrested at a meeting of a foreign-language workers’ group. (Fictional composite.)',g:'Group literature praises revolution, and several members are not citizens.',d:'Nobody is charged with an act. Meeting peacefully is lawful, and membership is not a crime.'},
  {t:'Case 2: The newspaper editor',s:'The editor of an immigrant weekly is held for articles opposing the war and the government. (Fictional composite.)',g:'The articles are “dangerous” and may inspire violence.',d:'Opinions are protected speech. No call to a specific act is shown.'},
  {t:'Case 3: The long-time resident',s:'A non-citizen who has lived in the U.S. for twelve years is held for deportation based on an old membership card. (Fictional composite.)',g:'Membership in a radical party is enough reason to remove a non-citizen.',d:'He has had no hearing and no lawyer, and the card was handed out at a lecture.'},
  {t:'Case 4: The bookstore search',s:'Agents search a bookstore without a warrant and seize pamphlets. (Fictional composite.)',g:'Speed matters: waiting for a warrant lets suspects destroy evidence.',d:'The Fourth Amendment requires a warrant based on probable cause.'},
  {t:'Case 5: The suspected plotter',s:'A man was seen buying chemicals and writing threats against officials. (Fictional composite.)',g:'The evidence points to a violent plot, and arrest should be immediate.',d:'Even strong evidence should go before a judge for a warrant, and he must receive a fair trial.'}];
 let i=0,meter=0,answers=[];const w=el('div',{class:'hear'});
 const meterEl=el('div',{class:'meter'},[el('span',{},['Individual Rights']),el('div',{class:'mbar'},[el('i',{id:'mfill'})]),el('span',{},['National Security'])]);
 const body=el('div');
 const setMeter=()=>{meterEl.querySelector('i').style.left=(50+meter*8)+'%'};
 const step=()=>{
  body.innerHTML='';
  if(i===0&&!w._brief){w._brief=1;body.append(el('h3',{},['Briefing: early 1920']),el('p',{},['The country has seen strikes, bombings, and fear of revolution. The Attorney General says radicals are plotting to overthrow the government. You are a reviewer deciding how to treat five suspects. The case files are fictional composites based on documented patterns of the raids.']),linkArt('g2-10','Read both sides (artwork)'),btn('Start',()=>step()));return}
  if(i>=cases.length)return reveal();
  const c=cases[i];body.append(el('h3',{},[c.t]),el('p',{},[c.s]),el('div',{class:'two'},[el('div',{class:'gov'},[el('b',{},['Government: ']),c.g]),el('div',{class:'def'},[el('b',{},['Defense: ']),c.d])]),
   el('div',{class:'sort-btns'},[['Detain',2],['Release',-2],['Require a warrant',-1]].map(o=>btn(o[0],()=>{meter+=o[1];answers.push(o[0]);i++;setMeter();step()}))));
 };
 const reveal=()=>{
  body.innerHTML='';body.append(el('h3',{},['What really happened']),el('p',{},['In 1919 and 1920, agents of the Justice Department carried out mass raids, arresting thousands of suspected radicals, often without warrants and without access to lawyers. Hundreds were deported. Many of those arrested were released, and the Labor Department’s Louis F. Post cancelled many deportation orders. Critics argued that the raids violated the Fourth, Fifth, and Sixth Amendments. Your balance: '+(meter>2?'leaning toward security.':meter<-2?'leaning toward individual rights.':'balanced between the two.')]),
   btn('Draft the ACLU mission',()=>found()));
 };
 const found=()=>{
  body.innerHTML='';const opts=[['Defend free speech, assembly, and press',1],['Defend due process of law',1],['Defend everyone regardless of their beliefs',1],['Defend only citizens with popular opinions',0],['Put national security above all else',0],['Defend only the groups we agree with',0]];
  const cbs=opts.map(o=>el('label',{class:'pick'},[el('input',{type:'checkbox'}),' '+o[0]]));
  body.append(el('h3',{},['Draft the ACLU’s mission']),el('p',{},['Pick the principles you would include.']),...cbs);
  const out=el('p',{class:'act-msg'},['']);
  body.append(btn('Compare with the real mission',()=>{const ok=opts.every((o,k)=>!!o[1]===cbs[k].firstChild.checked);out.innerHTML=(ok?'<b>Your draft matches.</b> ':'<b>Close.</b> ')+'The ACLU’s 1920 purpose was to defend First Amendment freedoms of speech, assembly, and press and the right to due process, regardless of the political beliefs of the accused.';RS.markSim('hearing');RS.toast('Hearing complete','done')}),out);
 };
 w.append(meterEl,body);setMeter();step();RS.overlay('Civil-Liberties Hearing Room',w);
};

/* ================= Gallery III: Source stations ================= */
Sims.sources=function(){
 const src=[
  {a:'g3-04',type:'Newspaper',ans:'Fear of radicals',why:'A front page about raids on radical groups after the Bolshevik Revolution anniversary shows fear of political radicals.'},
  {a:'g3-03',type:'Cartoon',ans:'Nativism',why:'The funnel and “anti-dumping” title portray immigrants as a flood to be stopped.'},
  {a:'g3-06',type:'Government document',ans:'Nativism',why:'Quotas by nationality limited immigration from particular groups.'},
  {a:'g3-07',type:'Legislation',ans:'Nativism',why:'The 1924 act favored Northern and Western Europeans and barred Asian immigration.'},
  {a:'g3-05',type:'Speech',ans:'Nativism',why:'“America must be kept American” expresses a vision of who counts as American.'},
  {a:'g3-13',type:'Photograph',ans:'Mixed',why:'Labor unrest was presented as a communist plot, mixing anti-labor and fear-of-radical attitudes.'}];
 let i=0,score=0;const w=el('div',{class:'srcs'});const body=el('div');
 const rank=()=>score===6?'Curator':score>=4?'Archivist':'Apprentice';
 const show=()=>{body.innerHTML='';if(i>=src.length){S.rank=rank();RS.save();RS.markSim('source3',{score});body.append(el('h3',{},['Historian rank: '+rank()]),el('p',{},['You identified '+score+' of 6 attitudes. Rank saved to your passport.']),btn('Done',()=>RS.closeOverlay()));return}
  const s=src[i],a=art(s.a);const th=thumb(s.a,500);
  body.append(el('p',{class:'small'},['Station '+(i+1)+' of 6 · '+s.type]),el('h3',{},[RS.strip(a.title)]),th||el('div',{}),
   el('dl',{class:'source-card'},[el('dt',{},['Date']),el('dd',{},[a.date]),el('dt',{},['Origin']),el('dd',{},[a.origin]),el('dt',{},['Creator']),el('dd',{html:a.creator}),el('dt',{},['Context']),el('dd',{html:a.context})]),
   el('p',{},['What attitude does this source reflect?']));
  const out=el('p',{class:'act-msg'},['']);
  const row=el('div',{class:'sort-btns'});['Nativism','Fear of radicals','Anti-labor','Mixed'].forEach(o=>row.append(btn(o,()=>{const ok=o===s.ans;if(ok)score++;out.innerHTML=(ok?'<b>Correct.</b> ':'<b>Not quite — answer: '+s.ans+'.</b> ')+s.why;row.remove();body.append(btn(i<5?'Next source':'See my rank',()=>{i++;show()}))})));
  body.append(row,out,linkArt(s.a,'Open the full artwork'))};
 w.append(body);show();RS.overlay('Source Analysis Hall',w);
};

/* ================= Quota Calculator ================= */
Sims.quota=function(){
 const G=[['Germany',2785,2311,'old'],['Ireland',1872,1352,'old'],['Great Britain',1251,1220,'old'],['Scandinavia',933,1214,'old'],['Italy',183,1343,'new'],['Russia & Poland',330,1732,'new'],['Austria-Hungary',304,1670,'new']];
 const w=el('div',{class:'quota'});let yr=1910,rate=3;const seen=new Set([1910]);
 const out=el('div');const info=el('p',{class:'act-msg'},['']);
 const slider=el('input',{type:'range',min:1890,max:1910,step:1,value:1910,'aria-label':'Census baseline year',oninput:e=>{yr=+e.target.value;seen.add(yr<=1891?1890:yr>=1909?1910:0);rate=yr<=1900?2:3;draw()}});
 const draw=()=>{const t=(yr-1890)/20;const rows=G.map(g=>[g[0],g[1]+(g[2]-g[1])*t,g[3]]);const quotas=rows.map(r=>[r[0],Math.round(r[1]*rate*10),r[2]]); // thousand * rate% -> people (x1000*rate/100 = *10*rate)
  const tot=quotas.reduce((a,b)=>a+b[1],0),newT=quotas.filter(q=>q[2]==='new').reduce((a,b)=>a+b[1],0);const max=Math.max(...quotas.map(q=>q[1]));
  out.innerHTML='';out.append(el('p',{},[el('b',{},['Baseline: '+yr+' Census · Rate: '+rate+'%']),' (the 1921 law used 1910 and 3%; the 1924 law used 1890 and 2%)']));
  quotas.forEach(q=>out.append(el('div',{class:'barrow'},[el('span',{},[q[0]]),el('i',{class:q[2]==='new'?'b2':'',style:`width:${q[1]/max*100}%`}),el('em',{},[q[1].toLocaleString()])])));
  out.append(el('p',{},['Share going to “New” immigrant groups (Italy, Russia/Poland, Austria-Hungary): ',el('b',{},[Math.round(newT/tot*100)+'%'])]),el('small',{},['Illustrative: approximate foreign-born counts (in thousands) from the 1890 and 1910 Censuses, interpolated between years. Verify before quoting.']));
  if(seen.has(1890)&&seen.has(1910)){info.textContent='Moving the baseline from 1910 to 1890 sharply shrank the share for Southern and Eastern Europeans. The baseline was a policy choice that favored some groups.';RS.markSim('quota')}};
 w.append(el('p',{},['Drag the slider from the 1910 baseline to the 1890 baseline and watch who gains and loses quota space.']),el('label',{class:'set-row'},['1890 ',slider,' 1910']),out,info,linkArt('g3-08','See the quota comparison chart'));
 draw();RS.overlay('Quota Calculator',w);
};

/* ================= Attitudes & Policy Board ================= */
Sims.board=function(){
 const laws=[['A','Emergency Quota Act (1921)'],['B','National Origins Act (1924)'],['C','Palmer Raids & deportations'],['D','The American Plan (open shop)']];
 const srcs=[['g3-01','A','War propaganda fed suspicion of foreigners that carried into postwar restriction.'],['g3-03','A','The cartoon’s “flood” image was aimed at the 1921 law.'],['g3-04','C','Red Scare headlines supported the raids and deportations.'],['g3-05','B','Restrictionist language led to the 1924 act.'],['g3-09','B','The Old/New immigrant distinction shaped the 1924 quotas.'],['g3-12','D','Strikes framed as plots supported open-shop campaigns.'],['g3-13','D','Strike fear fed anti-union policy.']];
 let sel=null,good=new Set();const w=el('div',{class:'board'});const left=el('div',{class:'bcol'}),right=el('div',{class:'bcol'});const msg=el('p',{class:'act-msg','aria-live':'polite'},['Click a source, then the law or policy it helped produce.']);
 const lbtns={};
 srcs.forEach(s=>{const a=art(s[0]);const b=el('button',{class:'bsrc',onclick:()=>{sel=s;Object.values(lbtns).forEach(x=>x.classList.remove('sel'));b.classList.add('sel');msg.textContent='Selected: '+RS.strip(a.title)+'. Now choose a law or policy.'}},[RS.strip(a.title)]);lbtns[s[0]]=b;left.append(b)});
 laws.forEach(l=>right.append(el('button',{class:'blaw',onclick:()=>{if(!sel){msg.textContent='Choose a source first.';return}if(sel[1]===l[0]){good.add(sel[0]);lbtns[sel[0]].classList.add('good');msg.textContent='Correct link! '+sel[2]+' ('+good.size+' of 6 needed)';if(good.size>=6){RS.markSim('board');RS.toast('Board complete','done')}}else msg.textContent='That link does not fit. Think about what the source argued.'}},[l[1]])));
 w.append(msg,el('div',{class:'cols'},[left,right]),el('p',{class:'small'},['Correct links glow green. Link at least six sources.']));RS.overlay('Attitudes and Policy Board',w);
};

/* ================= Gallery IV: Supreme Court ================= */
Sims.courtroom=function(){
 const w=el('div',{class:'court'});let step=0,pred='',va=null,vb=null;const body=el('div');
 const P=[
  ()=>[el('h3',{},['The facts']),el('p',{},['Clerk: “In November 1919, Benjamin Gitlow was arrested. He had published the Left Wing Manifesto, which urged workers toward revolution. New York’s Criminal Anarchy Law of 1902 makes it a crime to advocate overthrowing government by force. He was convicted in 1920.”']),btn('Hear Gitlow’s argument',()=>{step=1;draw()})],
  ()=>[el('h3',{},['Gitlow’s argument']),el('p',{},['Counsel: his writing is protected speech, and the First Amendment limits states through the Fourteenth. The Manifesto described a future, not an immediate act.']),btn('Hear the state’s argument',()=>{step=2;draw()})],
  ()=>[el('h3',{},['The state’s argument']),el('p',{},['Counsel for New York: speech urging violent revolution endangers public safety. A state may punish it, and the Criminal Anarchy Law is valid.']),btn('Review the evidence',()=>{step=3;draw()})],
  ()=>[el('h3',{},['Evidence and provisions']),el('p',{},['These items are pinned to the bench. Open them if you wish.']),el('div',{class:'evid'},[linkArt('g4-05'),linkArt('g4-06'),linkArt('g4-10')]),el('p',{},['Before you vote, write your prediction of how the Court actually ruled.']),(()=>{const t=el('textarea',{rows:3,'aria-label':'Your prediction',placeholder:'I think the Court will…'});return el('div',{},[t,btn('Lock in prediction',()=>{if(!t.value.trim()){return t.focus()}pred=t.value.trim();step=4;draw()})])})()],
  ()=>[el('h3',{},['Two votes']),el('p',{},[el('b',{},['Question A: ']),'Does the First Amendment limit state governments?']),el('div',{class:'sort-btns'},[btn('Yes',()=>{va='Yes';draw()},va==='Yes'?'on':''),btn('No',()=>{va='No';draw()},va==='No'?'on':'')]),el('p',{},[el('b',{},['Question B: ']),'Uphold or overturn Gitlow’s conviction?']),el('div',{class:'sort-btns'},[btn('Uphold',()=>{vb='Uphold';draw()},vb==='Uphold'?'on':''),btn('Overturn',()=>{vb='Overturn';draw()},vb==='Overturn'?'on':'')]),(va&&vb)?btn('Reveal the ruling',()=>{step=5;draw()}):el('span',{})],
  ()=>{RS.markSim('courtroom');RS.markAct('q4-courtroom');return[el('h3',{},['The ruling: June 8, 1925']),el('p',{},[el('b',{},['Your prediction: ']),pred]),el('p',{},['The Court, in a 7–2 opinion by Justice Sanford, ',el('b',{},['upheld the conviction']),', while declaring that freedom of speech is among the “liberties” protected from state impairment by the Fourteenth Amendment’s Due Process Clause. Justices Holmes and Brandeis dissented, with Holmes writing that “every idea is an incitement.”']),
   el('div',{class:'cmp two'},[el('div',{},[el('b',{},['Your Question A: ']),va,el('br'),el('b',{},['Court: ']),'Yes (assumed)']),el('div',{},[el('b',{},['Your Question B: ']),vb,el('br'),el('b',{},['Court: ']),'Uphold (7–2)'])]),
   el('p',{},[el('b',{},['Why it mattered: ']),'Government authority and individual liberty pulled in different directions in the same ruling. Gitlow lost, but the principle that free speech applies to the states began selective incorporation.']),linkArt('g4-07','Read the opinion excerpt'),btn('Done',()=>RS.closeOverlay())]}];
 const draw=()=>{body.innerHTML='';P[step]().forEach(n=>body.append(n))};
 w.append(body);draw();RS.overlay('Supreme Court Simulation',w);
};

/* ================= Gallery V: Policy Simulation ================= */
Sims.policy=function(){
 const METERS=['Alcohol consumption','Crime','Enforcement strain','Government authority','Public resistance','Organized crime','Economic effects'];
 const ACTUAL=[['↓','Fell early, then partly rebounded'],['↑','Violent crime and corruption rose in many cities'],['↑','Too few agents for the job'],['↓','Respect for law eroded'],['↑','Millions broke the law'],['↑','Bootlegging empires like Capone’s'],['↓','Lost tax revenue and jobs']];
 const w=el('div',{class:'policy'});let round=0;const body=el('div');const choices=[];
 const P=[
  ()=>[el('h3',{},['Round 1: Whether to ban']),el('p',{},['You are a legislator in 1917–19. Read the evidence, then vote.']),el('div',{class:'evid'},[linkArt('g5-06','Why supporters wanted it'),linkArt('g5-07','Why opponents resisted')]),el('div',{class:'sort-btns'},[btn('Vote YES on the amendment',()=>next('ban')),btn('Vote NO',()=>next('noban'))]),el('small',{},['In history, the 18th Amendment was ratified in 1919. Your simulation continues with the ban in place.'])],
  ()=>[el('h3',{},['Round 2: How to enforce']),el('p',{},['The Volstead Act needs agents and penalties.']),el('div',{class:'sort-btns'},[btn('Low budget',()=>next('low')),btn('Medium budget',()=>next('med')),btn('High budget, harsh penalties',()=>next('high'))])],
  ()=>[el('h3',{},['Round 3: Resistance and revenue']),el('p',{},['Citizens openly break the law and the Treasury loses alcohol taxes. What do you do?']),el('div',{class:'sort-btns'},[btn('Crack down harder',()=>next('crack')),btn('Allow beer and light wine',()=>next('relax')),btn('Stay the course',()=>next('stay'))])],
  ()=>{const f=[];const box=el('div');const arrows=METERS.map((m,i)=>{f[i]='';const row=el('div',{class:'fc-row'},[el('b',{},[m])]);['↑','↓'].forEach(a=>{const b=el('button',{class:'btn sm','aria-label':m+' '+(a==='↑'?'rises':'falls'),onclick:()=>{f[i]=a;row.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}},[a]);row.append(b)});box.append(row);return row});
   return [el('h3',{},['Forecast']),el('p',{},['Predict how each meter will move by 1933.']),box,btn('Reveal what happened',()=>{if(f.some(x=>!x))return;reveal(f)})]}];
 const next=c=>{choices.push(c);round++;draw()};
 const reveal=f=>{
  body.innerHTML='';let hit=0;body.append(el('h3',{},['Reveal: what really happened']));
  METERS.forEach((m,i)=>{const ok=f[i]===ACTUAL[i][0];if(ok)hit++;body.append(el('div',{class:'rv-row'+(ok?' ok':'')},[el('b',{},[m+': ']),'You predicted '+f[i]+', actual '+ACTUAL[i][0]+'. '+ACTUAL[i][1]]))});
  body.append(el('p',{},['You matched '+hit+' of 7. Unintended consequences included organized crime and bootlegging, speakeasies, corruption, eroded respect for law, and lost tax revenue. Repeal came with the 21st Amendment in 1933.']),el('p',{class:'small'},['Directions are qualitative; exact statistics are omitted until verified in cited sources.']),
   btn('Sort the outcomes',()=>{RS.markSim('policy');RS.closeOverlay();Sims.activity('q5-7')}),btn('Finish',()=>{RS.markSim('policy');RS.closeOverlay()},'ghost'));
 };
 const draw=()=>{body.innerHTML='';P[round]().forEach(n=>body.append(n))};
 w.append(body);draw();RS.overlay('Policy Council Chamber',w);
};

/* ================= Blind Pig: knock puzzle & Raid ================= */
Sims.knock=function(){
 const w=el('div',{class:'prose'},[el('p',{},['A cigar-shop front. A small slot is set in the wall. You raise your hand to knock…'])]);const out=el('p',{class:'act-msg'},[S.clue5?'You remember the clerk’s tip.':'(Tip: ask the cigar-shop clerk in this wing.)']);
 const knocks=[['Three fast knocks',false],['Two short, one long',true],['One long knock',false]];
 const pw=[['“Joe sent me.”',true],['“Open in the name of the law.”',false],['“I’d like a drink.”',false]];
 let ok1=false;
 knocks.forEach(k=>w.append(btn(k[0],()=>{ok1=k[1];out.textContent=k[1]?'The slot slides open. “Password?”':'Silence. Try another pattern.'})));
 w.append(el('h4',{},['Password']));pw.forEach(p=>w.append(btn(p[0],()=>{if(ok1&&p[1]){RS.closeOverlay();Game.secretOpen(5);RS.toast('The Blind Pig is open (all drinks are non-alcoholic props)','done')}else out.textContent=ok1?'The doorman scowls. Wrong password.':'Knock first.'})));
 w.append(out);RS.overlay('The Blind Pig',w);
};
Sims.raid=function(){
 const spots=['Under the bar','Piano','Coat rack','Trapdoor','Behind the stage','Jukebox','Teapot shelf','Barrel','Back office safe'];
 const w=el('div',{class:'raid'});let hidden=new Set(),t=10,timer=null;
 const info=el('p',{},['Hide the stash! Click 5 hiding spots before agents arrive. Time left: 10s. (Everything here is a prop; no alcohol.)']);
 const grid=el('div',{class:'rgrid'});const out=el('p',{class:'act-msg','aria-live':'polite'},['']);
 const bs=spots.map((s,i)=>{const b=el('button',{class:'btn',onclick:()=>{if(done)return;if(hidden.has(i)){hidden.delete(i);b.classList.remove('on')}else if(hidden.size<5){hidden.add(i);b.classList.add('on')}}},[s]);grid.append(b);return b});
 let done=false;
 const end=()=>{done=true;clearInterval(timer);const searched=shuffle([0,1,2,3,4,5,6,7,8]).slice(0,4);const found=[...hidden].filter(i=>searched.includes(i)).length;const hid=hidden.size;
  const win=hid>=5&&found<=1;
  out.innerHTML='Agents search '+searched.map(i=>spots[i]).join(', ')+'. '+(win?'<b>Most of your stash survives.</b>':'<b>They found '+found+' of '+hid+' hidden bottles'+(hid<5?' (you did not hide all 5)':'')+'.</b>');
  const row=el('div',{class:'sort-btns'});
  if(win){row.append(el('p',{},['An officer lingers by the door. Do you slip him an envelope?']),btn('Bribe the officer',()=>fin(true)),btn('Refuse',()=>fin(false)))}
  else row.append(btn('Try again',()=>{RS.closeOverlay();Sims.raid()}));
  out.append(row)};
 const fin=b=>{RS.markSim('raid');out.innerHTML=b?'<b>The officer pockets the envelope and the raid ends.</b> That is how corruption spread through police departments, courts, and federal agents. Honest enforcement was hard when bribes were cheap and profits huge.':'<b>He frowns and writes a report.</b> Few were so incorruptible. Corruption was widespread precisely because so many officials took the money.';out.append(btn('Done',()=>RS.closeOverlay()))};
 timer=setInterval(()=>{t--;info.textContent='Hide the stash! Click 5 hiding spots. Time left: '+t+'s';if(t<=0)end()},1000);
 w.append(info,grid,out);RS.overlay('Raid!',w,{onClose:()=>clearInterval(timer)});
};

/* ================= Research Room ================= */
Sims.bib=function(){
 const w=el('div',{class:'bibwall'});let filt='all';const shelf=el('div',{class:'shelf'}),card=el('div',{class:'bcard'});
 const draw=()=>{shelf.innerHTML='';D.BIB.filter(b=>filt==='all'||b.kind===filt).forEach(b=>shelf.append(el('button',{class:'book '+b.kind,onclick:()=>{open(b)}},[RS.strip(b.mla).split('.')[0]])))};
 const open=b=>{card.innerHTML='';card.append(el('span',{class:'badge '+b.kind},[b.kind==='primary'?'Primary source':'Secondary source']),el('p',{class:'bib',html:b.mla}),el('b',{},['Exhibits that use it:']));
  const ex=D.A.filter(a=>a.cite===b.id);const ul=el('ul');ex.forEach(a=>ul.append(el('li',{},[linkArt(a.id)])));if(!ex.length)ul.append(el('li',{},[b.uses.join('; ')]));card.append(ul);
  if(!S.bib.includes(b.id)){S.bib.push(b.id);RS.save();RS.emit('station','bibopen')}RS.checkQuests();const c=el('p',{class:'small'},[S.bib.length+' of 7 books opened'])
  card.append(c)};
 const tb=el('div',{class:'qb-tabs'});[['all','All'],['primary','Primary'],['secondary','Secondary']].forEach(f=>tb.append(el('button',{class:'tab'+(f[0]===filt?' on':''),onclick:e=>{filt=f[0];tb.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b===e.target));draw()}},[f[1]])));
 w.append(tb,shelf,card,el('h4',{},['Planned additions']),el('p',{class:'small',html:'<i>America’s History</i>, Volume II; <i>American Issues: A Documentary Reader</i>; library databases such as Gale; and chapter materials on the revived Klan and Prohibition.'}));
 draw();RS.overlay('Bibliography Wall',w);
};
const READ=[['Calvin Coolidge, 1921','“America must be kept American.” (Excerpt of a magazine article, read aloud.)'],['Gitlow majority (Sanford), 1925','We may and do assume that freedom of speech and of the press, which are protected by the First Amendment from abridgment by Congress, are among the fundamental personal rights and liberties protected by the due process clause of the Fourteenth Amendment from impairment by the States.'],['Gitlow dissent (Holmes), 1925','Every idea is an incitement.'],['18th Amendment, 1919','After one year from the ratification of this article the manufacture, sale, or transportation of intoxicating liquors is hereby prohibited.'],['21st Amendment, 1933','The eighteenth article of amendment to the Constitution of the United States is hereby repealed.']];
Sims.radio=function(){
 const w=el('div',{class:'radio'},[el('p',{},['Tune the dial. Each setting reads a primary-source excerpt aloud with captions. (Voice reading of public-domain text; archival audio is not bundled.)'])]);
 const dial=el('input',{type:'range',min:0,max:READ.length-1,step:1,value:0,'aria-label':'Radio dial'});const cap=el('p',{class:'radio-cap','aria-live':'polite'},['']);const lab=el('h4',{},[READ[0][0]]);
 const play=()=>{const r=READ[+dial.value];lab.textContent=r[0];cap.textContent=r[1];RS.narrate(r[1],RS.VOICE&&RS.VOICE.radio&&RS.VOICE.radio[+dial.value]);if(!S.radio.includes(r[0])){S.radio.push(r[0]);RS.save();RS.checkQuests()}};
 dial.addEventListener('input',()=>{lab.textContent=READ[+dial.value][0]});
 w.append(dial,lab,btn('▶ Listen',play),cap,el('p',{class:'small'},['Recordings heard: '+S.radio.length+' of '+READ.length]));RS.overlay('Radio Room',w);
};
Sims.terminal=function(){
 const w=el('div',{class:'term'});const list=el('div',{class:'tlist'});const q=el('input',{type:'search',placeholder:'Search your journal…','aria-label':'Search journal'});let gf=0;
 const draw=()=>{list.innerHTML='';const term=q.value.toLowerCase();const items=S.journal.map(id=>D.byId[id]).filter(a=>a&&(!gf||a.g===gf)&&(!term||(a.title+a.blurb).toLowerCase().includes(term)));
  if(!items.length)list.append(el('p',{},['No entries yet. Open artworks in the galleries to fill your journal.']));
  items.forEach(a=>list.append(el('div',{class:'jrow'},[el('span',{class:'dot',style:'background:'+D.G[a.g].accent}),linkArt(a.id),el('small',{},[' '+D.G[a.g].short+' · GQ '+(a.gq||[]).join(', ')+' · '+a.kind]),el('button',{class:'btn sm',onclick:()=>cite(a)},['Cite'])])))};
 const gsel=el('select',{'aria-label':'Gallery filter',onchange:e=>{gf=+e.target.value;draw()}},[el('option',{value:0},['All galleries'])].concat([1,2,3,4,5].map(g=>el('option',{value:g},[D.G[g].short]))));
 q.addEventListener('input',draw);
 const out=el('div',{class:'cite-out'});
 const cite=a=>{out.innerHTML='';const f=['Creator: '+RS.strip(a.creator),'Title: '+RS.strip(a.title),'Container / origin: '+RS.strip(a.origin),'Date: '+a.date];
  out.append(el('h4',{},['Build an MLA entry from the Source Card']),...f.map(x=>el('div',{class:'small'},[x])),btn('Build citation',()=>{const c=RS.strip(a.creator)+'. “'+RS.strip(a.title)+'.” '+RS.strip(a.origin)+', '+a.date+'.';out.append(el('p',{class:'bib'},[c]),el('small',{},['MLA format: Creator. “Title.” Container, Date. Check it against the Bibliography Wall.']));S.cited=true;RS.save();RS.checkQuests()}))};
 w.append(el('div',{class:'tctl'},[q,gsel]),list,out);draw();RS.overlay('Evidence Journal terminal',w);
};
Sims.microfilm=function(){
 const w=el('div',{class:'micro'});const q=el('input',{type:'search',placeholder:'Search clippings (try: strike, Palmer, quota)…','aria-label':'Search'});const res=el('div');
 const run=()=>{res.innerHTML='';const t=q.value.toLowerCase().trim();if(!t)return;const hits=D.A.filter(a=>(a.title+' '+RS.strip(a.blurb)+' '+RS.strip(a.context)).toLowerCase().includes(t));if(!hits.length)res.append(el('p',{},['No matching clippings.']));hits.slice(0,12).forEach(a=>res.append(el('div',{class:'jrow'},[linkArt(a.id),el('small',{},[' '+D.G[a.g].short+' · '+a.date])])))};
 q.addEventListener('input',run);w.append(el('p',{},['A newspaper-search tool that jumps to related clippings and exhibits.']),q,res);RS.overlay('Microfilm Room',w);
};
Sims.evaluation=function(){
 const w=el('div',{class:'prose'},[el('h3',{},['Primary or secondary?']),el('p',{},[el('b',{},['Primary sources']),' come from the time being studied: laws, court opinions, photographs, newspapers, speeches, letters. ',el('b',{},['Secondary sources']),' are written later to analyze or explain: textbooks, documentaries, magazine essays, museum charts.']),
  el('p',{},['Ask who made it, when, why, and for whom. Then try the classification activity.']),btn('Start the classification',()=>{RS.closeOverlay();Sims.activity('q6-2')})]);
 RS.overlay('Source Evaluation Desk',w);
};

/* ================= Synthesis ================= */
Sims.pedestals=function(){
 S.display=S.display||{};const LINES={1:'The Great Migration challenged racial structures and raised conflict.',2:'The Red Scare and the ACLU showed the tension between security and liberty.',3:'Nativism fed restrictive immigration law.',4:'Gitlow showed the constitutional stakes of political expression.',5:'Prohibition showed unintended consequences.'};
 const w=el('div',{class:'ped'});const row=el('div',{class:'peds'});const msg=el('p',{class:'central'},['']);
 const draw=()=>{row.innerHTML='';[1,2,3,4,5].forEach(g=>{const lit=!!S.display[g];const can=S.stamps.includes(g)||D.ITEMS[g].some(i=>S.items.includes(i[0]));
  row.append(el('div',{class:'pedestal'+(lit?' lit':''),style:'--acc:'+D.G[g].accent},[el('b',{},[D.G[g].n]),lit?el('p',{},[LINES[g]]):el('p',{},['Place an item or earn this gallery’s stamp']),lit?null:btn('Display',()=>{if(!can){RS.toast('You need a collectible or stamp from this gallery');return}S.display[g]=true;RS.save();draw()},can?'':'ghost')].filter(Boolean)))});
  msg.textContent=[1,2,3,4,5].every(g=>S.display[g])?'The Roaring Twenties were characterized not only by economic and cultural change, but also by intense conflicts over race, immigration, political radicalism, civil liberties, government authority, and social regulation.':''};
 w.append(row,msg);draw();RS.overlay('Hall of Evidence',w);
};
Sims.atrium=function(){
 if(S.sims.final)return Sims.finalDone();
 const w=el('div',{class:'atrium'});const sel={};const slots=[[['Prevented','Promoted']],[['Whose fear?','Whose rights?','What does this teach about today?']]];
 const body=el('div');
 const cardsFor=()=>S.journal.map(id=>D.byId[id]).filter(Boolean);
 function build(q){
  body.innerHTML='';const gq=D.GQ[q];const names=slots[q][0];const chosen=names.map(()=>[]);let active=0;
  body.append(el('h3',{},['Guiding Question '+(q+1)]),el('p',{class:'gq'},[gq.q]));
  const slotEls=names.map((n,i)=>el('div',{class:'slot'+(i===0?' active':''),tabindex:0,onclick:()=>{active=i;slotEls.forEach((s,k)=>s.classList.toggle('active',k===i))}},[el('b',{},[n]),el('div',{class:'chips'})]));
  const draw=()=>{slotEls.forEach((s,i)=>{const c=s.querySelector('.chips');c.innerHTML='';chosen[i].forEach(id=>c.append(el('button',{class:'chip',onclick:e=>{e.stopPropagation();chosen[i]=chosen[i].filter(x=>x!==id);draw()}},[RS.strip(art(id).title)+' ✕'])))})};
  body.append(el('div',{class:'slots'},slotEls));
  const pool=el('div',{class:'pool'});const cs=cardsFor();if(!cs.length)pool.append(el('p',{},['Your Evidence Journal is empty. Explore the galleries first.']));
  cs.forEach(a=>pool.append(el('button',{class:'card',style:'border-color:'+D.G[a.g].accent,onclick:()=>{if(!chosen[active].includes(a.id)){chosen[active].push(a.id);draw()}}},[RS.strip(a.title),el('small',{},[D.G[a.g].short])])));
  body.append(el('p',{class:'small'},['Click a slot, then add evidence cards from your journal. Use at least three cards from three different galleries.']),pool);
  const note=el('textarea',{rows:3,placeholder:'Optional: write your own answer here (not saved).','aria-label':'Your answer'});body.append(note);
  const msg=el('p',{class:'act-msg'},['']);
  body.append(btn('Submit answer',()=>{const all=chosen.flat();const gals=new Set(all.map(id=>art(id).g));if(all.length<3||gals.size<3){msg.textContent='Add at least three evidence cards from three different galleries (you have '+all.length+' cards from '+gals.size+' galleries).';return}
   sel[q]=true;body.innerHTML='';body.append(el('h3',{},['Model answer']),q===0?el('div',{},[el('b',{},['Prevented:']),el('ul',{html:gq.prevented.map(x=>'<li>'+x+'</li>').join('')}),el('b',{},['Promoted:']),el('ul',{html:gq.promoted.map(x=>'<li>'+x+'</li>').join('')})]):el('p',{html:gq.body}),el('p',{class:'small'},['Compare it with your own answer and cards.']),
    q===0?btn('Continue to Question 2',()=>build(1)):btn('Finish',()=>{RS.markSim('final');RS.closeOverlay();Sims.finalDone()}))}),msg)}
 w.append(body);build(0);RS.overlay('Guiding Questions Atrium',w);
};
Sims.finalDone=function(){
 const w=el('div',{class:'prose'},[el('h3',{},['You answered both Guiding Questions']),el('p',{},['Take your Visitor Passport and certificate to the Curator’s Office desk.']),btn('Open the Curator’s Office',()=>{RS.closeOverlay();Sims.curator()}),btn('🎬 One more thing…',()=>Sims.creditsReel())]);RS.overlay('The Curator’s Argument',w);
};
/* Easter egg: the credits video, offered once the visitor has finished the final quest. */
Sims.creditsReel=function(){
 const v=el('video',{controls:'',playsinline:'',preload:'metadata',class:'credits-video','aria-label':'Roaring Society credits video'});
 v.src='assets/video/credits.mp4';
 let playing=false;const set=on=>{if(on!==playing){playing=on;RS.emit(on?'credits.start':'credits.end')}};
 v.addEventListener('play',()=>set(true));v.addEventListener('pause',()=>set(false));v.addEventListener('ended',()=>set(false));
 const w=el('div',{class:'credits-reel'},[el('p',{class:'small'},['Thanks for visiting. Press play for the credits.']),v]);
 RS.overlay('Credits',w,{onClose:()=>{try{v.pause();v.removeAttribute('src');v.load()}catch(e){}set(false)}});
};
Sims.curator=function(){
 const w=el('div',{class:'prose'});
 if(!S.sims.final){w.append(el('p',{},['Turn in your final answer here after you have built it at the Guiding Questions Atrium (also in this wing).']),el('p',{},['Stamps: '+S.stamps.length+' of 5.']));RS.overlay('Curator’s Office',w);return}
 const name=el('input',{type:'text',placeholder:'Type any name (not stored)','aria-label':'Name on certificate',maxlength:40});
 const c=el('canvas',{width:800,height:560,class:'cert'});
 const draw=()=>{const x=c.getContext('2d');x.fillStyle='#f6ecd6';x.fillRect(0,0,800,560);x.strokeStyle='#8c6d23';x.lineWidth=10;x.strokeRect(20,20,760,520);x.lineWidth=2;x.strokeRect(36,36,728,488);x.fillStyle='#2b2118';x.textAlign='center';x.font='bold 40px Georgia, serif';x.fillText('Certificate of Completion',400,120);x.font='italic 22px Georgia';x.fillText('The Roaring Society — Social Conflict and Civil Liberties in 1920s America',400,160);
  x.font='20px Georgia';x.fillText('This certifies that',400,230);x.font='bold 40px Georgia';x.fillText(name.value||'A Curious Visitor',400,285);x.font='20px Georgia';x.fillText('studied all five galleries and answered the museum’s two Guiding Questions.',400,335);
  [1,2,3,4,5].forEach((g,i)=>{x.beginPath();x.arc(150+i*125,420,34,0,7);x.fillStyle=S.stamps.includes(g)?D.G[g].accent:'#ccc';x.fill();x.fillStyle='#fff';x.font='bold 18px Georgia';x.fillText(['I','II','III','IV','V'][i],150+i*125,427)});
  x.fillStyle='#2b2118';x.font='16px Georgia';x.fillText(new Date().toLocaleDateString(),400,505)};
 name.addEventListener('input',draw);draw();
 w.append(el('h3',{},['Visitor Passport & Certificate']),el('p',{},['Type any name you like. The game does not store it.']),name,c,btn('🎬 Credits',()=>Sims.creditsReel()),btn('Download certificate (PNG)',()=>{c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='roaring-society-certificate.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)})}));
 RS.overlay('Curator’s Office',w);
};

/* ================= Timeline Terrace ================= */
Sims.timeline=function(){
 const ev=[[1917,'U.S. enters WWI; Bolshevik Revolution',2,'g2-01'],[1919,'Red Summer riots; Seattle General Strike (Feb)',1,'g1-09'],[1919,'Boston Police Strike (Sep)',3,'g3-12'],[1919,'18th Amendment ratified (Jan); Volstead Act (Oct)',5,'g5-03'],[1919,'Palmer Raids begin (Nov)',2,'g2-04'],[1920,'Prohibition begins; ACLU founded (Jan)',2,'g2-07'],[1920,'Wall Street bombing (Sep)',2,'g2-02'],[1921,'Tulsa Race Massacre; Emergency Quota Act (May)',1,'g1-11'],[1921,'Sacco and Vanzetti trial',3,'g3-10'],[1924,'National Origins Act',3,'g3-07'],[1925,'Gitlow v. New York (June 8)',4,'g4-07'],[1925,'Scopes Trial; Klan marches in D.C.',2,'g2-08'],[1927,'Sacco and Vanzetti executed',3,'g3-11'],[1929,'Stock market crash (Oct)',0,null],[1933,'21st Amendment repeals Prohibition',5,'g5-13']];
 const w=el('div',{class:'timeline'},[el('p',{},['A mural walk from 1917 to 1933. Click an event to open the related artwork. Use the telescope in the courtyard to view the ground below.'])]);
 const track=el('ol',{class:'tl'});ev.forEach(e=>track.append(el('li',{style:'--acc:'+(D.G[e[2]]?D.G[e[2]].accent:'#888')},[el('b',{},[e[0]]),e[3]?el('button',{class:'link',onclick:()=>RS.openArtwork(e[3])},[e[1]]):el('span',{},[e[1]])])));
 w.append(track);RS.overlay('Timeline Terrace (roof level)',w);
};
})();
