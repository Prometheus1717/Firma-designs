export default {
  slug: 'about',
  lang: 'en',
  title: 'About Natal Navigator: Method, Sources & Editorial Policy',
  description: 'How Natal Navigator calculates maps, separates astronomy from symbolic astrology, handles sources, corrections, privacy and editorial responsibility.',
  keywords: 'Natal Navigator about, astrocartography methodology, astronomy-engine accuracy, editorial policy',
  articleHeadline: 'About Natal Navigator: methodology, sources and editorial standards',
  datePublished: '2026-08-10',
  dateModified: '2026-08-10',
  breadcrumb: [{ name: 'About', url: '/about' }],
  h1: 'How Natal Navigator calculates, explains and corrects its maps',
  lead: 'Natal Navigator is an interactive astrocartography product. It calculates astronomical positions with documented software, then presents traditional astrological interpretations as symbolic reflection — not as scientific prediction or professional advice.',
  sections: [
    {
      h2: 'Operator and editorial responsibility',
      html: `<p>Natal Navigator is operated by Sercan Yesilyurt, who is also responsible for the website's editorial content. The legally required address and contact details are maintained in the <a href="/impressum">imprint</a>. Articles use the transparent organizational byline “Natal Navigator Editorial”; the site does not invent author qualifications or anonymous expert profiles.</p>`,
    },
    {
      h2: 'Calculation method and documented precision',
      html: `<p>The product uses the open-source <a href="https://github.com/cosinekitty/astronomy" rel="noopener noreferrer">Astronomy Engine</a> library for planetary positions. Its documentation describes typical geocentric position accuracy within approximately one arcminute. A personal map also depends on the accuracy of birth time and place, time-zone conversion and the geometry used to project angular positions onto Earth.</p><p>We do not claim greater precision than the selected library documents. Input uncertainty can outweigh software precision: an uncertain birth time can move angular lines materially, so the map should never imply more certainty than the source data supports.</p>`,
    },
    {
      h2: 'Astronomy and interpretation are different claims',
      html: `<p>Planet positions and map geometry are computational questions. The life meanings traditionally assigned to Sun, Moon, Venus or other lines are astrological interpretations. They are not established by scientific evidence. Natal Navigator therefore frames the map as a vocabulary for reflection and comparison, never as a guarantee that a move will produce love, success, health or income.</p>`,
    },
    {
      h2: 'Editorial sources and corrections',
      html: `<p>Technical claims should link to primary documentation. Time-sensitive product comparisons should identify their checked date and distinguish observed features from vendor claims. Interpretive guides should label tradition, anecdote and opinion instead of presenting them as measured effects.</p><p>To report a factual error, send the page URL, affected passage and a source to <a href="mailto:info@natalnavigator.com">info@natalnavigator.com</a>. Confirmed material corrections update the page and its modification date.</p>`,
    },
    {
      h2: 'Product, privacy and commercial scope',
      html: `<p>The demo is a product preview limited to example charts. A personal map is a one-time purchase currently shown on the product page as €9.99 or US$9.99 depending on locale. Privacy, storage and deletion details are maintained in the <a href="/datenschutz">privacy notice</a>; commercial terms are maintained in the <a href="/agb">terms</a>.</p>`,
    },
  ],
  faq: [
    { q: 'Is astrocartography scientifically proven?', a: 'No. The astronomical inputs are calculable, but the astrological meanings assigned to locations are symbolic interpretations without established scientific validation.' },
    { q: 'How accurate is Astronomy Engine?', a: 'Its official documentation describes typical geocentric position accuracy within approximately one arcminute. Map accuracy also depends on birth data, time-zone conversion and projection geometry.' },
    { q: 'How can I request a correction?', a: 'Email info@natalnavigator.com with the page URL, passage and preferably a primary source. Confirmed material corrections update the content and modification date.' },
  ],
  related: [
    { href: '/astrology', label: 'Astrology explained: signs, planets, houses and your map' },
    { href: '/astrocartography', label: 'Astrocartography: the complete beginner guide' },
    { href: '/astrocartography-calculator', label: 'How the calculator works' },
    { href: '/blog/how-accurate-is-astrocartography', label: 'How accurate is astrocartography?' },
  ],
};
