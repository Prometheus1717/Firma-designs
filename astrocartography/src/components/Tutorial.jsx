import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { t } from '../lib/i18n';

// ── Tutorial overlay with spotlight, arrow(s), popup ──
// Each step targets one or more DOM nodes via data-tutorial="<key>".
// For multi-target steps, every target gets its own spotlight cutout and
// a separate arrow from the popup. Popup placement is based on the union
// bounding-box so the popup sits next to the whole highlighted cluster.

const F = { fontFamily: 'JetBrains Mono, monospace' };
const PADDING = 8;
const POPUP_GAP = 14;
const VP_MARGIN = 10;
const ACCENT = '#00D88A';

// Tutorial steps — desktop and mobile variants.
// `keys` arrays may differ per viewport so we target the right DOM nodes.
const STEPS_DESKTOP = [
  { keys: ['globe'],                         i18n: 'tutGlobe' },
  { keys: ['planets'],                       i18n: 'tutPlanets' },
  { keys: ['zoneTabs'],                      i18n: 'tutZoneTabs' },
  { keys: ['natalTabs'],                     i18n: 'tutNatal' },
  { keys: ['mapToggle'],                     i18n: 'tutMapToggle' },
  { keys: ['search', 'layerToggles'],        i18n: 'tutSearchLayers' },
];

const STEPS_MOBILE = [
  { keys: ['globe'],              i18n: 'tutGlobe' },
  { keys: ['mobPlanets'],         i18n: 'tutPlanets' },
  { keys: ['zoneTabs'],           i18n: 'tutZoneTabs' },
  { keys: ['natalTabs'],          i18n: 'tutNatal' },
  { keys: ['mapToggle'],          i18n: 'tutMapToggle' },
  { keys: ['mobSearch'],          i18n: 'tutSearchLayers' },
];

function isMobile() {
  return window.innerWidth < 900;
}

function getPopupW() {
  const vw = window.innerWidth;
  if (vw < 400) return vw - VP_MARGIN * 2 - 8;
  if (vw < 600) return Math.min(280, vw - VP_MARGIN * 2);
  return 320;
}

function getRect(key) {
  const el = document.querySelector(`[data-tutorial="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return r;
}

function unionRect(rects) {
  if (!rects.length) return null;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function computePlacement(rect, popupH, popupW) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const mob = vw < 900;

  // On mobile, always place popup below or above the target
  if (mob) {
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    let top, left;
    if (spaceBelow >= popupH + POPUP_GAP + VP_MARGIN) {
      top = rect.bottom + POPUP_GAP;
    } else if (spaceAbove >= popupH + POPUP_GAP + VP_MARGIN) {
      top = rect.top - popupH - POPUP_GAP;
    } else {
      top = Math.max(VP_MARGIN, vh - popupH - VP_MARGIN);
    }
    top = Math.max(VP_MARGIN, Math.min(vh - popupH - VP_MARGIN, top));
    left = Math.max(VP_MARGIN, Math.min(vw - popupW - VP_MARGIN, rect.left + rect.width / 2 - popupW / 2));
    return { side: top > rect.bottom ? 'bottom' : 'top', top, left, popupH };
  }

  const spaceRight  = vw - rect.right;
  const spaceLeft   = rect.left;
  const spaceBelow  = vh - rect.bottom;
  const spaceAbove  = rect.top;

  let side;
  if (spaceRight >= popupW + POPUP_GAP + VP_MARGIN) side = 'right';
  else if (spaceLeft  >= popupW + POPUP_GAP + VP_MARGIN) side = 'left';
  else if (spaceBelow >= popupH + POPUP_GAP + VP_MARGIN) side = 'bottom';
  else if (spaceAbove >= popupH + POPUP_GAP + VP_MARGIN) side = 'top';
  else side = spaceBelow >= spaceAbove ? 'bottom' : 'top';

  let top, left;
  if (side === 'right') {
    left = rect.right + POPUP_GAP;
    top  = Math.max(VP_MARGIN, Math.min(vh - popupH - VP_MARGIN, rect.top + rect.height / 2 - popupH / 2));
  } else if (side === 'left') {
    left = rect.left - popupW - POPUP_GAP;
    top  = Math.max(VP_MARGIN, Math.min(vh - popupH - VP_MARGIN, rect.top + rect.height / 2 - popupH / 2));
  } else if (side === 'bottom') {
    top  = Math.min(vh - popupH - VP_MARGIN, rect.bottom + POPUP_GAP);
    top  = Math.max(VP_MARGIN, top);
    left = Math.max(VP_MARGIN, Math.min(vw - popupW - VP_MARGIN, rect.left + rect.width / 2 - popupW / 2));
  } else {
    top  = Math.max(VP_MARGIN, rect.top - popupH - POPUP_GAP);
    left = Math.max(VP_MARGIN, Math.min(vw - popupW - VP_MARGIN, rect.left + rect.width / 2 - popupW / 2));
  }
  return { side, top, left, popupH };
}

function arrowGeometry(targetRect, place, popupW) {
  const { top, left, popupH } = place;
  const pL = left, pR = left + popupW, pT = top, pB = top + popupH;
  const pCX = left + popupW / 2, pCY = top + popupH / 2;

  const tCX = targetRect.left + targetRect.width / 2;
  const tCY = targetRect.top + targetRect.height / 2;

  const dxL = Math.abs(tCX - pL), dxR = Math.abs(tCX - pR);
  const dyT = Math.abs(tCY - pT), dyB = Math.abs(tCY - pB);
  const min = Math.min(dxL, dxR, dyT, dyB);

  let x1, y1;
  if (min === dxL)      { x1 = pL; y1 = Math.max(pT + 20, Math.min(pB - 20, tCY)); }
  else if (min === dxR) { x1 = pR; y1 = Math.max(pT + 20, Math.min(pB - 20, tCY)); }
  else if (min === dyT) { x1 = Math.max(pL + 20, Math.min(pR - 20, tCX)); y1 = pT; }
  else                  { x1 = Math.max(pL + 20, Math.min(pR - 20, tCX)); y1 = pB; }

  const dL = Math.abs(pCX - targetRect.left);
  const dR = Math.abs(pCX - targetRect.right);
  const dT = Math.abs(pCY - targetRect.top);
  const dB = Math.abs(pCY - targetRect.bottom);
  const m = Math.min(dL, dR, dT, dB);
  let x2, y2;
  if (m === dL)      { x2 = targetRect.left - 4;  y2 = tCY; }
  else if (m === dR) { x2 = targetRect.right + 4; y2 = tCY; }
  else if (m === dT) { x2 = tCX;                  y2 = targetRect.top - 4; }
  else               { x2 = tCX;                  y2 = targetRect.bottom + 4; }

  return { x1, y1, x2, y2 };
}

export default function Tutorial({ lang, onClose, onStep }) {
  const [phase, setPhase] = useState('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [rects, setRects] = useState([]);
  const [tick, setTick] = useState(0);
  const [popupH, setPopupH] = useState(240);
  const popupRef = useRef(null);

  const mob = isMobile();
  const popupW = getPopupW();
  const activeSteps = useMemo(() => mob ? STEPS_MOBILE : STEPS_DESKTOP, [mob]);

  const step = activeSteps[stepIdx];

  useEffect(() => {
    if (phase === 'running' && onStep && step) onStep(step.keys);
  }, [phase, stepIdx, step, onStep]);

  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => {
      const rs = step.keys.map(getRect).filter(Boolean);
      setRects(rs);
    };
    measure();
    const timers = [50, 150, 400].map(d => setTimeout(measure, d));
    return () => timers.forEach(clearTimeout);
  }, [step, tick]);

  useEffect(() => {
    const onChange = () => setTick(x => x + 1);
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, []);

  const next = useCallback(() => {
    if (stepIdx < activeSteps.length - 1) setStepIdx(i => i + 1);
    else onClose(true, true);
  }, [stepIdx, activeSteps.length, onClose]);

  const prev = useCallback(() => {
    if (stepIdx > 0) setStepIdx(i => i - 1);
  }, [stepIdx]);

  const dismiss = useCallback(() => onClose(true, false), [onClose]);

  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next, prev, dismiss]);

  useLayoutEffect(() => {
    if (phase !== 'running' || !popupRef.current) return;
    const h = popupRef.current.offsetHeight;
    if (h && Math.abs(h - popupH) > 4) setPopupH(h);
  }, [phase, step, rects, popupH]);

  // ── Intro dialog ──
  if (phase === 'intro') {
    const introW = mob ? 'calc(100% - 32px)' : 360;
    return (
      <div
        role="dialog"
        aria-label={t('tutorialIntroTitle', lang)}
        style={{ position: 'fixed', inset: 0, zIndex: 99990, background: 'rgba(2,8,18,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div style={{ width: introW, maxWidth: 360, background: '#0A1222', border: `1px solid ${ACCENT}`, borderRadius: 10, boxShadow: '0 18px 50px rgba(0,0,0,.65), 0 0 0 1px rgba(0,216,138,.18)', color: '#E4ECF5', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1A2840', background: '#0E1828' }}>
            <span style={{ ...F, fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>{t('tutorialIntroBadge', lang)}</span>
            <span onClick={dismiss} style={{ ...F, fontSize: 12, color: '#7B8AA0', cursor: 'pointer', padding: '2px 6px', borderRadius: 3, lineHeight: 1 }} title={t('tutorialIntroNo', lang)}>✕</span>
          </div>
          <div style={{ padding: mob ? '14px 14px 4px' : '18px 18px 6px' }}>
            <div style={{ ...F, fontSize: mob ? 13 : 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.3 }}>{t('tutorialIntroTitle', lang)}</div>
            <div style={{ fontSize: mob ? 12 : 13, lineHeight: 1.6, color: '#B6C2D2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t('tutorialIntroBody', lang)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 16px' }}>
            <span onClick={dismiss} style={{ ...F, fontSize: 10, fontWeight: 600, color: '#B6C2D2', background: 'transparent', border: '1px solid #2A3A50', borderRadius: 5, padding: '7px 14px', cursor: 'pointer', letterSpacing: 1 }}>
              {t('tutorialIntroNo', lang)}
            </span>
            <span onClick={() => setPhase('running')} style={{ ...F, fontSize: 10, fontWeight: 700, color: '#02101E', background: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 5, padding: '7px 16px', cursor: 'pointer', letterSpacing: 1 }}>
              {t('tutorialIntroYes', lang)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const union = rects.length ? unionRect(rects) : null;
  const place = union
    ? computePlacement(union, popupH, popupW)
    : { side: 'center', top: Math.max(VP_MARGIN, window.innerHeight / 2 - popupH / 2), left: Math.max(VP_MARGIN, window.innerWidth / 2 - popupW / 2), popupH };

  const vw = window.innerWidth, vh = window.innerHeight;
  const cuts = rects.map(r => ({
    x: Math.max(0, r.left - PADDING),
    y: Math.max(0, r.top - PADDING),
    w: Math.min(vw, r.width + PADDING * 2),
    h: Math.min(vh, r.height + PADDING * 2),
  }));
  const arrows = rects.map(r => arrowGeometry(r, place, popupW));

  const title = t(`${step.i18n}Title`, lang);
  const body  = t(`${step.i18n}Body`,  lang);

  return (
    <div
      role="dialog"
      aria-label={t('tutorialAriaLabel', lang)}
      style={{ position: 'fixed', inset: 0, zIndex: 99990, pointerEvents: 'none' }}
    >
      <svg width={vw} height={vh} style={{ position: 'fixed', inset: 0, pointerEvents: 'auto' }} onClick={dismiss}>
        <defs>
          <mask id="nn-tut-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {cuts.map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx="10" ry="10" fill="black" />
            ))}
          </mask>
          <marker id="nn-tut-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={ACCENT} />
          </marker>
        </defs>
        <rect x="0" y="0" width={vw} height={vh} fill="rgba(2, 8, 18, 0.72)" mask="url(#nn-tut-mask)" />
        {cuts.map((c, i) => (
          <rect
            key={i}
            x={c.x} y={c.y} width={c.w} height={c.h}
            rx="10" ry="10"
            fill="none" stroke={ACCENT} strokeWidth="2" strokeDasharray="6 4"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,216,138,.65))' }}
            pointerEvents="none"
          />
        ))}
        {arrows.map((a, i) => (
          <line
            key={i}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={ACCENT} strokeWidth="2.2"
            markerEnd="url(#nn-tut-arrow)"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,216,138,.55))' }}
            pointerEvents="none"
          />
        ))}
      </svg>

      <div
        ref={popupRef}
        style={{
          position: 'fixed',
          top: place.top,
          left: place.left,
          width: popupW,
          maxHeight: `calc(100vh - ${VP_MARGIN * 2}px)`,
          background: '#0A1222',
          border: `1px solid ${ACCENT}`,
          borderRadius: 10,
          boxShadow: '0 18px 50px rgba(0,0,0,.65), 0 0 0 1px rgba(0,216,138,.18)',
          color: '#E4ECF5',
          pointerEvents: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '8px 12px' : '10px 14px', borderBottom: '1px solid #1A2840', background: '#0E1828', flexShrink: 0 }}>
          <span style={{ ...F, fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>
            {t('tutorialBadge', lang)} · {stepIdx + 1}/{activeSteps.length}
          </span>
          <span
            onClick={dismiss}
            style={{ ...F, fontSize: 12, color: '#7B8AA0', cursor: 'pointer', padding: '2px 6px', borderRadius: 3, lineHeight: 1 }}
            title={t('tutorialSkip', lang)}
          >
            ✕
          </span>
        </div>

        <div style={{ padding: mob ? '10px 12px 2px' : '14px 16px 4px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          <div style={{ ...F, fontSize: mob ? 12 : 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 6, letterSpacing: 0.3 }}>{title}</div>
          <div style={{ fontSize: mob ? 11 : 12.5, lineHeight: 1.55, color: '#B6C2D2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{body}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0 4px', flexShrink: 0 }}>
          {activeSteps.map((_, i) => (
            <span
              key={i}
              onClick={() => setStepIdx(i)}
              style={{
                width: i === stepIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === stepIdx ? ACCENT : '#2A3A50',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mob ? '8px 12px 10px' : '10px 14px 12px', borderTop: '1px solid #1A2840', background: '#0E1828', flexShrink: 0 }}>
          <span
            onClick={dismiss}
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
              style={{ ...F, fontSize: 10, fontWeight: 700, color: '#02101E', background: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 5, padding: '6px 14px', cursor: 'pointer', letterSpacing: 1 }}
            >
              {stepIdx === activeSteps.length - 1 ? t('tutorialDone', lang) : t('tutorialNext', lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
