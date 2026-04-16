-- BagolykaLand – Initial Supabase schema
-- Run this once in: https://supabase.com/dashboard/project/esiittanpkwxvmghqbsy/sql

-- ── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. SIGNUPS: program / service signup forms ──────────────────────────────
--    Used by: pages/nyari-tabor, pages/foglalkozasaink/*, pages/vizsgalatok/*,
--             pages/ernyo-alatt-program, pages/kezen-fogva-*, pages/foglalkozasaink/szorongasoldo-*
CREATE TABLE IF NOT EXISTS signups (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  parent_name  TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT,
  child_name   TEXT,
  child_age    TEXT,
  turnus       TEXT,                    -- nyari-tabor turnus selection
  program      TEXT        NOT NULL,    -- from data-program-form attribute
  source_page  TEXT,                    -- window.location.pathname
  status       TEXT        DEFAULT 'new'
               CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled'))
);

-- ── 2. CONTACTS: general contact form (/kapcsolat/) ────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  message    TEXT        NOT NULL,
  status     TEXT        DEFAULT 'new'
             CHECK (status IN ('new', 'replied', 'closed'))
);

-- ── 3. LEADS: email capture (lead catchers + exit popup) ────────────────────
--    Used by: inline lead-catcher forms on blog posts + popup.js
CREATE TABLE IF NOT EXISTS leads (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name       TEXT,
  email      TEXT        NOT NULL,
  source_page TEXT,
  group_name  TEXT,                     -- MailerLite group / lead magnet tag
  form_type   TEXT
              CHECK (form_type IN ('lead_catcher', 'popup', 'newsletter'))
);

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE signups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads    ENABLE ROW LEVEL SECURITY;

-- Drop first (idempotent re-run)
DROP POLICY IF EXISTS anon_insert_signups  ON signups;
DROP POLICY IF EXISTS anon_insert_contacts ON contacts;
DROP POLICY IF EXISTS anon_insert_leads    ON leads;

-- Anonymous users: INSERT only, no SELECT / UPDATE / DELETE
CREATE POLICY anon_insert_signups  ON signups  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_contacts ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_leads    ON leads    FOR INSERT TO anon WITH CHECK (true);

-- Verify
SELECT 'signups'  AS t, COUNT(*) FROM signups
UNION ALL
SELECT 'contacts' AS t, COUNT(*) FROM contacts
UNION ALL
SELECT 'leads'    AS t, COUNT(*) FROM leads;
