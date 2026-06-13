// ── Legal pages for NatalNavigator (Impressum, Datenschutz, AGB, Widerruf) ──
// German-language legal documents for the operator (Kleinunternehmer, Germany).
// Rendered at /impressum, /datenschutz, /agb, /widerruf. These routes are set to
// noindex via vercel.json. Content reflects the actual tech stack: Vercel hosting,
// Supabase (auth + data), Stripe (payments), PostHog (analytics), Google Fonts +
// Fontshare (fonts), OpenStreetMap/Nominatim (city search geocoding).
import { useEffect, useState } from 'react';
import { resetConsent } from '../lib/consent';

function reopenConsent(e) {
  e.preventDefault();
  resetConsent();
  window.location.reload();
}

const OPERATOR = {
  name: 'Sercan Yesilyurt',
  street: 'Dasselstraße 31',
  city: '50674 Köln',
  country: 'Deutschland',
  email: 'info@natalnavigator.com',
};

const UPDATED = 'Juni 2026';

const AddressBlock = () => (
  <p>
    {OPERATOR.name}<br />
    {OPERATOR.street}<br />
    {OPERATOR.city}<br />
    {OPERATOR.country}
  </p>
);

// ── Document content ──────────────────────────────────────────────
const DOCS = {
  impressum: {
    title: 'Impressum',
    render: () => (
      <>
        <h3>Angaben gemäß § 5 DDG</h3>
        <AddressBlock />

        <h3>Kontakt</h3>
        <p>
          E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a><br />
          Kontaktformular: <a href="/kontakt">natalnavigator.com/kontakt</a>
        </p>

        <h3>Umsatzsteuer</h3>
        <p>
          Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine
          Umsatzsteuer berechnet und daher auch nicht in Rechnungen ausgewiesen.
        </p>

        <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
        <AddressBlock />

        <h3>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h3>
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h3>Haftung für Inhalte</h3>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf
          diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10
          DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
          gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
          forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
          Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
          Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
          erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
          Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </p>

        <h3>Haftung für Links</h3>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
          wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch
          keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der
          jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten
          Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
          überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
          erkennbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links
          umgehend entfernen.
        </p>

        <h3>Urheberrecht</h3>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
          Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
          Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
          nicht kommerziellen Gebrauch gestattet.
        </p>
      </>
    ),
  },

  datenschutz: {
    title: 'Datenschutzerklärung',
    render: () => (
      <>
        <h3>1. Verantwortlicher</h3>
        <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
        <AddressBlock />
        <p>E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a></p>

        <h3>2. Allgemeines und Verschlüsselung</h3>
        <p>
          Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Wir verarbeiten Ihre
          Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, BDSG,
          TDDDG). Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw.
          TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an „https://“
          in der Adresszeile Ihres Browsers.
        </p>

        <h3>3. Hosting und Server-Logfiles</h3>
        <p>
          Diese Website wird bei der Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA
          91789, USA) gehostet. Beim Aufruf der Website werden automatisch Informationen
          in Server-Logfiles erfasst, die Ihr Browser übermittelt: Browsertyp und
          -version, Betriebssystem, Referrer-URL, Hostname, Uhrzeit der Serveranfrage
          und IP-Adresse. Diese Verarbeitung erfolgt zur Gewährleistung eines
          störungsfreien Betriebs und der Sicherheit auf Grundlage unseres berechtigten
          Interesses (Art. 6 Abs. 1 lit. f DSGVO). Da Vercel Daten auch in den USA
          verarbeiten kann, erfolgt eine etwaige Übermittlung in ein Drittland auf
          Grundlage geeigneter Garantien (Standardvertragsklauseln der EU-Kommission).
          Zur anonymen Messung von Seitenaufrufen und Ladezeiten setzen wir zudem die
          cookielosen Dienste Vercel Analytics und Vercel Speed Insights ein, die keine
          personenbezogenen Profile bilden (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h3>4. Nutzerkonto und Geburtsdaten (Supabase)</h3>
        <p>
          Für die Erstellung Ihrer persönlichen astrokartografischen Karte legen Sie ein
          Nutzerkonto an und geben Geburtsdatum, Geburtszeit und Geburtsort an. Diese
          Daten sowie Ihre E-Mail-Adresse und Ihr (verschlüsselt gespeichertes) Passwort
          werden zur Vertragserfüllung verarbeitet (Art. 6 Abs. 1 lit. b DSGVO). Die
          Speicherung und Authentifizierung erfolgt über die Supabase Inc. (970 Toa
          Payoh North #07-04, Singapur, mit Datenverarbeitung u. a. in der EU/USA), mit
          der ein Auftragsverarbeitungsvertrag besteht. Etwaige Drittlandübermittlungen
          sind durch Standardvertragsklauseln abgesichert.
        </p>

        <h3>5. Zahlungsabwicklung (Stripe)</h3>
        <p>
          Zahlungen werden über die Stripe Payments Europe, Ltd. (1 Grand Canal Street
          Lower, Dublin, Irland) abgewickelt. Die für die Zahlung erforderlichen Daten
          (z. B. Name, E-Mail, Zahlungsdaten) werden direkt von Stripe verarbeitet; wir
          erhalten keine vollständigen Kartendaten. Rechtsgrundlage ist die
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Weitere Informationen finden
          Sie in der Datenschutzerklärung von Stripe.
        </p>

        <h3>6. Reichweitenmessung (PostHog)</h3>
        <p>
          Zur Analyse der Nutzung und Verbesserung unseres Angebots setzen wir PostHog
          ein. Dabei können pseudonymisierte Nutzungsdaten (z. B. aufgerufene Seiten,
          Interaktionen, gekürzte IP-Adresse, Gerätedaten) verarbeitet werden. Sofern
          hierfür Cookies oder vergleichbare Technologien eingesetzt werden, die nicht
          technisch zwingend erforderlich sind, erfolgt dies nur mit Ihrer Einwilligung
          (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Sie können eine erteilte
          Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
        </p>

        <h3>7. Schriftarten (Google Fonts, Fontshare)</h3>
        <p>
          Zur einheitlichen Darstellung von Schriftarten werden Web Fonts von Google
          (Google Ireland Ltd.) und Fontshare (Indian Type Foundry) geladen. Beim Aufruf
          einer Seite lädt Ihr Browser die Schriften von Servern dieser Anbieter, wobei
          Ihre IP-Adresse übermittelt wird. Rechtsgrundlage ist unser berechtigtes
          Interesse an einer ansprechenden Darstellung (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h3>8. Ortssuche (OpenStreetMap / Nominatim)</h3>
        <p>
          Für die Suche nach Geburts- und Zielorten nutzen wir den Geokodierungsdienst
          Nominatim der OpenStreetMap Foundation (St John’s Innovation Centre, Cowley
          Road, Cambridge, CB4 0WS, Vereinigtes Königreich). Bei einer Ortssuche werden
          Ihre Suchanfrage und Ihre IP-Adresse an diesen Dienst übermittelt, um
          Koordinaten zu ermitteln (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h3>9. Cookies und lokale Speicherung</h3>
        <p>
          Wir verwenden technisch notwendige Cookies bzw. lokale Speichertechnologien
          (z. B. zur Anmeldung, zum Speichern der gewählten Sprache und Darstellung).
          Diese sind für den Betrieb der Website erforderlich (Art. 6 Abs. 1 lit. f
          DSGVO bzw. § 25 Abs. 2 TDDDG). Nicht notwendige Technologien werden nur mit
          Ihrer Einwilligung eingesetzt.
        </p>

        <h3>10. Speicherdauer</h3>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die genannten
          Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
          Kontodaten werden bis zur Löschung Ihres Kontos gespeichert.
        </p>

        <h3>11. Ihre Rechte</h3>
        <p>
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16
          DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18
          DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch gegen die
          Verarbeitung (Art. 21 DSGVO). Zur Ausübung Ihrer Rechte genügt eine Nachricht
          an <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
        </p>

        <h3>12. Beschwerderecht bei der Aufsichtsbehörde</h3>
        <p>
          Ihnen steht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu. Für
          den Verantwortlichen zuständig ist die Landesbeauftragte für Datenschutz und
          Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213
          Düsseldorf.
        </p>

        <h3>13. Aktualität und Änderung</h3>
        <p>
          Diese Datenschutzerklärung hat den Stand {UPDATED}. Durch die Weiterentwicklung
          der Website oder geänderte gesetzliche Vorgaben kann es notwendig werden, diese
          Datenschutzerklärung anzupassen.
        </p>
      </>
    ),
  },

  agb: {
    title: 'Allgemeine Geschäftsbedingungen',
    render: () => (
      <>
        <h3>§ 1 Geltungsbereich und Anbieter</h3>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die über
          die Website natalnavigator.com zwischen {OPERATOR.name}, {OPERATOR.street},
          {' '}{OPERATOR.city} (nachfolgend „Anbieter“) und dem Nutzer (nachfolgend
          „Kunde“) über die Bereitstellung der digitalen Anwendung „Natal Navigator“
          geschlossen werden. Verbraucher im Sinne dieser AGB ist jede natürliche Person,
          die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer
          gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden
          können.
        </p>

        <h3>§ 2 Vertragsgegenstand</h3>
        <p>
          Der Anbieter stellt eine webbasierte Anwendung zur Astrokartographie und
          Relocation-Astrologie bereit. Gegen eine einmalige Zahlung erhält der Kunde
          dauerhaften Zugang zu den kostenpflichtigen Funktionen, insbesondere zur
          persönlichen astrokartografischen Karte mit Planetenlinien, bewerteten Orten,
          dem Geburtshoroskop sowie der PDF-Ausgabe. Der genaue Funktionsumfang ergibt
          sich aus der Produktbeschreibung auf der Website zum Zeitpunkt der Bestellung.
        </p>

        <h3>§ 3 Vertragsschluss</h3>
        <p>
          Die Darstellung der Produkte auf der Website stellt kein rechtlich bindendes
          Angebot, sondern eine Aufforderung zur Bestellung dar. Mit dem Abschluss des
          Bezahlvorgangs über unseren Zahlungsdienstleister gibt der Kunde ein
          verbindliches Angebot zum Erwerb ab. Der Vertrag kommt mit der Bestätigung des
          Zugangs bzw. der Freischaltung der kostenpflichtigen Funktionen zustande.
        </p>

        <h3>§ 4 Preise und Zahlung</h3>
        <p>
          Es gilt der jeweils im Bestellprozess angegebene Preis. Aufgrund der
          Kleinunternehmerregelung nach § 19 UStG wird keine Umsatzsteuer ausgewiesen.
          Die Zahlung erfolgt über den Zahlungsdienstleister Stripe mit den dort
          angebotenen Zahlungsarten. Die Zahlung ist mit Vertragsschluss sofort fällig.
        </p>

        <h3>§ 5 Bereitstellung der digitalen Inhalte</h3>
        <p>
          Die kostenpflichtigen Funktionen werden dem Kunden unmittelbar nach
          erfolgreicher Zahlung in seinem Nutzerkonto online bereitgestellt. Ein Versand
          physischer Datenträger erfolgt nicht.
        </p>

        <h3>§ 6 Widerrufsrecht</h3>
        <p>
          Verbrauchern steht ein gesetzliches Widerrufsrecht nach Maßgabe der gesonderten{' '}
          <a href="/widerruf">Widerrufsbelehrung</a> zu. Bei digitalen Inhalten erlischt
          das Widerrufsrecht vorzeitig, wenn der Kunde ausdrücklich zugestimmt hat, dass
          mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist begonnen wird, und
          er seine Kenntnis davon bestätigt hat, dass er durch diese Zustimmung sein
          Widerrufsrecht verliert (§ 356 Abs. 5 BGB).
        </p>

        <h3>§ 7 Art des Angebots / kein Beratungsvertrag</h3>
        <p>
          Natal Navigator ist ein Werkzeug zur Selbstreflexion und Unterhaltung auf Basis
          astrologischer Deutungstraditionen. Die bereitgestellten Inhalte stellen keine
          wissenschaftliche, medizinische, psychologische, rechtliche oder finanzielle
          Beratung dar und begründen keinen Anspruch auf bestimmte Ergebnisse.
          Entscheidungen, die der Kunde auf Grundlage der Inhalte trifft, liegen in seiner
          alleinigen Verantwortung.
        </p>

        <h3>§ 8 Haftung</h3>
        <p>
          Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des
          Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit. Bei
          leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung
          auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die
          Haftung ausgeschlossen.
        </p>

        <h3>§ 9 Verfügbarkeit</h3>
        <p>
          Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit des
          Dienstes, schuldet jedoch keine bestimmte Verfügbarkeitsquote. Wartungsarbeiten,
          technische Störungen oder Umstände außerhalb des Einflussbereichs des Anbieters
          können zu vorübergehenden Einschränkungen führen.
        </p>

        <h3>§ 10 Streitbeilegung</h3>
        <p>
          Der Anbieter ist nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h3>§ 11 Schlussbestimmungen</h3>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
          UN-Kaufrechts; zwingende Verbraucherschutzvorschriften des Staates, in dem der
          Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben unberührt. Sollte eine
          Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
          Bestimmungen unberührt. Stand: {UPDATED}.
        </p>
      </>
    ),
  },

  kontakt: {
    title: 'Kontakt',
    render: () => (
      <>
        <p>
          Haben Sie Fragen zu Natal Navigator, Ihrer Bestellung oder Ihrem Konto?
          Schreiben Sie uns über das Formular oder direkt an{' '}
          <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Wir antworten in der
          Regel innerhalb eines Werktags.
        </p>
        <ContactForm />
      </>
    ),
  },

  widerruf: {
    title: 'Widerrufsbelehrung',
    render: () => (
      <>
        <h3>Widerrufsrecht</h3>
        <p>
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
          Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
          Vertragsschlusses.
        </p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
        </p>
        <p>
          {OPERATOR.name}<br />
          {OPERATOR.street}<br />
          {OPERATOR.city}<br />
          E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
        </p>
        <p>
          mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief
          oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen,
          informieren. Sie können dafür das nachfolgende Muster-Widerrufsformular
          verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist
          reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor
          Ablauf der Widerrufsfrist absenden.
        </p>

        <h3>Folgen des Widerrufs</h3>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
          Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem
          Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags
          bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
          Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es
          sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall
          werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
        </p>

        <h3>Vorzeitiges Erlöschen des Widerrufsrechts</h3>
        <p>
          Ihr Widerrufsrecht erlischt bei einem Vertrag über die Bereitstellung digitaler
          Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden, wenn wir
          mit der Ausführung des Vertrags begonnen haben, nachdem Sie ausdrücklich
          zugestimmt haben, dass wir mit der Ausführung vor Ablauf der Widerrufsfrist
          beginnen, und Sie Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre
          Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren (§ 356 Abs. 5
          BGB).
        </p>

        <h3>Muster-Widerrufsformular</h3>
        <p>
          (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus
          und senden Sie es zurück.)
        </p>
        <div className="lg-form">
          <p>An {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}, {OPERATOR.email}:</p>
          <p>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
            über die Bereitstellung der folgenden digitalen Inhalte (*):
          </p>
          <p>____________________________________________</p>
          <p>Bestellt am (*) / erhalten am (*): ____________________</p>
          <p>Name des/der Verbraucher(s): ____________________</p>
          <p>Anschrift des/der Verbraucher(s): ____________________</p>
          <p>Datum und Unterschrift (nur bei Mitteilung auf Papier): ____________________</p>
          <p>(*) Unzutreffendes streichen.</p>
        </div>
      </>
    ),
  },
};

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Die Nachricht konnte nicht gesendet werden.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setError('Netzwerkfehler — bitte später erneut versuchen.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="lg-form lg-form-done">
        <p>Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns in Kürze.</p>
      </div>
    );
  }

  return (
    <form className="lg-contact" onSubmit={submit} noValidate>
      <label>
        <span>Name (optional)</span>
        <input type="text" value={form.name} onChange={update('name')} autoComplete="name" maxLength={120} />
      </label>
      <label>
        <span>E-Mail</span>
        <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required maxLength={254} />
      </label>
      <label>
        <span>Nachricht</span>
        <textarea value={form.message} onChange={update('message')} required rows={6} maxLength={5000} />
      </label>
      {/* Honeypot — hidden from real users, catches bots */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>Firma<input type="text" tabIndex={-1} autoComplete="off" value={form.company} onChange={update('company')} /></label>
      </div>
      {status === 'error' && <p className="lg-err">{error}</p>}
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}
      </button>
    </form>
  );
}

export default function LegalPage({ doc }) {
  const entry = DOCS[doc];

  useEffect(() => {
    if (entry) document.title = `${entry.title} — Natal Navigator`;
  }, [entry]);

  if (!entry) return null;

  return (
    <div className="lg-root">
      <style>{CSS}</style>
      <header className="lg-head">
        <div className="lg-wrap">
          <a href="/" className="lg-logo">Natal&nbsp;Navigator</a>
          <a href="/" className="lg-back">← Zurück zur Startseite</a>
        </div>
      </header>

      <main className="lg-wrap lg-main">
        <h1>{entry.title}</h1>
        <div className="lg-body">{entry.render()}</div>

        <nav className="lg-nav" aria-label="Rechtliche Seiten">
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="/agb">AGB</a>
          <a href="/widerruf">Widerruf</a>
          <a href="/kontakt">Kontakt</a>
          <a href="/datenschutz" onClick={reopenConsent}>Cookie-Einstellungen</a>
        </nav>
      </main>
    </div>
  );
}

const CSS = `
.lg-root{ min-height:100vh; background:#0f1115; color:#d7dbe2; font-family:'General Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif; line-height:1.7; }
.lg-wrap{ max-width:760px; margin:0 auto; padding:0 24px; }
.lg-head{ border-bottom:1px solid rgba(255,255,255,0.08); padding:20px 0; position:sticky; top:0; background:rgba(15,17,21,0.92); backdrop-filter:blur(8px); z-index:10; }
.lg-head .lg-wrap{ display:flex; align-items:center; justify-content:space-between; gap:16px; }
.lg-logo{ font-weight:600; color:#fff; text-decoration:none; letter-spacing:-0.01em; }
.lg-back{ color:#00D88A; text-decoration:none; font-size:0.9rem; }
.lg-back:hover{ text-decoration:underline; }
.lg-main{ padding:48px 24px 96px; }
.lg-main h1{ color:#fff; font-size:2rem; font-weight:600; margin:0 0 8px; letter-spacing:-0.02em; }
.lg-body{ margin-top:24px; }
.lg-body h3{ color:#fff; font-size:1.05rem; font-weight:600; margin:32px 0 8px; }
.lg-body p{ margin:0 0 12px; color:#c2c8d2; }
.lg-body a{ color:#00D88A; }
.lg-form{ border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:18px 20px; margin-top:12px; background:rgba(255,255,255,0.02); }
.lg-form p{ margin:0 0 10px; }
.lg-form-done{ border-color:rgba(0,216,138,0.4); }
.lg-contact{ display:flex; flex-direction:column; gap:16px; margin-top:20px; max-width:520px; }
.lg-contact label{ display:flex; flex-direction:column; gap:6px; }
.lg-contact label span{ font-size:0.85rem; color:#9aa2af; }
.lg-contact input, .lg-contact textarea{
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.14); border-radius:8px;
  padding:11px 13px; color:#e8ebf0; font:inherit; font-size:0.95rem; resize:vertical;
}
.lg-contact input:focus, .lg-contact textarea:focus{ outline:none; border-color:#00D88A; }
.lg-contact button{
  align-self:flex-start; background:#00D88A; color:#06231a; border:none; border-radius:8px;
  padding:12px 24px; font:inherit; font-weight:600; cursor:pointer; transition:opacity .2s;
}
.lg-contact button:hover{ opacity:0.9; }
.lg-contact button:disabled{ opacity:0.55; cursor:default; }
.lg-err{ color:#ff8080; font-size:0.9rem; margin:0; }
.lg-nav{ display:flex; flex-wrap:wrap; gap:18px; margin-top:56px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.08); }
.lg-nav a{ color:#9aa2af; text-decoration:none; font-size:0.9rem; }
.lg-nav a:hover{ color:#00D88A; }
@media (max-width:600px){ .lg-main h1{ font-size:1.6rem; } }
`;
