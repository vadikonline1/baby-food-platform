# Asseturi magazine (Google Play + App Store)

Surse vectoriale (SVG) — gata de exportat ca PNG/JPEG pentru import în
Play Console și App Store Connect. **Magazinele nu acceptă SVG**,
deci exportați fiecare fișier la dimensiunea exactă:

| Fișier | Export la | Folosit la |
|---|---|---|
| `icon-512.svg` | **512×512 PNG** (fără transparență rotunjită — magazinele decupează singure) | Icon aplicație (ambele magazine) + `mobile` icon |
| `feature-graphic-1024x500.svg` | **1024×500 PNG/JPEG** | Google Play → Prezentare grafică (banner sus) |
| `screenshot-promo-1080x1920.svg` | **1080×1920 PNG** | Capturi promo (înlocuiți cu screenshoturi reale din aplicație când există!) |

## Export deja generat

Directorul `export/` conține versiunile gata de upload:
`icon-512.png` (512×512), `icon-1024.png` (1024×1024 — folosit și ca
`mobile/assets/icon.png`), `feature-graphic-1024x500.png` **.jpg** și
`screenshot-promo-1080x1920.png`.

## Cum exportați (una din variante)

1. **Browser:** deschideți SVG-ul, DevTools → dimensiunea exactă → screenshot.
2. **Inkscape:** `inkscape in.svg -o out.png -w 1024 -h 500`
3. **Python:** `pip install cairosvg` + `cairosvg.svg2png(url='in.svg', write_to='out.png', output_width=1024, output_height=500)`
4. Convertoare online (căutați „SVG to PNG 1024x500").

## Cerințe magazine (orientativ)

- **Google Play:** icon 512×512 PNG 32-bit; feature graphic 1024×500 PNG/JPEG;
  minim 2 screenshoturi telefon (recomandat 1080×1920); categorie, descriere RO/RU/EN.
- **App Store:** icon 1024×1024 (exportați `icon-512.svg` la 1024!);
  screenshoturi 6.7" (1290×2796) și 6.5" (1242×2688) — faceți din aplicația reală
  cu simulatorul (Xcode) sau dispozitivul.

## Notă

Machetele de aici sunt placeholder-e decente pentru prima publicare.
Pentru conversie maximă, înlocuiți screenshotul promo cu capturi reale din
aplicație (Rețete → Rețetă → Plan) imediat ce aveți build-ul preview din EAS.
