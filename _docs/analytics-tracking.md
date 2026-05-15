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

## Google Ads — aktiválás (2026-05-15 — GA4-import flow)

**Állapot:**
- ✅ **Google Ads Customer ID: `8433857843`** (`AW-8433857843`) — a 2 aktív Search kampányt tartalmazó fiók
- ✅ `tracking.src.js` `gAdsId = 'AW-8433857843'` → AW config tag betöltődik (cross-domain linker, Enhanced Conversions user_data hash-eket továbbít)
- ✅ `tracking.src.js` `gAdsLabel = ''` (üres) → `fireGoogleAdsConversion()` no-op — **manual `pagead/conversion` page-event NEM tüzel a kódból**
- ✅ **Konverzió-szolgáltatás: GA4 Key Event import** — `bagolykaland.hu (web) generate_lead` action (ID `7607011896`, type `GOOGLE_ANALYTICS_4_GENERATE_LEAD`, primary_for_goal, 5000 HUF default value, ONE_PER_CLICK)
- ✅ Enhanced Conversions for Leads + Customer data terms **fiók-szinten ON** (2026 júni unified EC óta öröklődik action-re)
- ✅ GA4 ↔ Ads link él: `properties/490802166/googleAdsLinks/14857371868`, Personalized Advertising ON, customer `8433857843`
- ✅ GA4 `generate_lead` event Key Event-re jelölve (8 esemény az utolsó 14 napban, `isConversionEvent=true`)

**Történeti megjegyzés (2026-05-12–14):** rövid ideig az `AW-18155599249` customer ID-be tüzelt egy direkt gtag konverzió a kódból (`BagolyKaland Lead (webhely gtag)` action, label `T-UlCOvHqKscEJHrodFD`). Misalignment derült ki: a kampányok a `8433857843`-on futottak, így 0 konverziót látott a Bidder. 2026-05-15-én a fiók 2026-os GA4-alapú wizardra migrált, és a tisztább megoldás a `generate_lead` event GA4-importja lett. Ez a doksi azt az állapotot tükrözi.

### Conversion-firing út — GA4 import (egyetlen aktív path)

| | GA4 import (aktuális) | Direkt gtag (deprecated) |
|---|---|---|
| Setup | Google Ads → Cél → Konverziók → + Új → Importálás → GA4 → Web → `generate_lead` pipa → Import & continue | Konverziós action → Tag setup → label → `tracking.src.js` `gAdsLabel` → `npm run build` |
| Latency | 24-48 órás GA4 → Ads feldolgozás | Real-time (másodpercek) |
| Enhanced Conv | Automatikus — a GA4 link user_data-ágán | A `meta-enhance` hash-eken keresztül (`gtag('set','user_data',...)`) |
| `tracking.src.js` config | `gAdsLabel: ''` (üres) | `gAdsLabel: '<címke-string>'` |
| `fireGoogleAdsConversion()` | No-op (üres label miatt) | Aktív |

> **Most a GA4 import az élő path.** A `fireGoogleAdsConversion()` `main.src.js` `bk_lead_catcher_submit` / `bk_program_signup` / `bk_contact_form_success` hookok után csendben no-op — minden konverzió a GA4 generate_lead event-en keresztül kerül a Google Ads-be.

### Aktuális action konfiguráció (validálva GAQL-lel 2026-05-15)

```
bagolykaland.hu (web) generate_lead (ID 7607011896)
  status:                     ENABLED
  type:                       GOOGLE_ANALYTICS_4_GENERATE_LEAD
  category:                   SUBMIT_LEAD_FORM
  primary_for_goal:           true   (Elsődleges)
  value_settings:
    default_value:            5000 HUF
    always_use_default_value: true
  counting_type:              ONE_PER_CLICK   (Egy)
  click_through_lookback_days: 90
  view_through_lookback_days:  1
  attribution_model:          GOOGLE_SEARCH_ATTRIBUTION_DATA_DRIVEN
```

A 5000 HUF egy középérték — a GA4 event-ekben jelenleg dinamikus `value` paraméter van (1.5k–252k HUF programérték szerint), de a Google Ads-import a `always_use_default_value=true` miatt fix 5000 HUF-ot számol konverziónként. Ha bid-stratégia érzékenyebb értékegyengetést igényel, a `always_use_default_value=false` átkapcsolásával az `event_value`-t használja GA4-ből.

### Smoke test

Friss inkognitó ablak → bagolykaland.hu → bármelyik form kitöltése (pl. `/kapcsolat/`).

Ellenőrzés:
- **DevTools Network:** a request capture-ban **NEM** szabad `googleadservices.com/pagead/conversion/...` GET-et látni (a direkt gtag-fire kikapcsolva). Helyette **`region1.google-analytics.com/g/collect?...en=generate_lead&...`** GA4 hit kell.
- **GA4 DebugView:** `generate_lead` event a SUBMIT_LEAD_FORM kategóriában, hozzátapasztott attribútum-paraméterekkel (`gclid`, `utm_*` stb.)
- **Google Ads → Cél → Konverziók → bagolykaland.hu (web) generate_lead:** 24-48 órán belül a "Konverziók" oszlop felugrik 1-re (real-time-ban 1-3 órás Ads-on belüli feldolgozás után).

`node _dev/scripts/verify-conversion-fire.js` — Playwright headless smoke test, ami a `/kapcsolat/` formot kitölti és captureli a network hit-eket. A várt output: GA4 `g/collect` hit `en=generate_lead`-del, NEM `pagead/conversion/...` GET.

### "Never break" Google Ads kontextusban

1. **GA4 import + direkt gtag = duplikálás kockázata.** A `gAdsLabel: ''` direkt gtag-ot kikapcsolja → csak a GA4 import számol. Ha valaha visszakapcsolnád a direkt gtag-ot, a 7607011896 GA4-import action-t MÁSODLAGOSRA kell állítani, hogy a Smart Bidding ne számolja kétszer.
2. **GA4 ↔ Ads link Personalized Advertising OFF = nincs audience-export és nincs Enhanced Conversions data flow.** Mindkettő kell — GA4 Admin → Termékhivatkozások → Google Ads-link → "Personalized Advertising" ON.
3. **A `generate_lead` GA4 event MUST stay marked as Key Event.** Ha valaki tiltja GA4 Admin → Adatfolyamok → Eseménybeállítások-ban, a Google Ads import **azonnal megáll** (4-8 óra propagáció után).
4. **Fiók-szintű Enhanced Conversions for Leads ON** (`customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled=true`). A 2026 júni unified EC óta öröklődik action-re — külön action-szintű toggle nem kell.

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
