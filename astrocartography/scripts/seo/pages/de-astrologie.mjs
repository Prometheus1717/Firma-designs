const SIGNS = [
  ['aries', 'Widder', '♈', '21. März – 19. April', 'Feuer', 'kardinal', 'Mars', 'Anfang, Mut, der erste Schritt'],
  ['taurus', 'Stier', '♉', '20. April – 20. Mai', 'Erde', 'fix', 'Venus', 'Beständigkeit, Genuss, was bleibt'],
  ['gemini', 'Zwillinge', '♊', '21. Mai – 20. Juni', 'Luft', 'veränderlich', 'Merkur', 'Neugier, Sprache, schnelle Verbindungen'],
  ['cancer', 'Krebs', '♋', '21. Juni – 22. Juli', 'Wasser', 'kardinal', 'Mond', 'Zugehörigkeit, Erinnerung, Schutz'],
  ['leo', 'Löwe', '♌', '23. Juli – 22. August', 'Feuer', 'fix', 'Sonne', 'Sichtbarkeit, Wärme, schöpferischer Stolz'],
  ['virgo', 'Jungfrau', '♍', '23. August – 22. September', 'Erde', 'veränderlich', 'Merkur', 'Handwerk, Dienst, Systeme, die funktionieren'],
  ['libra', 'Waage', '♎', '23. September – 22. Oktober', 'Luft', 'kardinal', 'Venus', 'Ausgleich, Schönheit, Partnerschaft'],
  ['scorpio', 'Skorpion', '♏', '23. Oktober – 21. November', 'Wasser', 'fix', 'Pluto (Mars)', 'Tiefe, Intensität, Wandlung'],
  ['sagittarius', 'Schütze', '♐', '22. November – 21. Dezember', 'Feuer', 'veränderlich', 'Jupiter', 'Horizont, Sinn, die lange Reise'],
  ['capricorn', 'Steinbock', '♑', '22. Dezember – 19. Januar', 'Erde', 'kardinal', 'Saturn', 'Ehrgeiz, Struktur, verdiente Autorität'],
  ['aquarius', 'Wassermann', '♒', '20. Januar – 18. Februar', 'Luft', 'fix', 'Uranus (Saturn)', 'Eigensinn, Gemeinschaft, Ideen vor ihrer Zeit'],
  ['pisces', 'Fische', '♓', '19. Februar – 20. März', 'Wasser', 'veränderlich', 'Neptun (Jupiter)', 'Vorstellungskraft, Mitgefühl, weiche Grenzen'],
];

const signRows = SIGNS.map(([slug, name, glyph, dates, el, mode, ruler, theme]) =>
  `<tr><td>${glyph} <a href="/best-places-to-live/${slug}"><strong>${name}</strong></a></td><td>${dates}</td><td>${el} · ${mode}</td><td>${ruler}</td><td>${theme}</td></tr>`
).join('');

export default {
  slug: 'astrologie',
  lang: 'de',
  alt: { en: 'astrology' },
  title: 'Astrologie erklärt: Sternzeichen, Planeten, Häuser & Karte',
  ogTitle: 'Astrologie, erklärt als Landkarte',
  description: 'Astrologie zum Anwenden: die 12 Sternzeichen, 10 Planeten, 12 Häuser und 4 Achsen, und wie jede Stellung zu einer Linie auf deiner Astrokartographie-Karte wird.',
  keywords: 'astrologie, sternzeichen, geburtshoroskop, planeten astrologie, häuser astrologie, aszendent, astrologie karte, astrokartographie',
  articleHeadline: 'Astrologie, erklärt als Landkarte: Sternzeichen, Planeten, Häuser und wohin sie dich führen',
  datePublished: '2026-09-07',
  dateModified: '2026-09-07',
  breadcrumb: [{ name: 'Astrologie', url: '/astrologie' }],
  h1: 'Astrologie, erklärt als Landkarte: Sternzeichen, Planeten, Häuser und wohin sie dich führen',
  lead: '<strong>Astrologie ist eine Symbolsprache mit kleinem Wortschatz und endlosen Sätzen.</strong> Zwölf Sternzeichen beschreiben, <em>wie</em> etwas geschieht, zehn Planeten beschreiben, <em>was</em> geschieht, zwölf Häuser beschreiben, <em>in welchem Lebensbereich</em> es sich abspielt, und vier Achsen verankern das Ganze in Zeit und Ort deiner Geburt. Dieser Leitfaden bringt dir diesen Wortschatz in der Reihenfolge bei, in der du ihn wirklich brauchst, und zeigt dann den Teil, den fast alle Astrologie-Seiten auslassen: wie aus demselben Horoskop durch Astrokartographie eine Weltkarte wird.',
  definedTerm: {
    name: 'Astrologie',
    alternateName: ['Geburtshoroskop-Astrologie', 'Natalastrologie', 'horoskopische Astrologie'],
    description: 'Astrologie ist ein Symbolsystem, das die Stellungen von Sonne, Mond und Planeten zum Zeitpunkt der Geburt liest, ausgedrückt in zwölf Tierkreiszeichen, zwölf Häusern und vier Achsen, als Sprache für die Reflexion über Charakter, Zeit und Ort. Sie ist Deutung, keine gesicherte Wissenschaft.',
  },
  sections: [
    {
      h2: 'Was Astrologie ist, und was sie nicht ist',
      html: `<p>Ein Geburtshoroskop ist eine Momentaufnahme des Himmels in der Minute deiner Geburt, gezeichnet von dem Punkt der Erde aus, an dem du geboren wurdest. Dieser Teil ist Astronomie und auf die Bogenminute berechenbar. Alles danach, die Bedeutung einer Sonne im Löwen oder eines Mondes im vierten Haus, ist Deutung, über rund zweitausend Jahre Praxis weitergegeben. Astrologie wurde nie als Vorhersagewissenschaft belegt, und der ehrliche Umgang mit ihr ist der als Spiegel: ein geordneter Satz von Fragen darüber, wer du bist, was du willst und wo du dich zuhause fühlst.</p><p>Dieser Rahmen verändert, wie du jede Seite wie diese liest. Eine Zeichenbeschreibung ist kein Urteil, sondern eine Linse. Zeigt sie dir etwas Wahres, behalte es. Tut sie es nicht, bleibt das Horoskop trotzdem deins, nur die Linse hat nicht gepasst. Natal Navigator steht genau auf diesem Standpunkt: echte Ephemeriden darunter, symbolische Lesart darüber, die Entscheidung bleibt bei dir. Die vollständige <a href="/about">Methodik und die redaktionellen Grundsätze</a> sind offen einsehbar.</p>`,
    },
    {
      h2: 'Die 12 Sternzeichen',
      html: `<p>Der Tierkreis ist ein Band von 360 Grad, geteilt in zwölf Zeichen zu je 30 Grad. Wer sagt „Ich bin Zwilling", meint: Die Sonne stand an meinem Geburtstag im Abschnitt Zwillinge dieses Bandes. Jeder andere Planet steht ebenfalls in einem Zeichen, ein vollständiges Horoskop hat also zehn Zeichenstellungen, nicht eine. Zeichen werden nach <strong>Element</strong> gruppiert (Feuer, Erde, Luft, Wasser: das Temperament) und nach <strong>Modalität</strong> (kardinal, fix, veränderlich: die Art der Bewegung). Jedes Zeichen hat außerdem einen Herrscherplaneten, der seinen ganzen Charakter färbt.</p>
<div style="overflow-x:auto;"><table><thead><tr><th>Zeichen</th><th>Sonne im Zeichen</th><th>Element · Modus</th><th>Herrscher</th><th>Kernthema</th></tr></thead><tbody>${signRows}</tbody></table></div>
<p>Jeder Zeichenname führt zu einem Guide über die Art von Ort, an dem dieses Zeichen aufblüht, denn Temperament hat eine Geographie. Feuerzeichen wollen Schwung und Publikum, Erdzeichen Qualität und Kontinuität, Luftzeichen Gespräch und Optionen, Wasserzeichen Tiefe und Zugehörigkeit. Die Übersicht findest du unter <a href="/where-to-live-by-zodiac-sign">Wo leben, nach Sternzeichen</a> (englisch).</p>`,
    },
    {
      h2: 'Die 10 Planeten: das Personal des Horoskops',
      html: `<p>Wenn Zeichen die Adjektive sind, sind Planeten die Substantive. Die klassische Astrologie arbeitet mit den zwei Lichtern und acht Planeten, und jeder steht für einen Lebensbereich. In der Astrokartographie wird jeder von ihnen zusätzlich zu vier Linien auf dem Globus, deshalb sind die Linienseiten dieser Website der beste Ort, um tiefer zu gehen.</p>
<ul>
<li><strong>Sonne</strong>: Identität, Vitalität, das, was du werden sollst. Auf der Karte: <a href="/astrokartographie/sonnenlinie">Sonnenlinien</a>, dort wirst du gesehen.</li>
<li><strong>Mond</strong>: emotionale Bedürfnisse, Erinnerung, Zuhause, das Sicherheitsgefühl des Körpers. <a href="/astrokartographie/mondlinie">Mondlinien</a> sind die klassischen „Fühlt sich wie Zuhause an"-Linien.</li>
<li><strong>Merkur</strong>: Denken, Sprache, Lernen, Handel. <a href="/astrocartography/mercury-line">Merkurlinien</a> schärfen Kommunikation und Geschäft.</li>
<li><strong>Venus</strong>: Liebe, Schönheit, Genuss, Geld als Freude. <a href="/astrokartographie/venuslinie">Venuslinien</a> sind die meistgesuchten Linien jeder Karte.</li>
<li><strong>Mars</strong>: Antrieb, Konflikt, Mut, Sexualität. <a href="/astrokartographie/marslinie">Marslinien</a> geben Energie und reizen in gleichem Maß.</li>
<li><strong>Jupiter</strong>: Wachstum, Glück, Weite, Vertrauen. <a href="/astrokartographie/jupiterlinie">Jupiterlinien</a> öffnen Türen und weiten den Horizont.</li>
<li><strong>Saturn</strong>: Struktur, Grenzen, Disziplin, Meisterschaft über die Zeit. <a href="/astrokartographie/saturnlinie">Saturnlinien</a> fordern und belohnen den richtigen Menschen tief.</li>
<li><strong>Uranus</strong>: Wandel, Freiheit, Erfindung, plötzliche Wendungen. <a href="/astrocartography/uranus-line">Uranuslinien</a> lösen Routinen auf.</li>
<li><strong>Neptun</strong>: Vorstellungskraft, Spiritualität, Auflösung, Täuschung. <a href="/astrocartography/neptune-line">Neptunlinien</a> inspirieren und verwirren zugleich.</li>
<li><strong>Pluto</strong>: Macht, Tiefe, Ende und Neubeginn. <a href="/astrocartography/pluto-line">Plutolinien</a> sind dort, wo das Leben ernst wird.</li>
</ul>
<p>Die „großen Drei", die alle zitieren, Sonnenzeichen, Mondzeichen und Aszendent, sind schlicht die drei Stellungen, die dich am schnellsten beschreiben: der Kern, das Innere und die Person, der andere zuerst begegnen.</p>`,
    },
    {
      h2: 'Die 12 Häuser: in welchem Lebensbereich es geschieht',
      html: `<p>Häuser teilen das Horoskop in zwölf Lebensbereiche, gezählt gegen den Uhrzeigersinn vom östlichen Horizont deiner Geburt. Anders als Zeichen hängen Häuser von Geburtszeit und Geburtsort ab, weshalb ein Horoskop ohne Geburtszeit nur ein halbes Horoskop ist. Das Zeichen eines Planeten sagt, wie er sich verhält; sein Haus sagt, in welchem Zimmer deines Lebens er wohnt.</p>
<ol>
<li><strong>1. Haus</strong>: Selbst, Körper, Auftreten, erster Eindruck (beginnt am Aszendenten)</li>
<li><strong>2.</strong>: Geld, Besitz, Selbstwert</li>
<li><strong>3.</strong>: Kommunikation, Geschwister, kurze Wege, der Alltagsverstand</li>
<li><strong>4.</strong>: Zuhause, Familie, Wurzeln, das private Selbst (beginnt am IC)</li>
<li><strong>5.</strong>: Kreativität, Romantik, Kinder, Spiel</li>
<li><strong>6.</strong>: Arbeit, Routinen, Gesundheit, Dienst</li>
<li><strong>7.</strong>: Partnerschaft, Ehe, offene Gegner (beginnt am Deszendenten)</li>
<li><strong>8.</strong>: geteilte Ressourcen, Intimität, Wandlung</li>
<li><strong>9.</strong>: Reisen, höhere Bildung, Überzeugung, das Fremde</li>
<li><strong>10.</strong>: Beruf, Ruf, öffentliche Rolle (beginnt am Medium Coeli)</li>
<li><strong>11.</strong>: Freunde, Gemeinschaft, Hoffnungen, Netzwerke</li>
<li><strong>12.</strong>: Rückzug, das Unbewusste, Abschlüsse, Stille</li>
</ol>
<p>Vier dieser Häuser beginnen an einer Achse. Diese vier Achsen sind das Scharnier zwischen gewöhnlicher Astrologie und Astrokartographie.</p>`,
    },
    {
      h2: 'Die 4 Achsen: wo Astrologie zu Geographie wird',
      html: `<p>Aszendent, Deszendent, Medium Coeli und Imum Coeli sind die vier empfindlichsten Punkte jedes Horoskops. Sie sind keine Planeten, sondern Horizont und Meridian deines Geburtsorts, auf den Tierkreis projiziert. Deshalb wandern sie mit dem Ort: Ändere, wo du geboren bist oder wo du stehst, und die Achsen ändern sich, die Planeten nicht.</p>
<ul>
<li><strong>Aszendent (AC)</strong>: der östliche Horizont, das aufsteigende Zeichen, wie du wirkst. Auf der Karte: <a href="/astrocartography/asc-line">Aszendentenlinien</a>.</li>
<li><strong>Deszendent (DC)</strong>: der westliche Horizont, Partnerschaft und die Menschen, die du anziehst. <a href="/astrocartography/dsc-line">Deszendentenlinien</a>.</li>
<li><strong>Medium Coeli (MC)</strong>: der höchste Punkt, Beruf und öffentliche Sichtbarkeit. <a href="/astrocartography/mc-line">MC-Linien</a>.</li>
<li><strong>Imum Coeli (IC)</strong>: der tiefste Punkt, Zuhause, Wurzeln und Privatleben. <a href="/astrocartography/ic-line">IC-Linien</a>.</li>
</ul>
<p>Astrokartographie stellt für jeden Planeten eine einfache Frage: Wo auf der Erde hätte dieser Planet im Moment meiner Geburt genau auf einer meiner vier Achsen gestanden? Jede Antwort ist eine Linie über den Globus. Zehn Planeten mal vier Achsen ergeben die vierzig Linien einer Natal-Navigator-Karte. Wer auf seiner Venus-Deszendent-Linie steht, für den wäre Venus von dort aus zur Geburtsminute gerade untergegangen. Die <a href="/astrokartographie">Anleitung zur Astrokartographie</a> führt durch die ganze Methode, der <a href="/astrokartographie/rechner">Astrokartographie-Rechner</a> rechnet sie für dich.</p>`,
    },
    {
      h2: 'Vom Horoskop zur Karte: Stellungen geographisch lesen',
      html: `<p>Hier ist die Brücke, die die meisten Astrologie-Texte nie bauen. Nimm eine Stellung, etwa den Mond im Krebs im 4. Haus. Die klassische Astrologie liest darin einen Menschen, für den Zuhause, Familie und emotionale Sicherheit zentral sind. Die Astrokartographie stellt eine zweite Frage: <em>Wo</em> darf dieser Mond auf einer Achse stehen? Die Mond-IC-Linie ist der Streifen der Erde, auf dem dieses Bedürfnis nach Verwurzelung durch den Ort verstärkt wird. Ein Krebs-Mond-Mensch, der weit weg von jeder Mondlinie lebt, fühlt sich womöglich jahrelang leise entwurzelt, ohne zu wissen warum. Die Karte gibt diesem Gefühl Koordinaten.</p>
<p>Dieselbe Logik läuft durch jede Stellung. Eine Sonne im Löwen will gesehen werden, also wird die Sonnen-MC-Linie zum natürlichen Ort für die Frage, wo Sichtbarkeit leicht fällt. Ein Saturn im Steinbock baut langsam, also markieren die Saturnlinien, wo diese Disziplin geprüft und belohnt wird. Deine Zeichenstellungen sagen dir, was du brauchst; deine Linien sagen dir, wo die Welt diesem Bedürfnis entgegenkommt. <a href="/astrokartographie/wo-soll-ich-leben-astrologie">Wo soll ich leben?</a> wendet das auf die Fragen an, die Menschen wirklich stellen, und <a href="/blog/anzeichen-falscher-wohnort">Anzeichen, dass du am falschen Ort lebst</a> zeigt die Kehrseite.</p>`,
    },
    {
      h2: 'Dein eigenes Horoskop in zehn Minuten lesen',
      html: `<ol>
<li><strong>Besorge dir eine genaue Geburtszeit.</strong> Die Geburtsurkunde schlägt jede Erinnerung. Ohne Zeit hast du Zeichen, aber keine Häuser und keine Achsen.</li>
<li><strong>Finde deine großen Drei.</strong> Sonnenzeichen für die Identität, Mondzeichen für die Bedürfnisse, Aszendent für die Wirkung. Lies alle drei zusammen, nicht die Sonne allein.</li>
<li><strong>Suche nach Häufungen.</strong> Drei oder mehr Planeten in einem Zeichen oder Haus sind ein Thema und wiegen schwerer als jede Einzelstellung.</li>
<li><strong>Prüfe die Achsen.</strong> Jeder Planet wenige Grad neben AC, DC, MC oder IC ist laut in deinem Leben und erzeugt eine starke Linie auf deiner Karte.</li>
<li><strong>Mach eine Karte daraus.</strong> Öffne den <a href="/astrokartographie/rechner">Astrokartographie-Rechner</a>, gib dieselben Geburtsdaten ein und sieh zu, wie jede Stellung zu einer Linie wird. Dann bewerte die Städte, die du wirklich in Betracht ziehst.</li>
</ol>
<p>Die Demo lässt dich ein berühmtes Horoskop erkunden, bevor du dein eigenes eingibst: <a href="/demo">Live-Demo öffnen</a> oder gleich <a href="/create">deine Karte erstellen</a>.</p>`,
    },
  ],
  faq: [
    { q: 'Ist Astrologie real?', a: 'Die Astronomie in einem Geburtshoroskop ist real und exakt berechenbar. Die Bedeutungen, die Zeichen, Planeten und Häusern zugeschrieben werden, sind symbolische Deutung ohne gesicherte wissenschaftliche Bestätigung. Astrologie funktioniert am besten als geordnete Sprache für Reflexion, nicht als Vorhersage.' },
    { q: 'Was ist der Unterschied zwischen Astrologie und Astrokartographie?', a: 'Astrologie liest dein Geburtshoroskop für den Zeitpunkt deiner Geburt. Astrokartographie nimmt dasselbe Horoskop und fragt, wo auf der Erde jeder Planet auf einer deiner vier Achsen gestanden hätte. Das ergibt vierzig Linien über den Globus, Astrologie angewendet auf den Ort.' },
    { q: 'Brauche ich meine genaue Geburtszeit?', a: 'Für die Zeichen nicht. Für Häuser, Aszendent, Achsen und jede Astrokartographie-Linie ja. Wenige Minuten Abweichung verschieben den Aszendenten um ein Grad und Achsenlinien um Dutzende Kilometer, nutze also wenn möglich die Geburtsurkunde.' },
    { q: 'Was ist der Aszendent?', a: 'Der Aszendent ist das Tierkreiszeichen, das am Ort und in der Minute deiner Geburt am östlichen Horizont aufging. Er beschreibt, wie du wirkst, und legt das gesamte Häusersystem deines Horoskops fest.' },
    { q: 'Welcher Planet ist für die Wohnortwahl am wichtigsten?', a: 'Das hängt davon ab, was du dir vom Umzug wünschst. Mond- und IC-Linien sprechen von Zuhause und Zugehörigkeit, Sonnen- und MC-Linien von Sichtbarkeit und Beruf, Venus von Liebe und Leichtigkeit, Jupiter von Wachstum. Die meisten vergleichen zwei oder drei Linien, statt einer einzigen nachzujagen.' },
    { q: 'Kann Astrologie mir sagen, wohin ich ziehen soll?', a: 'Sie kann dir einen gut strukturierten Satz von Fragen geben und eine Karte, wo jedes Thema deines Horoskops verstärkt wird. Ein Ergebnis garantieren kann sie nicht. Nutze sie neben den praktischen Fakten eines Ortes und behandle die Karte als Werkzeug zur Reflexion, nicht als Anweisung.' },
  ],
  related: [
    { href: '/astrokartographie', label: 'Astrokartographie: die komplette Anleitung' },
    { href: '/astrokartographie/rechner', label: 'Astrokartographie-Rechner: aus dem Horoskop werden Linien' },
    { href: '/astrokartographie/wo-soll-ich-leben-astrologie', label: 'Wo soll ich leben? Astrologie und Wohnort' },
    { href: '/where-to-live-by-zodiac-sign', label: 'Wo leben, nach Sternzeichen (englisch)' },
    { href: '/astrokartographie/venuslinie', label: 'Venuslinie: Liebe, Schönheit und Leichtigkeit' },
    { href: '/astrology', label: 'This guide in English: Astrology, explained as a map' },
  ],
};
