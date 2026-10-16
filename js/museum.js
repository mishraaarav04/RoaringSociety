/* Presentation only. Keep the historical data, floor plan and interactions intact. */
(function(){
'use strict';
let seed=1920;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// Replace the original square interior columns at the same footprints.
Props.columns=function(g){};
const build=Engine.build;
Engine.build=function(){build();const scene=Engine._.scene;
 const brass=new THREE.MeshStandardMaterial({color:0xd9c398,map:RS.museumMaps.brass,metalness:.65,roughness:.38});
 const limestone=new THREE.MeshStandardMaterial({color:0xeee8dc,map:RS.museumMaps.stone,roughness:.62});
 const decorations=[];
 const bulb=new THREE.MeshStandardMaterial({color:0xffe4ad,emissive:0xffce85,emissiveIntensity:.65,roughness:.35});
 function add(geo,mat,px,py,pz){const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);scene.add(m);decorations.push(m);return m}
 const foliage=new THREE.MeshStandardMaterial({color:0x405f39,roughness:.9,side:THREE.DoubleSide});
 for(const [px,pz] of Props.visualPlants||[]){
  add(new THREE.CylinderGeometry(.24,.17,.43,24),brass,px,.215,pz);
  const leaves=foliage;
  for(let k=0;k<12;k++){const a=k*Math.PI*2/12;const stem=add(new THREE.CylinderGeometry(.009,.014,.85,6),leaves,px+Math.cos(a)*.1,.78,pz+Math.sin(a)*.1);stem.rotation.z=Math.cos(a)*.35;stem.rotation.x=Math.sin(a)*.35;
   const leaf=add(new THREE.SphereGeometry(1,12,8),leaves,px+Math.cos(a)*.25,1+random()*.3,pz+Math.sin(a)*.25);leaf.scale.set(.08,.34,.025);leaf.rotation.z=-Math.cos(a)*.8;leaf.rotation.x=Math.sin(a)*.8;
  }
 }
 for(let g=0;g<=7;g++){const [ox,oy]=World.ORIGIN[g];
  // Slender structural columns sit under the existing mezzanine edge.
  for(const [lx,ly] of [[10,4],[16,4],[4,10],[4,16],[10,16],[16,10]]){
   const px=ox+lx,pz=oy+ly;

   add(new THREE.CylinderGeometry(.19,.24,4.45,24),limestone,px,2.45,pz);
   for(const h of [.15,4.6])add(new THREE.CylinderGeometry(.33,.33,.25,24),limestone,px,h,pz);
   add(new THREE.CylinderGeometry(.26,.26,.07,24),brass,px,.32,pz);
   World.addSolid({x0:px-.36,x1:px+.36,y0:pz-.36,y1:pz+.36,b:0,t:4.75,kind:'column'});
  }
  const px=ox+10,pz=oy+10;
  add(new THREE.CylinderGeometry(.025,.025,1.6,12),brass,px,8.9,pz);
  const ring=add(new THREE.TorusGeometry(1.2,.035,8,48),brass,px,8.1,pz);ring.rotation.x=Math.PI/2;
  for(let k=0;k<8;k++){const a=k*Math.PI/4,xx=px+Math.cos(a)*1.2,zz=pz+Math.sin(a)*1.2;
   add(new THREE.CylinderGeometry(.11,.17,.28,16),bulb,xx,8.25,zz);
   add(new THREE.CylinderGeometry(.025,.025,.35,8),brass,xx,8,zz);
  }
  const light=new THREE.PointLight(0xffdcaa,.5,17,2);light.position.set(px,7.7,pz);light.visible=g<2;scene.add(light);(Engine._.galleryLights||(Engine._.galleryLights=[])).push(light);
 }
 // The makers’ signature is only discoverable inside the hidden Archive Stacks.
 const [mx,my]=World.ORIGIN[6],c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
 ctx.fillStyle='#302d21';ctx.fillRect(0,0,1024,512);ctx.strokeStyle='#b9a172';ctx.lineWidth=4;ctx.strokeRect(16,16,992,480);ctx.fillStyle='#e8dbb6';ctx.textAlign='center';ctx.font='600 38px "Libre Franklin",Arial';ctx.fillText('THE MAKERS’ SIGNATURE',512,85);
 ctx.font='32px "Libre Franklin",Arial';['Anish Mhaskar','Aarav Mishra','Manvi Mishra','Myra Mehrotra'].forEach((name,k)=>ctx.fillText(name,512,170+k*65));
 const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.45,.725),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));plaque.position.set(mx+2.8,1.65,my+4.58);plaque.rotation.y=Math.PI;scene.add(plaque);
 const makers={id:'makers',kind:'station',gal:6,x:mx+2.8,y:my+4.45,zc:1.65,label:'Read the makers’ signature',pick:.55,reach:2.4,visible:!!RS.S.secretOpen[6],mesh:plaque};Engine.sprites.push(makers);Engine.stationSprites.makers=makers;plaque.visible=makers.visible;
 // Batch stationary details by material to keep gallery draw calls low.
 const batches=new Map();
 decorations.forEach(m=>{m.updateMatrix();const geo=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());geo.applyMatrix4(m.matrix);let b=batches.get(m.material);if(!b){b={position:[],normal:[],uv:[]};batches.set(m.material,b)}for(const key of ['position','normal','uv']){const a=geo.getAttribute(key);if(a)for(const v of a.array)b[key].push(v)}scene.remove(m);geo.dispose()});
 batches.forEach((b,material)=>{const geo=new THREE.BufferGeometry();for(const key of ['position','normal','uv'])geo.setAttribute(key,new THREE.Float32BufferAttribute(b[key],key==='uv'?2:3));geo.computeBoundingSphere();scene.add(new THREE.Mesh(geo,material))});
};
})();
