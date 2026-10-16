/* Shared core: state, events, image resolver, charts, artwork viewer, toasts */
(function(){
'use strict';
const D=window.DATA;
const RS=window.RS={D};
const SAVE_KEY='roaring-society-v1';

/* ---------- tiny helpers ---------- */
RS.$=(s,r)=> (r||document).querySelector(s);
RS.$$=(s,r)=> Array.from((r||document).querySelectorAll(s));
RS.el=function(tag,attrs,kids){const e=document.createElement(tag);if(attrs)for(const k in attrs){if(k==='class')e.className=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),attrs[k]);else if(attrs[k]!==false&&attrs[k]!=null)e.setAttribute(k,attrs[k]);}
 (kids||[]).forEach(c=>e.append(c&&c.nodeType?c:document.createTextNode(c)));return e;};
RS.strip=h=>String(h).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&');
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
RS.ls=ls;

/* ---------- event bus ---------- */
const bus={};
RS.on=(t,f)=>{(bus[t]=bus[t]||[]).push(f)};
RS.emit=(t,d)=>{(bus[t]||[]).slice().forEach(f=>{try{f(d)}catch(e){console.error(e)}})};

/* ---------- save state ---------- */
const blank={version:1,seen:[],journal:[],quests:{},acts:{},sims:{},items:[],keys:[],stamps:[],points:0,bib:[],radio:[],views:[],stations:[],secret:{},secretOpen:{},pos:null,visited:[],settings:{captions:true,reducedMotion:false,sens:1,text:1,vol:0.6,music:0.5,quality:1,contrast:false,bob:true,invertY:false},rank:'',cited:false,answers:{}};
let S;
try{S=Object.assign({},blank,JSON.parse(ls.get(SAVE_KEY)||'{}'));S.settings=Object.assign({},blank.settings,S.settings||{})}catch(e){S=JSON.parse(JSON.stringify(blank))}
RS.S=S;
let saveT=0;
RS.save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>ls.set(SAVE_KEY,JSON.stringify(S)),150)};
RS.reset=()=>{ls.set(SAVE_KEY,'');location.reload()};

/* ---------- Curator Points: persistent, one-time rewards ---------- */
S.awards=S.awards||{};
Object.keys(S.quests).forEach(id=>{if(S.quests[id]==='complete')S.awards['quest:'+id]=true});
Object.keys(S.secretOpen).forEach(g=>{if(S.secretOpen[g])S.awards['secret:'+g]=true});
RS.award=function(id,points,label){
 if(S.awards[id])return false;S.awards[id]=true;S.points=(Number(S.points)||0)+points;RS.save();RS.emit('score.changed',S.points);
 if(label)RS.toast(label+' · +'+points+' points','done');return true;
};
RS.on('secret',g=>RS.award('secret:'+g,25,'Hidden room discovered'));

/* ---------- toasts ---------- */
RS.toast=function(msg,kind){
 let box=RS.$('#toasts');if(!box){box=RS.el('div',{id:'toasts','aria-live':'polite'});document.body.append(box)}
 const t=RS.el('div',{class:'toast '+(kind||'')},[msg]);box.append(t);
 setTimeout(()=>t.classList.add('out'),3600);setTimeout(()=>t.remove(),4200);
};

/* ---------- images (Wikimedia Commons) ---------- */
const STD=[120,250,330,500,960,1280,1920];
const fp=(f,w)=>{w=STD.find(s=>s>=w)||1920;return 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f.replace(/ /g,'_'))+'?width='+w};
RS.fileUrl=fp;
const API='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*';
const cacheKey='rs-img-v1';
let icache={};try{icache=JSON.parse(ls.get(cacheKey)||'{}')}catch(e){}
const saveCache=()=>ls.set(cacheKey,JSON.stringify(icache));
/* credit lookup */
RS.credit=async function(file){
 const k='c:'+file;if(icache[k])return icache[k];
 try{const r=await fetch(API+'&prop=imageinfo&iiprop=extmetadata|url&titles='+encodeURIComponent('File:'+file)).then(r=>r.json());
  const p=Object.values(r.query.pages)[0];const i=p.imageinfo&&p.imageinfo[0];if(!i)return null;const m=i.extmetadata||{};
  const c={artist:RS.strip((m.Artist||{}).value||'Unknown').slice(0,90),lic:(m.LicenseShortName||{}).value||'See source',page:i.descriptionurl};
  icache[k]=c;saveCache();return c}catch(e){return null}
};
/* search fallback -> {file} */
RS.searchImage=async function(q){
 const k='s:'+q;if(icache[k])return icache[k]==='none'?null:icache[k];
 try{const r=await fetch(API+'&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch='+encodeURIComponent('filetype:bitmap '+q)+'&prop=imageinfo&iiprop=url|extmetadata').then(r=>r.json());
  const pages=Object.values((r.query||{}).pages||{}).sort((a,b)=>a.index-b.index).filter(p=>p.imageinfo&&/public domain|cc0|no restrictions|cc by/i.test(((p.imageinfo[0].extmetadata||{}).LicenseShortName||{}).value||'pd'));
  if(!pages.length){icache[k]='none';saveCache();return null}
  const f=pages[0].title.replace('File:','');icache[k]={file:f};saveCache();return icache[k]}catch(e){return null}
};
/* resolve a usable image url for an artwork (first image) */
RS.imageFor=async function(art,w,idx){
 const files=art.f||[];
 if(files[idx||0])return {url:fp(files[idx||0],w),file:files[idx||0]};
 if(art.q&&!art.f){const s=await RS.searchImage(art.q);if(s)return {url:fp(s.file,w),file:s.file,found:true}}
 return null;
};
RS.preload=(url)=>new Promise(res=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url});

/* ---------- SVG charts ---------- */
const C={ink:'#2b2118',paper:'#f6ecd6',brass:'#b08d57',red:'#9b2335',teal:'#1f8a8a',gold:'#c8902a',slate:'#4a6a9b'};
function svg(w,h,inner,label){return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-size="13">${inner}</svg>`}
const bar=(x,y,w,h,c,t)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
RS.charts={
 'klan':()=>{const pts=[[1915,0.0],[1920,0.1],[1922,1],[1924,3.5],[1925,4.5],[1926,3],[1928,0.7],[1930,0.1]];
  let x0=50,y0=190,w=420,h=150;const px=y=>x0+(y-1915)/15*w,py=v=>y0-v/5*h;
  const path=pts.map((p,i)=>(i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)).join('');
  return svg(520,230,`<rect width="520" height="230" fill="#fffaf0"/><line x1="${x0}" y1="${y0}" x2="${x0+w}" y2="${y0}" stroke="#555"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="30" stroke="#555"/>`+
  [0,1,2,3,4,5].map(v=>`<text x="12" y="${py(v)+4}">${v}M</text><line x1="${x0}" x2="${x0+w}" y1="${py(v)}" y2="${py(v)}" stroke="#ddd"/>`).join('')+
  [1915,1920,1925,1930].map(y=>`<text x="${px(y)-14}" y="${y0+18}">${y}</text>`).join('')+
  `<path d="${path}" fill="none" stroke="${C.red}" stroke-width="3"/><text x="${px(1925)-60}" y="${py(4.5)-8}" fill="${C.red}">Peak: about 4–5 million</text><text x="50" y="18" font-weight="bold">Estimated Klan membership (approximate shape)</text><text x="50" y="224" font-size="11" fill="#555">Curve is schematic; historians’ estimates vary.</text>`,'Line chart: Klan membership rose from 1915 to a mid-1920s peak of about 4 to 5 million and then fell.')},
 'klan-targets':()=>{const t=['Black Americans','Roman Catholics','Jews','Immigrants','Modern / secular trends'];
  return svg(520,250,`<rect width="520" height="250" fill="#fffaf0"/><circle cx="90" cy="125" r="50" fill="${C.ink}"/><text x="90" y="121" fill="#fff" text-anchor="middle">1920s</text><text x="90" y="137" fill="#fff" text-anchor="middle">Klan</text>`+
  t.map((s,i)=>{const y=30+i*48;return `<line x1="140" y1="125" x2="300" y2="${y+14}" stroke="${C.red}" stroke-width="2"/><rect x="300" y="${y}" width="200" height="30" rx="6" fill="${i==0?C.brass:'#e8d9b5'}" stroke="#555"/><text x="312" y="${y+20}">${s}</text>`}).join('')+
  `<text x="300" y="20" font-weight="bold">Targets widened over time</text>`,'Diagram: five groups the 1920s Klan targeted.')},
 'quota':()=>svg(520,250,`<rect width="520" height="250" fill="#fffaf0"/><text x="20" y="22" font-weight="bold">Quota laws compared</text>`+
  [['Emergency Quota Act (1921)','3%','1910 Census',C.gold,0],['National Origins Act (1924)','2%','1890 Census',C.red,1]].map((r,i)=>{const x=20+i*250;return `<rect x="${x}" y="40" width="230" height="170" rx="8" fill="#fff" stroke="${r[3]}" stroke-width="3"/><text x="${x+12}" y="66" font-weight="bold">${r[0]}</text><text x="${x+12}" y="118" font-size="44" fill="${r[3]}">${r[1]}</text><text x="${x+12}" y="142">of each nationality’s</text><text x="${x+12}" y="160">foreign-born population</text><text x="${x+12}" y="190" font-weight="bold">Baseline: ${r[2]}</text>`}).join('')+`<text x="20" y="236" font-size="12" fill="#555">Earlier baseline = fewer Southern/Eastern Europeans counted.</text>`,'Comparison of the 1921 and 1924 quota laws.'),
 'oldnew':()=>svg(520,260,`<rect width="520" height="260" fill="#fffaf0"/><text x="20" y="22" font-weight="bold">Who the 1924 law favored and curtailed</text>`+
  [['Favored: “Old” immigrants','Britain, Ireland, Germany, Scandinavia',C.teal,'↑'],['Curtailed: “New” immigrants','Italy, Poland, Russia, Greece, the Balkans (often Catholic or Jewish)',C.red,'↓'],['Barred','Nearly all Asian immigrants','#222','✕']].map((r,i)=>`<rect x="20" y="${38+i*70}" width="480" height="58" rx="8" fill="#fff" stroke="${r[2]}" stroke-width="3"/><text x="40" y="${74+i*70}" font-size="30" fill="${r[2]}">${r[3]}</text><text x="80" y="${62+i*70}" font-weight="bold">${r[0]}</text><text x="80" y="${82+i*70}" font-size="12">${r[1]}</text>`).join(''),'Chart of favored, curtailed and barred groups.'),
 'union':()=>{const d=[[1920,5.0],[1922,3.6],[1924,3.6],[1926,3.5],[1928,3.4],[1930,3.4]];const x0=50,y0=190,w=420,h=150;const px=y=>x0+(y-1920)/10*w,py=v=>y0-v/6*h;
  return svg(520,230,`<rect width="520" height="230" fill="#fffaf0"/><line x1="${x0}" y1="${y0}" x2="${x0+w}" y2="${y0}" stroke="#555"/>`+[0,2,4,6].map(v=>`<text x="12" y="${py(v)+4}">${v}M</text><line x1="${x0}" x2="${x0+w}" y1="${py(v)}" y2="${py(v)}" stroke="#ddd"/>`).join('')+
  d.map(p=>`<rect x="${px(p[0])-14}" y="${py(p[1])}" width="28" height="${y0-py(p[1])}" fill="${C.slate}"/><text x="${px(p[0])-12}" y="${y0+16}">${p[0]}</text><text x="${px(p[0])-12}" y="${py(p[1])-4}" font-size="11">~${p[1]}M</text>`).join('')+`<text x="50" y="18" font-weight="bold">Approximate U.S. union membership (millions)</text><text x="50" y="224" font-size="11" fill="#555">Approximate; sources vary. Check Foner or Henretta for exact counts.</text>`,'Bar chart: union membership fell from about 5 million in 1920 to about 3.4 million in 1930.')},
 'incorporation':()=>svg(520,230,`<rect width="520" height="230" fill="#fffaf0"/>`+
  [['First Amendment','"Congress shall make no law …"',20,C.slate],['Fourteenth Amendment','Due Process: states may not take "liberty"',190,C.red],['State laws','Now limited by free speech',360,C.teal]].map((r,i)=>`<rect x="${r[2]}" y="60" width="140" height="100" rx="8" fill="#fff" stroke="${r[3]}" stroke-width="3"/><text x="${r[2]+8}" y="88" font-weight="bold" font-size="12">${r[0]}</text><text x="${r[2]+8}" y="112" font-size="11">${r[1].slice(0,22)}</text><text x="${r[2]+8}" y="128" font-size="11">${r[1].slice(22)}</text>`).join('')+
  `<path d="M160 110h28M330 110h28" stroke="#222" stroke-width="3" marker-end="url(#a)"/><defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6z"/></marker></defs><text x="20" y="30" font-weight="bold">Selective incorporation</text><text x="20" y="200" font-size="12">Gitlow (1925): the Court assumed speech is a “liberty” the states must respect.</text>`,'Diagram of incorporation: First Amendment to Fourteenth Amendment to state laws.'),
 'timeline-inc':()=>{const ev=[[1925,'Gitlow','Speech'],[1931,'Near v. Minnesota','Press'],[1937,'De Jonge v. Oregon','Assembly'],[1947,'Everson','Establishment'],[1961,'Mapp v. Ohio','Search & seizure'],[1963,'Gideon v. Wainwright','Right to counsel'],[1968,'Duncan v. Louisiana','Jury trial']];
  return svg(560,250,`<rect width="560" height="250" fill="#fffaf0"/><line x1="30" y1="120" x2="530" y2="120" stroke="#333" stroke-width="3"/>`+ev.map((e,i)=>{const x=40+i*75;const up=i%2==0;return `<circle cx="${x+30}" cy="120" r="6" fill="${C.red}"/><text x="${x+8}" y="${up?96:150}" font-weight="bold" font-size="12">${e[0]}</text><text x="${x-6}" y="${up?80:168}" font-size="10">${e[1]}</text><text x="${x-6}" y="${up?66:182}" font-size="10" fill="#555">${e[2]}</text>`}).join('')+`<text x="20" y="20" font-weight="bold">Selected incorporation cases</text>`,'Timeline of incorporation cases from 1925 to 1968.')},
 'revenue':()=>svg(520,230,`<rect width="520" height="230" fill="#fffaf0"/><text x="20" y="22" font-weight="bold">Prohibition and public money (direction only)</text>`+
  [['Alcohol tax revenue','↓',C.red,'Falls as the legal trade closes'],['Enforcement spending','↑',C.teal,'Rises to pay agents, courts, prisons']].map((r,i)=>`<rect x="${20+i*250}" y="46" width="230" height="140" rx="8" fill="#fff" stroke="${r[2]}" stroke-width="3"/><text x="${40+i*250}" y="84" font-weight="bold">${r[0]}</text><text x="${40+i*250}" y="150" font-size="70" fill="${r[2]}">${r[1]}</text><text x="${40+i*250}" y="176" font-size="11">${r[3]}</text>`).join('')+`<text x="20" y="212" font-size="11" fill="#555">Exact figures omitted until verified in a cited source.</text>`,'Chart: alcohol tax revenue down, enforcement spending up.')
};

/* ---------- Artwork viewer (pop-up) ---------- */
let overlayEl=null,lastFocus=null;
RS.closeViewer=function(){if(overlayEl){overlayEl.remove();overlayEl=null;RS.emit('viewer.close');if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}};
RS.viewing=()=>!!overlayEl;
RS.mla=(art)=>{const b=D.BIB.find(x=>x.id===art.cite);return b?b.mla:''};
RS.openArtwork=function(id,opts){
 const art=D.byId[id];if(!art)return;
 opts=opts||{};
 RS.closeViewer();lastFocus=document.activeElement;
 const first=RS.S.seen.indexOf(id)<0;
 const wrap=RS.el('div',{class:'viewer',role:'dialog','aria-modal':'true','aria-label':art.title});
 overlayEl=wrap;RS.releasePointer();
 const media=RS.el('div',{class:'v-media'});
 const info=RS.el('div',{class:'v-info'});
 const close=RS.el('button',{class:'v-close','aria-label':'Close',onclick:RS.closeViewer},['✕']);
 const frame=art.frame;
 const badge=RS.el('span',{class:'badge '+art.kind},[art.kind==='primary'?'Primary source':'Secondary source']);
 const h=RS.el('h2',{class:'pix'},[RS.strip(art.title)]);
 const gtag=RS.el('div',{class:'v-gal',style:'--acc:'+D.G[art.g].accent},[D.G[art.g].n+' · '+D.G[art.g].rooms[art.room]]);
 const cardRows=[['Creator',art.creator],['Date',art.date],['Origin',art.origin],['Type of source',art.kind==='primary'?'Primary':'Secondary'],['Historical context',art.context],['Relevance',art.relevance]];
 const card=RS.el('dl',{class:'source-card'});cardRows.forEach(r=>{card.append(RS.el('dt',{},[r[0]]),RS.el('dd',{html:r[1]}))});
 const credit=RS.el('p',{class:'credit'});
 const body=RS.el('div',{class:'v-blurb',html:art.blurb});
 const prompt=RS.el('p',{class:'think'},[RS.el('b',{},['Think about it: ']),art.prompt]);
 const jb=RS.el('button',{class:'btn',onclick:()=>{addJournal(id);jb.textContent='✓ In your Evidence Journal';jb.disabled=true}},[RS.S.journal.indexOf(id)>=0?'✓ In your Evidence Journal':'Add to Evidence Journal']);
 if(RS.S.journal.indexOf(id)>=0)jb.disabled=true;
 const cite=RS.el('details',{class:'cite'},[RS.el('summary',{},['Citation (MLA)']),RS.el('p',{html:RS.mla(art)+(art.f?' Image: Wikimedia Commons (see credit above).':'')}),RS.el('p',{class:'small'},['Suggested reading for this exhibit. The image file is credited separately above.'])]);
 const rel=RS.el('div',{class:'related'},[RS.el('b',{},['Related artworks: '])]);
 (art.related||[]).forEach(r=>{const x=D.byId[r];if(x)rel.append(RS.el('button',{class:'link',onclick:()=>{RS.emit('related',r);RS.openArtwork(r,opts)}},[RS.strip(x.title)]))});
 info.append(close,gtag,badge,h,card,credit,body,prompt,jb,rel,cite);
 const gate=()=>{
  const g=RS.el('div',{class:'gate'},[RS.el('h3',{},['Content note']),RS.el('p',{},['This exhibit discusses racial violence, including mass killing. Images are limited to aftermath and text. You can skip this room and still receive credit for it.']),
   RS.el('button',{class:'btn',onclick:()=>{g.remove();build()}},['Continue']),RS.el('button',{class:'btn ghost',onclick:()=>{g.remove();RS.skipMark(art);RS.closeViewer()}},['Skip this exhibit'])]);
  media.append(g);};
 function build(){
  media.innerHTML='';
  if(art.f&&art.f.length){
   const imgs=RS.el('div',{class:'v-imgs'+(art.f.length>1?' multi':'')});
   art.f.forEach((f,i)=>{
    const fig=RS.el('figure',{class:'zoomable'});const im=new Image();im.alt=(art.captions&&art.captions[i])||RS.strip(art.title);im.decoding='async';
    im.onerror=()=>{fig.replaceWith(RS.el('div',{class:'noimg'},['Image unavailable offline. Try again when connected.']))};
    im.src=RS.fileUrl(f,art.f.length>1?600:1400);
    fig.append(im);if(art.captions)fig.append(RS.el('figcaption',{},[art.captions[i]]));
    fig.addEventListener('click',()=>fig.classList.toggle('zoomed'));
    imgs.append(fig);
    RS.credit(f).then(c=>{if(c)credit.append(RS.el('span',{},[(art.captions?art.captions[i]+': ':'Image: ')+c.artist+' · '+c.lic+' · ']),RS.el('a',{href:c.page,target:'_blank',rel:'noopener'},['Wikimedia Commons']),document.createTextNode(' '))});
   });
   media.append(imgs,RS.el('p',{class:'small hint'},['Click an image to zoom; scroll to pan.']));
  }else if(art.q&&!art.doc&&!art.chart){
   const ph=RS.el('div',{class:'noimg'},['Searching Wikimedia Commons…']);media.append(ph);
   RS.imageFor(art,1200).then(r=>{if(!r){ph.textContent='No rights-clear image found for this item yet.';return}const im=new Image();im.alt=art.title;im.src=r.url;im.onerror=()=>{ph.textContent='Image unavailable.'};im.onload=()=>{ph.replaceWith(im)};RS.credit(r.file).then(c=>{if(c)credit.append(RS.el('span',{},['Image: '+c.artist+' · '+c.lic+' · ']),RS.el('a',{href:c.page,target:'_blank',rel:'noopener'},['Wikimedia Commons']))})});
  }else if(art.q&&art.doc){
   RS.imageFor(art,1000).then(r=>{if(!r)return;const im=new Image();im.alt='Related image: '+art.title;im.src=r.url;im.className='extra';im.onload=()=>{media.prepend(im);RS.credit(r.file).then(c=>{if(c)credit.append(RS.el('span',{},['Image: '+c.artist+' · '+c.lic+' · ']),RS.el('a',{href:c.page,target:'_blank',rel:'noopener'},['Wikimedia Commons']))})}});
  }
  if(art.chart&&RS.charts[art.chart])media.append(RS.el('div',{class:'chart',html:RS.charts[art.chart]()}));
  if(art.map)media.append(RS.el('div',{class:'chart',html:routeMap()}));
  if(art.doc){const d=RS.el('details',{class:'doc',open:(!art.f&&!art.chart)||false},[RS.el('summary',{},['Document text / transcript']),RS.el('pre',{},[art.doc])]);media.append(d)}
  if(art.hot){const hl=RS.el('ul',{class:'hotspots'});art.hot.forEach(h=>hl.append(RS.el('li',{},[RS.el('b',{},[h[0]+': ']),h[1]])));media.append(RS.el('div',{},[RS.el('b',{},['Look closer']),hl]))}
  if(!media.children.length)media.append(RS.el('div',{class:'noimg'},['Text exhibit — see the description.']));
 }
 wrap.append(media,info);document.body.append(wrap);
 if(art.sens&&!opts.skipGate&&!RS.S.views.includes('gate-ok'))gate();else build();
 if(art.sens)RS.S.views.includes('gate-ok')||0;
 close.focus();
 wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();RS.closeViewer()}});
 wrap.addEventListener('click',e=>{if(e.target===wrap)RS.closeViewer()});
 if(first){RS.S.seen.push(id);RS.save()}
 addJournal(id,true);
 RS.emit('artwork.viewed',id);
};
RS.skipMark=function(art){if(RS.S.seen.indexOf(art.id)<0)RS.S.seen.push(art.id);RS.save();RS.emit('artwork.viewed',art.id)};
function addJournal(id,quiet){if(RS.S.journal.indexOf(id)<0){RS.S.journal.push(id);RS.save();if(!quiet)RS.toast('Added to Evidence Journal')}}
RS.addJournal=addJournal;
function routeMap(){
 const cities={Chicago:[330,95],Detroit:[385,92],Cleveland:[415,105],Pittsburgh:[440,118],Philadelphia:[485,130],'New York':[505,105]};
 const origins={'Mississippi Delta':[290,265],Alabama:[355,265],Georgia:[405,255],'Carolinas / Virginia':[470,215]};
 const links=[['Mississippi Delta','Chicago'],['Alabama','Detroit'],['Alabama','Pittsburgh'],['Georgia','Philadelphia'],['Carolinas / Virginia','New York'],['Carolinas / Virginia','Philadelphia'],['Georgia','Cleveland']];
 return `<svg viewBox="0 0 560 300" role="img" aria-label="Schematic map of migration routes from the South to Northern cities" xmlns="http://www.w3.org/2000/svg" font-family="system-ui" font-size="11"><rect width="560" height="300" fill="#efe3c6"/><path d="M230 60 L520 70 L540 140 L500 210 L440 290 L260 290 L230 200 Z" fill="#e4d3a8" stroke="#a89060" stroke-width="2"/><line x1="230" y1="170" x2="540" y2="170" stroke="#a33" stroke-dasharray="5 4"/><text x="240" y="162" fill="#a33">Mason–Dixon / Ohio River (approx.)</text>`+
 links.map(l=>`<line x1="${origins[l[0]][0]}" y1="${origins[l[0]][1]}" x2="${cities[l[1]][0]}" y2="${cities[l[1]][1]}" stroke="#1f8a8a" stroke-width="3" opacity=".75"/>`).join('')+
 Object.entries(origins).map(([n,p])=>`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#9b2335"/><text x="${p[0]-30}" y="${p[1]+18}">${n}</text>`).join('')+
 Object.entries(cities).map(([n,p])=>`<rect x="${p[0]-5}" y="${p[1]-5}" width="10" height="10" fill="#222"/><text x="${p[0]-18}" y="${p[1]-10}">${n}</text>`).join('')+`<text x="10" y="20" font-weight="bold" font-size="13">Schematic routes (not to scale)</text></svg>`;
}

// All text dialogs share one pointer and movement policy.
RS.releasePointer=function(){
 const E=window.Engine;if(E){for(const key in E.keys)E.keys[key]=false;E.player.vxs=0;E.player.vys=0;E.player.jumpReq=false;E.moving=false}
 if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
};
/* ---------- Generic overlay for sims/panels ---------- */
RS.overlay=function(title,node,opts){
 opts=opts||{};RS.closeOverlay();
 const o=RS.el('div',{class:'overlay',role:'dialog','aria-modal':'true','aria-label':title});
 const head=RS.el('div',{class:'ov-head'},[RS.el('h2',{class:'pix'},[title]),RS.el('button',{class:'v-close','aria-label':'Close',onclick:()=>RS.closeOverlay()},['✕'])]);
 const body=RS.el('div',{class:'ov-body'});body.append(node);
 o.append(RS.el('div',{class:'ov-card'},[head,body]));document.body.append(o);
 RS._ov={el:o,onClose:opts.onClose,last:document.activeElement};RS.releasePointer();
 o.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();RS.closeOverlay()}});
 const f=o.querySelector('button, input, select');if(f)f.focus();
 return o;
};
RS.closeOverlay=function(){const v=RS._ov;if(v){v.el.remove();RS._ov=null;if(v.onClose)v.onClose();RS.emit('overlay.close')}};
RS.isModal=()=>!!(RS._ov||overlayEl);

/* ---------- quest/progress engine ---------- */
const Q=D.QUESTS.map(q=>({id:q[0],g:q[1],title:q[2],type:q[3],disc:q[4],obj:q[5],reward:q[6],journal:q[7]}));
RS.quests=Q;
RS.questState=id=>RS.S.quests[id]||'undiscovered';
function objDone(o){
 const s=RS.S;
 switch(o.k){
  case 'view':return o.ids.filter(i=>s.seen.includes(i)).length>=o.n;
  case 'act':return !!s.acts[o.id];
  case 'sim':return !!s.sims[o.id];
  case 'station':return s.stations.includes(o.id);
  case 'items':return (D.ITEMS[o.gal]||[]).every(i=>s.items.includes(i[0]));
  case 'stamps':return s.stamps.length>=o.n;
  case 'bib':return s.bib.length>=o.n;
  case 'radio':return s.radio.length>=o.n;
  case 'cite':return s.cited;
  case 'secret':return !!s.secret[o.gal];
 }return false;
}
RS.objDone=objDone;
function discovered(d){
 const s=RS.S;
 switch(d.k){
  case 'zone':return s.visited.includes(d.id);
  case 'view':return s.seen.includes(d.id);
  case 'station':return s.stations.includes(d.id);
  case 'secret':return !!s.secret[d.gal];
  case 'sim':return !!s.sims[d.id];
  case 'stamps':return s.stamps.length>=d.n;
 }return false;
}
RS.checkQuests=function(){
 const s=RS.S;let changed=false;
 Q.forEach(q=>{
  const st=s.quests[q.id];
  if(!st&&discovered(q.disc)){s.quests[q.id]='active';changed=true;RS.toast('New quest discovered: '+q.title,'quest');RS.sfx&&RS.sfx('quest')}
  if(s.quests[q.id]==='active'&&q.obj.every(objDone)){s.quests[q.id]='complete';RS.award('quest:'+q.id,25,'Quest complete: '+q.title);changed=true;RS.sfx&&RS.sfx('done');RS.emit('quest.complete',q.id)}
 });
 if(changed){RS.save();RS.emit('quests.changed')}
};
['artwork.viewed','sim.completed','act.completed','station','item.collected','zone.entered','secret'].forEach(e=>RS.on(e,()=>RS.checkQuests()));
RS.markStation=function(id){if(!RS.S.stations.includes(id)){RS.S.stations.push(id);RS.save()}RS.emit('station',id)};
RS.markSim=function(id,data){RS.S.sims[id]=data||true;RS.save();RS.emit('sim.completed',id)};
RS.markAct=function(id,data){RS.S.acts[id]=data||true;RS.save();RS.emit('act.completed',id)};
RS.collect=function(gal,key){if(!RS.S.items.includes(key)){RS.S.items.push(key);RS.save();RS.sfx&&RS.sfx('item');RS.toast('Item collected: '+(D.ITEMS[gal].find(i=>i[0]===key)||[0,key])[1],'item');
  if((D.ITEMS[gal]||[]).every(i=>RS.S.items.includes(i[0]))&&!RS.S.keys.includes(gal)){RS.S.keys.push(gal);RS.toast('You earned the '+D.KEYS[gal]+'!','done')}
  RS.emit('item.collected',key)}};
})();
