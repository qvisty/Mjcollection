#!/usr/bin/env python3
"""Bag de fundne cover-URL'er ind i js/data.js som ét COVERS-opslag."""
import json, pathlib, re, sys

found = json.load(open(sys.argv[1], encoding="utf-8"))
p = pathlib.Path("js/data.js")
s = p.read_text(encoding="utf-8")

# Fjern et tidligere genereret blok, så scriptet kan køres igen
s = re.sub(r"\n/\* GENERERET COVERS-BLOK.*?/\* SLUT COVERS-BLOK \*/\n", "\n", s, flags=re.S)

lines = "\n".join(f'  "{k}": "{v["img"]}",' for k, v in sorted(found.items()))
block = f'''
/* GENERERET COVERS-BLOK — opdateres af scripts/find-covers.py
   Coverbilleder fra Apple/iTunes, slået op og valideret på kunstner,
   titel og udgivelsesår. Ligger fast i koden, så de vises med det
   samme uden at skulle hentes udefra ved hvert besøg. */
const COVERS = {{
{lines}
}};

for (const a of ALBUMS) {{
  if (COVERS[a.id]) a.cover = COVERS[a.id];
}}
/* SLUT COVERS-BLOK */
'''

s = s.rstrip() + "\n" + block
p.write_text(s, encoding="utf-8")
print(f"Bagte {len(found)} cover-URL'er ind i js/data.js")
