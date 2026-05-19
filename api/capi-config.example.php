<?php
// Copy this file to capi-config.php and fill in your Meta Conversions API credentials.
// capi-config.php is gitignored — never commit it.
//
// Generate the access token in:
//   Meta Events Manager → your Pixel → Settings → Conversions API → "Generate access token".
// Keep this token secret — anyone with it can push events to your pixel.

$metaPixelId       = '9087042854758379';
$metaAccessToken   = '';        // paste the long EAA... token here
$metaApiVersion    = 'v21.0';   // Meta Graph API version
$metaTestEventCode = '';        // optional: set to a TEST12345 code from Events Manager → Test Events during QA; leave empty in production

// Health endpoint védelmi kulcs — meta-capi-health.php csak akkor válaszol,
// ha a ?key=… paraméter ezzel pontosan egyezik. Bármilyen random string
// (pl. `openssl rand -hex 16`). Ha üresen marad → az endpoint 404-et ad
// (auto-disable). Példa használat:
//   curl 'https://bagolykaland.hu/api/meta-capi-health.php?key=YOUR_KEY&hours=24'
$metaHealthKey     = '';
