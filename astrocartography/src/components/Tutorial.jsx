import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { t } from '../lib/i18n';

// ── Tutorial overlay with spotlight, arrow, popup ──
// Steps reference DOM nodes via data-tutorial="<key>" attributes.
// The popup is positioned next to the target; an arrow points to it.

const F = { fontFamily: 'JetBrains Mono, monospace' };
const PADDING = 8;        // padding around the spotlight box
const POPUP_W = 320;      // popup width
const POPUP_GAP = 18;     // gap between popup and target
const VP_MARGIN = 12;     // min margin from viewport edge

// Tutorial step ids match data-tutorial attributes in Dashboard.jsx
const STEPS = [
  { key: 'globe',       i18n: 'tutGlobe' },
  { key: 'planets',     i18n: 'tutPlanets' },
  { key: 'topCities',   i18n: 'tutTopCities' },
  { key: 'natal',       i18n: 'tutNatal' },
  { key: 'mapToggle',   i18n: 'tutMapToggle' },
  { key: 'search',      i18n: 'tutSearch' },
  { key: 'compare',     i18n: 'tutCompare' },
  { key: 'language',    i18n: 'tutLanguage' },
];

function getRect(key) {
  const el = document.querySelector(`[data-tutorial="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // Skip if element has no size (hidden/not rendered)
  if (r.width === 0 && r.height === 0) return null;
  return r;
}

// Decide popup placement and arrow direction based on target rect + viewport
function computePlacement(rect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  // Estimate popup height conservatively for placement decision
  const popupH = 200;

  const spaceRight  = vw - rect.right;
  const spaceLeft   = rect.left;
  const spaceBelow  = vh - rect.bottom;
  const spaceAbove  = rect.top;

  let side; // which side of target the popup sits on
  if (spaceRight >= POPUP_W + POPUP_GAP + VP_MARGIN) side = 'right';
  else if (spaceLeft  >= POPUP_W + POPUP_GAP + VP_MARGIN) side = 'left';
  else if (spaceBelow >= popupH + POPUP_GAP + VP_MARGIN) side = 'bottom';
  else if (spaceAbove >= popupH + POPUP_GAP + VP_MARGIN) side = 'top';
  else side = spaceBelow >= spaceAbove ? 'bottom' : 'top';

  let top, left;
  if (side === 'right') {
    left = rect.right + POPUP_GAP;
    top  = Math.max(VP_MARGIN, Math.min(vh - popupH - VP_MARGIN, rect.top + rect.height / 2 - popupH / 2));
  } else if (side === 'left') {
    left = rect.left - POPUP_W - POPUP_GAP;
    top  = Math.max(VP_MARGIN, Math.min(vh - popupH - VP_MARGIN, rect.top + rect.height / 2 - popupH / 2));
  } else if (side === 'bottom') {
    top  = rect.bottom + POPUP_GAP;
    left = Math.max(VP_MARGIN, Math.min(vw - POPUP_W - VP_MARGIN, rect.left + rect.width / 2 - POPUP_W / 2));
  } else { // top
    top  = rect.top - popupH - POPUP_GAP;
    left = Math.max(VP_MARGIN, Math.min(vw - POPUP_W - VP_MARGIN, rect.left + rect.width / 2 - POPUP_W / 2));
  }
  return { side, top, left };
}

// Arrow: from popup edge to target edge
function arrowGeometry(rect, place) {
  const { side, top, left } = place;
  // Arrow start (anchor on popup) and end (anchor on target)
  let x1, y1, x2, y2;
  if (side === 'right') {
    x1 = left;                              y1 = top + 80;
    x2 = rect.left + rect.width / 2 - 6;    y2 = rect.top + rect.height / 2;
  } else if (side === 'left') {
    x1 = left + POPUP_W;                    y1 = top + 80;
    x2 = rect.left + rect.width / 2 + 6;    y2 = rect.top + rect.height / 2;
  } else if (side === 'bottom') {
    x1 = left + POPUP_W / 2;                y1 = top;
    x2 = rect.left + rect.width / 2;        y2 = rect.bottom + 6;
  } else {
    x1 = left + POPUP_W / 2;                y1 = top + 200;
    x2 = rect.left + rect.width / 2;        y2 = rect.top - 6;
  }
  return { x1, y1, x2, y2 };
}

export default function Tutorial({ lang, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const [tick, setTick] = useState(0); // forces re-measure on resize/scroll

  // Filter steps to those whose target exists in the DOM (skip hidden mobile/desktop variants).
  // useMemo runs synchronously during render, so the DOM has already been laid out by the time
  // we mount (Dashboard is the parent). Falls back to all STEPS if nothing matches yet.
  const activeSteps = useMemo(() => {
    const present = STEPS.filter(s => document.querySelector(`[data-tutorial="${s.key}"]`));
    return present.length ? present : STEPS;
  }, []);

  const step = activeSteps[stepIdx];

  // Re-measure on step change, resize, scroll
  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => setRect(getRect(step.key));
    measure();
    // Try a few times in case the element is rendered async (e.g., after layout effect)
    const timers = [50, 150, 400].map(d => setTimeout(measure, d));
    return () => timers.forEach(clearTimeout);
  }, [step, tick]);

  useEffect(() => {
    const onResize = () => setTick(x => x + 1);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, []);

  const next = useCallback(() => {
    if (stepIdx < activeSteps.length - 1) setStepIdx(i => i + 1);
    else onClose(true);
  }, [stepIdx, activeSteps.length, onClose]);

  const prev = useCallback(() => {
    if (stepIdx > 0) setStepIdx(i => i - 1);
  }, [stepIdx]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(true);
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!step) return null;

  // If the target element doesn't exist (or isn't visible), still render the popup centered
  // so the tutorial doesn't get stuck on a missing step.
  const hasRect = !!rect;
  const place = hasRect ? computePlacement(rect) : { side: 'center', top: window.innerHeight / 2 - 110, left: window.innerWidth / 2 - POPUP_W / 2 };
  const arrow = hasRect ? arrowGeometry(rect, place) : null;

  // Build SVG mask: full-screen dark, with a transparent cutout over the target rect
  const vw = window.innerWidth, vh = window.innerHeight;
  const cut = hasRect ? {
    x: Math.max(0, rect.left - PADDING),
    y: Math.max(0, rect.top - PADDING),
    w: Math.min(vw, rect.width + PADDING * 2),
    h: Math.min(vh, rect.height + PADDING * 2),
  } : null;

  const title = t(`${step.i18n}Title`, lang);
  const body  = t(`${step.i18n}Body`,  lang);

  return (
    <div
      role="dialog"
      aria-label={t('tutorialAriaLabel', lang)}
      style={{ position: 'fixed', inset: 0, zIndex: 99990, pointerEvents: 'none' }}
    >
      {/* Spotlight overlay (SVG so we get a clean cut-out) */}
      <svg width={vw} height={vh} style={{ position: 'fixed', inset: 0, pointerEvents: 'auto' }} onClick={() => onClose(true)}>
        <defs>
          <mask id="nn-tut-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {cut && <rect x={cut.x} y={cut.y} width={cut.w} height={cut.h} rx="10" ry="10" fill="black" />}
          </mask>
        </defs>
        <rect x="0" y="0" width={vw} height={vh} fill="rgba(2, 8, 18, 0.72)" mask="url(#nn-tut-mask)" />
        {/* Highlight ring around target */}
        {cut && (
          <rect
            x={cut.x} y={cut.y} width={cut.w} height={cut.h}
            rx="10" ry="10"
            fill="none" stroke="#00D88A" strokeWidth="2" strokeDasharray="6 4"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,216,138,.65))' }}
            pointerEvents="none"
          />
        )}
        {/* Arrow from popup to target */}
        {arrow && (
          <g pointerEvents="none">
            <defs>
              <marker id="nn-tut-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#00D88A" />
              </marker>
            </defs>
            <line
              x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2}
              stroke="#00D88A" strokeWidth="2.2"
              markerEnd="url(#nn-tut-arrow)"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,216,138,.55))' }}
            />
          </g>
        )}
      </svg>

      {/* Popup window */}
      <div
        style={{
          position: 'fixed',
          top: place.top,
          left: place.left,
          width: POPUP_W,
          background: '#0A1222',
          border: '1px solid #00D88A',
          borderRadius: 10,
          boxShadow: '0 18px 50px rgba(0,0,0,.65), 0 0 0 1px rgba(0,216,138,.18)',
          color: '#E4ECF5',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1A2840', background: '#0E1828' }}>
          <span style={{ ...F, fontSize: 9, fontWeight: 700, color: '#00D88A', letterSpacing: 2 }}>
            {t('tutorialBadge', lang)} · {stepIdx + 1}/{activeSteps.length}
          </span>
          <span
            onClick={() => onClose(true)}
            style={{ ...F, fontSize: 9, color: '#7B8AA0', cursor: 'pointer', padding: '2px 6px', borderRadius: 3 }}
            title={t('tutorialSkip', lang)}
          >
            ✕
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div style={{ ...F, fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.3 }}>{title}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.65, color: '#B6C2D2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{body}</div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0 6px' }}>
          {activeSteps.map((_, i) => (
            <span
              key={i}
              onClick={() => setStepIdx(i)}
              style={{
                width: i === stepIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === stepIdx ? '#00D88A' : '#2A3A50',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 12px', borderTop: '1px solid #1A2840', background: '#0E1828' }}>
          <span
            onClick={() => onClose(true)}
            style={{ ...F, fontSize: 9, color: '#7B8AA0', cursor: 'pointer', letterSpacing: 1 }}
          >
            {t('tutorialSkip', lang)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepIdx > 0 && (
              <span
                onClick={prev}
                style={{ ...F, fontSize: 10, fontWeight: 600, color: '#B6C2D2', background: 'transparent', border: '1px solid #2A3A50', borderRadius: 5, padding: '6px 12px', cursor: 'pointer', letterSpacing: 1 }}
              >
                {t('tutorialBack', lang)}
              </span>
            )}
            <span
              onClick={next}
              style={{ ...F, fontSize: 10, fontWeight: 700, color: '#02101E', background: '#00D88A', border: '1px solid #00D88A', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', letterSpacing: 1 }}
            >
              {stepIdx === activeSteps.length - 1 ? t('tutorialDone', lang) : t('tutorialNext', lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
