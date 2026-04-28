# Meta Ads — Conversion Tracking

Reference doc for diagnosing Meta Ads campaign conversion attribution on bagolykaland.hu. Read this **before** assuming tracking is broken — the most common mistake is looking at the wrong reporting bucket.

---

## Ad set conversion pattern

Both active campaigns (camp + szorongásoldó) use the same `promoted_object` shape:

```jsonc
{
  "pixel_id": "9087042854758379",
  "custom_event_type": "LEAD",
  "pixel_rule": "{\"and\":[{\"pe.pixel_event_name\":{\"eq\":\"<EventName>\"}}, ...]}"
}
```

| Campaign | Event name | Extra rule |
|---|---|---|
| Nyári Tábor (camp) | `CampApplication` | none |
| Szorongásoldó | `ProgramSignup` | `url i_contains "szorongasoldo-program"` |

Meta matches the custom event via `pixel_rule` and **reports it as a standard `Lead` action** because `custom_event_type: LEAD` is the bucket. That is why campaign insights show `actions.lead = N` rather than a custom action type. This is by design — there is no "CampApplication" action_type in `actions[]`.

If you change the JS event name (`fbq('trackCustom', '<NewName>', ...)`), you MUST also change:
1. `api/contact.php` → `bk_meta_capi_send('<NewName>', ...)`
2. The ad set's `promoted_object.pixel_rule` (via Meta UI or API)

Pixel event names are **case-sensitive** and silently break optimization if mismatched.

---

## Custom Conversions vs ad set `pixel_rule` — different things

This is the trap most "0 conversions" panics fall into.

| | Ad set's `pixel_rule` | Custom Conversion (Events Manager) |
|---|---|---|
| Where defined | Inside `promoted_object` of the ad set | Events Manager → Egyéni konverziók |
| What it drives | Campaign optimization + `actions.lead` count | An additional reporting bucket; **not** wired to ad sets unless explicitly chosen as the optimization event |
| Backfill behavior | Counts all events from the ad set's creation onward | **Does not backfill** — only counts events fired after its own creation timestamp |
| Editable post-creation | Yes, by editing the ad set | **No** — Meta locks the rule + category (only name, description, value editable). Recreate to change rule. |
| Effect of deletion | Breaks the ad set | Safe if no ad set/audience references it |

**Symptom:** Custom Conversion shows `Inaktív / Soha nem érkezett esemény` but `capi.log` shows successful events with `http=200`.
**Cause:** Almost always the Custom Conversion was created *after* the events arrived. Iterating "Test 1 / Test 2 / Test 3" guarantees this — each recreate resets the counter.
**Fix:** Stop iterating. Either delete the orphan and rely on the ad set's `pixel_rule` + standard `Lead` reporting, or wait for new submissions to accumulate.

---

## `_fbc` synthesis from `fbclid` URL param

`api/meta-capi.php` (since commit `39aa612`) synthesizes `_fbc` as `fb.1.<event_time>.<fbclid>` when the cookie is missing but the landing URL has `?fbclid=`. This is Meta's documented fallback for blocked-pixel / ITP / first-party-cookie-write failures.

**Why it matters:** historically ~40% of camp submissions arrived without `_fbc` cookie. Without this fallback, those submissions reach Meta but can't be attributed to a specific ad click → no campaign credit. With the fallback, attribution is recovered for any submission whose landing URL still carries `fbclid` even if the cookie was blocked.

Do not remove this fallback. It is in `bk_meta_capi_send()` immediately before the `event` array is assembled.

---

## Diagnostic flow — "0 conversions on the campaign"

Run these in order. Stop at the first one that resolves.

### 1. Was the event accepted by Meta?

```bash
ssh bagoly "tail -50 ~/domains/bagolykaland.hu/public_html/api/logs/capi.log"
```

Look for lines like `<ts> | CampApplication | id=<eid> | http=200`. If `http != 200`, the issue is server-side (token expired, payload malformed) — fix that first.

### 2. Did the campaign get credit?

Pull live insights via Meta MCP:

```
mcp__claude_ai_Pipeboard_META_Ads_Integration__get_insights
  object_id: <campaign_id>
  level: campaign
  time_range: last_30d
```

Check `actions[]` for `action_type: "lead"` value. If it matches the count in `capi.log`, **the campaign IS converting** — the user is looking at the wrong UI metric (probably a Custom Conversion, see step 4).

### 3. Is the ad set's `pixel_rule` correctly defined?

```
mcp__claude_ai_Pipeboard_META_Ads_Integration__get_adset_details
  adset_id: <ad_set_id>
```

Verify `promoted_object.pixel_rule` references the exact event name we send (`CampApplication` / `ProgramSignup`, case-sensitive) and that `custom_event_type: LEAD` is set.

### 4. Where is the user seeing "0 conversions"?

Two views the user can confuse:
- **Hirdetéskezelő → Campaigns table → "Eredmények" column** — driven by ad set's pixel_rule. Should show the same number as `actions.lead`. If it shows 0 here too, the column is set to display a Custom Conversion (Test 3 etc.) instead of standard Lead. Switch column preset to "Teljesítmény" or customize to show "Konverziók (Lead)".
- **Events Manager → Egyéni konverziók → <name>** — Custom Conversion bucket. Will show 0 if created after events arrived (see "Custom Conversions vs ad set `pixel_rule`" above).

### 5. Is the click attributable at all?

If `capi.log` shows events but the campaign's `actions.lead` is also 0, the leads are coming from non-ad traffic (organic, direct, or beyond the 7-day click window). The `_fbc` cookie / `fbclid` URL param presence in `submissions.log` confirms whether ad-click attribution is even possible. No `fbc` ever → no campaign credit, no matter what.

---

## Meta MCP setup (per machine)

The `meta-ads-mcp` package + Pipeboard Meta integration are user-scoped credentials, not project-scoped. **They cannot live in this repo** — committing a Meta access token to git would leak it.

On a new machine, set up once via user-level config:

```jsonc
// ~/.claude.json (user-scoped, never commit)
{
  "mcpServers": {
    "meta-ads": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "meta-ads-mcp"],
      "env": { "META_ACCESS_TOKEN": "<long-lived token from Business Manager>" }
    }
  }
}
```

Verify by spawning a fresh Claude Code session — `mcp__meta-ads__*` tools should be visible. If they are not, either the token is expired (Meta long-lived tokens last ~60 days) or the npx process didn't finish in time on session boot. Reload Claude Code in that case.

The Pipeboard variant (`mcp__claude_ai_Pipeboard_META_Ads_Integration__*`) is configured separately via Claude.ai's web integration UI, not via JSON config — it travels with the user account, not the machine.

---

## Account / pixel IDs (constants)

| | Value |
|---|---|
| Ad account | `act_1172672534867644` |
| Pixel | `9087042854758379` |
| Camp campaign | `120226392077160275` ("Nyári Tábor 2026 – LP Form Fill \| HU \| Leads") |
| Camp ad set | `120244060140770275` |
| Szorongásoldó campaign | `120244336198280275` ("BL_Lead_SzorongasoldoProgram_Debrecen_2026-04") |
| Szorongásoldó ad set | `120244336367520275` |

Live campaigns = real spend. **Never** create / resume / pause / delete via MCP without explicit user confirmation in the same conversation.
