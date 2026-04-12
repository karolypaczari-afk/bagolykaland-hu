/**
 * BAGOLYKALAND.HU — Interactive UI v3
 * Header/footer are now static HTML rendered by Eleventy.
 * This file handles interactive behaviours only.
 */
(function () {
    'use strict';

    function track(eventName, params) {
        if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
            window.BKTracking.trackEvent(eventName, params || {});
        }
    }

    /* ------------------------------------------
       SCROLL SHADOW
    ------------------------------------------ */
    var hdr = document.getElementById('site-header-el');
    if (hdr) {
        var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 20); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ------------------------------------------
       DESKTOP DROPDOWNS
    ------------------------------------------ */
    document.querySelectorAll('.nav-item .nav-link[aria-haspopup]').forEach(function (btn) {
        var item = btn.closest('.nav-item');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = item.classList.contains('open');
            document.querySelectorAll('.nav-item.open').forEach(function (el) {
                el.classList.remove('open');
                var b = el.querySelector('[aria-haspopup]');
                if (b) b.setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
    document.addEventListener('click', function () {
        document.querySelectorAll('.nav-item.open').forEach(function (el) {
            el.classList.remove('open');
            var b = el.querySelector('[aria-haspopup]');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    });

    /* ------------------------------------------
       MOBILE HAMBURGER
    ------------------------------------------ */
    var hamburger = document.getElementById('hamburger-btn');
    var mobileNav = document.getElementById('mobile-nav');
    if (hamburger && mobileNav) {
        mobileNav.setAttribute('inert', '');

        hamburger.addEventListener('click', function () {
            var open = hamburger.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', open);
            mobileNav.classList.toggle('open', open);
            mobileNav.setAttribute('aria-hidden', !open);
            if (open) {
                mobileNav.removeAttribute('inert');
            } else {
                mobileNav.setAttribute('inert', '');
            }
            document.body.style.overflow = open ? 'hidden' : '';
            track('bk_mobile_nav_toggle', { nav_state: open ? 'open' : 'closed' });
        });

        mobileNav.querySelectorAll('.mobile-nav-item button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var li = btn.closest('.mobile-nav-item');
                li.classList.toggle('open');
                btn.setAttribute('aria-expanded', li.classList.contains('open'));
                track('bk_mobile_nav_section_toggle', {
                    section_label: btn.textContent.replace(/\s+/g, ' ').trim(),
                    section_state: li.classList.contains('open') ? 'open' : 'closed',
                });
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
                hamburger.classList.remove('open');
                mobileNav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
                mobileNav.setAttribute('inert', '');
                document.body.style.overflow = '';
            }
        });
    }

    /* ------------------------------------------
       ACTIVE NAV LINK
    ------------------------------------------ */
    var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-link[href], .dropdown a, .mobile-nav-link[href], .mobile-dropdown a').forEach(function (link) {
        try {
            var lp = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
            if (lp === currentPath) link.classList.add('active');
        } catch (e) {}
    });

    /* ------------------------------------------
       DISPATCH navReady for main.js
    ------------------------------------------ */
    document.dispatchEvent(new CustomEvent('navReady'));
}());
