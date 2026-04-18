import { useRef, useState, useCallback, useEffect } from 'react';
import NatalWheel from './NatalWheel';

// Zoomable / pannable wrapper for the natal wheel.
// - Wheel / trackpad: scroll-to-zoom, centered on cursor
// - Touch: pinch-to-zoom and single-finger pan
// - Mouse: click-and-drag to pan
// - Buttons: +, −, reset
export default function NatalWheelZoom({ size, ...wheelProps }) {
  const box = useRef(null);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const pinch = useRef(null);

  const clamp = useCallback((s) => Math.min(6, Math.max(1, s)), []);

  const zoomAt = useCallback((factor, cx, cy) => {
    setT(prev => {
      const ns = clamp(prev.s * factor);
      if (ns === prev.s) return prev;
      const k = ns / prev.s;
      return { s: ns, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k };
    });
  }, [clamp]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = box.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.0025);
    zoomAt(factor, cx, cy);
  }, [zoomAt]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX - t.x, y: e.clientY - t.y };
  };
  const onMouseMove = (e) => {
    if (!drag.current) return;
    setT(p => ({ ...p, x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }));
  };
  const endMouse = () => { drag.current = null; };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      pinch.current = {
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
        s0: t.s,
      };
      drag.current = null;
    } else if (e.touches.length === 1) {
      const tp = e.touches[0];
      drag.current = { x: tp.clientX - t.x, y: tp.clientY - t.y };
      pinch.current = null;
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const rect = box.current.getBoundingClientRect();
      const cx = pinch.current.cx - rect.left;
      const cy = pinch.current.cy - rect.top;
      const ns = clamp(pinch.current.s0 * (d / pinch.current.d));
      setT(prev => {
        const k = ns / prev.s;
        return { s: ns, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k };
      });
    } else if (e.touches.length === 1 && drag.current) {
      e.preventDefault();
      const tp = e.touches[0];
      setT(p => ({ ...p, x: tp.clientX - drag.current.x, y: tp.clientY - drag.current.y }));
    }
  };
  const endTouch = () => { drag.current = null; pinch.current = null; };

  const reset = () => setT({ s: 1, x: 0, y: 0 });

  const center = () => {
    if (!box.current) return;
    const r = box.current.getBoundingClientRect();
    return { cx: r.width / 2, cy: r.height / 2 };
  };
  const zoomIn  = () => { const c = center(); if (c) zoomAt(1.25, c.cx, c.cy); };
  const zoomOut = () => { const c = center(); if (c) zoomAt(1/1.25, c.cx, c.cy); };

  const BTN = {
    width: 30, height: 30, borderRadius: 6, border: '1px solid #C0B8A8',
    background: '#FFFFFF', color: '#1E1E1E', fontFamily: 'JetBrains Mono, monospace',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', userSelect: 'none',
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1 / 1' }}>
      <div
        ref={box}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endMouse}
        onMouseLeave={endMouse}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endTouch}
        onTouchCancel={endTouch}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid #E0DCD0',
          borderRadius: 8,
          touchAction: 'none',
          cursor: drag.current ? 'grabbing' : 'grab',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}>
          <NatalWheel size={size} {...wheelProps} />
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={zoomIn}  style={BTN} aria-label="Zoom in">+</button>
        <button onClick={zoomOut} style={BTN} aria-label="Zoom out">−</button>
        <button onClick={reset}   style={{ ...BTN, fontSize: 10 }} aria-label="Reset">1:1</button>
      </div>

      {/* Zoom level indicator */}
      <div style={{
        position: 'absolute', left: 8, bottom: 8,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666',
        background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 4,
        border: '1px solid #E0DCD0',
      }}>
        {Math.round(t.s * 100)}%
      </div>
    </div>
  );
}
