/**
 * BagolykaLand Email Capture Popup System
 * Triggers: exit-intent (desktop), timed (page-aware), scroll-depth
 * Fields: keresztnév (first name) + email
 * Integrates with MailerLite Universal JS
 *
 * Suppression logic — per-page progressive backoff:
 *   Dismiss 1-5 → session only (shows again next visit)
 *   Dismiss 6+  → 3 days
 *   Submit       → 30 days
 */
(function () {
    'use strict';

    function track(eventName, params) {
        if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
            window.BKTracking.trackEvent(eventName, params || {});
        }
        if (typeof window.fbq === 'function' && eventName === 'bk_popup_submit_success') {
            window.fbq('track', 'Lead', { content_name: 'popup_lead_magnet' });
        }
    }

    // ── Configuration ────────────────────────────────────────
    var COOKIE_PREFIX = 'bk_popup_dismissed_';
    var DISMISS_COUNT_PREFIX = 'bk_popup_dismiss_count_';
    var SUBMIT_DAYS = 30;
    var SCROLL_THRESHOLD = /Mobi|Android/i.test(navigator.userAgent) ? 0.30 : 0.50;

    // MailerLite group — same list as Zsenibagoly (Hiszti funnel), tagged with source
    var ML_GROUP_ID = '156829265225057690';
    var SOURCE = 'bagolykaland';

    // Unified lead magnet — "5 ingyenes segédanyag"
    var LEAD_MAGNET = {
        tag: '5 ingyenes segédanyag',
        title: '🦉 Kapj 5 ingyenes szülői segédanyagot — fejlesztőpedagógustól, azonnal',
        desc: 'Iratkozz fel és küldünk <strong>5 gyakorlati anyagot</strong>, amit még ma kipróbálhatsz a gyerekeddel.',
        resources: [
            '🔥 <strong>Top 5 tűzoltási technika</strong> — viselkedési krízishelyzetekre',
            '🎬 <strong>Hisztikezelés</strong> — 3 gyakorlati videó',
            '😰 <strong>Szorongásoldás</strong> — gyakorlati példa videóval',
            '📝 <strong>Figyelemfejlesztés</strong> — 3 Jolly Joker feladat (letölthető)',
            '🎓 <strong>Iskolaérettség</strong> — mik az elvárások?'
        ],
        button: 'Kérem az 5 ingyenes segédanyagot!',
        group: 'zsenifeszek'
    };

    // ── Cookie Helpers ───────────────────────────────────────
    function setCookie(name, value, days) {
        var expires = '';
        if (days > 0) {
            var d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            expires = ';expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + value + expires + ';path=/;SameSite=Lax';
    }

    function getCookie(name) {
        var v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return v ? v.pop() : '';
    }

    // ── Progressive Backoff ────────────────────────────────
    function getDismissCount(ctx) {
        var val = getCookie(DISMISS_COUNT_PREFIX + ctx);
        return val ? parseInt(val, 10) || 0 : 0;
    }

    function getDismissDays(count) {
        if (count <= 5) return 0;
        return 3;
    }

    // ── Page Classification ────────────────────────────────
    var SHORT_PAGES = ['kapcsolat', 'adatkezelesi', 'arlista'];

    function getPageType() {
        var path = window.location.pathname.toLowerCase();
        for (var i = 0; i < SHORT_PAGES.length; i++) {
            if (path.indexOf(SHORT_PAGES[i]) !== -1) return 'short';
        }
        if (path === '/' || path === '' || path === '/index.html') return 'home';
        return 'content';
    }

    function getTimerDelay() {
        var type = getPageType();
        var isMobile = window.innerWidth <= 768;
        if (type === 'short') return isMobile ? 20000 : 15000;
        if (type === 'home') return isMobile ? 15000 : 12000;
        return isMobile ? 12000 : 10000;
    }

    // ── Context key for cookie suppression ────────────────────
    function detectContext() {
        return 'zsenifeszek';
    }

    // ── Build Popup HTML ─────────────────────────────────────
    function buildPopup(lm) {
        var resourcesHtml = '<ul class="bk-popup-resources">';
        lm.resources.forEach(function(r) { resourcesHtml += '<li>' + r + '</li>'; });
        resourcesHtml += '</ul>';

        return '' +
            '<div class="bk-popup-overlay" id="bk-popup-overlay">' +
            '  <div class="bk-popup" role="dialog" aria-modal="true" aria-label="' + lm.tag + '">' +
            '    <button class="bk-popup-close" id="bk-popup-close" aria-label="Bezárás">' +
            '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '    </button>' +
            '    <div class="bk-popup-visual">' +
            '      <span class="bk-popup-emoji">🦉</span>' +
            '      <span class="bk-popup-tag">' + lm.tag + '</span>' +
            '    </div>' +
            '    <h2 class="bk-popup-title">' + lm.title + '</h2>' +
            '    <p class="bk-popup-desc">' + lm.desc + '</p>' +
            resourcesHtml +
            '    <form class="bk-popup-form" id="bk-popup-form">' +
            '      <div class="bk-popup-input-wrap">' +
            '        <label for="bk-popup-name" class="sr-only">Keresztnév</label>' +
            '        <input type="text" name="name" id="bk-popup-name" class="bk-popup-input" placeholder="Keresztneved" required autocomplete="given-name">' +
            '        <label for="bk-popup-email" class="sr-only">E-mail cím</label>' +
            '        <input type="email" name="email" id="bk-popup-email" class="bk-popup-input" placeholder="E-mail címed" required autocomplete="email">' +
            '        <button type="submit" class="bk-popup-submit">' +
            '          <span class="bk-popup-submit-text">' + lm.button + '</span>' +
            '          <svg class="bk-popup-submit-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '        </button>' +
            '      </div>' +
            '      <p class="bk-popup-gdpr-inline">Csatlakozz több száz tudatos szülőhöz — teljesen ingyen! <a href="/adatkezelesi-tajekoztato/">Adatkezelési tájékoztató</a></p>' +
            '    </form>' +
            '    <div class="bk-popup-success" id="bk-popup-success" style="display:none">' +
            '      <div class="bk-popup-success-icon">✓</div>' +
            '      <h3>Köszönjük!</h3>' +
            '      <p>Hamarosan megérkeznek az e-mailben a segédanyagok!</p>' +
            '    </div>' +
            '    <p class="bk-popup-privacy">Bármikor leiratkozhatsz.</p>' +
            '  </div>' +
            '</div>';
    }

    // ── Show / Hide ──────────────────────────────────────────
    var popupShown = false;

    function showPopup() {
        if (popupShown) return;
        var ctx = detectContext();
        if (getCookie(COOKIE_PREFIX + ctx)) return;
        popupShown = true;

        var lm = LEAD_MAGNET;
        track('bk_popup_shown', {
            popup_context: ctx,
            popup_group: lm.group
        });
        var wrapper = document.createElement('div');
        wrapper.innerHTML = buildPopup(lm);
        document.body.appendChild(wrapper.firstChild);

        requestAnimationFrame(function () {
            var overlay = document.getElementById('bk-popup-overlay');
            if (overlay) overlay.classList.add('bk-popup-visible');
        });

        var closeBtn = document.getElementById('bk-popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () { dismissPopup(); });
        }

        var overlay = document.getElementById('bk-popup-overlay');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) dismissPopup();
            });
        }

        document.addEventListener('keydown', function onEsc(e) {
            if (e.key === 'Escape') {
                dismissPopup();
                document.removeEventListener('keydown', onEsc);
            }
        });

        var form = document.getElementById('bk-popup-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var name = (form.querySelector('input[name="name"]') || {}).value || '';
                var email = (form.querySelector('input[type="email"]') || {}).value || '';
                var submitBtn = form.querySelector('button[type="submit"]');
                if (!email) return;

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.querySelector('.bk-popup-submit-text').textContent = 'Küldés...';
                }

                track('bk_popup_submit', {
                    popup_context: ctx,
                    popup_group: lm.group
                });

                // Save to Supabase (fire-and-forget)
                var sbKey = 'sb_publishable_WbKSuHWa6yRLGShUnR6bcw_341Kp-Xz';
                fetch('https://esiittanpkwxvmghqbsy.supabase.co/rest/v1/leads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': sbKey,
                        'Authorization': 'Bearer ' + sbKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        name: name.trim() || null,
                        email: email.trim(),
                        source_page: window.location.pathname,
                        group_name: lm.group,
                        form_type: 'popup'
                    })
                }).catch(function () {});

                submitToMailerLite(email, name)
                    .then(function () {
                        form.style.display = 'none';
                        var successEl = document.getElementById('bk-popup-success');
                        if (successEl) successEl.style.display = 'block';
                        setCookie(COOKIE_PREFIX + ctx, 'submitted', SUBMIT_DAYS);
                        track('bk_popup_submit_success', {
                            popup_context: ctx,
                            popup_group: lm.group
                        });
                        setTimeout(function () { removePopup(); }, 3000);
                    })
                    .catch(function () {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.querySelector('.bk-popup-submit-text').textContent = lm.button;
                        }
                        var errorMsg = document.createElement('p');
                        errorMsg.style.cssText = 'color:#E8734A;font-size:0.85rem;margin-top:12px;text-align:center;';
                        errorMsg.textContent = 'Hiba történt, kérjük próbáld újra.';
                        form.appendChild(errorMsg);
                        track('bk_popup_submit_error', {
                            popup_context: ctx,
                            popup_group: lm.group
                        });
                        setTimeout(function () {
                            if (errorMsg.parentNode) errorMsg.parentNode.removeChild(errorMsg);
                        }, 4000);
                    });
            });
        }
    }

    function dismissPopup() {
        var ctx = detectContext();
        var count = getDismissCount(ctx) + 1;
        setCookie(DISMISS_COUNT_PREFIX + ctx, count, 365);
        var days = getDismissDays(count);
        setCookie(COOKIE_PREFIX + ctx, 'dismissed', days);
        track('bk_popup_dismissed', {
            popup_context: ctx,
            dismiss_count: count,
            suppress_days: days
        });
        removePopup();
    }

    function removePopup() {
        var overlay = document.getElementById('bk-popup-overlay');
        if (overlay) {
            overlay.classList.remove('bk-popup-visible');
            overlay.classList.add('bk-popup-hiding');
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 400);
        }
    }

    // ── MailerLite Integration ───────────────────────────────
    function submitToMailerLite(email, name) {
        var apiKey = (window.BK_ML && window.BK_ML.API_KEY) || '';

        if (!apiKey || apiKey.indexOf('TODO') !== -1) {
            console.warn('[BagolykaLand] MailerLite API key not configured. Subscriber:', email);
            return Promise.resolve({ ok: true });
        }

        var payload = {
            email: email,
            groups: [ML_GROUP_ID],
            fields: {
                name: name,
                signup_source: SOURCE,
                signup_page: window.location.pathname
            }
        };

        return fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(function (res) {
            if (!res.ok && res.status !== 409) {
                throw new Error('MailerLite error: ' + res.status);
            }
            return res.json().catch(function () { return {}; });
        });
    }

    // ── Trigger System ───────────────────────────────────────
    var timerHandle = null;
    var scrollBound = false;
    var exitBound = false;

    function armTriggers() {
        var ctx = detectContext();
        if (getCookie(COOKIE_PREFIX + ctx)) return;

        var delay = getTimerDelay();
        timerHandle = setTimeout(showPopup, delay);

        if (!scrollBound) {
            scrollBound = true;
            window.addEventListener('scroll', function onScroll() {
                var scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
                if (scrolled >= SCROLL_THRESHOLD) {
                    window.removeEventListener('scroll', onScroll);
                    showPopup();
                }
            }, { passive: true });
        }

        if (!exitBound && !/Mobi|Android/i.test(navigator.userAgent)) {
            exitBound = true;
            document.addEventListener('mouseleave', function onLeave(e) {
                if (e.clientY < 20) {
                    document.removeEventListener('mouseleave', onLeave);
                    if (timerHandle) { clearTimeout(timerHandle); timerHandle = null; }
                    showPopup();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', armTriggers, { once: true });
    } else {
        armTriggers();
    }
})();
