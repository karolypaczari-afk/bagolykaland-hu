# TODO-k Karesznek — Google Ads optimalizáció hátralévő lépései

**Kontextus:** 2026-05-19-i kampány-audit alapján. A nagyobb beállítások (Display OFF, Search Partners OFF, Maximize Clicks, geo PRESENCE + csak Debrecen, budget 4.000 Ft/nap, 24 új negative keyword, 8 új pozitív keyword, új RSA hirdetés) **már beállítva**. Ezek vannak hátra.

**Kampány:** `[Search] Iskola-előkészítő — Debrecen 2026` (ID `23842444078`)
**Fiók:** `8433857843`

---

## 🔴 1. Conversion actions cleanup — Primary/Secondary szétválasztás

**Probléma:** Jelenleg mind a **8 conversion action `Primary`-ra** van állítva. A Smart Bidding ettől összezavarodik, ráadásul ugyanaz a lead 2-3 különböző action-ön is megszámolódhat (duplikáció).

**Hely:** Tools (kulcs ikon) → Conversions → Summary

**Mit csinálj:**

Csak EZ az egy maradjon `Primary`-on:
- ✅ `bagolykaland.hu (web) generate_lead` — ID `7607011896`

A többi **7 darab kerüljön `Secondary`-ra** (kattints rájuk → Edit settings → Goal section → "Secondary action"):

| Conversion action | ID | Miért secondary |
|---|---|---|
| `BagolyKaland Lead (webhely gtag)` | 7607034859 | Duplikálja a generate_lead-et |
| `Leadűrlap – Küldés` | 7606609367 | Google Lead Form asset — másik csatorna |
| `Javasolt cél` | 7607012322 | GA4 custom — bizonytalan, mit mér |
| `Clicks to call` | 7611139854 | Telefonhívás ≠ űrlap-lead |
| `Local actions - Website visits` | 7610709107 | GMB clicks, nem konverzió |
| `Local actions - Other engagements` | 7611166440 | GMB engagement, nem lead |
| `Local actions - Directions` | 7614518521 | GMB irány-lekérdezés, nem lead |

**Várt hatás:** A Smart Bidding (amikor visszaváltunk Maximize Conversionsre) tisztán a generate_lead-re fog optimalizálni — nem a GMB engagement-re.

---

## 🟠 2. Un-pin HEADLINE_1 — 2 meglévő RSA-ban

**Probléma:** Két aktív hirdetés HEADLINE_1-et pinel — ez korlátozza Google rotációját, ezért maradnak az ad strength `AVERAGE` szinten.

**Hely:** Ads & assets → Ads → kattints a hirdetésre → Edit → HEADLINE_1 melletti pin ikon → "Unpin" / "Not pinned"

**Melyik 2 hirdetés:**

### Ad ID `808460452555` (Nyári intenzív ad group)
- Pinelve: `"Nyári iskola-előkészítő"`
- Vedd le a pint — engedd Google rotációt

### Ad ID `808657110143` (Iskola-előkészítő core ad group)
- Pinelve: `"Iskola-előkészítő Debrecen"`
- Vedd le a pint

**A többi hirdetés** (`808663197802`, `808744086674`, és az új `809314679437`) már pin-mentes — ezekkel nincs teendő.

---

## 🟠 3. 0-impression keyword-ök szüneteltetése — Nyári intenzív ad group

**Probléma:** A `Nyári intenzív iskola-előkészítő` ad groupban kb. 15 keyword 30 napja 0 megjelenéssel áll (QS=0). Ezek lehúzzák az ad group átlagos QS-ét.

**Hely:** Keywords nézet → szűrő: `Impressions = 0`, dátum `Last 30 days`, ad group szűrő `Nyári intenzív iskola-előkészítő`

**Mit csinálj:** Jelöld ki mindet → **Pause**. (Ne töröld — később, ha a nyári kampány feléled, kell még őket átgondolni.)

Konkrét listája (van valószínűleg pár, de a fő szempont az „Impressions = 0" szűrés):
- `nyári iskolaelőkészítő` (PHRASE)
- `nyári iskola előkészítő Debrecen` (PHRASE)
- `intenzív iskola előkészítő` (PHRASE)
- `nyári iskola előkészítő tábor` (PHRASE)
- `nyári iskola előkészítő 2026` (PHRASE)
- `iskola előkészítő nyári intenzív` (PHRASE)
- `nyári felkészítés iskolára` (BROAD)
- `intenzív iskola előkészítő tábor` (PHRASE)
- `iskolára felkészítés Debrecen nyáron` (BROAD)
- `iskola előkészítő nyár 2026` (PHRASE)
- `iskolára felkészítő nyári` (PHRASE)
- `intenzív iskolára felkészítés` (PHRASE)
- `iskolaérettség fejlesztés nyár` (PHRASE)
- `óvodából iskolába nyáron` (BROAD)
- `iskola előkészítő nyári tanfolyam` (PHRASE)
- `iskola előkészítő augusztus` (BROAD)
- `iskola előkészítő július` (BROAD)
- `iskolára felkészítés nyáron` (BROAD)

A `Iskola-előkészítő — core` ad groupban szintén van pár 0-impr keyword (`iskola felkészítő foglalkozás`, `fejlesztőpedagógus iskola előkészítő`, `nagycsoportos iskola előkészítő`, stb.) — ezeket is meg lehet nézni, de ott kevésbé sürgős, mert a core ad group QS-átlaga jobb állapotban van.

---

## 🟡 4. Nyári intenzív kampány-stratégia — döntés kell

**Helyzet:** A Nyári intenzív ad group most a tanévi kampányban él. Május közepén még alacsony a keresési volumen, de június-júliusban felpörög. Két út:

### Opció A — Külön kampány nyárinak (javaslom)
- Hozz létre új Search kampányt: `[Search] Nyári intenzív iskola-előkészítő 2026`
- Saját napi budget: **1.500 Ft/nap**
- Indulás: **2026-06-01** (előre időzíthető)
- Áthelyezhető ad group: `Nyári intenzív iskola-előkészítő`
- Előny: a tanévi kampány nyugodtan fut, a nyári saját költségvetést kap a peak-szezonban

### Opció B — Marad a jelenlegi kampányban, de leszűkítve
- Tartsd benne, de hagyj benne csak 1-2 fókuszált BROAD kulcsszót:
  - `iskola előkészítő tábor`
  - `nyári felkészítés`
- A többit szüneteltesd (lásd 3. pont)

**Ha bizonytalan vagy:** Opció A jobb, mert a tanévi kampány stabilan futhat a saját 4.000 Ft-jával, és a nyári kampány nem szívja el a budget-et a tanévi keresőktől.

---

## 🟡 5. Landing page mobil-ellenőrzés (rövid audit)

**Miért fontos:** 30 nap alatt 91 kattintás → 0 lead = gyanúsan rossz form-konverzió. Egy része a Display-szennyezésből jött (most már nincs), de a tanévi LP-t érdemes átnézni mobilon.

**URL:** `https://bagolykaland.hu/foglalkozasaink/iskola-elokeszito-foglalkozas/`

**Checklist:**
- [ ] Nyisd meg mobilon (telefonon vagy Chrome DevTools mobil emuláció)
- [ ] Az első fold-on látszik-e CTA / űrlap-anchor?
- [ ] Page Speed Insights mobil score >70?  → https://pagespeed.web.dev/
- [ ] Az űrlap submit-jakor a `generate_lead` event valóban tüzel? — `_dev/scripts/verify-conversion-fire.js` script futtatva (memory: 2026-05-15-én helyrement, de érdemes újra verifikálni Display-off után)

---

## 📅 Két hét múlva (≈ 2026-06-02 körül) — Review

**Mit nézz át:**
1. Konverziós szám 14 nap alatt
2. Ha 5+ valid lead lett → **váltás `Maximize Clicks` → `Maximize Conversions`** (Smart Bidding újraindul, ~7 nap tanulási fázissal)
3. Ha még mindig 0 — landing page / tracking debug

**Várt 14 napos célok (Display-off után):**
- Megjelenés: 3.000-5.000 (most már csak valódi Search)
- CTR: 4-6%
- Avg CPC: 200-300 Ft
- Konverzió: 4-8
- Cost/lead: 6.000-10.000 Ft

---

## 📋 Backup info — amit már megcsináltunk MCP-vel (2026-05-19)

Hogy bárki más is láthassa a kontextust:

- ✅ 24 új negative keyword campaign szinten (preschool, lindaskóla, waldorf, montessori, református, görögkatolikus, magániskola, tervezet, tanmenet, óravázlat, vázlat, tananyag, óvodapedagógus, pedagógusoknak, mintafeladat, gyakorlófeladat, kvíz, érettségi, kérdőív, riport, interjú, nyíregyháza, szolnok, szakképzés)
- ✅ 8 új pozitív keyword a `Iskola-előkészítő — core` ad groupban (iskolaelőkészítő EXACT + 7 PHRASE long-tail)
- ✅ Új RSA hirdetés (ID `809314679437`) — 15 headline, 4 description, pin-mentes
- ✅ Geo PRESENCE módba állítva
- ✅ Magyarország (geo 20424) eltávolítva — csak Debrecen marad

---

# 🆕 Tracking-fejlesztések manuális UI-task-jai (2026-05-19)

> **Kontextus:** A Surya-projekt tracking-tanulságai alapján **online tracking-réteget kibővítettük**. A kódbeli rész élesben (lásd commit-ok 2026-05-19), de **5 UI/szerver-feladat nélkül** a Smart Bidding nem fogja kihasználni az új signal-eket. Sorrendben a legnagyobb hatású elöl.

---

## 🔴 T1. GA4 Admin → 2 új Custom Dimension regisztráció (5 perc)

**Probléma:** A kódbeli `lead_quality_tier` és `engagement_signals` event-paraméterek megérkeznek GA4-be, **DE riportokban nem szűrhetők** amíg nincsenek custom dimension-ként regisztrálva. Az `Lead Type` (régi dimension #8) lecserélődik.

**Hely:** [analytics.google.com](https://analytics.google.com) → **csak a bagolykaland.hu fiókkal** belépve (`G-86N523JP3E` mögötti property tulajdonosa) → bal alul fogaskerék (**Admin**) → property oszlop alatt **Custom definitions** → **Custom dimensions** tab → **Create custom dimension** gomb

**Mit hozz létre (mindkettőnél Scope = `Event`):**

### Dimension #1 — Lead Quality Tier

| Mező | Érték |
|---|---|
| **Dimension name** | `Lead Quality Tier` |
| **Scope** | `Event` |
| **Description** | `Lead minőség-besorolás: magnet / contact / career / program_inquiry / summer_camp / program_szorongas / school_prep_intensive / school_prep_academic` |
| **Event parameter** | `lead_quality_tier` |

→ **Save**

### Dimension #2 — Engagement Signals

| Mező | Érték |
|---|---|
| **Dimension name** | `Engagement Signals` |
| **Scope** | `Event` |
| **Description** | `qualified_engagement composite event komponensei (pl. "view+scroll50+dwell30")` |
| **Event parameter** | `engagement_signals` |

→ **Save**

### Régi dimension cseréje (ha van)

Ha a `Lead Type` (`lead_type` event parameter) korábban regisztrálva volt, **archive-old**: a sor mellett három pont → **Archive**. (Az új kódbázisban már nem küldjük a `lead_type`-ot — helyette `lead_quality_tier` megy.)

**Várt hatás:** 24-48 órán belül a GA4 Explore/Reports felületen lehet szűrni a `generate_lead` event-eket `lead_quality_tier == 'summer_camp'`-re stb. → tisztán látszik melyik program-LP termel high-value leadet.

**Verifikáció:** GA4 → **Realtime** → Events → kattints egy `generate_lead`-re a megelőző 30 percen belül (ha volt). A `lead_quality_tier` paraméternek látszania kell a párbeszéd-panelben. (Ha még nincs forgalom: `_dev/scripts/verify-conversion-fire.js` futtatása.)

---

## 🔴 T2. GA4 Admin → `generate_lead_paid` szűrt Key Event (8 perc)

**Probléma:** A Google Ads `generate_lead` import-action **most az összes leadet konverziónak látja**, beleértve az 5 ingyenes segédanyag popup-leadeket (`lead_quality_tier = magnet`). Ez **Smart Bidding signal-hígulás** — a lead-magnet keresőszavak (pl. „ingyenes szülői segédanyag") túl-bidet kapnak az igazi program-érdeklődéssel szemben.

**Megoldás:** Hozz létre egy szűrt event-másolatot (GA4-ben „Modify event"), ami csak akkor tüzel, ha `lead_quality_tier != 'magnet'`, és **azt** import-old Google Ads-be Key Event-ként.

### 2.1 Új event létrehozása GA4-ben

**Hely:** GA4 Admin → property oszlop → **Events** → **Create event** (jobb felül)

| Mező | Érték |
|---|---|
| **Custom event name** | `generate_lead_paid` |
| **Matching conditions** | parameter `event_name` equals `generate_lead` |
| | **+ Add condition** parameter `lead_quality_tier` does not equal `magnet` |
| **Parameter configuration** | „Copy parameters from the source event" ✅ |

→ **Create**

### 2.2 Mark as Key Event

24 óra után (az első `generate_lead_paid` után) jelenjen meg az Events listán. Akkor:

**Hely:** GA4 Admin → **Events** → keresd meg a `generate_lead_paid` sort → jobb oldalon **Mark as key event** toggle → **ON**

### 2.3 Régi `generate_lead` Key Event LE

**Hely:** GA4 Admin → **Events** → `generate_lead` sor → **Mark as key event** toggle → **OFF**

**FIGYELEM:** Ezt csak akkor csináld, ha a `generate_lead_paid` már látszik a listán és van rajta legalább 1 hit. Egyébként 1-2 napra leáll a Google Ads conversion-import.

### 2.4 Google Ads oldalon

A Google Ads-ben automatikusan a `generate_lead_paid` jelenik meg új importálható conversion-action-ként **24-48 órán belül** (GA4 → Ads link).

**Hely:** [ads.google.com](https://ads.google.com) → fiók `8433857843` → kulcsikon (Tools) → **Conversions** → **Summary**

1. Régi `bagolykaland.hu (web) generate_lead` (ID `7607011896`) → Edit → **Remove** (vagy `Secondary`-ra állítás — lásd T3)
2. Új `bagolykaland.hu (web) generate_lead_paid` → kattints rá → **Primary action** ✅
3. **Default value** mezőbe: hagyd üresen — a `value` paraméter már event-bound (tier-default a kódból).

**Várt hatás:** Smart Bidding csak a fizetős-szándékú leadeket súlyozza, a lead-magnet zaj kiszűrve. A 4. heti CR-növekedést várd.

---

## 🟠 T3. GA4 Admin → Enhanced Measurement Form interactions verify (2 perc)

**Probléma elhárítva:** A kódbeli `form_start` collision javítva (analytics.src.js + karrier-form.src.js már nem küldenek csupasz `form_start`-ot, csak `bk_form_start`-ot). **DE a GA4 Enhanced Measurement Form interactions toggle státuszát érdemes megnézni.**

**Hely:** GA4 Admin → property oszlop → **Data Streams** → **Web** → kattints a `bagolykaland.hu` stream-re → **Enhanced measurement** szekció → fogaskerék

**Mit nézz:**

| Toggle | Ajánlott állapot | Miért |
|---|---|---|
| **Page views** | ON | Default, alap signal |
| **Scrolls** | OFF (vagy ON) | A saját `scroll_depth_50/75` event-ünk pontosabb. Ha ON marad, csak duplikáció Scroll 90%-on, de nem zavar. |
| **Outbound clicks** | ON | OK |
| **Site search** | OFF | Nincs site search funkció |
| **Video engagement** | OFF | Nincs natív YouTube embed |
| **File downloads** | ON | Ha valaha lesz letölthető szülői segédanyag PDF |
| **Form interactions** | **ON** ✅ | Mostantól nem ütközik a saját kódunkkal (kódban `bk_form_start` használt) — Smart Bidding signal-ként ez auto-szállít `form_start` + `form_submit` event-eket |

→ **Save** (jobb felül)

**Várt hatás:** A GA4 auto-tracked `form_start` + `form_submit` event-ek a Google Ads-importba is bemennek mint mikro-konverzió-jelek (alacsony súllyal), gyorsítják a Smart Bidding tanulását.

---

## 🟠 T4. Hostinger szerver → CAPI Health endpoint aktiválás (5 perc, SSH-n)

**Probléma:** Az `api/meta-capi.php` és `api/meta-capi-relay.php` ma **silent fail-eket csinál** ha a Meta access token lejár (60-90 napos token!). Nem tudunk róla, csak az ad-set performance gyengül. Új `api/meta-capi-health.php` endpoint kész — csak aktiválni kell.

**Hely:** SSH-n be Hostinger-re (`ssh bagoly` — pubkey vagy `! ssh bagoly` interaktív)

### 4.1 Health key generálás + bevitel

```bash
# 1. Generálj egy random hex kulcsot
HEALTH_KEY=$(openssl rand -hex 16)
echo "Új health key: $HEALTH_KEY"
# Másold le ezt a kulcsot — kell a curl-höz!

# 2. Add hozzá a capi-config.php-hoz
ssh bagoly "echo '\$metaHealthKey = \"$HEALTH_KEY\";' >> ~/domains/bagolykaland.hu/public_html/api/capi-config.php"

# 3. Verifikáció
ssh bagoly "tail -3 ~/domains/bagolykaland.hu/public_html/api/capi-config.php"
```

> **Megjegyzés:** Ha nem hash-rotálva van a config-fájl, érdemesebb hPanel **File Manager**-ben kézzel beleírni, hogy a PHP-syntax tisztán megmaradjon.

### 4.2 Smoke test

```bash
curl -s "https://bagolykaland.hu/api/meta-capi-health.php?key=$HEALTH_KEY&hours=24" | head -50
```

**Várt válasz** (egyszerűsítve):
```json
{
  "window_hours": 24,
  "checked_at": "2026-05-19T...",
  "capi": { "total": 142, "ok_2xx": 140, "fail": 2, "ok_rate": 0.986, ... },
  "capi_relay": { ... },
  "health": "ok"
}
```

`health` mezők:
- `"ok"` — minden OK
- `"degraded"` — 50-95% ok-rate, vagy 6-24h silent → érdemes ránézni
- `"broken"` — <50% ok-rate, vagy 24h+ silent → **TOKEN LEJÁRT vagy graph API down, sürgős fix kell**
- `"silent"` — 0 event a window-ban (alacsony forgalmi időszakon ez normális)

### 4.3 Bookmark / heti rutin

A heti audit-ba (`feedback_google_ads_optimization_playbook.md` mintájára) tegyél be:

```bash
# Hétfő reggeli health-check
curl -s "https://bagolykaland.hu/api/meta-capi-health.php?key=YOUR_KEY&hours=168" | python -m json.tool | grep -E '"health|ok_rate|last_event'
```

Ha `health != "ok"` → SSH-zz be, futtasd: `ssh bagoly "tail -50 ~/domains/bagolykaland.hu/public_html/api/logs/capi.log | grep -v http=200"` → ha 401 vagy 400 status → token-lejárat, **rotate Meta access tokent** Events Manager-ben.

---

## 🟡 T5. Google Ads → Conversion action review (a T2 után, kb. 2 nap múlva)

**Mikor:** Akkor, amikor a T2-ben létrehozott `generate_lead_paid` már látszik Google Ads import-listán (~24-48 óra a T2 után).

Lásd a régebbi **🔴 1. Conversion actions cleanup — Primary/Secondary szétválasztás** szekciót feljebb — most a frissített logika:

| Conversion action | Új státusz | Miért |
|---|---|---|
| `bagolykaland.hu (web) generate_lead_paid` *(új)* | ✅ **Primary** | Ez az egy a fizetős-szándékú lead-signal |
| `bagolykaland.hu (web) generate_lead` *(régi)* | ❌ **Remove** *(vagy Secondary)* | Lecserélődik a `generate_lead_paid`-re |
| Többi 6 darab (BagolyKaland Lead webhely gtag, Leadűrlap Küldés, Javasolt cél, Clicks to call, Local actions × 3) | Secondary | Diagnosztikai jelek, ne tanuljon rájuk a Smart Bidding |

---

## ~~🟡 T6. (Opcionális) MailerLite popup-integráció befejezése~~ ✅ NEM SZÜKSÉGES

**Update 2026-05-19:** A `window.BK_ML.API_KEY` MÁR be van állítva a `_includes/partials/scripts.njk:2`-ben (inline JS), és a MailerLite API működik. Az eredeti T6 hipotézis hibás volt.

---

## 🔴 T7. MailerLite "Szekv. után" automation tartalmi verify (10 perc)

**Kontextus:** 2026-05-19 kódváltozás — a popup + inline lead-catcher feliratkozói az új master post-funnel group-ra mennek (`183475595689068359` = "Szekv. után - Összes feliratkozó kiv. vevok"), nem a régi Hiszti Welcome szekvenciára. **Triggerelt automation:** `183463194457540535` = "Szekv. után - Összes feliratkozónak".

**Probléma, amit ellenőrizni kell:** A landoló UI-n explicit ígéret van a feliratkozónak:

> *„Iratkozz fel és küldünk **5 gyakorlati anyagot**, amit még ma kipróbálhatsz a gyerekeddel"*
>
> + felsorolva: 🔥 Top 5 tűzoltási technika, 🎬 Hisztikezelés (3 videó), 😰 Szorongásoldás, 📝 Figyelemfejlesztés (Jolly Joker), 🎓 Iskolaérettség

Success-message: *„Hamarosan megérkeznek az e-mailben a segédanyagok!"*

**Kérdés:** A `183463194457540535` automation tényleg kiküldi-e az 5 anyagot, vagy csak a master newsletter szekvenciát?

### Lépések:

**1.** Lépj be: [app.mailerlite.com](https://app.mailerlite.com) → bal menü **Automation**

**2.** Keresd meg: **„Szekv. után - Összes feliratkozónak"** (ID `183463194457540535`) → kattints rá

**3.** Nézd meg a flow-t — első 5-7 email-step-et:

| Lépés | Mit várj | Mit ellenőrizz |
|---|---|---|
| 1. email (azonnal) | „Üdvözöllek + 1. anyag" | Tartalmazza-e a **tűzoltási technikákat** vagy linket hozzá? |
| 2. email (1-2 nap múlva) | 2. anyag | **Hisztikezelés** 3 videóra mutató link? |
| 3. email (3-4 nap) | 3. anyag | **Szorongásoldás** példa-videó? |
| 4. email (5-7 nap) | 4. anyag | **Figyelemfejlesztés** Jolly Joker letöltési link? |
| 5. email (7-10 nap) | 5. anyag | **Iskolaérettség** elvárás-leírás? |

**4.** Ha NEM teljesíti az 5 anyagot:

**Opció A** — építsd be: az automation **elejére adj hozzá 5 új email-step-et**, amik az 5 ígért anyagot küldik ki. Sorrend: az ígéret-volumenhez igazítva.

**Opció B** — írasd át a UI-promise-t: `_includes/partials/lead-catcher.njk` és `js/popup.js` szövegéből vedd ki az „5 anyag" konkrét felsorolást, és csak általánosan ígérj „hasznos parenting-tartalmat".

> **Javaslat:** Opció A jobb (a feliratkozó már látta a konkrét ígéreteket — a value-stack tartja a CR-t fel). De ha most nincs idő, Opció B konzervatívabb és pillanatok alatt megcsinálható.

### Verify:

Teszteld magad: `incognito Chrome` → bagolykaland.hu → kitölts a popup-ot egy `+karesz_test_2026_05_19@<gmail>.com` típusú email-aliasszal → várj 1 órát → ellenőrizd, hogy érkezett-e email és milyen tartalmú.

---

## 🟡 T8. (Opcionális) Meglévő Bagolykaland-tagged subscriber-ek áthelyezése

**Kontextus:** A 2026-05-19-i kódváltozás **csak a jövőbeli feliratkozókra hat**. A régi Hiszti group-ban (`156829265225057690`) jelenleg ott vannak a Bagolykaland-tagged korábbi feliratkozók is (`signup_source = "bagolykaland"` custom field szűrhetővé teszi őket).

**Kérdés:** Áthelyezzük őket is az új master group-ra?

**Pro:** Konzisztencia — minden Bagolykaland-feliratkozó ugyanazt a master szekvenciát kapja a jövőben.
**Con:** Ha a régi Hiszti Welcome szekvenciát éppen járják (1-2 hetes onboarding), elveszítik a maradék emaileket.

**Ha igen, mit csinálj:**

[app.mailerlite.com](https://app.mailerlite.com) → **Subscribers** → bal panel **Groups** → "Hirlevel feliratkozok - Hiszti" csoport → filter / advanced filter:

- `signup_source` is `bagolykaland`

Eredmény: lista a Bagolykaland-feliratkozókról. **Select all** → felül **Actions** → **Add to group** → "Szekv. után - Összes feliratkozó kiv. vevok" (NEM Move — Add, hogy a régi group-ban is maradjanak history-szempontból).

Optionálisan: ugyanezeknél **Remove from group** → "Hirlevel feliratkozok - Hiszti" (csak ha el akarod őket teljesen vágni a Hiszti listáról).

> **Javaslat:** Csak akkor csináld, ha T7-ben Opció A megvan (5 anyag az új flow-ban). Egyébként a meglévő feliratkozók kétszer kapnák meg az 5 anyagot, vagy ami rosszabb: az új master szekvenciába kerülve hirtelen abbahagyják a Hiszti welcome-emaileket — confusing élmény.

---

## 📅 Sorrend és időzítés

| Mikor | Mit | Becsült idő |
|---|---|---|
| **MA** | T1 (GA4 custom dimensions × 2) | 5 perc |
| **MA** | T3 (Enhanced Measurement verify) | 2 perc |
| **MA** | T4 (CAPI health endpoint SSH-aktiválás) | 5 perc |
| **MA** | T7 (MailerLite "Szekv. után" automation tartalmi verify) | 10 perc |
| **HOLNAP** | T2 (`generate_lead_paid` szűrt event létrehozás) | 8 perc |
| **+24h** | T2 folytatás (Key Event toggle + Google Ads import átváltás) | 5 perc |
| **+48h** | T5 (Google Ads conversion-action cleanup) | 10 perc |
| **T7 után** | T8 (Meglévő bagolykaland-feliratkozók áthelyezése, opcionális) | 5 perc |

**Smart Bidding tanulási fázis:** a T2 után 7-14 nap, mire az új `generate_lead_paid` signal teljesen átveszi.

---

## 🔍 Verify-checklist (mikor mondjuk hogy "kész")

- [ ] GA4 → Realtime → `generate_lead` event-en látszik a `lead_quality_tier` paraméter érték
- [ ] GA4 → Reports → Engagement → Events → `generate_lead_paid` event sor megjelenik (24h után)
- [ ] GA4 → Admin → Events → `generate_lead_paid` Key Event ON, `generate_lead` Key Event OFF
- [ ] Google Ads → Conversions → `bagolykaland.hu (web) generate_lead_paid` mint Primary action
- [ ] `curl 'https://bagolykaland.hu/api/meta-capi-health.php?key=YOUR&hours=24'` → `"health": "ok"`
- [ ] Popup form submit → MailerLite UI-n megjelenik a friss subscriber a **"Szekv. után - Összes feliratkozó kiv. vevok"** group-ban (NEM Hiszti)
- [ ] A friss subscriber `signup_source = bagolykaland` custom field-del rendelkezik
- [ ] T7: "Szekv. után - Összes feliratkozónak" automation tartalmi ellenőrzés — kiküldi-e az 5 ígért anyagot

---

## 📚 Hivatkozások (mit csináltunk a kódban, 2026-05-19 commit)

- `js/analytics.src.js` — `form_start` event eltávolítva (Enhanced Measurement collision elhárítva); `directions_click` regex-listener hozzáadva (4 Maps URL-pattern); `qualified_engagement` composite event hozzáadva (view + scroll_50 + 30s dwell); `BKAnalytics.fireLead` átírva `lead_quality_tier` tier-rendszerre, `LEAD_QUALITY_VALUES` map default-értékekkel.
- `js/karrier-form.src.js` — `form_start` → `bk_form_start`-ra átnevezve; `BKAnalytics.fireLead` használat.
- `js/main.src.js` — `bk_lead_catcher_submit` / `bk_program_signup` / `bk_contact_form_success` mind `lead_quality_tier` tier-rel hívja a fireLead-et.
- `js/popup.js` — **bug fix**: a popup-submit eddig csak Meta Lead-et küldött, GA4-be nem ért el. Most `BKAnalytics.fireLead({lead_quality_tier: 'magnet'})` is fut.
- `api/meta-capi-health.php` — új endpoint, capi.log + capi-relay.log status-eloszlás-riport.
- `api/capi-config.example.php` — `$metaHealthKey` dokumentálva.
- `_docs/analytics-tracking.md` — új event-ek (directions_click, qualified_engagement) + lead_quality_tier dimension dokumentálva, 19 → 20 custom dimension.
- `_includes/partials/lead-catcher.njk` + `js/popup.js` — MailerLite group ID lecserélve `156829265225057690` (Hiszti) → `183475595689068359` (Szekv. után - Összes feliratkozó kiv. vevok). Új feliratkozók a master post-funnel automation-be kerülnek.
