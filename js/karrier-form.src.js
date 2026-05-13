/**
 * BAGOLYKALAND.HU — Karrier (állás) form-submit
 * Page-scoped script — csak a /karrier/ oldalra töltődik be.
 * Multipart/form-data POST (a CV-feltöltés miatt), nem JSON — a meglévő
 * main.js contact-form pattern erre nem volt alkalmas, ezért külön modul.
 *
 * Tracking események:
 *   - bk_career_form_start    (első mezőfókusz)
 *   - bk_career_form_submit   (submit click)
 *   - bk_career_form_success  (200 OK)
 *   - bk_career_form_error    (hiba)
 *   - GA4 `generate_lead` (value=8000 HUF, content_category=career_application)
 *   - Meta `fbq('track', 'Lead', ...)` — közös event_id-vel a CAPI-val
 */
(function () {
    'use strict';

    var form = document.getElementById('karrier-form-el');
    if (!form) return;

    var MAX_FILE_BYTES = 20 * 1024 * 1024;
    var ALLOWED_EXTS = ['pdf', 'doc', 'docx'];

    // ── Helpers ──────────────────────────────────────────────────────────
    function uuid() {
        // Egyszerű v4 UUID — Meta CAPI / dataLayer dedup-hoz.
        var rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
            ? crypto.getRandomValues(new Uint8Array(16))
            : Array.from({ length: 16 }, function () { return Math.floor(Math.random() * 256); });
        rnd[6] = (rnd[6] & 0x0f) | 0x40;
        rnd[8] = (rnd[8] & 0x3f) | 0x80;
        var hex = Array.prototype.map.call(rnd, function (b) {
            return ('0' + b.toString(16)).slice(-2);
        }).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    function track(eventName, params) {
        // Triple-channel: dataLayer (GTM/GA4 server-side), gtag GA4 közvetlen, Meta Pixel.
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
        } catch (e) { /* noop */ }
    }

    function gaEvent(name, params) {
        if (typeof window.gtag === 'function') {
            try { window.gtag('event', name, params || {}); } catch (e) { /* noop */ }
        }
    }

    function metaEvent(name, params, eventId) {
        if (typeof window.fbq === 'function') {
            try {
                window.fbq('track', name, params || {}, eventId ? { eventID: eventId } : undefined);
            } catch (e) { /* noop */ }
        }
    }

    function showError(message) {
        var errEl = document.getElementById('kar-form-error');
        if (!errEl) return;
        errEl.textContent = message;
        errEl.style.display = 'block';
    }

    function hideError() {
        var errEl = document.getElementById('kar-form-error');
        if (!errEl) return;
        errEl.style.display = 'none';
        errEl.textContent = '';
    }

    // ── Form-start tracking (első mezőfókusz) ─────────────────────────────
    var startTracked = false;
    form.addEventListener('focusin', function () {
        if (startTracked) return;
        startTracked = true;
        track('bk_career_form_start', { form_name: 'career' });
        gaEvent('form_start', { form_name: 'career', content_category: 'career_application' });
    }, { once: false });

    // ── File-input UX (kiválasztás visszajelzése + kliens validáció) ─────
    var fileInput = document.getElementById('kar-cv');
    var fileLabel = document.getElementById('kar-file-label');
    var fileText = document.getElementById('kar-file-text');

    if (fileInput && fileLabel && fileText) {
        fileInput.addEventListener('change', function () {
            if (!fileInput.files || fileInput.files.length === 0) {
                fileLabel.classList.remove('kar-file--has-file');
                fileText.innerHTML = 'Húzd ide a fájlt, vagy <strong>kattints a kiválasztáshoz</strong>';
                return;
            }
            var file = fileInput.files[0];
            var ext = (file.name.split('.').pop() || '').toLowerCase();

            if (file.size > MAX_FILE_BYTES) {
                fileInput.value = '';
                fileLabel.classList.remove('kar-file--has-file');
                showError('A fájl mérete legfeljebb 20 MB lehet — most ' + (file.size / 1024 / 1024).toFixed(1) + ' MB. Tömörítsd PDF-be, vagy küldd e-mailben.');
                return;
            }
            if (ALLOWED_EXTS.indexOf(ext) === -1) {
                fileInput.value = '';
                fileLabel.classList.remove('kar-file--has-file');
                showError('Csak PDF, DOC vagy DOCX fájlt fogadunk. A kiválasztott fájl: .' + ext);
                return;
            }

            hideError();
            fileLabel.classList.add('kar-file--has-file');
            fileText.innerHTML = '<strong>' + file.name + '</strong> &middot; ' + (file.size / 1024).toFixed(0) + ' kB &middot; <span style="color:var(--clr-text-muted);">kattints a cseréhez</span>';
        });
    }

    // ── Submit handler ───────────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideError();

        var name      = form.querySelector('#kar-name').value.trim();
        var email     = form.querySelector('#kar-email').value.trim();
        var phone     = form.querySelector('#kar-phone').value.trim();
        var education = form.querySelector('#kar-education').value.trim();
        var experience = form.querySelector('#kar-experience').value.trim();
        var bio       = form.querySelector('#kar-bio').value.trim();
        var consent   = form.querySelector('#kar-consent').checked;
        var honeypot  = (form.querySelector('input[name="website"]') || {}).value || '';

        // Honeypot — siket pozitív
        if (honeypot) return;

        // Kliens validáció
        if (!name || !email || !phone || !education || !experience) {
            showError('Kérjük, töltsd ki a kötelező mezőket.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Kérjük, adj meg érvényes e-mail címet.');
            return;
        }
        if (experience.length < 20) {
            showError('Kérjük, írj egy kicsit többet a tapasztalatodról (legalább 20 karakter).');
            return;
        }
        if (bio && bio.length < 50) {
            showError('A bemutatkozó szöveg legalább 50 karakter legyen — vagy hagyd üresen.');
            return;
        }
        if (!consent) {
            showError('Kérjük, fogadd el az adatkezelési tájékoztatót a folytatáshoz.');
            return;
        }

        // Fájl kliens-ellenőrzés (akkor is, ha a change-event-ben már átment)
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            var f = fileInput.files[0];
            if (f.size > MAX_FILE_BYTES) {
                showError('A fájl mérete legfeljebb 20 MB lehet. Tömörítsd, vagy küldd e-mailben.');
                return;
            }
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = (fileInput && fileInput.files && fileInput.files.length > 0)
            ? 'Feltöltés...'
            : 'Küldés...';

        // Közös event_id: kliens pixel + szerver CAPI dedup
        var eventId = uuid();

        // Submit tracking
        track('bk_career_form_submit', { form_name: 'career', event_id: eventId });

        // FormData — multipart/form-data, NEM JSON (a CV miatt)
        var fd = new FormData(form);
        fd.set('event_id', eventId);
        fd.set('page_url', window.location.href);

        fetch('/api/karrier-jelentkezes.php', {
            method: 'POST',
            body: fd
        })
            .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
            .then(function (res) {
                if (res.data && res.data.ok) {
                    // Success — UI + tracking
                    form.style.display = 'none';
                    var successEl = document.getElementById('kar-form-success');
                    if (successEl) successEl.style.display = 'block';

                    track('bk_career_form_success', { form_name: 'career', event_id: eventId });
                    gaEvent('generate_lead', {
                        currency: 'HUF',
                        value: 8000,
                        content_category: 'career_application',
                        event_id: eventId
                    });
                    metaEvent('Lead', {
                        content_name: 'career_application',
                        content_category: 'career_application',
                        value: 8000,
                        currency: 'HUF'
                    }, eventId);

                    // Scroll to success state
                    if (successEl) {
                        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    throw new Error((res.data && res.data.error) || 'Ismeretlen hiba történt.');
                }
            })
            .catch(function (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = origText;
                showError(err.message || 'Hiba történt a küldéskor. Kérjük, próbáld újra, vagy írj e-mailt a fejlesztobagolyka@gmail.com címre.');
                track('bk_career_form_error', { form_name: 'career', error: err.message || 'unknown' });
            });
    });
})();
