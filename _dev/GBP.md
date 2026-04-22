# Google Business Profile — BagolykaLand

> Utolsó frissítés: 2026-04-22

---

## Kulcs adatok

| Mező | Érték |
|------|-------|
| Place ID | `ChIJiz_Kxg8OdEcRYnpb7s69mME` |
| Maps URL | https://www.google.com/maps/place/BagolykaLand/@47.5389796,21.625248,17z |
| Review link | https://search.google.com/local/writereview?placeid=ChIJiz_Kxg8OdEcRYnpb7s69mME |
| Dashboard | https://business.google.com |
| Rating | 5.0★ / 20 értékelés |

---

## Manuális teendők — GBP dashboard

### 1. Cím — SÜRGŐS
```
Csokonai utca 32.
Debrecen, 4024
```
- [ ] Frissítve a GBP dashboardon

### 2. Nyitvatartás
```
Hétfő–Péntek: 8:00–18:00
Szombat–Vasárnap: Zárva
```
- [ ] Beállítva

### 3. Business description (bemásolni — 620 kar)
```
BagolykaLand Fejlesztő Központ Debrecenben 15+ éve segít 3–12 éves gyermekeknek: logopédia, mozgásfejlesztés, egyéni fejlesztő foglalkozások, iskola-előkészítő és szorongásoldó program. Kiscsoportos modell (max. 5–7 fő), játékalapú módszertan, mérhető fejlődés – 1000+ sikeres gyermek. Egyedüli Dsmile-tréner Debrecenben. Komplex részképesség-vizsgálat és iskolaérettségi vizsgálat is elérhető. Új helyszín (2026 május): Csokonai u. 32. – 250 m², kert, sóterem, parkoló. Időpont: +36 30 364 9396 | fejlesztobagolyka@gmail.com
```
- [ ] Bemásolva

### 4. Kategóriák
**Primary:**
```
Fejlesztő pedagógiai intézmény
```
**Secondary (max 9, csak ha van dedikált aloldaluk):**
```
Logopédus
Gyógypedagógus
Gyermekfejlesztési szolgáltatás
Oktatási intézmény
Képességfejlesztő iskola
Pedagógiai intézet
Nyári tábor
Vizsgálati szolgáltatás
```
- [ ] Beállítva

### 5. Services tab

| Szolgáltatás | Ár |
|---|---|
| Logopédia | 10.000 Ft / 60 perc |
| Mozgásfejlesztés (egyéni) | 10.000 Ft / 60 perc |
| Mozgásfejlesztés (kiscsoportos) | 28.000 Ft / hó |
| Egyéni fejlesztő foglalkozás | 10.000 Ft / 60 perc |
| Iskola-előkészítő program | 28.000 Ft / hó |
| Szorongásoldó program „Mozaik" | 90.000 Ft (10 alkalom) |
| Szülői konzultáció | 18.000 Ft / 60 perc |
| Komplex részképesség-vizsgálat | 42.000 Ft / 180 perc |
| Iskolaérettségi vizsgálat | egyedi árazás |
| Logopédiai vizsgálat | egyedi árazás |
| Kézen Fogva online kurzus | 7.990 Ft |

- [ ] Felvive

### 6. Fotók — feltöltési sorrend
1. Cover: új épület kívülről (Csokonai u. 32. tábla látható)
2. Logo
3. Belső terek: fejlesztő szobák, sóterem, váróterem, kert (3–5 db)
4. Csapat: Alexandra, Nóra, Szandra — névvel
5. Foglalkozás közbeni fotók (szülői engedéllyel)
6. Eszközök, felszerelés
- [ ] Feltöltve

### 7. Posztok — heti ütemterv
- **Hétfő:** Szolgáltatás spotlight + CTA gomb + link az aloldalra
- **Csütörtök:** Tipp/blog bejegyzés + link
- **Eseménynél:** Program hirdetés (tábor, Mozaik csoport stb.)
- [ ] Első 2 poszt közzétéve

### 8. QR-kód a váróterembe
- Fájl: `qr-ertekeles.html` (projekt gyökerében)
- Böngészőben megnyitni → Nyomtatás (Ctrl+P)
- [ ] Kinyomtatva és kihelyezve

---

## NAP frissítés — külső directorykon

Helyes adat mindenhol: **Csokonai utca 32., Debrecen 4024 | H–P: 8:00–18:00 | +36 30 364 9396**

| Oldal | Link | Státusz |
|---|---|---|
| nyitva.hu | https://nyitva.hu/debrecen/bagolykaland-313794 | [ ] |
| cylex.hu | https://debrecen.cylex.hu/ceg-info/bagolykaland-1122305.html | [ ] |
| imami.hu | https://debrecen.imami.hu/kepessegfejlesztes-felzarkoztatas/bagolykaland | [ ] |

---

## GBP MCP szerver — review automation

Eszközök: `list_locations`, `get_unreplied_reviews`, `generate_reply`, `post_reply`, `get_review_day_stats`

### Setup lépések

- [ ] `cd C:\Users\charl\mcp-servers\gbp-review-agent && npm install && npm run build`
- [ ] Google Cloud projekt + GBP API engedélyezése: https://console.cloud.google.com/apis/library
- [ ] GBP API hozzáférés kérelem (jóváhagyás kell): https://support.google.com/business/contact/api_default
- [ ] OAuth 2.0 credentials: https://console.cloud.google.com/apis/credentials
  - Típus: Web application
  - Redirect URI: `http://localhost:3000/auth/callback`
  - Scope: `https://www.googleapis.com/auth/business.manage`
- [ ] `.env` kitöltése: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- [ ] `npm run auth` → OAuth flow böngészőben → token mentés
- [ ] `~/.claude/mcp.json` bővítése:

```json
"google-business-reviews": {
  "command": "node",
  "args": ["C:/Users/charl/mcp-servers/gbp-review-agent/build/index.js"],
  "env": {
    "GOOGLE_CLIENT_ID": "...",
    "GOOGLE_CLIENT_SECRET": "...",
    "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback"
  }
}
```

### Dokumentáció

| Téma | Link |
|------|------|
| GBP API referencia | https://developers.google.com/my-business/reference/rest |
| GBP API hozzáférés kérelem | https://support.google.com/business/contact/api_default |
| OAuth 2.0 Web Server Flow | https://developers.google.com/identity/protocols/oauth2/web-server |
| Google Cloud Console | https://console.cloud.google.com |
| MCP szerver repo | https://github.com/satheeshds/gbp-review-agent |
| GBP Help Center | https://support.google.com/business |

---

## Kódban elvégzett módosítások (2026-04-22)

| Fájl | Változtatás |
|------|-------------|
| `pages/vizsgalatok/komplex-reszkepesseg-vizsgalat/index.njk` | Title: "Debrecen" hozzáadva |
| `pages/arlista/index.njk` | Title: "Debrecen" hozzáadva |
| `pages/blog/index.njk` | Title: "Debrecen" hozzáadva |
| `_data/site.json` | Nyitvatartás: "H–V: 9:00–17:00" → "H–P: 8:00–18:00" |
| `_includes/partials/head.njk` | Schema árak kiegészítve, leírások minden ajánlathoz, Szülői konzultáció hozzáadva |
| `qr-ertekeles.html` | ÚJ — nyomtatható QR-kód oldal |
