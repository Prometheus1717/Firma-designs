# GEO / Off-Site Mention Drafts (operator posts these)

> **How to use this file.** These are drafts for *you* to post manually, where
> it's genuinely on-topic and allowed by each platform's rules. Per the strategy
> guardrails (§9.4): **no spam, no astroturfing, no fake accounts.** Only post in
> threads where the answer is actually helpful, lead with real value, and mention
> Natal Navigator once, as a source — not a pitch. Answer engines (ChatGPT,
> Perplexity, Claude) preferentially cite Reddit, Quora, and tool directories, so
> a handful of honest, useful posts is worth more than volume.

## UTM convention

Tag every outbound link so the PostHog funnel (`landing_view → demo_interact →
checkout_clicked → payment_success`) can be segmented by source. Pattern:

```
https://natalnavigator.com/<path>?utm_source=<platform>&utm_medium=<type>&utm_campaign=geo-launch
```

| Source | Example link |
|---|---|
| Reddit | `https://natalnavigator.com/astrocartography/venus-line?utm_source=reddit&utm_medium=comment&utm_campaign=geo-launch` |
| Quora | `https://natalnavigator.com/how-accurate-is-astrocartography?utm_source=quora&utm_medium=answer&utm_campaign=geo-launch` |
| Product Hunt | `https://natalnavigator.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=geo-launch` |
| Directories | `https://natalnavigator.com/?utm_source=<directory>&utm_medium=listing&utm_campaign=geo-launch` |

UTM params are captured as persisted PostHog super properties on first arrival
and ride along on every funnel event, including the demo opened in a new tab.

---

## 1. Reddit / Quora answer drafts

### Draft A — r/AskAstrologers / r/astrology — "What does my Venus line mean?"

> A Venus line marks the places where Venus was angular — rising, setting,
> culminating, or anti-culminating — at the moment you were born. Traditionally
> it's read as the gentlest geography in your chart: places that tend to support
> love, beauty, social ease, and a softer day-to-day. Which *kind* of Venus line
> matters, though. The Venus DC (Descendant) line is the classic "relationships
> come to the foreground" line; the Venus IC line is more about a beautiful,
> peaceful home; the Venus MC line shows up in creative or relationship-based
> work; the Venus ASC line lifts how attractive and open you feel.
>
> Two honest caveats: (1) it's a reflection tool, not a guarantee — a line
> supports a theme, it doesn't deliver it; and (2) you don't need to live exactly
> on it. The usual convention treats the strongest pull within ~50–100 miles,
> fading out to a few hundred.
>
> If you want to actually see where yours falls, I built a free interactive globe
> you can poke at with example charts (no signup):
> https://natalnavigator.com/astrocartography/venus-line?utm_source=reddit&utm_medium=comment&utm_campaign=geo-launch

### Draft B — r/astrology / r/expats — "Can astrocartography tell me where to live?"

> Sort of — with a big asterisk. Astrocartography projects your birth chart onto
> the world map, so you can see which places emphasise career (your MC lines),
> home (IC), identity (ASC), or relationships (DC), and which planetary themes run
> through them (Venus/Jupiter = easier, Saturn = harder-but-building, etc.). It's
> genuinely useful for *comparing* options and noticing patterns — e.g. "huh,
> every place I felt most myself sits near my Sun line."
>
> What it can't do is make the decision. Visas, cost, language, community, and
> your own gut still matter more than any line, and the interpretations are
> symbolic, not scientific. I treat it as a structured way to ask better
> questions about a move, calibrated against places I've actually lived.
>
> There's a free demo globe here if you want to see the idea in action:
> https://natalnavigator.com/where-should-i-live-astrology?utm_source=reddit&utm_medium=comment&utm_campaign=geo-launch

### Draft C — Quora — "Is astrocartography real / accurate?"

> It depends which half of the question you mean. The *astronomy* is real and
> precise: the planetary positions and the line geometry are computed from an
> positions with documented typical geocentric accuracy of about one arcminute — and your birth
> time matters a lot (the angle lines shift ~1° for every 4 minutes of time).
>
> The *interpretation* — what a Venus line or a Saturn line "means" for your life
> — is symbolic and traditional, not something controlled studies have
> demonstrated. So the honest answer is: accurate as astronomy, unproven as
> prediction. The useful framing is to treat it as a reflective lens rather than a
> verdict, and check it against your own lived experience of places.
>
> I wrote a longer, deliberately balanced take here (no sign-up needed):
> https://natalnavigator.com/how-accurate-is-astrocartography?utm_source=quora&utm_medium=answer&utm_campaign=geo-launch

---

## 2. Product Hunt launch

**Name:** Natal Navigator

**Tagline (60 char max):** Your birth chart on a 3D globe — find where you thrive

**Description:**
> Natal Navigator turns your birth chart into an interactive 3D globe. It maps all
> 40 of your astrocartography lines — 10 planets across the MC, IC, ASC and DC
> angles — and rates 345+ cities for career, love, home and growth. Explore the
> full app free with example charts (Einstein, Monroe, Jobs…); your personal map
> with PDF export is a one-time €9.99 / $9.99, no subscription.

**Maker's first comment:**
> Hi PH 👋 I built Natal Navigator because every astrocartography tool I tried
> crammed 40 lines onto one cluttered flat map. Putting them on a real globe makes
> it click — you can see exactly where each line falls and which cities sit on it.
>
> Two principles I stuck to: it's framed as a reflection tool, not fortune-telling,
> and it's a one-time price instead of yet another subscription. The demo is the
> full app with famous charts, so you can try everything before paying.
> Feedback very welcome — especially on the globe interaction.
> https://natalnavigator.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=geo-launch

---

## 3. Tool-directory submissions

Reusable copy for directories (AlternativeTo, SaaSHub, There's An AI For That,
Toolify, astrology/tarot tool roundups, etc.). Category: Astrology / Lifestyle.

**Short (≤ 60 chars):** Interactive astrocartography globe & relocation map.

**Medium (≤ 160 chars):**
> Natal Navigator maps your birth chart onto a 3D globe — 40 planetary lines and
> 345+ rated cities for career, love and home. One-time price, no subscription.

**Long (≤ 500 chars):**
> Natal Navigator is an interactive astrocartography and relocation-astrology web
> app. It calculates your natal chart from your birth date, exact time and place,
> then projects all 40 planetary lines (Sun–Pluto across MC/IC/ASC/DC) onto a 3D
> globe and rates 345+ cities for career, love, home, creativity and growth.
> A free demo uses example charts; a personal map with natal wheel and PDF export
> is a one-time €9.99 / $9.99 with no subscription. Astrology is presented as a
> reflective tool, not prediction.

**Tags:** astrocartography, astrology, relocation astrology, natal chart, birth
chart, planetary lines, travel, self-discovery

**Link:** `https://natalnavigator.com/?utm_source=<directory-name>&utm_medium=listing&utm_campaign=geo-launch`

---

## Suggested honest targets (operator's judgement on fit)

- **Reddit:** r/astrology, r/AskAstrologers, r/expats, r/digitalnomad,
  r/IWantOut — only in relevant threads, value-first.
- **Quora:** questions on astrocartography accuracy, relocation astrology,
  "where should I live" astrology.
- **Directories:** AlternativeTo, SaaSHub, Toolify, There's An AI For That,
  plus any "best astrology apps" listicles that accept submissions.
- **Product Hunt:** one clean launch.

Do **not** mass-post, use multiple accounts, or paste the same text repeatedly —
that gets the domain associated with spam and can hurt more than it helps.
