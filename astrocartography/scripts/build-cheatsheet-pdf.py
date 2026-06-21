#!/usr/bin/env python3
"""Generates the Astrocartography Line Cheat Sheet PDF lead magnet.
Branded to the landing palette. Vector-only, no external fonts.
Output: public/astrocartography-line-cheat-sheet.pdf
Run: python3 scripts/build-cheatsheet-pdf.py
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "astrocartography-line-cheat-sheet.pdf")

PAPER  = HexColor("#FBF8F1"); PAPER2 = HexColor("#F4EFE3"); CARD = HexColor("#FFFFFF")
INK    = HexColor("#181C23"); INK2 = HexColor("#4C5563"); INK3 = HexColor("#8A93A2")
LINE   = HexColor("#E7E0D1")
MINT   = HexColor("#0E7C5B"); MINTB = HexColor("#19C68B"); MINTS = HexColor("#DCF2E5")
AMBER  = HexColor("#A8650F"); AMBERS = HexColor("#FAEBD2")
LAV    = HexColor("#5D4FB8"); LAVS = HexColor("#E9E5F9")
ROSE   = HexColor("#B2543F"); ROSES = HexColor("#F9E3E0")
NIGHT  = HexColor("#0B1118")

W, H = A4
M = 18 * mm

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Astrocartography Line Cheat Sheet")
c.setAuthor("Natal Navigator")
c.setSubject("A printable one-page guide to the 10 planetary lines and 4 angles of astrocartography.")
c.setKeywords("astrocartography, planetary lines, sun line, venus line, ascendant, midheaven, cheat sheet, natal navigator")


def bg():
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)


def card(x, y, w, h, fill=CARD, stroke=LINE, r=10):
    c.setFillColor(fill); c.setStrokeColor(stroke); c.setLineWidth(1)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)


def dot(x, y, col, rad=3.4*mm):
    c.setFillColor(col); c.circle(x, y, rad, stroke=0, fill=1)


# ─────────────────────────── PAGE 1 ───────────────────────────
bg()
# header band
c.setFillColor(INK); c.rect(0, H-42*mm, W, 42*mm, stroke=0, fill=1)
c.setFillColor(MINTB); c.circle(M+5*mm, H-21*mm, 5*mm, stroke=0, fill=1)
c.setFillColor(NIGHT); c.setFont("Helvetica-Bold", 13); c.drawCentredString(M+5*mm, H-23.3*mm, "N")
c.setFillColor(PAPER); c.setFont("Helvetica-Bold", 22)
c.drawString(M+15*mm, H-19*mm, "Astrocartography Line Cheat Sheet")
c.setFillColor(HexColor("#C2CDC8")); c.setFont("Helvetica", 10.5)
c.drawString(M+15*mm, H-26*mm, "The 10 planetary lines & 4 angles — what each place amplifies in you.")
c.setFillColor(MINTB); c.setFont("Helvetica-Bold", 9.5)
c.drawString(M+15*mm, H-33*mm, "natalnavigator.com  ·  3D-globe astrocartography")

y = H - 52*mm
# Section: 4 angles
c.setFillColor(INK3); c.setFont("Helvetica-Bold", 9)
c.drawString(M, y, "THE 4 ANGLES  ·  the area of life a line touches")
y -= 6*mm
angles = [
    ("AC", "Ascendant — rising", "How a place makes you feel & come across.", AMBER, AMBERS),
    ("DC", "Descendant — setting", "Relationships and the people you draw in.", ROSE, ROSES),
    ("MC", "Midheaven — top", "Career, reputation, visibility, public life.", MINT, MINTS),
    ("IC", "Imum Coeli — base", "Home, roots, family, your private world.", LAV, LAVS),
]
cw = (W - 2*M - 3*4*mm) / 4
for i, (ab, name, desc, col, soft) in enumerate(angles):
    x = M + i*(cw + 4*mm)
    card(x, y-30*mm, cw, 30*mm, fill=soft, stroke=soft)
    c.setFillColor(col); c.setFont("Helvetica-Bold", 16); c.drawString(x+5*mm, y-11*mm, ab)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 8.2); c.drawString(x+5*mm, y-16.5*mm, name)
    c.setFillColor(INK2); c.setFont("Helvetica", 7.6)
    # wrap desc
    words = desc.split(); ln = ""; ty = y-21*mm
    for wd in words:
        if c.stringWidth(ln+" "+wd, "Helvetica", 7.6) < cw-9*mm:
            ln = (ln+" "+wd).strip()
        else:
            c.drawString(x+5*mm, ty, ln); ty -= 3.6*mm; ln = wd
    if ln: c.drawString(x+5*mm, ty, ln)

y -= 40*mm
# Section: 10 planet lines
c.setFillColor(INK3); c.setFont("Helvetica-Bold", 9)
c.drawString(M, y, "THE 10 PLANET LINES  ·  the theme a line amplifies")
y -= 7*mm
planets = [
    ("Sun", "Identity & vitality", "You feel more seen, more yourself, more alive.", AMBER),
    ("Moon", "Comfort & belonging", "Rest comes easier; a place can feel like home.", LAV),
    ("Mercury", "Mind & communication", "Ideas, writing, study and conversation quicken.", MINT),
    ("Venus", "Love & ease", "Warmth, attraction, beauty — relationships soften.", ROSE),
    ("Mars", "Drive & courage", "Energy and assertiveness rise; so can friction.", ROSE),
    ("Jupiter", "Luck & growth", "Doors open; optimism and opportunity expand.", MINT),
    ("Saturn", "Structure & weight", "Harder, but where discipline and mastery build.", INK2),
    ("Uranus", "Freedom & change", "Reinvention, surprise, breaking the old pattern.", LAV),
    ("Neptune", "Dream & dissolve", "Inspiration and spirituality — but less clarity.", LAV),
    ("Pluto", "Depth & transformation", "Intense, powerful, sometimes a total rebuild.", INK2),
]
rh = 11.4*mm
for i, (name, kw, desc, col) in enumerate(planets):
    ry = y - (i+1)*rh
    if i % 2 == 0:
        c.setFillColor(PAPER2); c.rect(M, ry, W-2*M, rh, stroke=0, fill=1)
    dot(M+5*mm, ry+rh/2, col, rad=2.6*mm)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 11); c.drawString(M+11*mm, ry+rh/2-1.2*mm, name)
    c.setFillColor(col); c.setFont("Helvetica-Bold", 8.6); c.drawString(M+42*mm, ry+rh/2-1.2*mm, kw)
    c.setFillColor(INK2); c.setFont("Helvetica", 9); c.drawString(M+88*mm, ry+rh/2-1.2*mm, desc)

# footer p1
c.setFillColor(INK3); c.setFont("Helvetica-Oblique", 8)
c.drawCentredString(W/2, 14*mm, "A line is a band, not a hairline — its theme is strongest within ~80–160 km and fades to ~500 km.")
c.setFillColor(INK3); c.setFont("Helvetica", 7.5)
c.drawCentredString(W/2, 9*mm, "© 2026 Natal Navigator  ·  natalnavigator.com  ·  Page 1 of 2  ·  A reflective tool, not a prediction.")
c.showPage()

# ─────────────────────────── PAGE 2 ───────────────────────────
bg()
c.setFillColor(INK); c.rect(0, H-30*mm, W, 30*mm, stroke=0, fill=1)
c.setFillColor(PAPER); c.setFont("Helvetica-Bold", 19)
c.drawString(M, H-16*mm, "Read your map in 5 steps")
c.setFillColor(HexColor("#C2CDC8")); c.setFont("Helvetica", 10)
c.drawString(M, H-23*mm, "The formula is simple: planet (the theme) + angle (the area of life).")

y = H - 44*mm
steps = [
    ("1", "Get your exact birth time", "Date and city set the planets; the exact minute sets the angles. A 4-minute error shifts a line ~100 km."),
    ("2", "Render all 40 lines", "Each of the 10 planets draws up to 4 lines (AC, DC, MC, IC). On a 3D globe there is no Mercator distortion."),
    ("3", "Read planet + angle as a phrase", "Venus + DC = warmth in partnership. Sun + MC = visibility. Saturn + AC = pressure, but mastery."),
    ("4", "Find lines near real places", "A line matters most for cities within ~80–160 km. Look for lines that pass near places you could live."),
    ("5", "Match the line to your question", "Love? Venus & DC. Career? MC & Jupiter. Rest? Moon & IC. Fresh start? A clean, supportive angle."),
]
for num, t, d in steps:
    card(M, y-22*mm, W-2*M, 22*mm)
    c.setFillColor(MINT); c.circle(M+10*mm, y-11*mm, 6*mm, stroke=0, fill=1)
    c.setFillColor(CARD); c.setFont("Helvetica-Bold", 13); c.drawCentredString(M+10*mm, y-13.2*mm, num)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 12); c.drawString(M+22*mm, y-9*mm, t)
    c.setFillColor(INK2); c.setFont("Helvetica", 9.4)
    words = d.split(); ln = ""; ty = y-15*mm
    for wd in words:
        if c.stringWidth(ln+" "+wd, "Helvetica", 9.4) < (W-2*M-26*mm):
            ln = (ln+" "+wd).strip()
        else:
            c.drawString(M+22*mm, ty, ln); ty -= 4.4*mm; ln = wd
    if ln: c.drawString(M+22*mm, ty, ln)
    y -= 25*mm

# CTA box
y -= 2*mm
c.setFillColor(NIGHT); c.roundRect(M, y-34*mm, W-2*M, 34*mm, 12, stroke=0, fill=1)
c.setFillColor(PAPER); c.setFont("Helvetica-Bold", 15)
c.drawCentredString(W/2, y-13*mm, "See your own lines in 90 seconds")
c.setFillColor(HexColor("#C2CDC8")); c.setFont("Helvetica", 9.5)
c.drawCentredString(W/2, y-20*mm, "Enter your birth date, time & city. Watch 40 lines render on a 3D globe,")
c.drawCentredString(W/2, y-25*mm, "with 345+ cities scored as thrive / neutral / caution for your chart.")
c.setFillColor(MINTB); c.roundRect(W/2-32*mm, y-33*mm, 64*mm, 7.5*mm, 6, stroke=0, fill=1)
c.setFillColor(NIGHT); c.setFont("Helvetica-Bold", 9.5)
c.drawCentredString(W/2, y-30.7*mm, "natalnavigator.com  →  Open the Globe")

c.setFillColor(INK3); c.setFont("Helvetica", 7.5)
c.drawCentredString(W/2, 9*mm, "© 2026 Natal Navigator  ·  natalnavigator.com  ·  Page 2 of 2  ·  Astrocartography is a reflective, interpretive tool.")
c.showPage()
c.save()
print("wrote", os.path.relpath(OUT, ROOT))
