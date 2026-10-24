# Vedligeholdelsesscripts

## Coverbilleder

`find-covers.py` slår coverbilleder op hos Apple/iTunes for hver udgivelse og
validerer hvert match på **kunstner, titel og udgivelsesår**, så vi ikke ender
med et cover fra en anden plade. `bake-covers.py` skriver resultatet ind i
`js/data.js` som `COVERS`-opslaget nederst i filen.

```bash
# 1) Træk udgivelseslisten ud af data.js
cp js/data.js /tmp/d.js && echo "module.exports={ALBUMS};" >> /tmp/d.js
node -e "console.log(JSON.stringify(require('/tmp/d.js').ALBUMS.map(
  a=>({id:a.id,title:a.title,artist:a.artist,year:a.year,format:a.format,wiki:a.wiki}))))" > /tmp/albums.json

# 2) Slå op (tager ca. 7 min; kan genoptages, resultatet caches)
python3 scripts/find-covers.py /tmp/albums.json /tmp/covers.json

# 3) Skriv ind i data.js
python3 scripts/bake-covers.py /tmp/covers.json
```

### To ting at holde øje med

**Forkerte kunstnere.** Navnetjekket accepterer alt med "jackson" i — det
matchede fx country-sangeren *Alan Jackson* på "Santa Claus Is Comin' to Town".
Gennemgå listen over kunstnernavne efter en kørsel.

**Delte covers på singler.** iTunes har sjældent 7"-omslaget; den returnerer
ofte opsamlingens cover, så mange singler får samme billede. Covers, der deles
af flere singler, udelades med vilje — så viser kortet i stedet den genererede
7"-grafik, som er unik og læsbar.
