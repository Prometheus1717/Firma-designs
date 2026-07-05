import { useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';
import { initPostHog, trackPageView } from '../lib/posthog';

// Opt-in consent banner for analytics (PostHog). Shown until the visitor makes
// a choice. Accepting starts analytics immediately; rejecting keeps it off.
// Withdrawal is possible any time via the "Cookie-Einstellungen" footer links
// (resetConsent + reload makes this banner reappear).
export default function ConsentBanner() {
  const [decided, setDecided] = useState(() => getConsent() !== null);
  if (decided) return null;

  const accept = () => {
    setConsent(true);
    initPostHog();
    trackPageView(window.location.pathname);
    setDecided(true);
  };
  const reject = () => {
    setConsent(false);
    setDecided(true);
  };

  return (
    <div className="nn-consent" role="dialog" aria-label="Datenschutz-Einstellungen">
      <style>{CSS}</style>
      <p className="nn-consent-text">
        Wir verwenden optionale Analyse-Cookies, um die Nutzung unserer Website zu
        verstehen und das Angebot zu verbessern. Diese werden nur mit Ihrer
        Einwilligung gesetzt. Technisch notwendige Funktionen bleiben davon
        unberührt. Mehr dazu in unserer{' '}
        <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>
      <div className="nn-consent-btns">
        <button type="button" className="nn-consent-reject" onClick={reject}>
          Nur notwendige
        </button>
        <button type="button" className="nn-consent-accept" onClick={accept}>
          Akzeptieren
        </button>
      </div>
    </div>
  );
}

const CSS = `
.nn-consent{
  position:fixed; left:16px; right:16px; bottom:16px; z-index:9999;
  max-width:560px; margin:0 auto;
  background:#0D1520; color:#c2c8d2; border:1px solid #1A2840; border-radius:12px;
  padding:18px 20px; box-shadow:0 12px 40px rgba(0,0,0,0.45);
  font-family:'General Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  display:flex; flex-direction:column; gap:14px; line-height:1.55;
}
.nn-consent-text{ margin:0; font-size:13.5px; }
.nn-consent-text a{ color:#00D88A; text-decoration:underline; text-underline-offset:2px; }
.nn-consent-btns{ display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
.nn-consent button{
  font:inherit; font-size:13px; font-weight:600; border-radius:8px; padding:9px 18px; cursor:pointer;
  border:1px solid transparent;
}
.nn-consent-reject{ background:transparent; color:#9aa2af; border-color:#2A3A50; }
.nn-consent-reject:hover{ color:#d7dbe2; border-color:#3a4a60; }
.nn-consent-accept{ background:#00D88A; color:#06231a; }
.nn-consent-accept:hover{ opacity:0.9; }
`;
