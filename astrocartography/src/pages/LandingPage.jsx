import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── SVG Icons ───
const ArrowIcon = () => (
  <svg className="lp-arrow-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10m-4-4 4 4-4 4"/></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)', flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/><path d="M2 12h20"/></svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ToggleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M12 3v18m0-18a5.5 5.5 0 0 1 0 11 5.5 5.5 0 0 1 0-11z"/><circle cx="12" cy="5" r="2"/></svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8m8 4H8"/></svg>
);
const ThriveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
);
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--lp-accent)' }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28, color: 'var(--lp-accent)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28, color: 'var(--lp-accent)' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M12 14h.01"/></svg>
);
const GlobeIcon28 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28, color: 'var(--lp-accent)' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/><path d="M2 12h20"/></svg>
);
const PlayPlaceholder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 64, height: 64, opacity: 0.3 }}><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>
);

// ─── Feature Point ───
function FeaturePoint({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lp-accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</h4>
        <p style={{ fontSize: 14, color: 'var(--lp-text-secondary)', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Screenshot Card (replaces video placeholders) ───
function ScreenshotCard({ src, alt, zoomOrigin }) {
  return (
    <div className="lp-screenshot-wrap">
      <img src={src} alt={alt} loading="lazy" className="lp-screenshot-img" style={{ transformOrigin: zoomOrigin || 'center center' }} />
    </div>
  );
}

// ─── Video Placeholder (fallback) ───
function VideoPlaceholder({ text }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '16/10', background: 'linear-gradient(135deg, #0A1018, #0D1822)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      color: 'var(--lp-text-muted)', fontSize: 14,
    }}>
      <PlayPlaceholder />
      <span>{text}</span>
    </div>
  );
}

// Image sets for dark/light A/B variants
const IMAGES = {
  dark: {
    dashboard: '/landing/dark-dashboard-full.jpg',
    globe: '/landing/dark-globe.jpg',
    natal: '/landing/dark-natal-chart.jpg',
    cities: '/landing/dark-dashboard-full.jpg',
  },
  light: {
    dashboard: '/landing/dashboard-full.jpg',
    globe: '/landing/globe.jpg',
    natal: '/landing/dashboard-full-natal.jpg',
    cities: '/landing/dashboard-full.jpg',
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const rootRef = useRef(null);

  // A/B variant: /landing?v=light for light mode, default dark
  const variant = new URLSearchParams(window.location.search).get('v') === 'light' ? 'light' : 'dark';
  const isLight = variant === 'light';
  const imgs = IMAGES[variant];

  // Scroll effect for navbar
  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('lp-scrolled', container.scrollTop > 40);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-based reveal — queries DOM directly, no ref tracking needed
  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;
    let lastScroll = -1;
    let rafId;
    const checkReveals = () => {
      const scrollTop = container.scrollTop;
      if (scrollTop === lastScroll) return;
      lastScroll = scrollTop;
      const viewH = container.clientHeight;
      const containerTop = container.getBoundingClientRect().top;
      container.querySelectorAll('.lp-reveal:not(.lp-visible)').forEach(el => {
        const relTop = el.getBoundingClientRect().top - containerTop;
        if (relTop < viewH + 80) {
          el.classList.add('lp-visible');
        }
      });
    };
    // Use both scroll event AND rAF loop for maximum reliability
    container.addEventListener('scroll', checkReveals, { passive: true });
    const loop = () => { checkReveals(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
    return () => { container.removeEventListener('scroll', checkReveals); cancelAnimationFrame(rafId); };
  }, []);

  const goAuth = () => navigate('/auth');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el && rootRef.current) {
      const top = el.offsetTop - 80;
      rootRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className={`lp-root${isLight ? ' lp-light' : ''}`} ref={rootRef}>
      <style>{landingCSS}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className="lp-navbar" ref={navRef}>
        <div className="lp-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(24px, 4vw, 120px)' }}>
          <a href="/landing" className="lp-nav-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/><path d="M2 12h20"/>
            </svg>
            NATAL NAVIGATOR
          </a>
          <ul className="lp-nav-links">
            <li><a href="#lp-features" onClick={(e) => { e.preventDefault(); scrollTo('lp-features'); }}>Features</a></li>
            <li><a href="#lp-how" onClick={(e) => { e.preventDefault(); scrollTo('lp-how'); }}>How It Works</a></li>
            <li><a href="#lp-pricing" onClick={(e) => { e.preventDefault(); scrollTo('lp-pricing'); }}>Pricing</a></li>
          </ul>
          <div className="lp-nav-cta">
            <button onClick={goAuth} className="lp-pill lp-pill--accent">
              <span className="lp-pill-inner">Create My Chart <ArrowIcon /></span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        <div className="lp-hero-bg"><div className="lp-hero-placeholder" /></div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-dot" />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Personal astrocartography maps —</span>
            <span style={{ color: 'var(--lp-accent)', fontWeight: 600 }}>Free to try</span>
          </div>
          <h1 className="lp-hero-heading lp-gradient-text">Discover Where Your Stars Align</h1>
          <p className="lp-hero-sub">
            NatalNavigator maps your birth chart onto the world. Explore an interactive 3D globe with planetary lines, discover your ideal cities, and unlock the hidden geography of your natal chart.
          </p>
          <div className="lp-hero-cta">
            <button onClick={goAuth} className="lp-pill lp-pill--accent">
              <span className="lp-pill-inner">Create My Chart — Free <ArrowIcon /></span>
            </button>
            <button onClick={() => scrollTo('lp-features')} className="lp-pill lp-pill--dark">
              <span className="lp-pill-inner">See How It Works</span>
            </button>
          </div>
        </div>
        <div className="lp-scroll-indicator">
          <span>Explore</span>
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: -80, padding: '0 24px 120px' }}>
        <div className="lp-dashboard-frame lp-reveal">
          <div className="lp-frame-bar">
            <div className="lp-frame-dot" style={{ background: '#FF5F57' }} />
            <div className="lp-frame-dot" style={{ background: '#FFBD2E' }} />
            <div className="lp-frame-dot" style={{ background: '#28C840' }} />
            <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--lp-text-muted)', letterSpacing: 0.5 }}>natalnavigator.com/dashboard</div>
          </div>
          <ScreenshotCard src={imgs.dashboard} alt="NatalNavigator Dashboard — Interactive astrocartography globe with planetary lines" zoomOrigin="center 40%" />
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {[
              { n: '345+', l: 'Cities Analyzed' },
              { n: '10', l: 'Celestial Bodies' },
              { n: '4', l: 'Angular Lines' },
              { n: '\u221E', l: 'Possibilities' },
            ].map((s, i) => (
              <div key={i} className={`lp-reveal ${i > 0 ? `lp-delay-${i}` : ''}`}>
                <div className="lp-stat-number">{s.n}</div>
                <div className="lp-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 1: ASTROCARTOGRAPHY ═══ */}
      <section className="lp-feature" id="lp-features">
        <div className="lp-container">
          <div className="lp-feature-grid">
            <div className="lp-feature-text lp-reveal">
              <div className="lp-section-label">Astrocartography</div>
              <h2 className="lp-section-heading lp-gradient-text">Your Planetary Lines, Mapped Across the Globe</h2>
              <p className="lp-section-sub">See exactly where each planet's energy is strongest for you. NatalNavigator plots your MC, IC, ASC, and DSC lines for all 10 celestial bodies on an interactive 3D globe.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <FeaturePoint icon={<GlobeIcon />} title="Interactive 3D Globe" desc="Drag, rotate, and zoom to explore your planetary lines anywhere on Earth. Powered by D3.js with smooth, responsive interactions." />
                <FeaturePoint icon={<PinIcon />} title="345+ Cities Analyzed" desc="Every city rated as THRIVE, NEUTRAL, or AVOID based on how your planetary lines interact with that location." />
                <FeaturePoint icon={<ToggleIcon />} title="Planet-by-Planet Control" desc="Toggle individual planets — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto — to see their unique influence." />
              </div>
            </div>
            <div className="lp-video-card lp-reveal lp-delay-2">
              <ScreenshotCard src={imgs.globe} alt="Interactive 3D globe with astrocartography lines" zoomOrigin="60% 30%" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 2: NATAL CHART ═══ */}
      <section className="lp-feature">
        <div className="lp-container">
          <div className="lp-feature-grid lp-reverse">
            <div className="lp-feature-text lp-reveal">
              <div className="lp-section-label">Natal Chart</div>
              <h2 className="lp-section-heading lp-gradient-text">Your Birth Chart, Beautifully Rendered</h2>
              <p className="lp-section-sub">A precision-crafted natal wheel using the astronomy-engine library for real astronomical accuracy — not simplified approximations.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <FeaturePoint icon={<ClockIcon />} title="Astronomical Precision" desc="Real planetary ephemeris calculations — not tables. Your chart uses the same engine NASA uses for celestial mechanics." />
                <FeaturePoint icon={<StarIcon />} title="Houses, Aspects & Signs" desc="Full 12-house system with planetary aspects, zodiac sign placements, and retrograde tracking — all visualized in a clean natal wheel." />
                <FeaturePoint icon={<DocIcon />} title="PDF Export" desc="Download your complete natal chart as a beautifully formatted PDF report to keep or share." />
              </div>
            </div>
            <div className="lp-video-card lp-reveal lp-delay-2">
              <ScreenshotCard src={imgs.natal} alt="Natal chart wheel with planetary positions" zoomOrigin="85% 30%" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 3: CITY READINGS ═══ */}
      <section className="lp-feature">
        <div className="lp-container">
          <div className="lp-feature-grid">
            <div className="lp-feature-text lp-reveal">
              <div className="lp-section-label">City Readings</div>
              <h2 className="lp-section-heading lp-gradient-text">Find Your Best Cities on Earth</h2>
              <p className="lp-section-sub">Not all places are equal in your chart. NatalNavigator rates 345+ cities worldwide based on your unique planetary alignments.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <FeaturePoint icon={<ThriveIcon />} title="Thrive Zones" desc="Cities where your planetary lines converge favorably — ideal for career, relationships, or personal growth." />
                <FeaturePoint icon={<WarnIcon />} title="Caution Zones" desc="Cities where challenging planetary energies are strongest — be aware of potential difficulties before relocating." />
                <FeaturePoint icon={<GridIcon />} title="Detailed Readings" desc="Each city comes with personalized astrological readings explaining exactly why it's rated the way it is for you." />
              </div>
            </div>
            <div className="lp-video-card lp-reveal lp-delay-2">
              <ScreenshotCard src={imgs.cities} alt="City readings panel with Thrive and Avoid zones" zoomOrigin="10% 75%" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-how" id="lp-how">
        <div className="lp-container" style={{ textAlign: 'center' }}>
          <div className="lp-section-label" style={{ textAlign: 'center' }}>How It Works</div>
          <h2 className="lp-section-heading lp-gradient-text" style={{ textAlign: 'center', margin: '0 auto' }}>Three Steps to Your Map</h2>
          <div className="lp-steps-grid">
            {[
              { num: '01', icon: <UserIcon />, title: 'Create Your Account', desc: 'Sign up in seconds with just your email. No credit card required to start exploring.' },
              { num: '02', icon: <CalendarIcon />, title: 'Enter Your Birth Data', desc: 'Provide your date, time, and city of birth. We calculate your exact natal positions from real astronomical data.' },
              { num: '03', icon: <GlobeIcon28 />, title: 'Explore Your Map', desc: 'Your personal astrocartography globe is ready. Discover your planetary lines, best cities, and natal chart — all in one place.' },
            ].map((step, i) => (
              <div key={i} className={`lp-step-card lp-reveal ${i > 0 ? `lp-delay-${i}` : ''}`}>
                <div className="lp-step-number">{step.num}</div>
                <div className="lp-step-icon">{step.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--lp-text-secondary)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="lp-pricing" id="lp-pricing">
        <div className="lp-container" style={{ textAlign: 'center' }}>
          <div className="lp-section-label" style={{ textAlign: 'center' }}>Pricing</div>
          <h2 className="lp-section-heading lp-gradient-text" style={{ textAlign: 'center', margin: '0 auto' }}>Simple, One-Time Pricing</h2>
          <p className="lp-section-sub" style={{ textAlign: 'center', margin: '16px auto 0' }}>No subscriptions. No hidden fees. Pay once, access forever.</p>
          <div className="lp-pricing-grid">
            {/* Free */}
            <div className="lp-pricing-card lp-reveal">
              <div className="lp-pricing-tier">Explorer</div>
              <div className="lp-pricing-price">Free</div>
              <p className="lp-pricing-desc">Try the demo and see what astrocartography can reveal.</p>
              <ul className="lp-pricing-features">
                <li><CheckIcon /> Demo globe with sample chart</li>
                <li><CheckIcon /> Preview planetary lines</li>
                <li><CheckIcon /> See how it works before you commit</li>
              </ul>
              <button onClick={() => navigate('/')} className="lp-pill lp-pill--dark" style={{ width: '100%' }}>
                <span className="lp-pill-inner" style={{ width: '100%', justifyContent: 'center' }}>Try the Demo</span>
              </button>
            </div>
            {/* Premium */}
            <div className="lp-pricing-card lp-pricing-featured lp-reveal lp-delay-1">
              <div className="lp-pricing-tier">Premium</div>
              <div className="lp-pricing-price">&euro;4.99 <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--lp-text-muted)' }}>one-time</span></div>
              <p className="lp-pricing-desc">Unlock your personal chart forever. No subscription.</p>
              <ul className="lp-pricing-features">
                <li><CheckIcon /> Your personal astrocartography globe</li>
                <li><CheckIcon /> Full natal chart wheel</li>
                <li><CheckIcon /> 345+ city readings (Thrive / Avoid)</li>
                <li><CheckIcon /> PDF chart export</li>
                <li><CheckIcon /> Lifetime access — pay once, keep forever</li>
              </ul>
              <button onClick={goAuth} className="lp-pill lp-pill--accent" style={{ width: '100%' }}>
                <span className="lp-pill-inner" style={{ width: '100%', justifyContent: 'center' }}>Get Premium <ArrowIcon /></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-content lp-reveal">
            <div className="lp-section-label">Ready?</div>
            <h2 className="lp-section-heading lp-gradient-text" style={{ maxWidth: 600, margin: '0 auto' }}>Your Stars Are Already Aligned. Now See Where.</h2>
            <p className="lp-section-sub" style={{ textAlign: 'center', margin: '0 auto' }}>
              Join thousands discovering their personal geography through the lens of their natal chart.
            </p>
            <button onClick={goAuth} className="lp-pill lp-pill--accent">
              <span className="lp-pill-inner">Create My Chart — Free <ArrowIcon /></span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-logo">NATAL NAVIGATOR</div>
            <ul className="lp-footer-links">
              <li><a href="#lp-features" onClick={(e) => { e.preventDefault(); scrollTo('lp-features'); }}>Features</a></li>
              <li><a href="#lp-how" onClick={(e) => { e.preventDefault(); scrollTo('lp-how'); }}>How It Works</a></li>
              <li><a href="#lp-pricing" onClick={(e) => { e.preventDefault(); scrollTo('lp-pricing'); }}>Pricing</a></li>
              <li><a href="mailto:info@natalnavigator.com">Contact</a></li>
            </ul>
            <div className="lp-footer-copy">&copy; 2026 NatalNavigator. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════
// All CSS scoped with .lp- prefix to avoid
// conflicts with the main app styles
// ═══════════════════════════════════════════
const landingCSS = `
  .lp-root {
    --lp-accent: #00D88A;
    --lp-accent-glow: rgba(0, 216, 138, 0.15);
    --lp-accent-dim: rgba(0, 216, 138, 0.6);
    --lp-bg-dark: #000000;
    --lp-bg-card: #0A0F14;
    --lp-bg-card-border: rgba(255,255,255,0.06);
    --lp-text-primary: #ffffff;
    --lp-text-secondary: rgba(255,255,255,0.7);
    --lp-text-muted: rgba(255,255,255,0.4);
    --lp-gold: #E8A838;

    font-family: 'General Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #000;
    color: #fff;
    overflow-x: hidden;
    overflow-y: auto;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
  .lp-root *, .lp-root *::before, .lp-root *::after { margin: 0; padding: 0; box-sizing: border-box; }
  .lp-root a { color: inherit; text-decoration: none; }
  .lp-root button { font-family: inherit; cursor: pointer; border: none; background: none; }
  .lp-root img, .lp-root video { display: block; max-width: 100%; }

  .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  /* ── Section Labels ── */
  .lp-section-label {
    font-size: 13px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase;
    color: var(--lp-accent); margin-bottom: 16px;
  }
  .lp-section-heading {
    font-size: clamp(32px, 5vw, 52px); font-weight: 600; line-height: 1.15;
    letter-spacing: -0.02em; margin-bottom: 20px;
  }
  .lp-section-sub { font-size: 16px; color: var(--lp-text-secondary); max-width: 600px; line-height: 1.7; }
  .lp-gradient-text {
    background: linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* ── Pill Buttons ── */
  .lp-pill {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    border-radius: 999px; border: 0.6px solid rgba(255,255,255,0.25); padding: 1px;
    transition: all 0.3s ease;
  }
  .lp-pill::before {
    content: ''; position: absolute; top: -1px; left: 20%; right: 20%; height: 8px;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.35), transparent);
    border-radius: 0 0 50% 50%; filter: blur(4px); pointer-events: none;
  }
  .lp-pill-inner {
    display: inline-flex; align-items: center; gap: 8px; padding: 12px 32px;
    border-radius: 999px; font-size: 14px; font-weight: 500; transition: all 0.3s ease;
  }
  .lp-pill--dark .lp-pill-inner { background: #000; color: #fff; }
  .lp-pill--accent .lp-pill-inner { background: var(--lp-accent); color: #000; font-weight: 600; }
  .lp-pill--accent { border-color: var(--lp-accent); }
  .lp-pill--accent::before { background: radial-gradient(ellipse at center, rgba(0,216,138,0.5), transparent); }
  .lp-pill:hover { transform: translateY(-2px); }
  .lp-pill:hover .lp-pill-inner { box-shadow: 0 8px 32px rgba(0,216,138,0.2); }
  .lp-arrow-icon { width: 16px; height: 16px; transition: transform 0.3s ease; }
  .lp-pill:hover .lp-arrow-icon { transform: translateX(3px); }

  /* ── Navbar ── */
  .lp-navbar {
    position: sticky; top: 0; left: 0; right: 0; z-index: 1000; padding: 20px 0;
    transition: background 0.3s ease, backdrop-filter 0.3s ease;
  }
  .lp-navbar.lp-scrolled {
    background: rgba(0,0,0,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .lp-nav-logo {
    display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700;
    letter-spacing: 4px; color: var(--lp-accent);
  }
  .lp-nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
  .lp-nav-links a { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.7); transition: color 0.2s; }
  .lp-nav-links a:hover { color: #fff; }
  @media (max-width: 768px) {
    .lp-nav-links { display: none; }
    .lp-nav-cta { display: none; }
  }

  /* ── Hero ── */
  .lp-hero {
    position: relative; min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; overflow: hidden;
  }
  .lp-hero-bg { position: absolute; inset: 0; z-index: 0; }
  .lp-hero-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #0A1018 0%, #0D1822 30%, #0A1220 60%, #000 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .lp-hero-placeholder::before {
    content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,216,138,0.08) 0%, transparent 70%);
    animation: lp-pulse-glow 4s ease-in-out infinite;
  }
  @keyframes lp-pulse-glow {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.15); opacity: 1; }
  }
  .lp-hero-content {
    position: relative; z-index: 2; text-align: center; display: flex; flex-direction: column;
    align-items: center; gap: 32px; padding: clamp(160px, 20vw, 280px) 24px 80px;
  }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px;
    border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    font-size: 13px; font-weight: 500; animation: lp-fade-in-up 0.8s ease-out;
  }
  .lp-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--lp-accent);
    box-shadow: 0 0 8px var(--lp-accent); animation: lp-dot-pulse 2s ease-in-out infinite;
  }
  @keyframes lp-dot-pulse {
    0%, 100% { box-shadow: 0 0 4px var(--lp-accent); }
    50% { box-shadow: 0 0 12px var(--lp-accent), 0 0 24px rgba(0,216,138,0.3); }
  }
  .lp-hero-heading {
    font-size: clamp(38px, 6.5vw, 64px); font-weight: 600; line-height: 1.12;
    letter-spacing: -0.03em; max-width: 720px; animation: lp-fade-in-up 0.8s ease-out 0.15s both;
  }
  .lp-hero-sub {
    font-size: clamp(15px, 2vw, 17px); color: var(--lp-text-secondary); max-width: 620px;
    line-height: 1.7; animation: lp-fade-in-up 0.8s ease-out 0.3s both;
  }
  .lp-hero-cta {
    display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
    animation: lp-fade-in-up 0.8s ease-out 0.45s both;
  }
  @keyframes lp-fade-in-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .lp-scroll-indicator {
    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 2;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: lp-fade-in-up 0.8s ease-out 0.8s both;
  }
  .lp-scroll-indicator span { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--lp-text-muted); }
  .lp-scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
    animation: lp-scroll-anim 2s ease-in-out infinite;
  }
  @keyframes lp-scroll-anim {
    0%, 100% { opacity: 0.3; transform: scaleY(0.6); }
    50% { opacity: 1; transform: scaleY(1); }
  }

  /* ── Dashboard Preview ── */
  .lp-dashboard-frame {
    max-width: 1100px; margin: 0 auto; border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08); overflow: hidden; background: #0A1018;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(0,216,138,0.05);
  }
  .lp-frame-bar {
    display: flex; align-items: center; gap: 8px; padding: 14px 20px;
    background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .lp-frame-dot { width: 10px; height: 10px; border-radius: 50%; }

  /* ── Stats ── */
  .lp-stats { padding: 80px 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .lp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px; text-align: center; }
  .lp-stat-number {
    font-size: clamp(36px, 5vw, 52px); font-weight: 700; color: var(--lp-accent);
    letter-spacing: -0.02em; line-height: 1; margin-bottom: 8px;
  }
  .lp-stat-label { font-size: 14px; color: var(--lp-text-muted); letter-spacing: 1px; text-transform: uppercase; }
  @media (max-width: 768px) { .lp-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; } }

  /* ── Features ── */
  .lp-feature { padding: 120px 0; }
  .lp-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .lp-feature-grid.lp-reverse { direction: rtl; }
  .lp-feature-grid.lp-reverse > * { direction: ltr; }
  .lp-feature-text { display: flex; flex-direction: column; gap: 20px; }
  .lp-video-card {
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden;
    background: var(--lp-bg-card); box-shadow: 0 24px 60px rgba(0,0,0,0.4);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }
  .lp-video-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,216,138,0.06);
  }
  @media (max-width: 900px) {
    .lp-feature-grid, .lp-feature-grid.lp-reverse { grid-template-columns: 1fr; gap: 40px; direction: ltr; }
  }

  /* ── How It Works ── */
  .lp-how { padding: 120px 0; }
  .lp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 60px; }
  .lp-step-card {
    padding: 40px 32px; border-radius: 20px; background: var(--lp-bg-card);
    border: 1px solid var(--lp-bg-card-border); text-align: center; position: relative;
    transition: transform 0.3s ease, border-color 0.3s ease;
  }
  .lp-step-card:hover { transform: translateY(-6px); border-color: rgba(0,216,138,0.15); }
  .lp-step-number { font-size: 48px; font-weight: 700; color: var(--lp-accent); opacity: 0.2; line-height: 1; margin-bottom: 20px; }
  .lp-step-icon {
    width: 56px; height: 56px; border-radius: 16px; background: var(--lp-accent-glow);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
  }
  @media (max-width: 768px) {
    .lp-steps-grid { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; }
  }

  /* ── Pricing ── */
  .lp-pricing { padding: 120px 0; }
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 800px; margin: 60px auto 0; }
  .lp-pricing-card {
    padding: 44px 36px; border-radius: 20px; background: var(--lp-bg-card);
    border: 1px solid var(--lp-bg-card-border); text-align: left; position: relative;
    transition: transform 0.3s ease;
  }
  .lp-pricing-card:hover { transform: translateY(-4px); }
  .lp-pricing-featured { border-color: var(--lp-accent); box-shadow: 0 0 60px rgba(0,216,138,0.08); }
  .lp-pricing-featured::before {
    content: 'MOST POPULAR'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #000;
    background: var(--lp-accent); padding: 4px 16px; border-radius: 999px;
  }
  .lp-pricing-tier { font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--lp-text-muted); margin-bottom: 16px; }
  .lp-pricing-price { font-size: 44px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .lp-pricing-desc { font-size: 14px; color: var(--lp-text-secondary); margin-bottom: 28px; }
  .lp-pricing-features { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
  .lp-pricing-features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--lp-text-secondary); }
  @media (max-width: 600px) { .lp-pricing-grid { grid-template-columns: 1fr; } }

  /* ── CTA ── */
  .lp-cta { padding: 140px 0; text-align: center; position: relative; }
  .lp-cta::before {
    content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px; background: radial-gradient(ellipse, rgba(0,216,138,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-cta-content { position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px; }

  /* ── Footer ── */
  .lp-footer { padding: 48px 0; border-top: 1px solid rgba(255,255,255,0.05); }
  .lp-footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .lp-footer-logo { font-size: 14px; font-weight: 700; letter-spacing: 4px; color: var(--lp-accent); }
  .lp-footer-links { display: flex; gap: 28px; list-style: none; }
  .lp-footer-links a { font-size: 13px; color: var(--lp-text-muted); transition: color 0.2s; }
  .lp-footer-links a:hover { color: #fff; }
  .lp-footer-copy { font-size: 12px; color: var(--lp-text-muted); width: 100%; text-align: center; margin-top: 24px; }

  /* ── Screenshot Cards ── */
  .lp-screenshot-wrap {
    width: 100%; aspect-ratio: 16/10; overflow: hidden; position: relative;
    border-radius: 8px;
  }
  .lp-screenshot-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.6s ease;
    filter: brightness(0.9) saturate(1.1);
  }
  .lp-video-card:hover .lp-screenshot-img {
    transform: scale(1.15);
    filter: brightness(1) saturate(1.2);
  }
  /* Dashboard preview frame uses different aspect ratio */
  .lp-dashboard-frame .lp-screenshot-wrap {
    aspect-ratio: 16/9;
    border-radius: 0;
  }
  .lp-dashboard-frame .lp-screenshot-img {
    transition: transform 8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .lp-dashboard-frame:hover .lp-screenshot-img {
    transform: scale(1.08);
  }

  /* ── Reveal Animations ── */
  .lp-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
  .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }
  .lp-delay-1 { transition-delay: 0.15s; }
  .lp-delay-2 { transition-delay: 0.3s; }
  .lp-delay-3 { transition-delay: 0.45s; }

  /* ═══ LIGHT MODE VARIANT ═══ */
  .lp-root.lp-light {
    --lp-accent: #00A86B;
    --lp-accent-glow: rgba(0, 168, 107, 0.12);
    --lp-accent-dim: rgba(0, 168, 107, 0.6);
    --lp-bg-dark: #FAFBFC;
    --lp-bg-card: #FFFFFF;
    --lp-bg-card-border: rgba(0,0,0,0.08);
    --lp-text-primary: #111827;
    --lp-text-secondary: rgba(17,24,39,0.65);
    --lp-text-muted: rgba(17,24,39,0.4);
    background: #FAFBFC;
    color: #111827;
  }
  .lp-light .lp-gradient-text {
    background: linear-gradient(144.5deg, #111827 28%, rgba(17,24,39,0.45) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .lp-light .lp-hero-placeholder {
    background: linear-gradient(135deg, #F0F4F8 0%, #E8EDF2 30%, #F0F2F5 60%, #FAFBFC 100%);
  }
  .lp-light .lp-hero-placeholder::before {
    background: radial-gradient(circle, rgba(0,168,107,0.06) 0%, transparent 70%);
  }
  .lp-light .lp-hero-badge {
    background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08);
  }
  .lp-light .lp-hero-badge span:first-of-type { color: rgba(17,24,39,0.5) !important; }
  .lp-light .lp-hero-badge span:last-of-type { color: var(--lp-accent) !important; }
  .lp-light .lp-pill--dark .lp-pill-inner { background: #fff; color: #111827; }
  .lp-light .lp-pill { border-color: rgba(0,0,0,0.15); }
  .lp-light .lp-pill::before {
    background: radial-gradient(ellipse at center, rgba(0,0,0,0.06), transparent);
  }
  .lp-light .lp-pill--accent::before {
    background: radial-gradient(ellipse at center, rgba(0,168,107,0.3), transparent);
  }
  .lp-light .lp-pill:hover .lp-pill-inner { box-shadow: 0 8px 32px rgba(0,168,107,0.15); }
  .lp-light .lp-navbar.lp-scrolled {
    background: rgba(250,251,252,0.85); border-bottom-color: rgba(0,0,0,0.06);
  }
  .lp-light .lp-nav-links a { color: rgba(17,24,39,0.6); }
  .lp-light .lp-nav-links a:hover { color: #111827; }
  .lp-light .lp-stats { border-color: rgba(0,0,0,0.06); }
  .lp-light .lp-dashboard-frame {
    background: #fff; border-color: rgba(0,0,0,0.1);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 32px 80px rgba(0,0,0,0.08), 0 0 120px rgba(0,168,107,0.04);
  }
  .lp-light .lp-frame-bar {
    background: rgba(0,0,0,0.03); border-bottom-color: rgba(0,0,0,0.06);
  }
  .lp-light .lp-frame-bar div:last-child { color: rgba(17,24,39,0.4); }
  .lp-light .lp-video-card {
    background: #fff; border-color: rgba(0,0,0,0.08);
    box-shadow: 0 24px 60px rgba(0,0,0,0.06);
  }
  .lp-light .lp-video-card:hover {
    box-shadow: 0 32px 80px rgba(0,0,0,0.1), 0 0 60px rgba(0,168,107,0.04);
  }
  .lp-light .lp-step-card {
    background: #fff; border-color: rgba(0,0,0,0.06);
  }
  .lp-light .lp-step-card:hover { border-color: rgba(0,168,107,0.2); }
  .lp-light .lp-pricing-card {
    background: #fff; border-color: rgba(0,0,0,0.06);
  }
  .lp-light .lp-pricing-featured { border-color: var(--lp-accent); box-shadow: 0 0 60px rgba(0,168,107,0.06); }
  .lp-light .lp-cta::before {
    background: radial-gradient(ellipse, rgba(0,168,107,0.04) 0%, transparent 70%);
  }
  .lp-light .lp-footer { border-top-color: rgba(0,0,0,0.06); }
  .lp-light .lp-footer-links a { color: rgba(17,24,39,0.4); }
  .lp-light .lp-footer-links a:hover { color: #111827; }
  .lp-light .lp-scroll-indicator span { color: rgba(17,24,39,0.35); }
  .lp-light .lp-scroll-line {
    background: linear-gradient(to bottom, rgba(17,24,39,0.25), transparent);
  }
  .lp-light .lp-screenshot-img {
    filter: brightness(1) saturate(1.05);
  }
  .lp-light .lp-video-card:hover .lp-screenshot-img {
    filter: brightness(1.02) saturate(1.1);
  }
`;
