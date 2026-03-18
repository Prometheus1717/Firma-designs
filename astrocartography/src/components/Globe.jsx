import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';

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

export default function Globe({ lines, citiesOnLines, homeLocation, onCityClick, flat }) {
  const canvasRef = useRef(null);
  const S = useRef({
    rot: [-7, -25], scale: 280, drag: false, auto: true, raf: 0,
    lx: 0, ly: 0, wg: null, fd: false, dirty: true, lastDraw: 0,
    // Flat map state — panX/panY in pixels, zoom multiplier
    panX: 0, panY: 0, zoom: 1,
  });
  const [, forceUpdate] = useState(0);
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

    if (isFlat) {
      // Flat map — Equirectangular projection, edge-to-edge
      // Scale to fill the entire canvas: width maps 360° of longitude
      const baseScaleW = W / (2 * Math.PI);
      const baseScaleH = H / Math.PI;
      // Use the larger scale so the map covers the whole canvas
      const baseScale = Math.max(baseScaleW, baseScaleH) * s.zoom;
      proj = d3.geoEquirectangular()
        .scale(baseScale)
        .translate([cx + s.panX, cy + s.panY])
        .rotate([0, 0]);
      path = d3.geoPath(proj, ctx);
      center = null;

      // Ocean background — fill entire canvas
      ctx.fillStyle = '#0B1420';
      ctx.fillRect(0, 0, W, H);

      // Graticule
      ctx.strokeStyle = '#182838'; ctx.lineWidth = .4;
      ctx.beginPath(); path(d3.geoGraticule().step([30, 30])()); ctx.stroke();
      // Finer graticule at higher zoom
      if (s.zoom > 1.5) {
        ctx.strokeStyle = '#141E2C'; ctx.lineWidth = .2;
        ctx.beginPath(); path(d3.geoGraticule().step([10, 10])()); ctx.stroke();
      }

      // Countries
      ctx.fillStyle = '#0F1C28'; ctx.strokeStyle = '#3A5A72'; ctx.lineWidth = .5;
      CP.forEach(p => { ctx.beginPath(); path({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [p] } }); ctx.fill(); ctx.stroke(); });
      if (s.wg) s.wg.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); ctx.stroke(); });
    } else {
      // Globe — Orthographic projection
      proj = d3.geoOrthographic().scale(s.scale).translate([cx, cy]).rotate(s.rot).clipAngle(90);
      path = d3.geoPath(proj, ctx);
      center = [-s.rot[0], -s.rot[1]];

      // Atmosphere
      const ag = ctx.createRadialGradient(cx, cy, s.scale * .92, cx, cy, s.scale * 1.08);
      ag.addColorStop(0, 'transparent'); ag.addColorStop(1, 'rgba(0,216,138,.03)');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, s.scale * 1.08, 0, Math.PI * 2); ctx.fill();

      // Ocean
      ctx.fillStyle = '#0B1420'; ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.fill();

      // Graticule
      ctx.strokeStyle = '#142030'; ctx.lineWidth = .3;
      ctx.beginPath(); path(d3.geoGraticule().step([20, 20])()); ctx.stroke();

      // Countries
      ctx.fillStyle = '#0F1C28'; ctx.strokeStyle = '#3A5A72'; ctx.lineWidth = .6;
      CP.forEach(p => { ctx.beginPath(); path({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [p] } }); ctx.fill(); ctx.stroke(); });
      if (s.wg) s.wg.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); ctx.stroke(); });

      // Sphere border
      ctx.strokeStyle = '#1C3040'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.arc(cx, cy, s.scale, 0, Math.PI * 2); ctx.stroke();
    }

    // Astro lines
    if (lines) {
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
          const geo = { type: 'LineString', coordinates: Array.from({ length: 181 }, (_, i) => [l.lo, -90 + i]) };
          ctx.beginPath(); path(geo); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });
    }

    // Cities on lines
    if (citiesOnLines) {
      citiesOnLines.forEach(c => {
        if (!isFlat && center && d3.geoDistance([c.lo, c.la], center) > Math.PI / 2) return;
        const p = proj([c.lo, c.la]);
        if (!p) return;
        const r = isFlat ? (s.zoom > 3 ? 4 : s.zoom > 1.5 ? 3 : 2) : (s.scale > 400 ? 4 : 2.5);
        ctx.fillStyle = c.lc; ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        const showLabels = isFlat ? s.zoom > 0.9 : s.scale > 250;
        if (showLabels) {
          const fs = isFlat
            ? (s.zoom > 4 ? 11 : s.zoom > 2 ? 9 : s.zoom > 1.2 ? 8 : 7)
            : (s.scale > 500 ? 10 : s.scale > 350 ? 8 : 7);
          ctx.font = `600 ${fs}px JetBrains Mono`;
          ctx.fillStyle = '#D0DDE8';
          ctx.textAlign = 'left';
          ctx.fillText(c.name, p[0] + r + 4, p[1] + 3);
        }
      });
    }

    // Home marker
    if (homeLocation) {
      const [hLng, hLat, hLabel] = homeLocation;
      if (isFlat || (center && d3.geoDistance([hLng, hLat], center) < Math.PI / 2)) {
        const p = proj([hLng, hLat]);
        if (p) {
          const t = (Date.now() % 2200) / 2200;
          ctx.strokeStyle = '#00D88A'; ctx.lineWidth = 1.2; ctx.globalAlpha = .4 * (1 - t);
          ctx.beginPath(); ctx.arc(p[0], p[1], 6 + t * 14, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.fillStyle = '#00D88A';
          ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); ctx.fill();
          ctx.font = 'bold 11px JetBrains Mono'; ctx.fillStyle = '#00D88A';
          ctx.fillText(`${hLabel} ★`, p[0] + 10, p[1] + 4);
        }
      }
    }
  }, [lines, citiesOnLines, homeLocation]);

  useEffect(() => {
    const s = S.current;
    if (!s.fd) {
      s.fd = true;
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(r => { if (r.ok) return r.json(); throw 0; })
        .then(t => { s.wg = topoF(t, 'countries'); s.dirty = true; })
        .catch(() => { });
    }

    function loop(ts) {
      const isFlat = flatRef.current;
      if (!isFlat && s.auto && !s.drag) { s.rot = [s.rot[0] - .06, s.rot[1]]; s.dirty = true; }
      if (s.dirty || (ts - s.lastDraw) > 100) { draw(); s.dirty = false; s.lastDraw = ts; }
      s.raf = requestAnimationFrame(loop);
    }
    s.raf = requestAnimationFrame(loop);

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

    const dn = e => {
      s.drag = true;
      s.auto = false;
      const t = e.touches ? e.touches[0] : e;
      s.lx = t.clientX; s.ly = t.clientY;
    };
    const mv = e => {
      if (!s.drag) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - s.lx, dy = t.clientY - s.ly;
      if (flatRef.current) {
        // Only allow pan when zoomed in, clamped to edges
        if (s.zoom > 1) {
          s.panX += dx;
          s.panY += dy;
          clampPan();
        }
      } else {
        s.rot = [s.rot[0] + dx * .25, Math.max(-70, Math.min(70, s.rot[1] - dy * .25))];
      }
      s.lx = t.clientX; s.ly = t.clientY;
      s.dirty = true;
    };
    const up = () => {
      s.drag = false;
      if (!flatRef.current) setTimeout(() => { s.auto = true; }, 4000);
    };
    const wh = e => {
      e.preventDefault();
      if (flatRef.current) {
        const rect = c.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2 - s.panX;
        const my = e.clientY - rect.top - rect.height / 2 - s.panY;
        const factor = e.deltaY < 0 ? 1.1 : 0.91;
        const newZoom = Math.max(1, Math.min(15, s.zoom * factor));
        // Zoom toward mouse position
        s.panX -= mx * (newZoom / s.zoom - 1);
        s.panY -= my * (newZoom / s.zoom - 1);
        s.zoom = newZoom;
        clampPan();
      } else {
        s.scale = Math.max(180, Math.min(1800, s.scale * (e.deltaY < 0 ? 1.08 : .93)));
        s.auto = false;
        clearTimeout(s._z);
        s._z = setTimeout(() => { s.auto = true; }, 4000);
      }
      s.dirty = true;
    };
    const dbl = e => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      if (flatRef.current) {
        const mx = e.clientX - r.left - r.width / 2 - s.panX;
        const my = e.clientY - r.top - r.height / 2 - s.panY;
        const newZoom = Math.min(15, s.zoom * 2);
        s.panX -= mx * (newZoom / s.zoom - 1);
        s.panY -= my * (newZoom / s.zoom - 1);
        s.zoom = newZoom;
        clampPan();
      } else {
        const proj = d3.geoOrthographic().scale(s.scale).translate([r.width / 2, r.height / 2]).rotate(s.rot);
        const co = proj.invert([e.clientX - r.left, e.clientY - r.top]);
        if (co) { s.rot = [-co[0], -co[1]]; s.scale = Math.min(1800, s.scale * 1.5); s.auto = false; setTimeout(() => { s.auto = true; }, 6000); }
      }
      s.dirty = true;
    };
    const click = e => {
      if (!citiesOnLines || !onCityClick) return;
      const r = c.getBoundingClientRect();
      const W = r.width, H = r.height;
      let proj;
      if (flatRef.current) {
        const bsW = W / (2 * Math.PI), bsH = H / Math.PI;
        proj = d3.geoEquirectangular()
          .scale(Math.max(bsW, bsH) * s.zoom)
          .translate([W / 2 + s.panX, H / 2 + s.panY])
          .rotate([0, 0]);
      } else {
        proj = d3.geoOrthographic().scale(s.scale).translate([W / 2, H / 2]).rotate(s.rot);
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

    c.addEventListener('mousedown', dn); window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    c.addEventListener('touchstart', dn, { passive: true }); c.addEventListener('touchmove', mv, { passive: true }); c.addEventListener('touchend', up, { passive: true });
    c.addEventListener('wheel', wh, { passive: false }); c.addEventListener('dblclick', dbl); c.addEventListener('click', click);
    const rs = () => { s.dirty = true; }; window.addEventListener('resize', rs);

    return () => {
      cancelAnimationFrame(s.raf);
      c.removeEventListener('mousedown', dn); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
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
    s.dirty = true;
  }, [flat]);

  // Expose flyTo
  Globe.flyTo = (la, lo) => {
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
      s.rot = [-lo, -la];
      s.scale = Math.max(s.scale, 450);
      setTimeout(() => { s.auto = true; }, 6000);
    }
    s.dirty = true;
  };

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />;
}
