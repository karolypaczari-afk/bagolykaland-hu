# Analytics tracking — bagolykaland.hu

Ez a doksi a `js/analytics.src.js` modult dokumentálja és az **emberi GA4-admin lépéseket**,
amik nélkül a JS-ben kiküldött adatok nem jelennek meg riportokban.

A Meta Pixel + CAPI réteg külön doksiban: `_docs/meta-ads-tracking.md`.

---

## Mit csinál `analytics.src.js`

Két dolgot, automatikusan, minden oldalon:

### 1. Attribúció-capture (first-party, 90 napos cookie + localStorage)

Az első érkezéskor elkapja az URL-ből és eltárolja:

| Kulcs | Honnan |
|---|---|
| `gclid` | Google Ads click |
| `gbraid` / `wbraid` | iOS Google Ads click (cookieless attribution) |
| `fbclid` | Meta ad click |
| `msclkid` | Microsoft Ads click |
| `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` / `utm_term` | bármilyen UTM |

Logika:
- **Új click-ID érkezik** (gclid/gbraid/wbraid/fbclid/msclkid) → felülírja az előzőt (last-click).
- **Csak UTM** click-ID nélkül → kiegészíti a hiányzó mezőket, click-ID-t megőrzi (a régebbi paid click marad attribuálva).
- **Sem új ID, sem UTM** → tárolt érték marad.

Tárolva: `bk_attrib` cookie + `localStorage['bk_attrib']` (90 nap).

Elérhető: `window.BKAttribution.get()`, `getEventParams()`, `clear()`.

Minden GA4 event-re automatikusan ráragad (lásd lent), így ha egy látogató 2 héttel az ad-klikk után tölti ki a formot, a `generate_lead` event még mindig viszi a `gclid`-et.

### 2. GA4 custom event-ek

Ezek mind `gtag('event', ...)` hívások, automatikus dataLayer push-csal:

| Event | Mikor tüzel | Paraméterek |
|---|---|---|
| `view_camp` | `/nyari-tabor/...` (sessionben 1×) | service_slug, service_category=summer_camp |
| `view_program` | `/szorongasoldo/`, `/iskola-elokeszito/`, `/nyari-iskola-elokeszito/` (sessionben 1×) | service_slug, service_category |
| `view_course` | `/kezen-fogva/...` (sessionben 1×) | service_slug, service_category=online_course |
| `view_service` | `/foglalkozasaink/...` (sessionben 1×) | service_slug, service_category=service |
| `view_assessment` | `/vizsgalatok/...` (sessionben 1×) | service_slug, service_category=assessment |
| `phone_click` | `tel:` link click | link_url, link_text |
| `email_click` | `mailto:` link click | link_url, link_text |
| `cta_click` | `.btn-coral` / `.btn-teal` / `.btn-primary` / `.v2-sticky-cta a` / `.announcement-bar a` click VAGY href tartalmaz `nyari-tabor`/`szorongasoldo`/`iskola-elokeszito`/`kezen-fogva`/`kapcsolat`/`foglalkozasaink`/`vizsgalatok` | cta_type (program/service/contact/form_anchor/engagement), cta_text, cta_destination |
| `scroll_depth_50` | Az oldal 50%-ának elérése | scroll_depth=50 |
| `scroll_depth_75` | Az oldal 75%-ának elérése | scroll_depth=75 |
| `form_start` | Első focus bármelyik form input/select/textarea-ban | form_id, source |
| `generate_lead` | Sikeres form submit (program/lead-magnet/contact) — main.src.js hívja | lead_source, lead_type, value (HUF), currency=HUF, program/turnus/form_name (típustól függően) |

**Minden** event-re automatikusan ráragad a default param-csomag:
- `content_group`, `page_category`, `service_slug`, `lang`
- `gclid` / `gbraid` / `wbraid` / `fbclid` / `msclkid` / `utm_*` (ha vannak attribútumban)

Ezt egy `gtag('set', {...})` hívással intézi, ami az analytics.js elején fut, MIELŐTT a tracking-loader.js kiküldi a `page_view`-t.

---

## KÖTELEZŐ manuális lépés: GA4 Admin custom dimensions (~10 perc, kattintós UI)

Ezek nélkül az event-ek beérkeznek, **de a riportokban nem szűrhető szerintük**.

### Lépés 1 — nyisd meg a Custom definitions felületet

1. Lépj be **csak a bagolykaland.hu fiókkal** (`G-86N523JP3E` mögötti property tulajdonosa) → https://analytics.google.com/
2. Bal alul fogaskerék (**Admin**) → property oszlop alatt **Custom definitions**
3. **Custom dimensions** tab → jobb felül **Create custom dimension** gomb

### Lépés 2 — hozd létre a 19 dimension-t egyenként

Mindegyiknél a scope **Event**, a többi mező ahogy alább. A `Description` opcionális, segít ha 2 hónap múlva visszanézed.

| # | Dimension name | Event parameter | Description (másold ki) |
|---|---|---|---|
| 1  | Page Category      | `page_category`    | Oldal taxonómia (home / summer_camp / program / service / assessment / blog / contact …) |
| 2  | Service Slug       | `service_slug`     | URL slug a megnyitott szolgáltatáshoz |
| 3  | Service Category   | `service_category` | `view_*` event-ek service kategória paramétere |
| 4  | CTA Type           | `cta_type`         | program / service / contact / form_anchor / engagement |
| 5  | CTA Text           | `cta_text`         | Megnyomott CTA látható szövege |
| 6  | Form ID            | `form_id`          | Form HTML id / name |
| 7  | Lead Source        | `lead_source`      | `generate_lead` event source: program_signup / contact_form / bagolykaland (lead magnet) |
| 8  | Lead Type          | `lead_type`        | summer_camp / school_prep_intensive / program_inquiry / lead_magnet / contact |
| 9  | Program            | `program`          | Konkrét program neve (camp / szorongásoldó / iskola-előkészítő …) |
| 10 | Turnus             | `turnus`           | Tábor turnus azonosító |
| 11 | FBCLID             | `fbclid`           | Meta click ID (Surya parity, magic dim-name) |
| 12 | GBRAID             | `gbraid`           | Google Ads iOS click ID |
| 13 | WBRAID             | `wbraid`           | Google Ads web cross-context click ID |
| 14 | MSCLKID            | `msclkid`          | Microsoft Ads click ID |
| 15 | UTM Source         | `utm_source`       | Marketing forrás (manual UTM) |
| 16 | UTM Medium         | `utm_medium`       | cpc / email / social / referral |
| 17 | UTM Campaign       | `utm_campaign`     | Kampánynév (manual UTM) |
| 18 | UTM Content        | `utm_content`      | Ad/creative variant |
| 19 | UTM Term           | `utm_term`         | Kulcsszó vagy targeting term |

**Tipp**: tartsd nyitva ezt a doksit + a GA4 tab-ot egymás mellett, és gyorsbillentyűzd: Tab-ok között CTRL+Tab, mezők között Tab, mentés Enter.

> **Content Group**, **Language (lang)** és **gclid** automatikusan kollektálódik GA4-ben (built-in dimension-ök), külön regisztrálni nem kell.

**Property limit:** 50 custom dimension. Itt 19, bőven belefér.

**Feldolgozási késleltetés:** 24-48 óra, mire az új dimension-re lehet szűrni — addig csak az event-listing mutatja az event paramétereket.

---

## KÖTELEZŐ manuális lépés: Key event = `generate_lead` (~2 perc)

GA4 Admin → property oszlop → **Events** → keresd meg a `generate_lead` sort a listában (megjelenik ~24 órán belül az első hit után — addig manuálisan kell létrehozni).

### Ha még nincs a listán:

GA4 Admin → **Events** → **Create event** → 
- Custom event name: `generate_lead`
- Matching conditions: `event_name` equals `generate_lead`
- Mentsd el.

### Ha már ott van:

Az adott sor jobb oldalán a **Mark as key event** toggle → ON.

A `bk_*` event-eket (`bk_program_signup` stb.) **NE** jelöld key event-nek — duplikálnák a `generate_lead`-et. Ezeket csak event-listing-szinten figyeld.

**Opcionális mikro-konverziók** (Surya jó tapasztalata szerint NEM kell key event-nek jelölni — pollutálja a Smart Bidding-et): `view_camp`, `view_program`, `cta_click`, `scroll_depth_50`, `scroll_depth_75`. Hagyd őket sima event-nek és csak elemzéshez használd.

---

## Alternatív: programatikus regisztráció (~5 perc, ha jártas vagy a service account-ban)

Ha NEM akarsz 19-szer kattintani, létezik a Surya-projektben egy GA4 admin script. Két előfeltétel:

1. **Bagolykaland GA4 property ID** — Admin → Property Settings → felül látszik a `Property ID` (kb. 9 jegyű szám)
2. **Service account hozzáférés:** Bagolykaland GA4 → Admin → Property Access Management → Add users → email: `ga4-mcp-server@zsenibagoly.iam.gserviceaccount.com` → role: **Editor** → Add.

Aztán futtatás (PowerShell, Bagolykaland projekt-gyökerében):
```powershell
$env:GA4_PROPERTY_ID = "<a property ID-d>"
& C:\claudecode_use\Suryaayurveda_hu_koltozes_2026_04\scripts\tracking\run_ga4_admin_setup.ps1 --dry-run
```
A `--dry-run` először felismeri, hogy létezik-e mind a 19 dimension, és mit hozna létre. Ha rendben, futtasd újra `--dry-run` nélkül és létrejönnek. A `generate_lead` key event egy külön hívással (lásd `ga4_admin.py ensure generate_lead`).

⚠️ A Surya `ga4_admin_setup.py` jelenleg a property ID-t hard-codeolja Surya-ra. Bagolykalandra adaptáláshoz a script tetején lévő `PROPERTY_ID` konstanst kell felülírni — vagy létrehozni egy bagolykaland-os másolatot a `_dev/ga4-admin/` alá és onnan futtatni. Ha akarod, kérd a következő üzenetben hogy „készítsd el a bagolykaland-os admin scriptet a `_dev/`-be" és lehúzom 5 perc alatt.

---

## Smoke teszt — fejlesztés alatt

DevTools Console:

```js
// Attribúció állapot
BKAttribution.get()                  // → { gclid: "...", utm_source: "...", first_seen: "..." }
BKAttribution.getDefaultEventParams() // → { content_group: "summer_camp", gclid: "...", ... }

// Manuálisan tüzelj egy lead-et (érték nélkül)
BKAnalytics.fireLead({ lead_source: 'smoke_test', lead_type: 'manual' })

// Nézd a dataLayer-t
dataLayer.filter(x => x[0] === 'event')
```

GA4 Real-time → DebugView (kell a Chrome GA Debugger extension): minden event érkezzen 1-2s alatt.

URL-ben kézi teszt:
```
https://bagolykaland.hu/?gclid=TEST_FROM_DEVTOOLS&utm_source=manual_test
```
→ töltsd ki valamelyik formot → `generate_lead` event paramétereiben látnod kell a `gclid=TEST_FROM_DEVTOOLS`-t.

---

## Mi NEM tartozik ide

- **Meta Pixel + CAPI** → `_docs/meta-ads-tracking.md` és `js/meta-enhance.src.js`.
- **Microsoft Clarity** → `js/tracking-loader.src.js` `configureClarity()` szekciója; külön doksi nincs, kódból olvasható.
- **Consent Mode v2** → `_includes/partials/head.njk` inline script, és `js/cookie-consent.src.js`.

---

## Google Ads — aktiválás folyamatban (2026-05-11)

**Állapot:**
- ✅ Google Ads fiók létrehozva, Customer ID: `8433857843`
- ✅ GA4 ↔ Google Ads link létezik (`properties/490802166/googleAdsLinks/14857371868`, létrehozva 2026-05-11 13:18)
- ✅ `tracking.src.js` `gAdsId = 'AW-8433857843'` → AW config tag betöltődik (cross-domain linker, conversion enhanced data)
- ✅ `main.src.js` `fireGoogleAdsConversion()` scaffold mind a 3 lead-path után meghívva (lead magnet 3.000 Ft, program signup variábilis 5k-252k Ft, contact form 1.500 Ft) — **label nélkül no-op**, production-safe
- ⏳ `gAdsLabel` üres → direkt gtag conversion még nem tüzel; a GA4 import is hiányzik
- ⏳ Enhanced Conversions toggle ki
- ⏳ Customer data terms el nem fogadva
- ⏳ GA4 stream "Include user-provided data for advertising" ki
- ⚠️ GA4↔Ads link `ads_personalization_enabled: false` → remarketing audience-export nem működik

### Kétféle conversion-firing út, ne kombinálj

| | GA4 import (egyszerűbb) | Direkt gtag (precízebb) |
|---|---|---|
| Setup | Google Ads → Konverziók → Új → Importálás → GA4 → `generate_lead` | Konverziós action → Tag setup → label másolása → `js/tracking.src.js` `gAdsLabel` → `npm run build` |
| Latency | 24-48 órás GA4 → Ads feldolgozás | Real-time (másodpercek) |
| Enhanced Conv | A GA4 user_data ágon | A meta-enhance hash-eken (már mind ki van építve) |
| Risk | Smart Bidding lassabb tanulás | Akkor sem tüzel ha JS hiba van az oldalon |
| Dedup | — | Egyező `transaction_id`-vel a GA4 generate_lead-del |

**Ajánlott a direkt gtag-ra menni** mert a `fireGoogleAdsConversion()` már bele van drótozva minden lead-pathba, és Enhanced Conv automatikusan jön. **NE** importáld a `generate_lead`-et Ads conversion-ként ha a direkt gtag is fut — Smart Bidding duplán számolja.

### Pontos UI lépéssor (Google Ads + GA4)

#### 1. GA4: Personalized Advertising ON a link-en (~30s)
GA4 → bal lent fogaskerék (**Admin**) → property oszlop → **Product Links** → **Google Ads links** → kattints a most létrehozott linkre (`Customer ID 843-385-7843`) → szerkesztés (ceruza ikon) → **Enable Personalized Advertising** toggle ✓ → Mentés.

#### 2. GA4: Data Stream — user-provided data ON (~30s)
GA4 → Admin → property oszlop → **Data Streams** → web stream (`bagolykaland.hu`) → görgess le **Enhanced measurement** alá → **Include user-provided data for advertising** → ON.

#### 3. Google Ads: Customer data terms (~1 perc)
Google Ads (https://ads.google.com) → felül **Eszközök** (Tools, kulcs ikon) → **Konverziók** (Conversions) → bal oldalt **Beállítások** (Settings) → **Customer data terms** szekcióban olvasd át és fogadd el. Egyszer kell, az egész fiókra érvényes.

#### 4. Google Ads: a konverziós action már LÉTEZIK — MCP létrehozta (~0 perc)

Adspirer MCP-vel létrejött 2026-05-11-én. Ne hozz létre újabbat manuálisan.

**Konverziós action:** `BagolyKaland Lead (webhely gtag)`, ID `7607034859`
- Kategória: SUBMIT_LEAD_FORM (Lead → Send lead form)
- Számolás: ONE_PER_CLICK
- Click-through ablak: 30d, View-through: 1d
- Default érték: 5000 HUF (a JS dinamikusan felülírja submit-enként)
- Attribúció: GOOGLE_ADS_LAST_CLICK (új fióknak ez kezdetnek; ~3000 click + 300 conv után váltható DATA_DRIVEN-re)

#### 5. Google Ads: a meglévő "Javasolt cél" downgrade primary→secondary (~30s)

Eszközök → Konverziók → kattints a **Javasolt cél** soron (Status `ENABLED`, Category `Lead`) → **Szerkeszt** → **Cél típusa** alatt válaszd **Másodlagos cél** (Secondary goal) → Mentés.

**Miért:** A GA4 → Ads link auto-importálta ezt a `generate_lead` event-ből (`GOOGLE_ANALYTICS_4_CUSTOM` típus). Ha primary marad MELLETTE a direkt gtag konverzió, Smart Bidding **kétszer számolja** ugyanazt a leadet → bid túl agresszív. Ezért a direkt gtag (webhely) marad primary, a GA4 import átkerül secondary-be (még riportban látszik, de Smart Bidding nem optimalizál rá).

A "Leadűrlap – Küldés" (LEAD_FORM_SUBMIT) primary marad — csak Google Ads-en belüli lead extension form-okra tüzel, a weboldal-form-okra nem ütközik a webhely gtag konverzióval.

#### 6. Google Ads: Enhanced Conversions ON az új konverzión (~1 perc)

Eszközök → Konverziók → **BagolyKaland Lead (webhely gtag)** sor → **Enhanced Conversions** szekció → **Bekapcsolás** → forrás: **Google Tag** (NEM "Google Analytics", mert direkt gtag-ot használunk!) → User-provided data: jóváhagyod → Mentés.

A `meta-enhance.src.js` által írt SHA-256 email/phone hash-eket a `tracking-loader.js` `pushEnhancedConversionsData()` automatikusan átadja `gtag('set','user_data',...)` hívással. Ez teszi 5-15%-kal pontosabbá a konverziós megfeleltetést cookie-blocked browser-ek esetén.

#### 7. Google Ads: tag setup → label kinyerés (~1 perc)

Konverziós action oldala → **Tag setup** szekció → **Install the tag yourself** (NE Google Tag Manager). Megjelenik:
```
gtag('event', 'conversion', {
  'send_to': 'AW-8433857843/aBcD-EfGhIjKlM',  ← a / utáni rész kell
  'value': 1.0,
  'currency': 'HUF'
});
```
**Másold ki a `/` utáni stringet** (pl. `aBcD-EfGhIjKlM`) — ez a `gAdsLabel`.

#### 8. Mondd meg a labelt — bekódolom (~30 másodperc)

Add meg az előző lépésben kimásolt labelt és:
- bekódolom `js/tracking.src.js` `gAdsLabel`-jébe
- `npm run build` → live deploy
- a `fireGoogleAdsConversion()` azonnal tüzel a következő lead-en

#### 6. Smoke test (~5 perc)

Friss inkognitó ablak → bagolykaland.hu → bármelyik form kitöltése (pl. `/nyari-tabor/` form vagy `/szorongasoldo/` form).

Ellenőrzés:
- **Google Ads → Konverziók → adott konverzió:** a "All conversions" oszlopnak 1-2 órán belül 1-re kell ugrania (real-time-ban 24-48h-ig még "1 day to update" lehet, de a recent activity látszik)
- **DevTools Console:** `dataLayer.filter(x => x[1] === 'conversion')` → 1 hit a transaction_id-vel
- **GA4 DebugView:** látnod kell a `generate_lead` event-et, és a `_user_data` paramétert benne

### "Never break" Google Ads kontextusban

1. **gAdsId nélkül a gAdsLabel hiábavaló** — a loadGads() csak akkor tölti be a AW tag-et ha gAdsId van. Most már van (`AW-8433857843`).
2. **GA4 import + direkt gtag = duplikálás kockázata** — ha mindkettő be van állítva, MINDIG legyen ugyanaz a `transaction_id`. A scaffold a form `event_id`-jét használja, ami szerver-oldali CAPI dedup-pal is egyezik.
3. **Personalized Advertising OFF a linken = nincs remarketing audience-export.** Ezt sokan elfelejtik bekapcsolni, mert a link létrejön a checkbox bekattintása nélkül is.
4. **Enhanced Conversions forrás kiválasztása:** Google Tag (=direkt gtag) vagy Google Analytics — pontosan AZT válaszd amelyik útat használod, ne mindkettőt. Most: Google Tag.

---

## Fájlok

| Fájl | Mit csinál |
|---|---|
| `js/analytics.src.js` | Attribúció-capture + GA4 custom event-ek (ez a doksi tárgya) |
| `js/tracking.src.js` | Vendor-ID config (`gaMeasurementId: G-86N523JP3E`, `clarityId`, `metaPixelId`) |
| `js/tracking-loader.src.js` | Consent-gated SDK bootstrap (GA4 / Meta Pixel / Clarity scriptek) |
| `js/meta-enhance.src.js` | Meta Advanced Matching + CAPI relay + Meta-specific events |
| `js/cookie-consent.src.js` | Opt-out cookie banner |
| `_includes/partials/head.njk` | Consent Mode v2 default + gtag stub (inline) |
| `_includes/partials/scripts.njk` | Script betöltési sorrend: tracking → **analytics** → tracking-loader → meta-enhance → ... |
| `api/contact.php` | Form-submit handler — naplózza a `page_url`-t (gclid benne van) és tüzeli a Meta CAPI-t |

Build pipeline: `npm run build` minden `js/*.src.js`-t minifikál (terser), így új fájlt nem kell beregisztrálni — automatikus.
