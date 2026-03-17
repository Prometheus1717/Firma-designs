import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";

const USER = { name:'Alex', born:'27 Jun 1997 · 02:30', loc:'Köln, DE', sun:'Cancer',moon:'Aries',asc:'Sagittarius' };

const LINES = [
  { n:'Sun MC',lo:7,c:'#E8A838',desc:'Your Sun Midheaven — the peak of career visibility. Here you are recognized as an authority. Sun in Cancer gives you nurturing intellectual presence that others trust instinctively.',angle:'MC',quality:'thrive' },
  { n:'Mercury MC',lo:9,c:'#5BA8D4',desc:'Mercury Midheaven — your voice carries weight here. Communication, writing, teaching, and strategic thinking flourish. Mercury in Cancer makes your words emotionally resonant.',angle:'MC',quality:'thrive' },
  { n:'Venus IC',lo:-9,c:'#D4729A',desc:'Venus on the IC — this is where your soul feels at home. Deep creative nourishment, beauty in daily life, and emotional ease. Venus in Cancer makes this profoundly safe and nurturing.',angle:'IC',quality:'thrive' },
  { n:'Venus MC',lo:-1,c:'#B8608A',desc:'Venus Midheaven — public magnetism, aesthetic recognition, partnership attraction. You are perceived as charming and creatively compelling in this zone.',angle:'MC',quality:'thrive' },
  { n:'Mars MC',lo:5,c:'#D45050',desc:'Mars Midheaven — raw ambition ignites. Mars in Libra at 3° conjuncts your natal MC almost exactly, making this your most powerful career activation zone on Earth.',angle:'MC',quality:'thrive' },
  { n:'Jupiter DC',lo:135,c:'#8068C0',desc:'Jupiter Descendant — partnerships expand abundantly. Mentors, collaborators, and benefactors appear naturally. Jupiter in Aquarius favors tech-forward, unconventional alliances.',angle:'DC',quality:'thrive' },
  { n:'Saturn ASC',lo:58,c:'#887058',desc:'Saturn Ascendant — heaviness settles on your identity here. You feel older, restricted, burdened. Saturn in Aries suppresses your natural fire and initiative. Best avoided for long stays.',angle:'ASC',quality:'avoid' },
  { n:'Neptune IC',lo:-75,c:'#4868B8',desc:'Neptune on the IC — your sense of home dissolves. Confusion about roots, boundaries blur, deception in domestic matters. Neptune in Capricorn undermines the very structures you build.',angle:'IC',quality:'avoid' },
  { n:'Pluto ASC',lo:-60,c:'#7048A0',desc:'Pluto Ascendant — identity-level intensity. Power struggles, forced transformation, sometimes danger. Pluto in Sagittarius challenges your worldview and belief system at the deepest level.',angle:'ASC',quality:'avoid' },
];

const PLANETS = '☉ Cancer 6°04\' · ☽ Aries 8°31\' · ☿ Cancer 8°25\' · ♀ Cancer 28°42\' · ♂ Libra 3°47\' · ♃ Aquarius 21°26\'℞ · ♄ Aries 19°20\' · ♅ Aquarius 7°53\'℞ · ♆ Capricorn 29°11\'℞ · ♇ Sagittarius 3°22\'℞ · ASC Sagittarius 4°33\' · MC Libra 1°03\'';

const ALL_CITIES = [
  [51.51,-.13,'London'],[48.86,2.35,'Paris'],[50.94,6.96,'Köln'],[52.52,13.4,'Berlin'],
  [48.14,11.58,'München'],[50.11,8.68,'Frankfurt'],[53.55,9.99,'Hamburg'],[51.23,6.78,'Düsseldorf'],
  [48.78,9.18,'Stuttgart'],[47.37,8.54,'Zürich'],[46.2,6.14,'Genève'],[48.21,16.37,'Wien'],
  [50.08,14.44,'Praha'],[52.23,21.01,'Warszawa'],[47.5,19.04,'Budapest'],[44.43,26.1,'Bucureşti'],
  [42.7,23.32,'Sofia'],[37.98,23.73,'Athina'],[41.01,28.98,'İstanbul'],[40.42,-3.7,'Madrid'],
  [41.39,2.17,'Barcelona'],[39.47,-.38,'Valencia'],[38.72,-9.14,'Lisboa'],[41.16,-8.63,'Porto'],
  [45.46,9.19,'Milano'],[41.9,12.5,'Roma'],[43.77,11.25,'Firenze'],[40.85,14.27,'Napoli'],
  [50.85,4.35,'Bruxelles'],[52.37,4.9,'Amsterdam'],[51.92,4.48,'Rotterdam'],
  [53.35,-6.26,'Dublin'],[55.95,-3.19,'Edinburgh'],[53.48,-2.24,'Manchester'],
  [59.33,18.07,'Stockholm'],[59.91,10.75,'Oslo'],[55.68,12.57,'København'],[60.17,24.94,'Helsinki'],
  [56.95,24.11,'Riga'],[54.69,25.28,'Vilnius'],[59.44,24.75,'Tallinn'],
  [55.75,37.62,'Moscow'],[50.45,30.52,'Kyiv'],[53.9,27.57,'Minsk'],
  [40.71,-74.01,'New York'],[34.05,-118.24,'Los Angeles'],[41.88,-87.63,'Chicago'],
  [29.76,-95.37,'Houston'],[33.45,-112.07,'Phoenix'],[39.74,-104.99,'Denver'],
  [37.77,-122.42,'San Francisco'],[47.61,-122.33,'Seattle'],[25.76,-80.19,'Miami'],
  [38.91,-77.04,'Washington DC'],[42.36,-71.06,'Boston'],[36.17,-115.14,'Las Vegas'],
  [32.72,-117.16,'San Diego'],[30.27,-97.74,'Austin'],[45.5,-73.57,'Montréal'],
  [43.65,-79.38,'Toronto'],[49.28,-123.12,'Vancouver'],[51.05,-114.07,'Calgary'],
  [19.43,-99.13,'México City'],[14.63,-90.51,'Guatemala'],[9.93,-84.08,'San José CR'],
  [4.71,-74.07,'Bogotá'],[-.18,-78.47,'Quito'],[-12.05,-77.04,'Lima'],
  [-33.45,-70.67,'Santiago'],[-34.6,-58.38,'Buenos Aires'],[-22.91,-43.17,'Rio de Janeiro'],
  [-23.55,-46.63,'São Paulo'],[-15.79,-47.88,'Brasília'],
  [35.69,51.39,'Tehran'],[33.31,44.37,'Baghdad'],[24.71,46.68,'Riyadh'],
  [25.2,55.27,'Dubai'],[21.42,39.83,'Mecca'],[31.95,35.93,'Amman'],
  [33.89,35.5,'Beirut'],[32.08,34.78,'Tel Aviv'],[40.18,44.51,'Yerevan'],
  [39.92,32.85,'Ankara'],[38.42,27.14,'İzmir'],
  [30.04,31.24,'Cairo'],[36.75,3.04,'Algiers'],[33.97,-6.85,'Rabat'],
  [6.52,3.38,'Lagos'],[-1.29,36.82,'Nairobi'],[-33.92,18.42,'Cape Town'],
  [-26.2,28.04,'Johannesburg'],[9.02,38.75,'Addis Ababa'],[5.56,-.19,'Accra'],
  [39.91,116.39,'Beijing'],[31.23,121.47,'Shanghai'],[22.32,114.17,'Hong Kong'],
  [23.13,113.26,'Guangzhou'],[30.57,104.07,'Chengdu'],
  [35.68,139.69,'Tokyo'],[34.69,135.5,'Osaka'],[35.01,135.77,'Kyoto'],
  [37.57,126.98,'Seoul'],[35.18,129.08,'Busan'],[25.03,121.57,'Taipei'],
  [1.35,103.82,'Singapore'],[13.76,100.5,'Bangkok'],[21.03,105.85,'Hanoi'],
  [10.82,106.63,'Ho Chi Minh'],[14.6,120.98,'Manila'],[-6.21,106.85,'Jakarta'],
  [3.14,101.69,'Kuala Lumpur'],
  [28.61,77.21,'Delhi'],[19.08,72.88,'Mumbai'],[12.97,77.59,'Bengaluru'],
  [22.57,88.36,'Kolkata'],[27.18,84.99,'Kathmandu'],[33.69,73.04,'Islamabad'],
  [-33.87,151.21,'Sydney'],[-37.81,144.96,'Melbourne'],[-27.47,153.03,'Brisbane'],
  [-31.95,115.86,'Perth'],[-36.85,174.76,'Auckland'],
  [64.15,-21.94,'Reykjavík'],[34.53,69.17,'Kabul'],[41.3,69.28,'Tashkent'],
];

const CP = [
  [[-9.5,37],[-5.5,36],[-2,36.7],[0,40.5],[3,43],[-9,43],[-9,41],[-9.5,37]],
  [[3,43],[7.5,43.7],[7,44],[8,48],[7,49],[2.5,51],[0,49.5],[-4,48.5],[-1,46],[3,43]],
  [[6,47.5],[6,51],[9.5,55],[12,54],[15,49],[13,47.5],[6,47.5]],
  [[-6,50],[-3.5,52],[-3,54],[-5,57],[-3,58.5],[0,57.5],[1.5,53],[1,51],[-1,50.5],[-6,50]],
  [[-10,51.5],[-6,51.5],[-6,53.5],[-8,54.5],[-10,53.5],[-10,51.5]],
  [[7,44],[13.5,45.5],[14,46],[15,42],[16,39],[13,38],[11,38.5],[10,42.5],[7,44]],
  [[5,58],[12,66],[25,71],[30,70],[18,60],[5,58]],
  [[12,56],[24,66],[18,70],[12,66],[11,58],[12,56]],
  [[14.5,54],[23,54],[24,50],[18,49.5],[14.5,54]],
  [[26,42],[44,40],[44,38],[36,36.5],[28,41],[26,42]],
  [[24,52],[38,48],[30,46],[24,50],[24,52]],
  [[28,60],[90,55],[145,50],[130,48],[100,50],[44,50],[40,60],[100,65],[180,65],[180,55],[140,55],[130,55]],
  [[75,40],[100,40],[117,23],[122,30],[110,42],[90,44],[75,40]],
  [[130,31],[142,43],[141,45],[137,37],[130,31]],
  [[68,24],[77,8],[80,12],[88,22],[80,30],[75,35],[68,24]],
  [[44,40],[60,35],[57,28],[48,30],[44,40]],
  [[36,28],[55,22],[52,27],[42,32],[36,28]],
  [[-17,14.7],[3,36],[10,37],[32,31.5],[51,11],[42,3],[30,-33],[10,-10],[-10,6.5],[-17,14.7]],
  [[-140,60],[-122,37],[-97,26],[-82,25],[-60,47],[-80,64],[-140,60]],
  [[-97,26],[-87,18],[-97,22],[-97,26]],
  [[-80,10],[-50,0],[-38,-12],[-70,-51],[-75,-45],[-80,-3],[-80,10]],
  [[114,-22],[153,-28],[142,-11],[119,-20],[114,-22]],
];

const COL = { thrive:'#00D88A', avoid:'#F04060', neutral:'#D8A030' };

function getCitiesOnLines(lines, cities, threshold=3.5) {
  const r = [], seen = new Set();
  lines.forEach(l => {
    cities.forEach(([la,lo,name]) => {
      const d = Math.min(Math.abs(lo-l.lo), 360-Math.abs(lo-l.lo));
      if (d <= threshold && !seen.has(name)) {
        seen.add(name);
        r.push({ la,lo,name,line:l.n,lc:l.c,q:l.quality,dist:d,desc:l.desc });
      }
    });
  });
  return r.sort((a,b)=>a.dist-b.dist);
}

function cityReading(c) {
  if (c.q === 'thrive') return `${c.name} lies on your ${c.line} line (${c.dist.toFixed(1)}° off). This is a zone of activation — ${c.line.includes('Sun')?'career authority and recognition':'creative energy and partnership attraction'} are enhanced here. Spending time in ${c.name} could amplify your professional visibility and sense of purpose.`;
  return `${c.name} falls on your ${c.line} line (${c.dist.toFixed(1)}° off). This is a zone of challenge — ${c.line.includes('Saturn')?'restriction and heaviness':c.line.includes('Neptune')?'confusion and dissolved boundaries':'intense power dynamics'} may surface here. Short visits are fine, but long-term residence could drain your energy.`;
}

export default function App() {
  const canvasRef = useRef(null);
  const S = useRef({ rot:[-7,-25],scale:280,drag:false,auto:true,raf:0,lx:0,ly:0,wg:null,fd:false,dirty:true,lastDraw:0 });
  const [tab,setTab] = useState('thrive');
  const [clock,setClock] = useState('');
  const [popup,setPopup] = useState(null);
  const [cityPop,setCityPop] = useState(null);
  const [w,setW] = useState(900);
  const [showProf,setShowProf] = useState(false);

  useEffect(()=>{const t=setInterval(()=>setClock(new Date().toUTCString().replace(/.*,\s/,'').replace(' GMT','')+' UTC'),1000);return()=>clearInterval(t)},[]);
  useEffect(()=>{const h=()=>{setW(window.innerWidth);S.current.dirty=true};h();window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[]);

  const onLines = useMemo(()=>getCitiesOnLines(LINES,ALL_CITIES,3.5),[]);
  const mob = w < 900;

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const par = canvas.parentElement;
    const W = par.clientWidth, H = par.clientHeight;
    if (!W||!H) return;
    const dpr = Math.min(window.devicePixelRatio||1,2);
    if (canvas.width!==W*dpr) { canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    const s=S.current, cx=W/2, cy=H/2;
    const proj=d3.geoOrthographic().scale(s.scale).translate([cx,cy]).rotate(s.rot).clipAngle(90);
    const path=d3.geoPath(proj,ctx);
    const center=[-s.rot[0],-s.rot[1]];

    // Atmosphere
    const ag=ctx.createRadialGradient(cx,cy,s.scale*.92,cx,cy,s.scale*1.08);
    ag.addColorStop(0,'transparent'); ag.addColorStop(1,'rgba(0,216,138,.03)');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(cx,cy,s.scale*1.08,0,Math.PI*2); ctx.fill();

    // Ocean
    ctx.fillStyle='#0B1420'; ctx.beginPath(); ctx.arc(cx,cy,s.scale,0,Math.PI*2); ctx.fill();

    // Graticule
    ctx.strokeStyle='#142030'; ctx.lineWidth=.3;
    ctx.beginPath(); path(d3.geoGraticule().step([20,20])()); ctx.stroke();

    // Countries
    ctx.fillStyle='#0F1C28'; ctx.strokeStyle='#1C3040'; ctx.lineWidth=.6;
    CP.forEach(p=>{ctx.beginPath();path({type:'Feature',geometry:{type:'Polygon',coordinates:[p]}});ctx.fill();ctx.stroke()});
    if(s.wg) s.wg.forEach(f=>{ctx.beginPath();path(f);ctx.fill();ctx.stroke()});

    // Sphere border
    ctx.strokeStyle='#1C3040'; ctx.lineWidth=.8;
    ctx.beginPath(); ctx.arc(cx,cy,s.scale,0,Math.PI*2); ctx.stroke();

    // Astro lines
    LINES.forEach(l=>{
      const geo={type:'LineString',coordinates:Array.from({length:181},(_,i)=>[l.lo,-90+i])};
      ctx.strokeStyle=l.c; ctx.lineWidth=s.scale>400?2.5:1.8; ctx.globalAlpha=.6;
      ctx.beginPath(); path(geo); ctx.stroke(); ctx.globalAlpha=1;
    });

    // Cities on lines
    onLines.forEach(c=>{
      if(d3.geoDistance([c.lo,c.la],center)>Math.PI/2) return;
      const p=proj([c.lo,c.la]); if(!p) return;
      const r=s.scale>400?4:2.5;
      ctx.fillStyle=c.lc; ctx.globalAlpha=.9;
      ctx.beginPath(); ctx.arc(p[0],p[1],r,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      if(s.scale>250){
        const fs=s.scale>500?10:s.scale>350?8:7;
        ctx.font=`600 ${fs}px JetBrains Mono`;
        ctx.fillStyle='#D0DDE8';
        ctx.textAlign='left';
        ctx.fillText(c.name,p[0]+r+4,p[1]+3);
      }
    });

    // Köln home
    if(d3.geoDistance([6.96,50.94],center)<Math.PI/2){
      const p=proj([6.96,50.94]); if(p){
        const t=(Date.now()%2200)/2200;
        ctx.strokeStyle='#00D88A';ctx.lineWidth=1.2;ctx.globalAlpha=.4*(1-t);
        ctx.beginPath();ctx.arc(p[0],p[1],6+t*14,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1;ctx.fillStyle='#00D88A';
        ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fill();
        ctx.font='bold 11px JetBrains Mono';ctx.fillStyle='#00D88A';
        ctx.fillText('KÖLN ★',p[0]+10,p[1]+4);
      }
    }
  },[onLines]);

  // Topo decoder
  function topoF(t,n){try{const o=t.objects[n];if(!o)return null;const a=t.arcs,tf=t.transform;function da(i){const ar=a[i<0?~i:i];const c=[];let x=0,y=0;ar.forEach(p=>{x+=p[0];y+=p[1];c.push([x*tf.scale[0]+tf.translate[0],y*tf.scale[1]+tf.translate[1]])});return i<0?c.reverse():c}function dr(r){let c=[];r.forEach(i=>c=c.concat(da(i)));return c}return o.geometries.map(g=>{if(g.type==='Polygon')return{type:'Feature',geometry:{type:'Polygon',coordinates:g.arcs.map(dr)}};if(g.type==='MultiPolygon')return{type:'Feature',geometry:{type:'MultiPolygon',coordinates:g.arcs.map(p=>p.map(dr))}};return null}).filter(Boolean)}catch(e){return null}}

  useEffect(()=>{
    const s=S.current;
    if(!s.fd){s.fd=true;try{fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>{if(r.ok)return r.json();throw 0}).then(t=>{s.wg=topoF(t,'countries');s.dirty=true}).catch(()=>{})}catch(e){}}

    function loop(ts){
      if(s.auto&&!s.drag) { s.rot=[s.rot[0]-.06,s.rot[1]]; s.dirty=true; }
      if(s.dirty || (ts - s.lastDraw) > 100) { draw(); s.dirty=false; s.lastDraw=ts; }
      s.raf=requestAnimationFrame(loop);
    }
    s.raf=requestAnimationFrame(loop);

    const c=canvasRef.current; if(!c) return;
    const dn=e=>{s.drag=true;s.auto=false;const t=e.touches?e.touches[0]:e;s.lx=t.clientX;s.ly=t.clientY};
    const mv=e=>{if(!s.drag)return;const t=e.touches?e.touches[0]:e;s.rot=[s.rot[0]+(t.clientX-s.lx)*.25,Math.max(-70,Math.min(70,s.rot[1]-(t.clientY-s.ly)*.25))];s.lx=t.clientX;s.ly=t.clientY;s.dirty=true};
    const up=()=>{s.drag=false;setTimeout(()=>{s.auto=true},4000)};
    const wh=e=>{e.preventDefault();s.scale=Math.max(180,Math.min(1800,s.scale*(e.deltaY<0?1.08:.93)));s.auto=false;s.dirty=true;clearTimeout(s._z);s._z=setTimeout(()=>{s.auto=true},4000)};
    const dbl=e=>{e.preventDefault();const r=c.getBoundingClientRect();const proj=d3.geoOrthographic().scale(s.scale).translate([r.width/2,r.height/2]).rotate(s.rot);const co=proj.invert([e.clientX-r.left,e.clientY-r.top]);if(co){s.rot=[-co[0],-co[1]];s.scale=Math.min(1800,s.scale*1.5);s.auto=false;s.dirty=true;setTimeout(()=>{s.auto=true},6000)}};

    const click=e=>{
      const r=c.getBoundingClientRect();const proj=d3.geoOrthographic().scale(s.scale).translate([r.width/2,r.height/2]).rotate(s.rot);
      const mx=e.clientX-r.left,my=e.clientY-r.top;
      let closest=null,minD=20;
      onLines.forEach(ci=>{
        const p=proj([ci.lo,ci.la]);if(!p)return;
        const d=Math.hypot(p[0]-mx,p[1]-my);
        if(d<minD){minD=d;closest=ci}
      });
      if(closest) setCityPop(closest); else setCityPop(null);
    };

    c.addEventListener('mousedown',dn);window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);
    c.addEventListener('touchstart',dn,{passive:true});c.addEventListener('touchmove',mv,{passive:true});c.addEventListener('touchend',up,{passive:true});
    c.addEventListener('wheel',wh,{passive:false});c.addEventListener('dblclick',dbl);c.addEventListener('click',click);
    const rs=()=>{s.dirty=true};window.addEventListener('resize',rs);

    return()=>{cancelAnimationFrame(s.raf);c.removeEventListener('mousedown',dn);window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);c.removeEventListener('touchstart',dn);c.removeEventListener('touchmove',mv);c.removeEventListener('touchend',up);c.removeEventListener('wheel',wh);c.removeEventListener('dblclick',dbl);c.removeEventListener('click',click);window.removeEventListener('resize',rs)};
  },[draw,onLines]);

  const flyTo=(la,lo)=>{const s=S.current;s.auto=false;s.rot=[-lo,-la];s.scale=Math.max(s.scale,450);s.dirty=true;setTimeout(()=>{s.auto=true},6000)};

  const thriveC=onLines.filter(c=>c.q==='thrive'), avoidC=onLines.filter(c=>c.q==='avoid');
  const filteredTab=tab==='thrive'?thriveC:tab==='avoid'?avoidC:onLines;
  const bestCities=onLines.filter(c=>c.q==='thrive').slice(0,5);

  const F={fontFamily:'JetBrains Mono,monospace'};

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'#0A1018',color:'#D0DDE8',fontFamily:'Instrument Sans,sans-serif',overflow:'hidden'}}>
      {/* TOPBAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:38,minHeight:38,background:'#0D1520',borderBottom:'1px solid #1A2840',zIndex:300,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{...F,fontSize:12,fontWeight:700,color:'#00D88A',letterSpacing:3}}>ASTROCARTO</span>
          <div style={{width:1,height:16,background:'#1A2840'}}/>
          <span style={{...F,fontSize:9,color:'#00D88A',display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#00D88A',boxShadow:'0 0 8px #00D88A'}}/>LIVE
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {!mob&&<span style={{...F,fontSize:9,color:'#5A7088'}}>{clock}</span>}
          <div onClick={()=>setShowProf(!showProf)} style={{...F,fontSize:9,color:'#8098B0',cursor:'pointer',background:'#101C28',padding:'4px 10px',borderRadius:4,border:'1px solid #1A2840',position:'relative'}}>
            ◉ {USER.name}
            {showProf&&<div style={{position:'absolute',top:32,right:0,background:'#0D1520',border:'1px solid #1A2840',borderRadius:8,padding:14,minWidth:220,zIndex:600,boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#D0DDE8',marginBottom:6}}>{USER.name}</div>
              <div style={{...F,fontSize:10,color:'#8098B0',marginBottom:3}}>Born: {USER.born}</div>
              <div style={{...F,fontSize:10,color:'#8098B0',marginBottom:6}}>Location: {USER.loc}</div>
              <div style={{...F,fontSize:9,color:'#5A7088'}}>☉ {USER.sun} · ☽ {USER.moon} · ASC {USER.asc}</div>
            </div>}
          </div>
        </div>
      </div>

      {/* PLANET TICKER */}
      <div style={{height:24,minHeight:24,background:'#0B1218',borderBottom:'1px solid #14202C',display:'flex',alignItems:'center',overflow:'hidden',flexShrink:0}}>
        <div style={{display:'flex',gap:20,whiteSpace:'nowrap',...F,fontSize:9,animation:'ts 80s linear infinite'}}>
          {[PLANETS,PLANETS].map((t,i)=><span key={i} style={{color:'#E8A838',padding:'0 20px'}}>{t}</span>)}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* LEFT SIDEBAR */}
        {!mob&&<div style={{width:200,minWidth:200,background:'#0D1520',borderRight:'1px solid #1A2840',overflowY:'auto',flexShrink:0,display:'flex',flexDirection:'column'}}>
          <div style={{...F,fontSize:9,fontWeight:600,color:'#5A7088',letterSpacing:2,padding:'12px 12px 6px'}}>PLANETARY LINES</div>
          {LINES.map((l,i)=>(
            <div key={i} onClick={()=>setPopup(popup===i?null:i)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',cursor:'pointer',borderBottom:'1px solid #14202C',background:popup===i?'#101C28':'transparent'}}>
              <div style={{width:14,height:3,borderRadius:2,background:l.c,flexShrink:0}}/>
              <span style={{...F,fontSize:9,color:'#B0C0D0',flex:1}}>{l.n}</span>
              <span style={{...F,fontSize:8,color:l.quality==='thrive'?'#00D88A':'#F04060'}}>{l.angle}</span>
            </div>
          ))}
          <div style={{...F,fontSize:9,fontWeight:600,color:'#5A7088',letterSpacing:2,padding:'12px 12px 6px',borderTop:'1px solid #1A2840',marginTop:2}}>ZONES</div>
          {[['thrive','Thrive Zone','Cities that amplify your strengths'],['avoid','Caution Zone','Cities that challenge or drain'],['neutral','Neutral','No major line influence']].map(([t,l,d])=>(
            <div key={t} style={{padding:'5px 12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,...F,fontSize:9,color:'#8098B0'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:COL[t]}}/>{l}
              </div>
              <div style={{...F,fontSize:7,color:'#3A5068',marginLeft:15,marginTop:1}}>{d}</div>
            </div>
          ))}
          {/* TOP 5 CITIES */}
          <div style={{...F,fontSize:9,fontWeight:600,color:'#5A7088',letterSpacing:2,padding:'12px 12px 6px',borderTop:'1px solid #1A2840',marginTop:2}}>TOP CITIES FOR YOU</div>
          {bestCities.map((c,i)=>(
            <div key={i} onClick={()=>flyTo(c.la,c.lo)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',cursor:'pointer',...F,fontSize:9}}>
              <span style={{color:'#00D88A',fontWeight:700,width:14}}>{i+1}.</span>
              <span style={{color:'#B0C0D0'}}>{c.name}</span>
              <span style={{color:'#3A5068',marginLeft:'auto',fontSize:8}}>{c.line}</span>
            </div>
          ))}
          <div style={{...F,fontSize:8,color:'#1A2840',padding:'12px',marginTop:'auto',lineHeight:1.6}}>
            Drag = Rotate · Scroll = Zoom<br/>Double-click = Zoom to point<br/>Click city = Reading
          </div>
        </div>}

        {/* GLOBE */}
        <div style={{flex:1,position:'relative',overflow:'hidden',background:'#0A1018',cursor:'grab'}}>
          <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%',touchAction:'none'}}/>
          {/* Line info popup */}
          {typeof popup==='number'&&(
            <div style={{position:'absolute',top:mob?8:50,left:mob?8:8,right:mob?8:'auto',width:mob?'auto':320,background:'rgba(13,21,32,.97)',border:'1px solid #1A2840',borderRadius:8,padding:16,zIndex:100,boxShadow:'0 12px 40px rgba(0,0,0,.5)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:20,height:3,borderRadius:2,background:LINES[popup].c}}/>
                <span style={{...F,fontSize:13,fontWeight:700,color:LINES[popup].c}}>{LINES[popup].n}</span>
                <span style={{...F,fontSize:9,color:'#5A7088'}}>{LINES[popup].angle} · {LINES[popup].lo}°</span>
                <span onClick={()=>setPopup(null)} style={{marginLeft:'auto',cursor:'pointer',...F,fontSize:14,color:'#5A7088'}}>✕</span>
              </div>
              <div style={{fontSize:13,color:'#8098B0',lineHeight:1.8}}>{LINES[popup].desc}</div>
              <div style={{...F,fontSize:9,color:'#3A5068',marginTop:10}}>Cities: {onLines.filter(c=>c.line===LINES[popup].n).map(c=>c.name).join(' · ')}</div>
            </div>
          )}
          {/* City reading popup */}
          {cityPop&&(
            <div style={{position:'absolute',bottom:mob?8:16,right:mob?8:16,left:mob?8:'auto',width:mob?'auto':340,background:'rgba(13,21,32,.97)',border:`1px solid ${cityPop.lc}30`,borderRadius:8,padding:16,zIndex:100,boxShadow:'0 12px 40px rgba(0,0,0,.5)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:cityPop.lc}}/>
                <span style={{...F,fontSize:14,fontWeight:700,color:'#D0DDE8'}}>{cityPop.name}</span>
                <span style={{...F,fontSize:9,fontWeight:700,color:cityPop.q==='thrive'?COL.thrive:COL.avoid,marginLeft:'auto'}}>{cityPop.q==='thrive'?'THRIVE':'CAUTION'}</span>
                <span onClick={()=>setCityPop(null)} style={{cursor:'pointer',...F,fontSize:14,color:'#5A7088',marginLeft:8}}>✕</span>
              </div>
              <div style={{...F,fontSize:9,color:cityPop.lc,marginBottom:6}}>{cityPop.line} · {cityPop.dist.toFixed(1)}° from line</div>
              <div style={{fontSize:12,color:'#8098B0',lineHeight:1.7}}>{cityReading(cityPop)}</div>
            </div>
          )}
          {/* Mobile legend toggle */}
          {mob&&<div style={{position:'absolute',top:8,left:8,zIndex:50}}>
            <div onClick={()=>setPopup(popup==='leg'?null:'leg')} style={{...F,fontSize:9,color:'#00D88A',background:'rgba(13,21,32,.95)',border:'1px solid #1A2840',borderRadius:4,padding:'6px 10px',cursor:'pointer'}}>☰ LINES</div>
            {popup==='leg'&&<div style={{background:'rgba(13,21,32,.97)',border:'1px solid #1A2840',borderRadius:6,padding:10,marginTop:4,minWidth:180}}>
              {LINES.map((l,i)=>(<div key={i} onClick={e=>{e.stopPropagation();setPopup(i)}} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',cursor:'pointer'}}>
                <div style={{width:12,height:2.5,background:l.c,borderRadius:1}}/><span style={{...F,fontSize:9,color:'#B0C0D0'}}>{l.n}</span>
              </div>))}
            </div>}
          </div>}
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div style={{minHeight:mob?165:190,maxHeight:mob?165:190,background:'#0D1520',borderTop:'1px solid #1A2840',display:'flex',flexShrink:0,zIndex:200}}>
        {/* Left: Thrive/Neutral/Avoid */}
        <div style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #1A2840',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'1px solid #14202C',flexShrink:0}}>
            {['thrive','avoid','all'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1,background:tab===t?'#101C28':'transparent',border:'none',
                borderBottom:tab===t?`2px solid ${t==='thrive'?COL.thrive:t==='avoid'?COL.avoid:'#5A7088'}`:'2px solid transparent',
                color:tab===t?(t==='thrive'?COL.thrive:t==='avoid'?COL.avoid:'#B0C0D0'):'#3A5068',
                cursor:'pointer',padding:mob?'5px 0':'6px 0',...F,fontSize:mob?8:9,fontWeight:700,letterSpacing:1}}>
                {t==='thrive'?`▲ THRIVE (${thriveC.length})`:t==='avoid'?`▼ AVOID (${avoidC.length})`:`ALL (${onLines.length})`}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {filteredTab.map((c,i)=>(
              <div key={i} onClick={()=>flyTo(c.la,c.lo)} style={{display:'flex',padding:'5px 12px',borderBottom:'1px solid #14202C',cursor:'pointer',gap:7,alignItems:'center'}}>
                <div style={{width:3,height:20,borderRadius:1,background:c.lc,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:11,fontWeight:600,color:'#D0DDE8'}}>{c.name}</span>
                    <span style={{...F,fontSize:7,color:c.lc,background:c.lc+'15',padding:'1px 5px',borderRadius:2}}>{c.line}</span>
                    <span style={{...F,fontSize:8,color:'#3A5068',marginLeft:'auto'}}>{c.dist.toFixed(1)}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: On Your Lines summary (desktop) */}
        {!mob&&<div style={{width:280,minWidth:280,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{...F,fontSize:9,fontWeight:600,color:'#5A7088',letterSpacing:1.5,padding:'8px 12px',borderBottom:'1px solid #14202C'}}>
            ON YOUR LINES — {onLines.length} CITIES
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
            {LINES.map((l,i)=>{
              const cities=onLines.filter(c=>c.line===l.n);
              if(!cities.length)return null;
              return(
                <div key={i} style={{padding:'4px 12px',borderBottom:'1px solid #0F1820'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                    <div style={{width:10,height:2,background:l.c,borderRadius:1}}/>
                    <span style={{...F,fontSize:8,color:'#8098B0',fontWeight:600}}>{l.n}</span>
                    <span style={{...F,fontSize:7,color:'#3A5068',marginLeft:'auto'}}>{cities.length} cities</span>
                  </div>
                  <div style={{...F,fontSize:8,color:'#5A7088',lineHeight:1.5}}>{cities.map(c=>c.name).join(' · ')}</div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      {/* BOTTOM TICKER */}
      <div style={{height:22,minHeight:22,background:'#0A1018',borderTop:'1px solid #14202C',display:'flex',alignItems:'center',overflow:'hidden',flexShrink:0}}>
        <div style={{display:'flex',gap:24,whiteSpace:'nowrap',...F,fontSize:8,animation:'ts 55s linear infinite'}}>
          {[...Array(2)].flatMap(()=>[
            `★ Best city: ${bestCities[0]?.name} (${bestCities[0]?.line})`,
            `▲ ${thriveC.length} cities on thrive lines`,
            `▼ ${avoidC.length} cities on caution lines`,
            `◉ ${onLines.length} total cities on your natal lines`,
            `☉ Sun MC at ${LINES[0].lo}°E — career power zone`,
            `♀ Venus IC at ${LINES[2].lo}°W — soul home zone`,
            `♂ Mars MC at ${LINES[4].lo}°E — ambition corridor`,
          ]).map((t,i)=>(
            <span key={i} style={{color:t.startsWith('▼')?'#F04060':t.startsWith('▲')?'#00D88A':'#5A7088',padding:'0 4px'}}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
