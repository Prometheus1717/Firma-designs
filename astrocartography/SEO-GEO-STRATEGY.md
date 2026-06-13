# Natal Navigator — SEO- & GEO-Strategie und Implementierungs-Brief

> **An die umsetzende KI (Claude Opus 4.8):** Dieses Dokument ist dein vollständiger
> Arbeitsauftrag. Es enthält (A) den auditierten Ist-Zustand mit exakten Dateipfaden,
> (B) die architektonische Grundsatzentscheidung zu Domain/Weiterleitung/Verlinkung,
> (C) priorisierte Arbeitspakete mit Akzeptanzkriterien und (D) harte Guardrails.
> Arbeite die Phasen in Reihenfolge ab. Erfinde nichts dazu, was den Guardrails
> (Abschnitt 9) widerspricht. Alles, was du nicht selbst ausführen kannst
> (Vercel-Dashboard, Google Search Console, Bing), schreibst du als präzise
> Klick-Anleitung für den Betreiber in deine Abschlussmeldung.

Stand der Analyse: 2026-06-12 · Repo: `prometheus1717/firma-designs` · App-Code: `astrocartography/`

---

## 1. Ist-Zustand (Audit-Befunde)

### 1.1 Infrastruktur — wer liefert was aus

| Vercel-Projekt | Domain(s) | Inhalt |
|---|---|---|
| `firma-designs` (prj_2DDcIUT4Mo9ceGbPwIGoqcXP2Rt1) | **natalnavigator.com** + `firma-designs.vercel.app` | App-Build: `/` = Live-Demo-Dashboard für anonyme Besucher |
| `natal-landing` (prj_G8JiyGGS0neQblcr5OFW1gXVAKTM) | **nur** `natal-landing.vercel.app` | Marketing-Landingpage-Build (`VITE_IS_LANDING=1`), Live-Demo per iframe im Hero |
| `astrocartography` (prj_0QtTcbrsAMWtLaf2JI8cALTzLMR8) | `astrocartography-five.vercel.app` | Älteres Duplikat-Deployment (letzter Deploy deutlich älter) |
| GitHub Pages (Repo-Root `index.html`, `CNAME`) | hermeswriting.de | **Anderes Business** (Ghostwriting) — für Natal Navigator irrelevant |

Beide Natal-Navigator-Projekte bauen dieselbe Codebase; der Schalter ist
`VITE_IS_LANDING` (ausgewertet in `astrocartography/src/App.jsx`, ca. Zeile 245–269:
anonyme Besucher sehen bei `IS_LANDING` die `LandingPage`, sonst `<Dashboard demo />`;
die Landing bettet die Demo als iframe `/demo?embed=1&…` ein).

### 1.2 Sitemap-Prüfung (`astrocartography/public/sitemap.xml`)

Die Sitemap ist technisch sauber (valides XML, hreflang-Paare en/de korrekt,
Canonicals konsistent), aber sie enthält **nur 4 URLs**:

1. `https://natalnavigator.com/` (priority 1.0)
2. `/astrocartography` (EN-Guide, statisches HTML, ~2.300 Wörter Quelltext)
3. `/astrocartography-calculator` (EN, statisch)
4. `/astrokartographie` (DE-Guide, statisch, hreflang-verknüpft mit EN)

Alle `lastmod`-Werte stehen auf `2026-05-04` (veraltet).

**Diagnose zum GSC-Muster des Betreibers** (gute Klicks im Verhältnis zu Impressionen,
schlechte Durchschnittsposition): Die CTR ist gesund — Titles/Snippets funktionieren.
Die Impressionen sind niedrig und die Position schlecht, weil die Domain für fast
nichts ranken *kann*: 4 indexierbare URLs, junges Projekt, kaum Backlinks, und die
Konkurrenz (astrocarto.org, astrocartography.app, upastrology.com, astroline.today,
astrologym.com) besetzt die Nische mit jeweils dutzenden Longtail-Seiten
(z. B. „Venus Line Astrocartography: What It Means & Best Cities to Live").
**Das Problem ist ein Content- und Authority-Gap, kein Snippet-Problem.**
Die Lösung ist Abschnitt 5 (Content-Cluster) — nicht weiteres Feilen an der Homepage.

### 1.3 Weitere Befunde

- ✅ `robots.txt` erlaubt GPTBot, ClaudeBot, PerplexityBot, anthropic-ai, ChatGPT-User; verweist auf die Sitemap.
- ✅ `llms.txt` existiert und ist inhaltlich stark (Entity-Definition, Preise, Features, „What NatalNavigator should be cited for").
- ✅ `vercel.json`: `noindex` via `X-Robots-Tag` auf `/auth`, `/dashboard`, `/birth-data`, `/reset-password`, `/admin`, `/landing`, `/demo` — für private Routen und das iframe-Demo korrekt.
- ✅ App-`index.html`: vollständiger SEO-Head (Canonical, OG, Twitter, JSON-LD `WebApplication` mit Offer). **Achtung:** Offer-Preis steht aktuell auf 4,99 € und muss im Zuge von Phase 5 auf 9,99 € geändert werden (siehe Abschnitt 7b).
- ⚠️ **Befund A — Landingpage ist unsichtbar:** Das `natal-landing`-Projekt hat keine Custom Domain. Die neue Landingpage existiert für Google faktisch nicht.
- ⚠️ **Befund B — möglicher Bot-Block (403):** Ein automatisierter Fetch von `https://natalnavigator.com/sitemap.xml` erhielt am 2026-06-12 ein **HTTP 403** vom Server. `robots.txt` lädt AI-Crawler zwar ein, aber eine Vercel-Firewall/Bot-Protection könnte sie (und ggf. weitere Crawler) trotzdem aussperren. Das würde die gesamte GEO-Strategie torpedieren. → Arbeitspaket P0-2.
- ⚠️ **Befund C — Landing ist clientseitig gerendert:** `LandingPage.jsx` (1.261 Zeilen) rendert allen Marketing-Content per React. Google rendert JS; **AI-Crawler (GPTBot, ClaudeBot, PerplexityBot) führen kein JavaScript aus** und sehen nur den `<head>` plus leeres `#root`. Für GEO ist der Landing-Content damit unsichtbar. → Arbeitspaket P1-2.
- ⚠️ **Befund D — Duplicate-Content-Risiko:** Die `.vercel.app`-Produktionsdomains (`firma-designs.vercel.app`, `natal-landing.vercel.app`, `astrocartography-five.vercel.app`) liefern identische Inhalte unter anderen Hosts aus. Canonicals mildern das, sauber ist es nicht. → Arbeitspaket P0-3.

---

## 2. Grundsatzentscheidung: Domain, Weiterleitung, Verlinkung

**Entscheidung: EINE Domain. Die Landingpage wird die Homepage von `natalnavigator.com/`. Keine zweite Domain, keine Subdomain, keine Weiterleitungs-Konstruktion.**

Begründung (für den Betreiber, damit die Entscheidung nachvollziehbar ist):

1. `natalnavigator.com` ist bereits indexiert, hat GSC-Historie, Klicks und erste
   Rankings. Jede neue Domain/Subdomain startet bei null Authority und **spaltet**
   künftige Backlinks auf zwei Hosts. Das ist der teuerste Fehler, der hier möglich wäre.
2. Die Landingpage enthält die Live-Demo im Hero — es geht also nichts verloren,
   wenn sie das bisherige Demo-Dashboard auf `/` ersetzt. Die Demo bleibt unter
   `/demo` (noindex, da iframe-Inhalt/Duplikat) und über den „Fullscreen"-Link erreichbar.
3. Eine Landingpage mit echtem Text-Content auf `/` ist für SEO und GEO strikt
   besser als ein Canvas/WebGL-Dashboard auf `/`, das Crawlern fast nichts bietet.
4. Redirects sind damit fast keine nötig: `/landing → /` existiert bereits in
   `App.jsx`. Es gibt keine alten URLs, die brechen.
5. `hermeswriting.de` (GitHub Pages, Repo-Root) ist ein thematisch fremdes Business.
   **Nicht** mit natalnavigator.com verlinken — kein SEO-Wert, potenziell schädlich
   (irrelevante Nachbarschaft). Die beiden Projekte bleiben vollständig getrennt.

---

## 3. Phase 0 — Sofortmaßnahmen (Tag 1, höchste Priorität)

### P0-1: Landingpage live auf natalnavigator.com/ schalten

1. Im Vercel-Projekt **`firma-designs`** die Environment-Variable
   `VITE_IS_LANDING=1` für **Production** setzen und neu deployen
   (Betreiber-Anleitung: Vercel → firma-designs → Settings → Environment Variables).
   Alternativ, falls du Deploy-Zugriff hast: Variable setzen und Production-Deploy auslösen.
2. Code-seitig prüfen/anpassen: Der Kommentar in `App.jsx` (Z. 245 ff.) sagt, nur das
   dedizierte natal-landing-Deployment sei der Landing-Build — Kommentar an die neue
   Realität anpassen. Funktional ändert sich nichts: anonyme Besucher → Landing,
   eingeloggte → Redirect zu Dashboard/Birth-Data, Demo läuft als same-origin iframe
   unter `/demo`.
3. Das Projekt `natal-landing` danach **löschen** oder explizit als Staging
   deklarieren. Wenn es bleibt: sicherstellen, dass es nicht indexiert wird (P0-3).
4. Das verwaiste Projekt `astrocartography` (astrocartography-five.vercel.app) löschen.

**Akzeptanz:** `curl -A Googlebot https://natalnavigator.com/` liefert die Landingpage-
Shell (Status 200, `index, follow`, Canonical `https://natalnavigator.com/`); `/demo`
liefert weiterhin `X-Robots-Tag: noindex`.

### P0-2: 403-Befund klären — AI-Crawler dürfen nicht geblockt sein

1. Betreiber-Anleitung schreiben: Vercel → firma-designs → Firewall → prüfen, ob
   „Attack Challenge Mode", „Bot Protection" oder Custom Rules aktiv sind und ob in
   den Logs 403er für Googlebot/Bingbot/GPTBot/ClaudeBot/PerplexityBot auftauchen.
   Verifizierte Bots (Kategorie „AI Crawlers" und Suchmaschinen) explizit **allowlisten**.
2. Verifikation nach Fix (durch Betreiber oder dich, falls Netzzugriff):
   `curl -I -A "GPTBot" https://natalnavigator.com/llms.txt` → muss 200 liefern;
   ebenso für `Mozilla/5.0 ... Googlebot/2.1` auf `/` und `/sitemap.xml`.
3. In der GSC mit dem URL-Prüftool die Startseite live testen („Live-URL testen") —
   wenn Google selbst 403/Blocked sieht, ist das die Erklärung für stagnierende
   Impressionen und MUSS vor allem anderen behoben werden.

**Akzeptanz:** Alle genannten User-Agents erhalten 200 auf `/`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`.

### P0-3: Duplicate Hosts eliminieren

In `astrocartography/vercel.json` einen Host-Redirect ergänzen (vor den bestehenden
Rewrites, als `redirects`-Block):

```json
"redirects": [
  {
    "source": "/(.*)",
    "has": [{ "type": "host", "value": "(?<sub>.*)\\.vercel\\.app" }],
    "destination": "https://natalnavigator.com/$1",
    "permanent": true
  }
]
```

**Akzeptanz:** `firma-designs.vercel.app/astrocartography` → 308 auf
`natalnavigator.com/astrocartography`.

### P0-4: Indexierung anstoßen (Betreiber-Anleitung schreiben)

1. GSC (Property natalnavigator.com): Sitemap erneut einreichen, danach für `/`,
   `/astrocartography`, `/astrocartography-calculator`, `/astrokartographie` jeweils
   URL-Prüfung → „Indexierung beantragen".
2. **Bing Webmaster Tools einrichten** (Import aus GSC möglich, 2 Minuten). Bing
   speist ChatGPT-Search und teilweise weitere Assistenten — für GEO nicht optional.
3. **IndexNow** aktivieren: Key-Datei in `astrocartography/public/` ablegen (du
   generierst den Key), und bei jeder Sitemap-Änderung `https://api.indexnow.org/indexnow?...` pingen.
   Baue dafür ein kleines Script `astrocartography/scripts/ping-indexnow.mjs`.

---

## 4. Phase 1 — Technisches SEO/GEO-Fundament (Woche 1)

### P1-1: Sitemap dynamisch korrekt halten

- `lastmod` aller bestehenden Einträge auf das Datum des nächsten Deploys setzen.
- Jede in Phase 2 neu erstellte Seite **sofort** in die Sitemap aufnehmen
  (korrekte hreflang-Paare für EN/DE-Pendants, Muster der bestehenden Einträge übernehmen).
- Schreibe ein Build-Script (`scripts/build-sitemap.mjs`), das die Sitemap aus einer
  zentralen Routen-Liste generiert, damit sie nie wieder veraltet. In `package.json`
  als Teil des Builds verdrahten.

### P1-2: Landing-Content für Nicht-JS-Crawler sichtbar machen (GEO-kritisch)

Die eleganteste Lösung bei diesem Setup: **Build-Time-Prerendering der Landingpage.**

- Schreibe ein Build-Script, das `LandingPage.jsx` per `ReactDOMServer.renderToString`
  (bzw. `renderToStaticMarkup` für die reinen Textsektionen) rendert und das Ergebnis
  in das `#root`-Element der ausgelieferten `index.html` des Landing-Builds injiziert;
  React hydratisiert dann clientseitig (`hydrateRoot` statt `createRoot`, nur wenn
  vorgerendertes Markup vorhanden ist).
- Falls Hydration wegen Auth-/Router-Abhängigkeiten zu riskant ist (die Page hängt an
  `useAuth`/Router), ist der pragmatische Plan B vollkommen akzeptabel: rendere **nur
  die statischen Textsektionen** (Features, How-it-works, For-you, Lines, Why, Pricing,
  FAQ — IDs `#features`, `#how`, `#for-you`, `#lines`, `#why`, `#pricing`, `#faq` in
  `LandingPage.jsx`) als semantisches HTML in die `index.html` unterhalb des
  Hero-Mounts, und lasse React beim Mount das Ganze ersetzen. Identischer Inhalt für
  Bot und Mensch = kein Cloaking.
- **Akzeptanz:** `curl https://natalnavigator.com/ | grep -c "astrocartography"`
  liefert zweistellige Treffer ohne JS-Ausführung; die FAQ-Fragen stehen im Roh-HTML.

### P1-3: Strukturierte Daten ausbauen

In den Head des Landing-Builds (bzw. der prerenderten Seite):

- `FAQPage`-Schema mit exakt den Fragen/Antworten der FAQ-Sektion (`#faq`).
- `Organization` (Name, Logo `https://natalnavigator.com/logo.svg`, `sameAs` sobald Social-Profile existieren).
- `BreadcrumbList` auf allen Guide-Seiten (auch den neuen aus Phase 2).
- Bestehendes `WebApplication`-Schema behalten; `aggregateRating` NUR ergänzen, wenn
  echte Bewertungen existieren (Guardrail!).

### P1-4: GEO-Dateien vervollständigen

- `llms.txt`: um die in Phase 2 neuen URLs erweitern (Sektion „High-priority pages").
- Zusätzlich `llms-full.txt` erzeugen: Volltexte der Guides in Markdown konkateniert,
  damit Assistenten mit einem Fetch alles haben.
- In jede Guide-Seite einen **zitierfähigen Definitionsabsatz** direkt unter die H1
  setzen (1–2 Sätze, Entität + Klartext-Definition; AI-Antworten zitieren bevorzugt
  solche Absätze). Beispiel-Muster: „A Venus line in astrocartography is the
  geographic path where Venus was rising, setting, culminating or anti-culminating
  at your birth — places along it emphasize love, beauty, ease and money themes."

---

## 5. Phase 2 — Content-Cluster (Wochen 1–6) — der eigentliche Hebel

**Format:** Statisches HTML in `astrocartography/public/<slug>/index.html`, exakt nach
dem Muster der drei bestehenden Guides (gleiche CSS-Konventionen, Header/Footer,
Canonical, OG, hreflang, Breadcrumb-Schema). Kein React nötig. 1.200–2.000 Wörter
pro Seite, jede Seite mit: zitierfähiger Definition unter der H1, mindestens einer
Tabelle oder strukturierten Liste, 4–6 FAQ-Einträgen mit `FAQPage`-Schema, internen
Links auf `/astrocartography-calculator`, die Demo und 2–3 Schwester-Guides, und
einem CTA-Block auf das Produkt (Preis 9,99 € / $9.99 — siehe Abschnitt 7b).

### Cluster 1 — Planetenlinien-Guides EN (höchste Priorität, 10 Seiten)

Das ist das Longtail-Rückgrat der Nische; die Konkurrenz rankt genau damit.
URLs: `/astrocartography/sun-line`, `/moon-line`, `/mercury-line`, `/venus-line`,
`/mars-line`, `/jupiter-line`, `/saturn-line`, `/uranus-line`, `/neptune-line`,
`/pluto-line`.

Aufbau je Seite: Was die Linie bedeutet · MC/IC/ASC/DSC-Varianten als eigene
H2-Sektionen (deckt „venus line MC meaning" etc. ab) · Leben auf vs. nahe der Linie
(Orb ~300–700 Meilen — gängige Praxis in der Nische, als Interpretationskonvention
formulieren) · für wen die Linie spannend ist (Pain-Point-Verknüpfung) · FAQ · CTA.
Inhaltliche Rohmasse existiert bereits im Repo: `src/data/natalReadings.js`,
`natalLexicon.js`, `natalReadingsI18n*.js` — daraus paraphrasieren, nicht 1:1 kopieren.

### Cluster 2 — Winkel-Guides EN (4 Seiten)

`/astrocartography/mc-line`, `/ic-line`, `/asc-line`, `/dsc-line` — Suchmuster
„what is an IC line astrocartography". Verlinken kreuzweise mit Cluster 1.

### Cluster 3 — Intent-/Pain-Point-Seiten EN (6–8 Seiten)

Hier sitzt die emotionale Bindung der breiten Zielgruppe (Menschen an
Wendepunkten: Umzug, Trennung, Berufswechsel, Auswandern, Nomadentum, Saturn Return):

| URL | Ziel-Keyword-Familie | Emotionaler Hook |
|---|---|---|
| `/where-should-i-live-astrology` | where should I live astrology/by birth chart | „Feeling stuck where you are" |
| `/astrocartography-for-love` | venus line love, where will I find love astrology | Dating-Frust, Neuanfang |
| `/astrocartography-for-career` | career astrology relocation, MC line career | Jobwechsel, Sichtbarkeit |
| `/relocation-astrology` | relocation astrology, relocated chart | Umzugsentscheidung |
| `/astrocartography-for-digital-nomads` | best places digital nomad astrology | Ortsunabhängigkeit |
| `/moving-abroad-astrology` | moving abroad astrology | Auswandern |
| `/how-accurate-is-astrocartography` | is astrocartography real/accurate | Skeptiker → ehrlich beantworten (stärkt E-E-A-T und GEO-Zitierbarkeit) |
| `/free-astrocartography-chart` | free astrocartography chart/map no sign-up | Vergleichs-/Tool-Intent → Demo |

### Cluster 4 — Deutsches Cluster (5–7 Seiten, geringere Konkurrenz = schnellere Wins)

`/astrokartographie/venuslinie`, `/sonnenlinie`, `/mondlinie`, `/jupiterlinie`,
`/saturnlinie` + `/wo-soll-ich-leben-astrologie` + ggf. `/astrokartographie-rechner`.
Jede DE-Seite per hreflang mit dem EN-Pendant verknüpfen (Muster: bestehendes
`/astrokartographie` ↔ `/astrocartography`).

### Veröffentlichungs-Reihenfolge und Takt

Woche 1: Venus, Sun, Moon, Jupiter, Saturn (EN) — die fünf meistgesuchten Linien.
Woche 2: restliche 5 Planeten + 4 Winkel. Woche 3–4: Intent-Seiten. Woche 5–6: DE-Cluster.
Nach jedem Batch: Sitemap regenerieren, IndexNow pingen, llms.txt aktualisieren.
**Gesamtumfang gedeckelt auf ~35 neue Seiten** — Qualität schlägt Masse (Guardrail 9.2).

### Interne Verlinkung (Pflicht-Topologie)

- Landing-Footer (Sektion „Learn", `LandingPage.jsx` aria-label="Learn"): Links auf
  beide Pillar-Guides + Calculator + die 3 stärksten neuen Seiten.
- Pillar `/astrocartography`: verlinkt alle 14 Linien-Guides (Linkliste/Tabelle).
- Jeder Linien-Guide: → Pillar, → Calculator, → 2 Nachbar-Guides, → 1 Intent-Seite.
- Jede Intent-Seite: → Demo/Homepage (Conversion) + → 2 thematisch passende Linien-Guides.

---

## 6. Phase 3 — GEO / AI-Sichtbarkeit (parallel zu Phase 2)

GEO-Ziel: Wenn jemand ChatGPT/Claude/Perplexity fragt „best astrocartography
calculator" oder „what does my Venus line mean", soll Natal Navigator genannt werden.

1. **Technisch (siehe P0-2, P1-2, P1-4):** Bots durchlassen, Content ohne JS lesbar,
   llms.txt/llms-full.txt aktuell, Bing indexiert (ChatGPT-Search-Quelle).
2. **Zitierfähigkeit:** Jede Seite beantwortet ihre Kernfrage in den ersten 80
   Wörtern in zitierbarer Form; Zahlen nennen (40 Linien, 10 Planeten, 345+ Städte,
   9,99 € einmalig, kein Abo) — konkrete Fakten werden von Antwort-Engines bevorzugt
   wiedergegeben.
3. **Konsistente Entität:** Überall identische Selbstbeschreibung („Natal Navigator
   is an interactive astrocartography calculator and relocation astrology app") —
   in llms.txt, Schema, About-Footer, Guides. Keine widersprüchlichen Claims.
4. **Externe Erwähnungen (Betreiber-Aufgabe, KI bereitet nur Texte vor):**
   Antwort-Engines zitieren bevorzugt Reddit (r/AskAstrologers, r/astrology,
   r/digitalnomad), Quora, Tool-Verzeichnisse und Listicles. Du verfasst als
   Arbeitsergebnis: 3 ehrliche, nicht-werbliche Reddit-/Quora-Antwortentwürfe zum
   Thema Linien-Deutung (Tool-Nennung nur als Quelle), einen Product-Hunt-Launch-Text
   und Einreichungstexte für 5 Tool-Verzeichnisse. **Du postest nichts selbst.**
   Spam/Astroturfing ist untersagt (Guardrail 9.4).

---

## 7. Phase 4 — Conversion-Messung (Woche 2+, klein halten)

Die Seite konvertiert bereits gut (gute CTR, Demo im Hero, Einmalpreis ohne Abo,
PostHog vorhanden). Geschäftsmodell-Entscheidung des Betreibers: **vorerst KEIN
Freemium — direkte Paywall.** Die anonyme Demo (Celebrity-Charts) übernimmt die
„Ausprobieren"-Funktion; wer die eigene Karte will, kauft. Ein persönlicher
Free-Tier (1–2 Linien gratis) ist als späteres A/B-Experiment vorgemerkt, wird
aber **jetzt nicht gebaut**. Erst Baseline messen, dann ggf. testen.

1. PostHog-Funnel definieren: `landing_view → demo_interact → checkout_start →
   purchase`, segmentiert nach UTM/Referrer (`?utm_source=` an alle in Phase 2/3
   erzeugten ausgehenden Erwähnungstexte hängen). Wichtig: Die Demo-CTAs öffnen
   per `target="_blank"` einen neuen Tab (`LandingPage.jsx` Z. 389/417) — sicherstellen,
   dass derselbe PostHog-Distinct-ID über den Tab-Wechsel erhalten bleibt, sonst
   bricht der Funnel zwischen `demo_interact` und `checkout_start`.
2. Auf jeder Content-Seite genau EIN konsistenter CTA-Block (Demo + Preisanker
   „9,99 € einmalig, kein Abo" — das Anti-Abo-Argument ist das stärkste
   Differenzierungsmerkmal gegen die Abo-Konkurrenz, prominent halten).
3. Title-Tag der Money-Pages nicht mehr anfassen, solange die CTR gut ist.

---

## 7b. Phase 5 — Preis, Recht & Checkout (Pflicht VOR breitem Traffic)

Diese Phase ist **nicht optional** und sollte zeitlich VOR Phase 2/3 abgeschlossen
sein: Es ist sinnlos (und rechtlich riskant), erst Traffic auf einen Shop ohne
Impressum/Datenschutz/Widerruf zu leiten.

### P5-1: Preis auf 9,99 € / $9.99 anheben — überall konsistent

Betreiber-Entscheidung: Preis von 4,99 € auf **9,99 €** anheben; USD numerisch
identisch **$9.99** (nicht umrechnen — psychologische Schwelle „unter 10" schlägt
Wechselkurs; Apple/Spotify-Konvention). Begründung: Preis-Qualitäts-Signal für die
Zielgruppe (Frauen 30+, emotionales Selbsterkenntnis-Produkt), Verdopplung des
Umsatzes pro Käufer bei einem Einmalzahlungs-Modell, und das vollständigere Paket
ggü. der Abo-Konkurrenz trägt den Preis mühelos.

Der Preis MUSS an ALLEN folgenden Stellen identisch sein (Entity-Konsistenz ist
GEO-kritisch — widersprüchliche Preise verwirren Antwort-Engines und Käufer):
- Stripe-Produkt/Price-Objekt (EUR 9,99 **und** USD 9.99 als Currency-Options bzw.
  Adaptive Pricing aktivieren, damit jeder Besucher seine Währung sieht)
- JSON-LD `Offer` in `astrocartography/index.html` (`price`, ggf. zweites Offer für USD)
- Landing-Pricing-Sektion (`LandingPage.jsx`, `#pricing`)
- `public/llms.txt` (Sektion „Pricing")
- alle statischen Guide-/Intent-Seiten mit CTA-Block (Phase 2)
- die drei bestehenden Guides, falls sie den Preis nennen

**Verbot:** Kein Fake-Streichpreis („~~19,99~~ 9,99") ohne echten vorherigen
Verkaufspreis — in der EU nach Omnibus-Richtlinie abmahnfähig (siehe Guardrail 9.9).
EU-Anzeigepreis ist immer **brutto inkl. MwSt.**

### P5-2: Rechtsseiten anlegen (fehlen aktuell vollständig — verifiziert)

Audit-Befund: Die App hat KEIN Impressum, KEINE Datenschutzerklärung, KEINE
Widerrufsbelehrung, KEINE AGB; der Landing-Footer hat nur eine Mailadresse. Für
einen deutschen B2C-Anbieter digitaler Inhalte ist das abmahnfähig.

Vier statische Seiten erstellen (Muster: bestehende Guides; `noindex` via
`vercel.json`-Header wie `/auth`), plus Footer-Links in `LandingPage.jsx`:
- `/imprint` (Impressum, § 5 DDG — Inhaber, Adresse, Kontakt; Daten vom Betreiber einholen)
- `/privacy` (DSGVO-Datenschutzerklärung — MUSS PostHog, Supabase, Stripe als
  Auftragsverarbeiter nennen; der Betreiber trackt aktiv)
- `/terms` (AGB)
- `/refund` (Widerrufsbelehrung)
- Inhalte beim Betreiber anfordern / aus dem hermeswriting.de-Bestand als Vorlage
  nehmen, NICHT frei erfinden (Guardrail 9.3 — keine erfundenen Rechtsangaben).

### P5-3: Widerruf bei digitalen Inhalten korrekt lösen

Digitale Inhalte haben 14 Tage Widerrufsrecht, ES SEI DENN, der Käufer stimmt im
Checkout der sofortigen Ausführung ausdrücklich zu UND bestätigt den Verlust des
Widerrufsrechts. → Pflicht-Checkbox/Hinweis unmittelbar vor dem Stripe-Checkout
einbauen. Empfehlung des Betreibers prüfen: zusätzlich freiwillige „14 Tage
Geld-zurück"-Garantie als Conversion-Booster (bei 9,99 € risikoarm).

### P5-4: Checkout-Hebel (Betreiber-Aufgabe in Stripe, KI dokumentiert)

- **Stripe Tax aktivieren** (EU-OSS: MwSt. des Käuferlandes wird automatisch korrekt
  berechnet/ausgewiesen — sonst Steuerproblem bei jedem Auslandsverkauf).
- **Zahlungsmethoden** über Karte hinaus aktivieren: **PayPal, Apple Pay, Google Pay**
  — bei der Zielgruppe (Impulskauf < 10 €, mobil) der vermutlich größte Conversion-Hebel.
- **Abandoned-Checkout-Recovery** in Stripe aktivieren (Checkout-Abbrecher = heißeste Leads).
- E-Mail-Hygiene: `info@natalnavigator.com` muss existieren/empfangen; SPF/DKIM für
  Stripe-Belege und Supabase-Mails (Reset-Templates liegen im Repo) sauber konfigurieren.

### P5-5: Echte Bewertungen einsammeln (für späteres aggregateRating)

Nach Kauf/PDF-Export dezenter Review-Prompt. Erst NACH ~20–30 echten Stimmen darf
`aggregateRating` ins Schema (Guardrail 9.3 — vorher verboten). Liefert Sterne-Snippets
in Google und Social Proof für die Landing.

### P5-6: Code-Hygiene-Fix

`LandingPage.jsx` Z. 313: Auth-Link ist als absolute URL
`https://natalnavigator.com/auth` hartkodiert → auf relativ `/auth` ändern, damit
Staging-/Preview-Deployments nicht auf die Produktionsdomain springen.

### P5-7: Zusätzlicher Kanal — Pinterest/Instagram (Betreiber, KI bereitet vor)

Die Zielgruppe (Frauen 30+) entdeckt Astrologie primär über Pinterest/Instagram/
TikTok, nicht über Google. Pinterest ist faktisch eine zweite Suchmaschine mit
langer Content-Lebensdauer und genau dieser Demografie. Jeder Phase-2-Guide lässt
sich als 2–3 Pins verwerten (Karten-Visuals existieren in `public/landing/`). Die KI
liefert dafür Pin-Titel/Beschreibungs-Entwürfe mit UTM-Links; der Betreiber postet.
Konsequenz: **Mobile-Erlebnis von Landing + Demo-iframe muss explizit getestet werden**
(Großteil dieses Traffics ist mobil).

---

## 8. Messung & Erfolgskriterien

| Metrik | Quelle | Baseline | Ziel 90 Tage |
|---|---|---|---|
| Indexierte URLs | GSC Seiten-Bericht | ~4 | 35–40 |
| Impressionen/Woche | GSC | niedrig (Betreiber kennt Zahl) | 10× Baseline |
| Ø-Position Cluster „lines" | GSC Filter `/astrocartography/` | – | < 15 |
| Bing-Indexierung | Bing WMT | 0 (nicht eingerichtet) | vollständig |
| AI-Erwähnung | manuelle Stichprobe: 5 Fragen an ChatGPT/Perplexity/Claude monatlich | 0 | ≥ 1 Engine nennt Natal Navigator |
| Demo→Kauf-Funnel | PostHog | unbekannt | gemessen + erste Optimierung |

Wöchentliche Routine (Betreiber, 15 Min): GSC-Performance nach Seiten-Filter,
neue Seiten auf Indexierung prüfen, eine AI-Engine-Stichprobe.

---

## 9. Guardrails — was du als umsetzende KI NICHT tun darfst

1. **Keine neue Domain, keine Subdomain, keine Weiterleitungsketten.** Die Entscheidung
   aus Abschnitt 2 steht.
2. **Kein skaliertes Thin-Content-Programm.** Keine automatisch generierten
   Stadt-Seiten („Venus line in Lissabon" × 345 Städte) — das fällt unter Googles
   Scaled-Content-Abuse-Policy und gefährdet die ganze Domain. Deckel: ~35 Seiten,
   jede einzeln redigiert.
3. **Kein Fake-E-E-A-T und keine erfundenen Angaben:** keine erfundenen
   Bewertungen/`aggregateRating` (erst nach echten Stimmen, P5-5), keine erfundenen
   Autoren-Personas, keine erfundenen Statistiken — und **keine erfundenen
   Rechtsinhalte** (Impressum/Datenschutz/AGB-Daten beim Betreiber einholen, nicht
   ausdenken). Astrologie wird als Reflexions-/Deutungswerkzeug beschrieben, nicht als
   Vorhersagewissenschaft (so steht es korrekt in `llms.txt` — beibehalten).
4. **Kein Posten auf fremden Plattformen** (Reddit/Quora/Foren) — nur Entwürfe für
   den Betreiber.
5. **Kein Cross-Linking mit hermeswriting.de.**
6. **`/demo`, `/auth`, `/dashboard` etc. bleiben noindex.** Die `/landing`-Route
   bleibt ein Redirect auf `/`.
7. **Bestehende Canonicals/hreflang-Logik nicht umbauen,** nur nach vorhandenem
   Muster erweitern.
8. Jede Änderung an `vercel.json` vor dem Deploy gegen die bestehenden Security-Header
   und Rewrites prüfen (CSP nicht aufweichen).
9. **Preis = 9,99 € / $9.99, lückenlos konsistent** an allen in P5-1 gelisteten
   Stellen. Kein Fake-Streichpreis (EU-Omnibus). EU-Preise immer brutto inkl. MwSt.
10. **Kein Freemium bauen.** Betreiber-Entscheidung: direkte Paywall, Freemium nur als
    späteres, separat freigegebenes Experiment.
11. **Reihenfolge beachten:** Phase 5 (Recht + Preis + Checkout) MUSS abgeschlossen
    sein, bevor breiter Traffic aus Phase 2/3 auf den Shop geleitet wird.

---

## 10. Abarbeitungs-Checkliste (Kurzform für die Umsetzung)

- [ ] P0-1 `VITE_IS_LANDING=1` auf firma-designs-Production; Landing = Homepage
- [ ] P0-2 403/Firewall-Prüfanleitung + Verifikations-Curls; AI-Bots allowlisten
- [ ] P0-3 Host-Redirect `*.vercel.app → natalnavigator.com` in vercel.json
- [ ] P0-4 GSC-Resubmit-Anleitung, Bing WMT, IndexNow-Key + Ping-Script
- [ ] P1-1 Sitemap-Generator-Script, lastmod frisch
- [ ] P1-2 Landing-Prerendering (Bots sehen Volltext ohne JS)
- [ ] P1-3 FAQPage-, Organization-, BreadcrumbList-Schema
- [ ] P1-4 llms.txt erweitern, llms-full.txt, Zitier-Absätze
- [ ] P2 Cluster 1–4: ~35 statische Guide-/Intent-Seiten nach Muster, gestaffelt
- [ ] P2 Interne Verlinkungs-Topologie (Footer „Learn", Pillar-Hub, Kreuzlinks)
- [ ] P3 GEO: Fakten-Snippets, Entity-Konsistenz, Erwähnungs-Textentwürfe
- [ ] P4 PostHog-Funnel + UTM-Konvention (Distinct-ID über Tab-Wechsel halten)
- [ ] **P5-1 Preis 9,99 €/$9.99 überall konsistent (Stripe, JSON-LD, Landing, llms.txt, Guides)**
- [ ] **P5-2 Rechtsseiten /imprint /privacy /terms /refund + Footer-Links (noindex)**
- [ ] **P5-3 Widerruf-Checkbox vor Checkout (+ optional 14-Tage-Garantie)**
- [ ] **P5-4 Stripe Tax, PayPal/Apple Pay/Google Pay, Abandoned-Checkout, E-Mail/SPF/DKIM**
- [ ] P5-5 Review-Prompt nach Kauf (aggregateRating erst nach echten Stimmen)
- [ ] P5-6 Auth-Link in LandingPage.jsx Z.313 relativ machen
- [ ] P5-7 Pinterest/Instagram-Pin-Entwürfe + Mobile-Test Landing/Demo
- [ ] Abschlussbericht mit allen Betreiber-To-dos (GSC/Bing/Vercel/Stripe-Dashboard)
