import { useRef, useEffect, useCallback, useState } from 'react';
import { geoOrthographic, geoEquirectangular, geoPath, geoGraticule, geoDistance } from 'd3-geo';

// All polygon rings use CCW winding (GeoJSON right-hand rule) so D3 fills correctly
const CP = [
  [[-9.5,37],[-5.5,36],[-2,36.7],[0,40.5],[3,43],[-9,43],[-9,41],[-9.5,37]],
  [[3,43],[7.5,43.7],[7,44],[8,48],[7,49],[2.5,51],[0,49.5],[-4,48.5],[-1,46],[3,43]],
  [[6,47.5],[13,47.5],[15,49],[12,54],[9.5,55],[6,51],[6,47.5]],
  [[-6,50],[-1,50.5],[1,51],[1.5,53],[0,57.5],[-3,58.5],[-5,57],[-3,54],[-3.5,52],[-6,50]],
  [[-10,51.5],[-6,51.5],[-6,53.5],[-8,54.5],[-10,53.5],[-10,51.5]],
  [[7,44],[10,42.5],[11,38.5],[13,38],[16,39],[15,42],[14,46],[13.5,45.5],[7,44]],
  [[5,58],[18,60],[30,70],[25,71],[12,66],[5,58]],
  [[12,56],[24,66],[18,70],[12,66],[11,58],[12,56]],
  [[14.5,54],[18,49.5],[24,50],[23,54],[14.5,54]],
  [[26,42],[28,41],[36,36.5],[44,38],[44,40],[26,42]],
  [[24,52],[24,50],[30,46],[38,48],[24,52]],
  [[28,60],[130,55],[140,55],[180,55],[180,65],[100,65],[40,60],[44,50],[100,50],[130,48],[145,50],[90,55],[28,60]],
  [[75,40],[100,40],[117,23],[122,30],[110,42],[90,44],[75,40]],
  [[130,31],[142,43],[141,45],[137,37],[130,31]],
  [[68,24],[77,8],[80,12],[88,22],[80,30],[75,35],[68,24]],
  [[44,40],[48,30],[57,28],[60,35],[44,40]],
  [[36,28],[55,22],[52,27],[42,32],[36,28]],
  [[-17,14.7],[-10,6.5],[10,-10],[30,-33],[42,3],[51,11],[32,31.5],[10,37],[3,36],[-17,14.7]],
  [[-140,60],[-122,37],[-97,26],[-82,25],[-60,47],[-80,64],[-140,60]],
  [[-97,26],[-97,22],[-87,18],[-97,26]],
  [[-80,10],[-80,-3],[-75,-45],[-70,-51],[-38,-12],[-50,0],[-80,10]],
  [[114,-22],[153,-28],[142,-11],[119,-20],[114,-22]],
];

// Pre-built GeoJSON features for hardcoded country polygons — avoids creating objects every frame
const CP_FEATURES = CP.map(p => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [p] } }));

// Pre-built graticule geometries — lines only, no outer frame (extent prevents the border rectangle)
const GRAT_20 = geoGraticule().step([20, 20]).extent([[-179.99, -89.99], [179.99, 89.99]])();
const GRAT_30 = geoGraticule().step([30, 30]).extent([[-179.99, -89.99], [179.99, 89.99]])();
const GRAT_10 = geoGraticule().step([10, 10]).extent([[-179.99, -89.99], [179.99, 89.99]])();

// Cache meridian line geometries per longitude — avoid Array.from(181) allocation per frame per line
const _meridianCache = new Map();
function getMeridianGeo(lo) {
  let geo = _meridianCache.get(lo);
  if (!geo) {
    geo = { type: 'LineString', coordinates: Array.from({ length: 181 }, (_, i) => [lo, -90 + i]) };
    _meridianCache.set(lo, geo);
  }
  return geo;
}

// Global world-atlas cache — persists across component remounts, avoids refetch
let _worldGeoCache = null;
let _worldGeoFetching = false;
const _worldGeoCallbacks = [];

function fetchWorldGeo(callback) {
  if (_worldGeoCache) { callback(_worldGeoCache); return; }
  _worldGeoCallbacks.push(callback);
  if (_worldGeoFetching) return;
  _worldGeoFetching = true;
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => { if (r.ok) return r.json(); throw 0; })
    .then(t => {
      _worldGeoCache = topoF(t, 'countries');
      _worldGeoCallbacks.forEach(cb => cb(_worldGeoCache));
      _worldGeoCallbacks.length = 0;
    })
    .catch(() => { _worldGeoFetching = false; });
}

function topoF(t, n) {
  try {
    const o = t.objects[n];
    if (!o) return null;
    const a = t.arcs, tf = t.transform;
    function da(i) {
      const ar = a[i < 0 ? ~i : i];
      const c = [];
      let x = 0, y = 0;
      ar.forEach(p => { x += p[0]; y += p[1]; c.push([x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]]); });
      return i < 0 ? c.reverse() : c;
    }
    function dr(r) { let c = []; r.forEach(i => c = c.concat(da(i))); return c; }
    return o.geometries.map(g => {
      if (g.type === 'Polygon') return { type: 'Feature', geometry: { type: 'Polygon', coordinates: g.arcs.map(dr) } };
      if (g.type === 'MultiPolygon') return { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: g.arcs.map(p => p.map(dr)) } };
      return null;
    }).filter(Boolean);
  } catch (e) { return null; }
}

export default function Globe({ lines, citiesOnLines, allCities, citiesTiers, homeLocation, onCityClick, flat, lightMode }) {
  const canvasRef = useRef(null);
  const lightRef = useRef(lightMode);
  lightRef.current = lightMode;
  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || window.innerWidth < 900);
  // Compute initial globe scale: on mobile use width * 0.48 for a closer, fuller globe
  const initScale = typeof window !== 'undefined'
    ? (isMobile ? window.innerWidth * 0.48 : Math.min(window.innerWidth, window.innerHeight) * 0.38)
    : 220;
  const S = useRef({
    rot: [-7, -25], scale: initScale, baseScale: initScale, drag: false, auto: true, raf: 0,
    lx: 0, ly: 0, wg: null, fd: false, dirty: true, lastDraw: 0,
    // Flat map state — panX/panY in pixels, zoom multiplier
    panX: 0, panY: 0, zoom: 1,
    // Pinch-to-zoom tracking
    pinchDist: 0,
    // Double-tap tracking
    lastTap: 0, lastTapX: 0, lastTapY: 0,
    // Mobile: ~30fps (33ms) for smooth rotation; desktop: 60fps
    frameInterval: isMobile ? 33 : 16,
    // Cached atmosphere gradient — avoid per-frame allocation (Chrome/Firefox GC pressure)
    _atmosGrad: null, _atmosScale: 0, _atmosCx: 0, _atmosCy: 0,
    // Fly-to animation state
    anim: null,
    // Highlighted city (shown with pulsing marker + label)
    highlight: null,
  });
  const [, forceUpdate] = useState(0);
  const [showLines, setShowLines] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const showLinesRef = useRef(true);
  const showCitiesRef = useRef(true);
  showLinesRef.current = showLines;
  showCitiesRef.current = showCities;
  const flatRef = useRef(flat);
  flatRef.current = flat;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const par = canvas.parentElement;
    const W = par.clientWidth, H = par.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const s = S.current, cx = W / 2, cy = H / 2;
    const isFlat = flatRef.current;

    let proj, path, center;

    const lt = lightRef.current;
    // Theme colors — ceramic globe light / deep dark
    const ocean = lt ? '#B4C5D4' : '#060D16';
    const land = lt ? '#EDE5DA' : '#0F1C28';
    const border = lt ? '#9E9488' : '#3A5A72';
    const grat1 = lt ? 'rgba(160,175,190,.14)' : '#182838';
    const grat2 = lt ? 'rgba(160,175,190,.10)' : '#141E2C';
    const grat3 = lt ? 'rgba(160,175,190,.12)' : '#142030';
    const sphereB = lt ? '#C0B8AE' : '#1C3040';
    const labelC = lt ? '#3A3832' : '#D0DDE8';
    const dimLabel = lt ? '#8A8580' : '#5A7088';
    const accentG = lt ? 'rgba(140,160,180,.08)' : 'rgba(0,216,138,.03)';

    if (isFlat) {
      // Flat map — Equirectangular projection
      // Use max scale so the map always fills the canvas (no empty bars)
      // Users can pan to see clipped areas
      const baseScaleW = W / (2 * Math.PI);
      const baseScaleH = H / Math.PI;
      const baseScale = Math.max(baseScaleW, baseScaleH) * s.zoom;
      proj = geoEquirectangular()
        .scale(baseScale)
        .translate([cx + s.panX, cy + s.panY])
        .rotate([0, 0]);
      path = geoPath(proj, ctx);
      center = null;

      // Ocean background — fill entire canvas
      ctx.fillStyle = ocean;
      ctx.fillRect(0, 0, W, H);

      // Graticule (cached geometry) — subtle grid
      ctx.strokeStyle = grat1; ctx.lineWidth = lt ? .25 : .4;
      ctx.beginPath(); path(GRAT_30); ctx.stroke();
      if (s.zoom > 1.5) {
        ctx.strokeStyle = grat2; ctx.lineWidth = lt ? .15 : .2;
        ctx.beginPath(); path(GRAT_10); ctx.stroke();
      }

      // Countries — fill each individually, then stroke borders
      ctx.fillStyle = land;
      const flatFeatures = s.wg || CP_FEATURES;
      flatFeatures.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); });
      ctx.strokeStyle = border; ctx.lineWidth = lt ? .6 : .5;
      flatFeatures.forEach(f => { ctx.beginPath(); path(f); ctx.stroke(); });
    } else {
      // Globe — Orthographic projection
      proj = geoOrthographic().scale(s.scale).translate([cx, cy]).rotate(s.rot).clipAngle(90);
      path = geoPath(proj, ctx);
      center = [-s.rot[0], -s.rot[1]];

      // Atmosphere — soft outer halo
      const atmosKey = `${s.scale}_${cx}_${cy}_${lt}`;
      if (s._atmosKey !== atmosKey) {
        s._atmosGrad = ctx.createRadialGradient(cx, cy, s.scale * .92, cx, cy, s.scale * 1.08);
        if (lt) {
          s._atmosGrad.addColorStop(0, 'transparent');
          s._atmosGrad.addColorStop(0.5, 'rgba(180,197,212,.03)');
          s._atmosGrad.addColorStop(1, 'rgba(180,197,212,.07)');
        } else {
          s._atmosGrad.addColorStop(0, 'transparent');
          s._atmosGrad.addColorStop(1, accentG);
        }
        s._atmosKey = atmosKey;
      }
      ctx.fillStyle = s._atmosGrad; ctx.beginPath(); ctx.arc(cx, cy, s.scale * 1.08, 0, Math.PI * 2); ctx.fill();

      // Sphere with drop shadow (light mode — ceramic globe feel)
      if (lt) {
        ctx.save();
        ctx.shadowColor = 'rgba(60,70,80,.16)';
        ctx.shadowBlur = s.scale * 0.08;
        ctx.shadowOffsetY = s.scale * 0.03;
        ctx.fillStyle = ocean;
        ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = ocean; ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.fill();
      }

      // Graticule — barely-there grid lines
      ctx.strokeStyle = grat3; ctx.lineWidth = lt ? .2 : .3;
      ctx.beginPath(); path(GRAT_20); ctx.stroke();

      // Countries — fill each individually, then stroke borders
      ctx.fillStyle = land;
      const globeFeatures = s.wg || CP_FEATURES;
      globeFeatures.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); });
      ctx.strokeStyle = border; ctx.lineWidth = lt ? .6 : .6;
      globeFeatures.forEach(f => { ctx.beginPath(); path(f); ctx.stroke(); });

      // Inner edge vignette — subtle spherical depth
      if (lt) {
        const vinKey = `vin_${s.scale}_${cx}_${cy}`;
        if (s._vinKey !== vinKey) {
          s._vinGrad = ctx.createRadialGradient(cx, cy, s.scale * .6, cx, cy, s.scale);
          s._vinGrad.addColorStop(0, 'transparent');
          s._vinGrad.addColorStop(0.8, 'transparent');
          s._vinGrad.addColorStop(1, 'rgba(80,90,100,.06)');
          s._vinKey = vinKey;
        }
        ctx.fillStyle = s._vinGrad;
        ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.fill();
      }

      // Sphere border — thin and refined
      ctx.strokeStyle = sphereB; ctx.lineWidth = lt ? 1.0 : .8;
      ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.stroke();
    }

    // Astro lines
    if (lines && showLinesRef.current) {
      const lw = isFlat ? (s.zoom > 2 ? 1.8 : 1.2) : (s.scale > 400 ? 2.2 : 1.5);
      lines.forEach(l => {
        ctx.strokeStyle = l.c;
        ctx.lineWidth = lw;
        ctx.globalAlpha = .65;

        if (l.angle === 'IC') ctx.setLineDash([6, 4]);
        else if (l.angle === 'ASC') ctx.setLineDash([10, 4]);
        else if (l.angle === 'DC') ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);

        if (l.type === 'curve') {
          const segs = l.segments || [l.points];
          segs.forEach(seg => {
            if (!seg || seg.length < 2) return;
            ctx.beginPath(); path({ type: 'LineString', coordinates: seg }); ctx.stroke();
          });
        } else {
          ctx.beginPath(); path(getMeridianGeo(l.lo)); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });
    }

    // ── City rendering with collision detection ──
    const labelBoxes = []; // occupied label rectangles
    function canPlace(x, y, w, h) {
      for (let i = 0; i < labelBoxes.length; i++) {
        const b = labelBoxes[i];
        if (x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]) return false;
      }
      return true;
    }

    // Cities on lines (priority — always draw dot, label with collision check)
    if (citiesOnLines && showCitiesRef.current) {
      citiesOnLines.forEach(c => {
        if (!isFlat && center && geoDistance([c.lo, c.la], center) > Math.PI / 2) return;
        const p = proj([c.lo, c.la]);
        if (!p || p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) return;
        const r = isFlat ? (s.zoom > 3 ? 4 : s.zoom > 1.5 ? 3 : 2) : (s.scale > 400 ? 4 : 2.5);
        ctx.fillStyle = c.lc; ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        const showLabels = isFlat ? s.zoom > 0.9 : s.scale > 250;
        if (showLabels) {
          const fs = isFlat
            ? (s.zoom > 4 ? 11 : s.zoom > 2 ? 9 : s.zoom > 1.2 ? 8 : 7)
            : (s.scale > 500 ? 10 : s.scale > 350 ? 8 : 7);
          const lx = p[0] + r + 4, ly = p[1] + 3;
          const lw = c.name.length * fs * 0.6, lh = fs + 2;
          if (canPlace(lx, ly - lh, lw, lh)) {
            ctx.font = `600 ${fs}px JetBrains Mono`;
            ctx.fillStyle = labelC; ctx.textAlign = 'left';
            ctx.fillText(c.name, lx, ly);
            labelBoxes.push([lx, ly - lh, lw, lh]);
          }
        }
        // Reserve dot space
        labelBoxes.push([p[0] - r, p[1] - r, r * 2, r * 2]);
      });
    }

    // Additional cities on zoom (tiered, with collision)
    const zoomLevel = isFlat ? s.zoom : s.scale / 280;
    if (citiesTiers && zoomLevel > 1.8 && showCitiesRef.current) {
      const tierIdx = isFlat
        ? (s.zoom > 5 ? 2 : s.zoom > 2.5 ? 1 : 0)
        : (s.scale > 800 ? 2 : s.scale > 500 ? 1 : 0);
      const tierCities = citiesTiers[tierIdx] || citiesTiers[0];
      const onLineNames = new Set(citiesOnLines ? citiesOnLines.map(c => c.name) : []);
      tierCities.forEach(([la, lo, name]) => {
        if (onLineNames.has(name)) return;
        if (!isFlat && center && geoDistance([lo, la], center) > Math.PI / 2) return;
        const p = proj([lo, la]);
        if (!p || p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) return;
        const r = isFlat ? (s.zoom > 5 ? 2.5 : 2) : (s.scale > 600 ? 2.5 : 1.5);
        // Check dot doesn't overlap existing labels
        if (!canPlace(p[0] - r - 2, p[1] - r - 2, r * 2 + 4, r * 2 + 4)) return;
        ctx.fillStyle = dimLabel; ctx.globalAlpha = .45;
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        const showLabel = isFlat ? s.zoom > 2.5 : s.scale > 500;
        if (showLabel) {
          const fs = isFlat
            ? (s.zoom > 6 ? 9 : s.zoom > 4 ? 8 : 7)
            : (s.scale > 800 ? 9 : 7);
          const lx = p[0] + r + 3, ly = p[1] + 3;
          const lw = name.length * fs * 0.6, lh = fs + 2;
          if (canPlace(lx, ly - lh, lw, lh)) {
            ctx.font = `500 ${fs}px JetBrains Mono`;
            ctx.fillStyle = dimLabel; ctx.globalAlpha = .55;
            ctx.textAlign = 'left';
            ctx.fillText(name, lx, ly);
            ctx.globalAlpha = 1;
            labelBoxes.push([lx, ly - lh, lw, lh]);
          }
        }
        labelBoxes.push([p[0] - r, p[1] - r, r * 2, r * 2]);
      });
    }

    // ── Highlighted city (pulsing ring + label) ──
    if (s.highlight) {
      const hl = s.highlight;
      const hlAge = (performance.now() - hl.time) / 1000; // seconds
      if (hlAge < 8) { // show for 8 seconds
        const visible = isFlat || (center && geoDistance([hl.lo, hl.la], center) < Math.PI / 2);
        if (visible) {
          const hp = proj([hl.lo, hl.la]);
          if (hp) {
            const pulse = 0.5 + 0.5 * Math.sin(hlAge * 4); // pulsing
            const hlC = '#00D88A';
            // Pulsing outer ring
            ctx.strokeStyle = hlC; ctx.lineWidth = 2; ctx.globalAlpha = 0.3 + 0.3 * pulse;
            ctx.beginPath(); ctx.arc(hp[0], hp[1], 14 + 4 * pulse, 0, Math.PI * 2); ctx.stroke();
            // Inner dot
            ctx.globalAlpha = 0.9; ctx.fillStyle = hlC;
            ctx.beginPath(); ctx.arc(hp[0], hp[1], 5, 0, Math.PI * 2); ctx.fill();
            // City name label with background
            ctx.font = 'bold 12px JetBrains Mono';
            const tw = ctx.measureText(hl.name).width;
            const lx = hp[0] + 20, ly = hp[1] - 8;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = lt ? 'rgba(255,255,255,.92)' : 'rgba(13,21,32,.92)';
            ctx.beginPath();
            const pad = 5, rad = 4;
            const bx = lx - pad, by = ly - 12 - pad, bw = tw + pad * 2, bh = 16 + pad * 2;
            if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, rad); else ctx.rect(bx, by, bw, bh);
            ctx.fill();
            ctx.strokeStyle = hlC; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, rad); else ctx.rect(bx, by, bw, bh);
            ctx.stroke();
            ctx.globalAlpha = 1; ctx.fillStyle = hlC;
            ctx.fillText(hl.name, lx, ly);
            s.dirty = true; // keep redrawing for pulse animation
            if (s.scheduleRedraw) s.scheduleRedraw();
          }
        }
      } else {
        s.highlight = null; // expired
      }
    }

    // Home marker (static — no animation to save CPU)
    if (homeLocation) {
      const [hLng, hLat, hLabel] = homeLocation;
      if (isFlat || (center && geoDistance([hLng, hLat], center) < Math.PI / 2)) {
        const p = proj([hLng, hLat]);
        if (p) {
          // Static ring instead of animated pulse
          const homeC = '#00D88A';
          ctx.strokeStyle = homeC; ctx.lineWidth = 1; ctx.globalAlpha = .25;
          ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.fillStyle = homeC;
          ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); ctx.fill();
          ctx.font = 'bold 11px JetBrains Mono'; ctx.fillStyle = homeC;
          ctx.fillText(`${hLabel} ★`, p[0] + 10, p[1] + 4);
        }
      }
    }
  }, [lines, citiesOnLines, allCities, homeLocation]);

  useEffect(() => {
    const s = S.current;
    if (!s.fd) {
      s.fd = true;
      fetchWorldGeo((features) => { s.wg = features; scheduleRedraw(); });
    }

    // Efficient rendering: only run RAF when needed, stop when idle
    let loopRunning = false;
    let lastLoopTs = 0;
    function loop(ts) {
      const isFlat = flatRef.current;
      // Delta time for smooth time-based rotation (avoids jitter from variable frame rates)
      const dt = lastLoopTs ? Math.min(ts - lastLoopTs, 100) : 16; // cap at 100ms to avoid jumps after tab switch
      lastLoopTs = ts;

      // Auto-rotation (only globe, only when idle) — time-based for consistent speed
      const cv = canvasRef.current;
      const globeFills = cv && s.scale >= Math.min(cv.parentElement.clientWidth, cv.parentElement.clientHeight) * 1.5;
      const shouldRotate = !isFlat && s.auto && !s.drag && !globeFills;
      if (shouldRotate) {
        // degrees per millisecond — scale-aware so zoomed-in rotation is slower
        const baseDeg = isMobile ? 0.0036 : 0.0018;
        const zoomRatio = Math.min(1, s.baseScale / Math.max(s.scale, 80));
        const degPerMs = baseDeg * zoomRatio;
        s.rot = [s.rot[0] - degPerMs * dt, s.rot[1]];
        s.dirty = true;
      }

      // Fly-to animation interpolation
      if (s.anim) {
        const t = Math.min(1, (ts - s.anim.startTime) / s.anim.duration);
        // Ease-in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        s.rot = [
          s.anim.startRot[0] + (s.anim.targetLon - s.anim.startRot[0]) * ease,
          s.anim.startRot[1] + (s.anim.targetLat - s.anim.startRot[1]) * ease,
        ];
        s.scale = s.anim.startScale + (s.anim.targetScale - s.anim.startScale) * ease;
        s.dirty = true;
        if (t >= 1) s.anim = null;
      }

      if (s.dirty) {
        const elapsed = ts - s.lastDraw;
        if (elapsed >= s.frameInterval) { draw(); s.dirty = false; s.lastDraw = ts; }
      }

      // Keep loop alive only if auto-rotating, dirty, animating, or highlight is pulsing
      const hlActive = s.highlight && (ts - s.highlight.time) < 8000;
      if (shouldRotate || s.dirty || s.drag || s.anim || hlActive) {
        s.raf = requestAnimationFrame(loop);
      } else {
        loopRunning = false;
        lastLoopTs = 0; // reset so next start doesn't have stale timestamp
      }
    }
    function scheduleRedraw() {
      s.dirty = true;
      if (!loopRunning) {
        loopRunning = true;
        s.raf = requestAnimationFrame(loop);
      }
    }
    // Store scheduleRedraw on ref so event handlers can call it
    s.scheduleRedraw = scheduleRedraw;
    scheduleRedraw();

    const c = canvasRef.current;
    if (!c) return;

    // Clamp pan so map edges never leave the viewport
    const clampPan = () => {
      const rect = c.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      const bsW = W / (2 * Math.PI), bsH = H / Math.PI;
      const sc = Math.max(bsW, bsH) * s.zoom;
      // Map pixel extents from center: width = 2*PI*sc, height = PI*sc
      const halfMapW = Math.PI * sc;
      const halfMapH = Math.PI * sc / 2;
      const maxPanX = Math.max(0, halfMapW - W / 2);
      const maxPanY = Math.max(0, halfMapH - H / 2);
      s.panX = Math.max(-maxPanX, Math.min(maxPanX, s.panX));
      s.panY = Math.max(-maxPanY, Math.min(maxPanY, s.panY));
    };

    // Helper: distance between two touch points
    const touchDist = (t) => {
      if (t.length < 2) return 0;
      const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const dn = e => {
      s.drag = true;
      s.auto = false;
      if (e.touches && e.touches.length >= 2) {
        s.pinchDist = touchDist(e.touches);
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        s.lx = mx; s.ly = my;
      } else {
        const t = e.touches ? e.touches[0] : e;
        s.lx = t.clientX; s.ly = t.clientY;
        s.pinchDist = 0;
      }
      scheduleRedraw();
    };
    const mv = e => {
      if (!s.drag) return;
      // Pinch-to-zoom with two fingers
      if (e.touches && e.touches.length >= 2) {
        e.preventDefault();
        const newDist = touchDist(e.touches);
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (s.pinchDist > 0 && newDist > 0) {
          const ratio = newDist / s.pinchDist;
          if (flatRef.current) {
            const rect = c.getBoundingClientRect();
            const cx2 = mx - rect.left - rect.width / 2 - s.panX;
            const cy2 = my - rect.top - rect.height / 2 - s.panY;
            const boosted = 1 + (ratio - 1) * 1.5;
            const newZoom = Math.max(1, Math.min(25, s.zoom * boosted));
            s.panX -= cx2 * (newZoom / s.zoom - 1);
            s.panY -= cy2 * (newZoom / s.zoom - 1);
            s.zoom = newZoom;
            clampPan();
          } else {
            const boosted = 1 + (ratio - 1) * 1.5;
            s.scale = Math.max(80, Math.min(8000, s.scale * boosted));
          }
        }
        // Also pan with two-finger drag
        const dx = mx - s.lx, dy = my - s.ly;
        if (flatRef.current) {
          s.panX += dx; s.panY += dy; clampPan();
        } else {
          const sens = 0.25 * (s.baseScale / Math.max(s.scale, 1));
          s.rot = [s.rot[0] + dx * sens, Math.max(-70, Math.min(70, s.rot[1] - dy * sens))];
        }
        s.lx = mx; s.ly = my;
        s.pinchDist = newDist;
        scheduleRedraw();
        return;
      }
      // Single finger: drag/rotate
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - s.lx, dy = t.clientY - s.ly;
      if (flatRef.current) {
        s.panX += dx;
        s.panY += dy;
        clampPan();
      } else {
        const sens = 0.25 * (s.baseScale / Math.max(s.scale, 1));
        s.rot = [s.rot[0] + dx * sens, Math.max(-70, Math.min(70, s.rot[1] - dy * sens))];
      }
      s.lx = t.clientX; s.ly = t.clientY;
      scheduleRedraw();
    };
    const up = e => {
      s.drag = false;
      s.pinchDist = 0;
      if (!flatRef.current) {
        const gf = c && s.scale >= Math.min(c.parentElement.clientWidth, c.parentElement.clientHeight) * 1.5;
        if (!gf) setTimeout(() => { s.auto = true; scheduleRedraw(); }, 4000);
      }
      // Double-tap detection for mobile zoom
      if (e.changedTouches && e.changedTouches.length === 1) {
        const now = Date.now();
        const tx = e.changedTouches[0].clientX, ty = e.changedTouches[0].clientY;
        const dt = now - s.lastTap;
        const dd = Math.hypot(tx - s.lastTapX, ty - s.lastTapY);
        if (dt < 300 && dd < 30) {
          s.lastTap = 0;
          const r = c.getBoundingClientRect();
          if (flatRef.current) {
            const mx = tx - r.left - r.width / 2 - s.panX;
            const my = ty - r.top - r.height / 2 - s.panY;
            const newZoom = Math.min(25, s.zoom * 2);
            s.panX -= mx * (newZoom / s.zoom - 1);
            s.panY -= my * (newZoom / s.zoom - 1);
            s.zoom = newZoom;
            clampPan();
          } else {
            const proj = geoOrthographic().scale(s.scale).translate([r.width / 2, r.height / 2]).rotate(s.rot);
            const co = proj.invert([tx - r.left, ty - r.top]);
            if (co) {
              s.rot = [-co[0], -co[1]];
              s.scale = Math.min(8000, s.scale * 2);
              s.auto = false;
              const gf2 = c && s.scale >= Math.min(c.parentElement.clientWidth, c.parentElement.clientHeight) * 1.5;
              if (!gf2) setTimeout(() => { s.auto = true; scheduleRedraw(); }, 6000);
            }
          }
          scheduleRedraw();
        } else {
          s.lastTap = now;
          s.lastTapX = tx;
          s.lastTapY = ty;
        }
      }
    };
    const wh = e => {
      e.preventDefault();
      if (flatRef.current) {
        const rect = c.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2 - s.panX;
        const my = e.clientY - rect.top - rect.height / 2 - s.panY;
        const factor = e.deltaY < 0 ? 1.1 : 0.91;
        const newZoom = Math.max(1, Math.min(25, s.zoom * factor));
        // Zoom toward mouse position
        s.panX -= mx * (newZoom / s.zoom - 1);
        s.panY -= my * (newZoom / s.zoom - 1);
        s.zoom = newZoom;
        clampPan();
      } else {
        s.scale = Math.max(80, Math.min(8000, s.scale * (e.deltaY < 0 ? 1.1 : .91)));
        s.auto = false;
        clearTimeout(s._z);
        const gf = c && s.scale >= Math.min(c.parentElement.clientWidth, c.parentElement.clientHeight) * 1.5;
        if (!gf) s._z = setTimeout(() => { s.auto = true; scheduleRedraw(); }, 4000);
      }
      scheduleRedraw();
    };
    const dbl = e => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      if (flatRef.current) {
        const mx = e.clientX - r.left - r.width / 2 - s.panX;
        const my = e.clientY - r.top - r.height / 2 - s.panY;
        const newZoom = Math.min(25, s.zoom * 2);
        s.panX -= mx * (newZoom / s.zoom - 1);
        s.panY -= my * (newZoom / s.zoom - 1);
        s.zoom = newZoom;
        clampPan();
      } else {
        const proj = geoOrthographic().scale(s.scale).translate([r.width / 2, r.height / 2]).rotate(s.rot);
        const co = proj.invert([e.clientX - r.left, e.clientY - r.top]);
        if (co) {
          s.rot = [-co[0], -co[1]]; s.scale = Math.min(8000, s.scale * 1.5); s.auto = false;
          const gf = c && s.scale >= Math.min(c.parentElement.clientWidth, c.parentElement.clientHeight) * 1.5;
          if (!gf) setTimeout(() => { s.auto = true; scheduleRedraw(); }, 6000);
        }
      }
      scheduleRedraw();
    };
    const click = e => {
      if (!citiesOnLines || !onCityClick) return;
      const r = c.getBoundingClientRect();
      const W = r.width, H = r.height;
      let proj;
      if (flatRef.current) {
        const bsW = W / (2 * Math.PI), bsH = H / Math.PI;
        proj = geoEquirectangular()
          .scale(Math.max(bsW, bsH) * s.zoom)
          .translate([W / 2 + s.panX, H / 2 + s.panY])
          .rotate([0, 0]);
      } else {
        proj = geoOrthographic().scale(s.scale).translate([W / 2, H / 2]).rotate(s.rot);
      }
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let closest = null, minD = 20;
      citiesOnLines.forEach(ci => {
        const p = proj([ci.lo, ci.la]);
        if (!p) return;
        const d = Math.hypot(p[0] - mx, p[1] - my);
        if (d < minD) { minD = d; closest = ci; }
      });
      onCityClick(closest);
    };

    // Throttle mousemove to avoid overwhelming Chrome/Firefox with high-frequency events
    let _mvRaf = 0;
    const mvThrottled = (e) => { if (_mvRaf) return; _mvRaf = requestAnimationFrame(() => { mv(e); _mvRaf = 0; }); };

    c.addEventListener('mousedown', dn, { passive: true }); window.addEventListener('mousemove', mvThrottled, { passive: true }); window.addEventListener('mouseup', up, { passive: true });
    c.addEventListener('touchstart', dn, { passive: false }); c.addEventListener('touchmove', mv, { passive: false }); c.addEventListener('touchend', up, { passive: true });
    c.addEventListener('wheel', wh, { passive: false }); c.addEventListener('dblclick', dbl, { passive: true }); c.addEventListener('click', click, { passive: true });
    const rs = () => { scheduleRedraw(); }; window.addEventListener('resize', rs);

    // Pause RAF loop when tab is hidden, resume when visible
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(s.raf);
        loopRunning = false;
      } else {
        scheduleRedraw();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    // No auto-stop timer — rotation continues until user drags/zooms in

    return () => {
      cancelAnimationFrame(s.raf);
      cancelAnimationFrame(_mvRaf);
      document.removeEventListener('visibilitychange', onVis);
      c.removeEventListener('mousedown', dn); window.removeEventListener('mousemove', mvThrottled); window.removeEventListener('mouseup', up);
      c.removeEventListener('touchstart', dn); c.removeEventListener('touchmove', mv); c.removeEventListener('touchend', up);
      c.removeEventListener('wheel', wh); c.removeEventListener('dblclick', dbl); c.removeEventListener('click', click);
      window.removeEventListener('resize', rs);
    };
  }, [draw, citiesOnLines, onCityClick]);

  // Reset flat state and mark dirty on mode change
  useEffect(() => {
    const s = S.current;
    if (flat) {
      s.panX = 0; s.panY = 0; s.zoom = 1;
    }
    if (s.scheduleRedraw) s.scheduleRedraw();
  }, [flat]);

  // Redraw on light mode change — invalidate cached atmosphere gradient
  useEffect(() => {
    const s = S.current;
    s._atmosKey = null;
    s.dirty = true;
    if (s.scheduleRedraw) s.scheduleRedraw();
  }, [lightMode]);

  // Expose flyTo — smooth animated rotation + zoom
  Globe.flyTo = (la, lo, name) => {
    const s = S.current;
    if (flatRef.current) {
      // Center on the city by computing pixel offset, clamped to edges
      const canvas = canvasRef.current;
      if (canvas) {
        const par = canvas.parentElement;
        const W = par.clientWidth, H = par.clientHeight;
        const bsW = W / (2 * Math.PI), bsH = H / Math.PI;
        const baseScale = Math.max(bsW, bsH);
        const targetZoom = Math.max(s.zoom, 3);
        const lonRad = lo * Math.PI / 180;
        const latRad = la * Math.PI / 180;
        s.panX = -lonRad * baseScale * targetZoom;
        s.panY = latRad * baseScale * targetZoom;
        s.zoom = targetZoom;
        // Clamp so map stays in viewport
        const sc = baseScale * targetZoom;
        const halfMapW = Math.PI * sc;
        const halfMapH = Math.PI * sc / 2;
        const maxPanX = Math.max(0, halfMapW - W / 2);
        const maxPanY = Math.max(0, halfMapH - H / 2);
        s.panX = Math.max(-maxPanX, Math.min(maxPanX, s.panX));
        s.panY = Math.max(-maxPanY, Math.min(maxPanY, s.panY));
      }
    } else {
      s.auto = false;
      // Smooth fly-to animation: interpolate rotation and scale
      const startRot = [...s.rot];
      const targetRot = [-lo, -la];
      // Shortest path for longitude wrapping
      let dLon = targetRot[0] - startRot[0];
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      const startScale = s.scale;
      const targetScale = Math.max(s.scale, 450);
      s.anim = {
        startRot,
        targetLon: startRot[0] + dLon,
        targetLat: targetRot[1],
        startScale,
        targetScale,
        startTime: performance.now(),
        duration: 1400, // ms
      };
      clearTimeout(s._autoTimer);
      s._autoTimer = setTimeout(() => { s.auto = true; if (s.scheduleRedraw) s.scheduleRedraw(); }, 8000);
    }
    // Set highlighted city
    if (name) {
      s.highlight = { la, lo, name, time: performance.now() };
    }
    if (s.scheduleRedraw) s.scheduleRedraw();
  };

  // Expose highlight method (show city label without flying)
  Globe.highlight = (la, lo, name) => {
    const s = S.current;
    s.highlight = name ? { la, lo, name, time: performance.now() } : null;
    if (s.scheduleRedraw) s.scheduleRedraw();
  };

  const toggleLines = useCallback(() => {
    setShowLines(v => !v);
    S.current.dirty = true;
    if (S.current.scheduleRedraw) S.current.scheduleRedraw();
  }, []);
  const toggleCities = useCallback(() => {
    setShowCities(v => !v);
    S.current.dirty = true;
    if (S.current.scheduleRedraw) S.current.scheduleRedraw();
  }, []);

  const btnSize = isMobile ? 26 : 32;
  const btnIconSize = isMobile ? 13 : 16;
  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: btnSize, height: btnSize, borderRadius: isMobile ? 5 : 6, border: '1px solid #1A2840',
    cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11, fontWeight: 600, padding: 0, transition: 'background .15s, color .15s',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} role="img" aria-label="Interactive 3D astrocartography globe showing personalized planetary lines across the world" style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', willChange: 'contents', contain: 'strict' }} />
      {/* Layer toggle buttons — bottom left */}
      <div style={{ position: 'absolute', bottom: isMobile ? 8 : 12, left: isMobile ? 8 : 12, zIndex: 50, display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 6 }}>
        <button
          onClick={toggleLines}
          title={showLines ? 'Hide natal lines' : 'Show natal lines'}
          style={{
            ...btnBase,
            background: showLines ? 'rgba(0,168,107,.12)' : (lightRef.current ? 'rgba(255,255,255,.85)' : 'rgba(13,21,32,.85)'),
            color: showLines ? (lightRef.current ? '#00A86B' : '#00D88A') : (lightRef.current ? '#8A8580' : '#5A7088'),
            borderColor: lightRef.current ? '#D6D2CC' : '#1A2840',
          }}
        >
          <svg width={btnIconSize} height={btnIconSize} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="14" x2="7" y2="2" /><line x1="9" y1="14" x2="14" y2="3" /><line x1="1" y1="8" x2="15" y2="8" strokeDasharray="2 2" />
          </svg>
        </button>
        <button
          onClick={toggleCities}
          title={showCities ? 'Hide cities' : 'Show cities'}
          style={{
            ...btnBase,
            background: showCities ? 'rgba(0,168,107,.12)' : (lightRef.current ? 'rgba(255,255,255,.85)' : 'rgba(13,21,32,.85)'),
            color: showCities ? (lightRef.current ? '#00A86B' : '#00D88A') : (lightRef.current ? '#8A8580' : '#5A7088'),
            borderColor: lightRef.current ? '#D6D2CC' : '#1A2840',
          }}
        >
          <svg width={btnIconSize} height={btnIconSize} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="6" r="3" /><path d="M8 9v4" /><circle cx="4" cy="11" r="1.5" /><circle cx="12" cy="10" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
