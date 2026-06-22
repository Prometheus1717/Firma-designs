import { useCallback, useEffect, useRef } from 'react';

export function useMobileFormViewport() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const body = document.body;
    let raf = 0;

    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const height = Math.round((vv && vv.height) || window.innerHeight || root.clientHeight || 0);
        if (height > 0) root.style.setProperty('--app-height', `${height}px`);

        const keyboardInset = vv
          ? Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)))
          : 0;
        root.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
      });
    };

    root.classList.add('nn-form-route');
    body.classList.add('nn-form-route');
    sync();

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });
    window.visualViewport?.addEventListener('resize', sync, { passive: true });
    window.visualViewport?.addEventListener('scroll', sync, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      root.classList.remove('nn-form-route');
      body.classList.remove('nn-form-route');
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);

  const scrollFocusedField = useCallback((event) => {
    const field = event.currentTarget;
    const scroll = () => {
      const container = containerRef.current;
      if (!container || !field) return;

      const containerRect = container.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const targetTop = container.scrollTop + fieldRect.top - containerRect.top - containerRect.height * 0.28;

      const top = Math.max(0, targetTop);
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top, behavior: 'smooth' });
      } else {
        container.scrollTop = top;
      }
    };

    // iOS Safari updates visualViewport in stages when the keyboard/password
    // accessory appears. Re-run after each stage so the final position is clean.
    window.setTimeout(scroll, 80);
    window.setTimeout(scroll, 320);
    window.setTimeout(scroll, 650);
  }, []);

  return { containerRef, scrollFocusedField };
}
