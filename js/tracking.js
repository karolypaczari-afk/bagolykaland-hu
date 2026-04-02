/**
 * BAGOLYKALAND.HU — Tracking & Analytics
 *
 * Paste your tracking codes here.
 * This file is included globally via index.html (and every other page).
 *
 * ============================================================
 * HOW TO USE:
 * 1. Replace each TODO placeholder with the real ID / snippet.
 * 2. Uncomment the relevant blocks.
 * ============================================================
 */

/* ============================================================
   GOOGLE TAG MANAGER
   Replace GTM-XXXXXXX with your container ID.
   (If you use GTM, you can manage GA4 + FB Pixel from inside it
    and skip the individual snippets below.)

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');  // TODO: replace GTM-XXXXXXX

// Also add this immediately after <body> in each HTML file:
// <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
// height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
============================================================ */


/* ============================================================
   GOOGLE ANALYTICS 4 (GA4)
   Replace G-XXXXXXXXXX with your Measurement ID.
   Only needed if NOT using GTM.

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');  // TODO: replace G-XXXXXXXXXX

// Also add to <head>:
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
============================================================ */


/* ============================================================
   META (FACEBOOK) PIXEL
   Replace XXXXXXXXXXXXXXX with your Pixel ID.
   Only needed if NOT managing via GTM.

!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'XXXXXXXXXXXXXXX');  // TODO: replace XXXXXXXXXXXXXXX
fbq('track', 'PageView');
============================================================ */
