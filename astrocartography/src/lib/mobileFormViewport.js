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

        // Device-agnostic "keyboard is open" signal. The per-page media queries
        // only top-align the form on phones (≤640px); iPad / desktop-width touch
        // devices kept a centred card that clips its own top out of reach once
        // the visual viewport shrinks. Toggling this class lets CSS top-align the
        // form at ANY width while a keyboard is actually present. 80px clears
        // browser-chrome jitter without missing a real keyboard.
        root.classList.toggle('nn-keyboard-open', keyboardInset > 80);
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
      root.classList.remove('nn-keyboard-open');
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);

  const scrollFocusedField = useCallback((event) => {
    const field = event.currentTarget;
    const scroll = () => {
      const container = containerRef.current;
      if (!container || !field || !field.isConnected) return;

      const containerRect = container.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();

      // Only scroll when the field is actually hidden (behind the keyboard or
      // outside the container). Unconditional scrolling made every focus jump
      // the whole form to a fixed position — visually "everything leaps up" on
      // each field tap even when the field was already perfectly visible.
      const vv = window.visualViewport;
      const visibleBottom = vv ? vv.height + vv.offsetTop : window.innerHeight;
      const topBound = Math.max(containerRect.top, 0) + 8;
      const bottomBound = Math.min(containerRect.bottom, visibleBottom) - 8;
      if (fieldRect.top >= topBound && fieldRect.bottom <= bottomBound) return;

      const targetTop = container.scrollTop + fieldRect.top - containerRect.top - containerRect.height * 0.28;
      const top = Math.max(0, targetTop);
      if (Math.abs(top - container.scrollTop) < 4) return;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top, behavior: 'smooth' });
      } else {
        container.scrollTop = top;
      }
    };

    // iOS Safari updates visualViewport in stages when the keyboard/password
    // accessory appears. Re-run after each stage so the final position is clean
    // (each pass is a no-op once the field is visible).
    window.setTimeout(scroll, 80);
    window.setTimeout(scroll, 320);
    window.setTimeout(scroll, 650);
  }, []);

  return { containerRef, scrollFocusedField };
}
