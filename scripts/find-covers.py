#!/usr/bin/env python3
"""Hent og validér coverbilleder fra iTunes for hver udgivelse.

Album slås op som album, singler som sang (hvor artworket er den
tilhørende udgivelses). Hvert hit valideres på både kunstner og titel,
så vi ikke ender med et tilfældigt cover fra en anden artist.
"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

UA = "MjCollectionCoverBot/1.0 (privat samlerside)"
PAUSE = 1.5

albums = json.load(open(sys.argv[1], encoding="utf-8"))
out_path = sys.argv[2]
cache_path = out_path + ".cache"
cache = json.load(open(cache_path, encoding="utf-8")) if os.path.exists(cache_path) else {}


def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\(.*?\)", " ", s)                 # parenteser væk
    s = re.sub(r"\b(single|ep|version|remaster(ed)?|deluxe|edition|expanded)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def itunes(term, entity):
    url = "https://itunes.apple.com/search?" + urllib.parse.urlencode(
        {"term": term, "entity": entity, "media": "music", "limit": 25})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read().decode("utf-8", "replace").strip()
            return json.loads(body).get("results", []) if body else []
        except Exception as e:
            if attempt == 3:
                print(f"    fejl ({term[:40]}): {e}", file=sys.stderr)
                return None
            time.sleep(2 * (attempt + 1))
    return None


def titles_match(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return False
    return a == b or a.startswith(b) or b.startswith(a)


def artist_ok(album, name):
    n = norm(name)
    if "jackson" in n:
        return True
    # Duetter: hovednavnet kan være en anden kunstner
    return any(part and part in n for part in norm(album["artist"]).split(" & "))


def resolve(album):
    is_single = album["format"] == "single"
    entity = "song" if is_single else "album"
    key = "trackName" if is_single else "collectionName"

    terms = [f'{album["artist"]} {album["title"]}', f'michael jackson {album["title"]}']
    for term in terms:
        results = itunes(term, entity)
        time.sleep(PAUSE)
        if not results:
            continue
        # Bedste match: rigtig kunstner + titel, helst tættest på udgivelsesåret
        best = None
        for r in results:
            if not artist_ok(album, r.get("artistName", "")):
                continue
            if not titles_match(r.get(key, ""), album["title"]):
                continue
            art = r.get("artworkUrl100")
            if not art:
                continue
            year = int((r.get("releaseDate") or "0")[:4] or 0)
            score = abs(year - album["year"]) if year else 99
            if best is None or score < best[0]:
                best = (score, {
                    "img": art.replace("100x100bb", "600x600bb").replace("100x100", "600x600"),
                    "match": r.get(key), "artist": r.get("artistName"), "year": year,
                })
        if best:
            return best[1]
    return None


todo = [a for a in albums if a["id"] not in cache]
print(f"Slår {len(todo)} udgivelser op hos iTunes…", file=sys.stderr)
for i, a in enumerate(todo, 1):
    cache[a["id"]] = resolve(a)
    json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
    if i % 10 == 0 or i == len(todo):
        hits = sum(1 for v in cache.values() if v)
        print(f"  {i}/{len(todo)} — fundet indtil nu: {hits}", file=sys.stderr, flush=True)

found = {k: v for k, v in cache.items() if v}
json.dump(found, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
by_id = {a["id"]: a for a in albums}
missing = [k for k in cache if not cache[k]]
print(f"\nCover fundet: {len(found)}/{len(albums)}")
print(f"Mangler:      {len(missing)}")
for k in missing:
    a = by_id[k]
    print(f"  - {a['title']} ({a['year']}, {a['format']})")
