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
       DESKTOP DROPDOWNS + MEGA MENU
    ------------------------------------------ */
    var navItems = document.querySelectorAll('.nav-item');
    var backdrop = document.getElementById('mega-backdrop');
    var hoverTimers = {};
    var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function closeAllPanels() {
        navItems.forEach(function (el) {
            if (el.classList.contains('open')) {
                el.classList.remove('open');
                var b = el.querySelector('[aria-haspopup]');
                if (b) b.setAttribute('aria-expanded', 'false');
            }
        });
        if (backdrop) {
            backdrop.classList.remove('active');
            backdrop.setAttribute('aria-hidden', 'true');
        }
    }

    navItems.forEach(function (item, idx) {
        var btn = item.querySelector('.nav-link[aria-haspopup]');
        if (!btn) return;

        var isMega = item.classList.contains('nav-item--mega');

        function openPanel() {
            var alreadyOpen = item.classList.contains('open');
            closeAllPanels();
            if (!alreadyOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                if (backdrop && isMega) {
                    backdrop.classList.add('active');
                    backdrop.setAttribute('aria-hidden', 'false');
                }
                track('bk_mega_open', { panel: btn.textContent.replace(/\s+/g, ' ').trim() });
            }
        }

        function closePanel() {
            item.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            if (backdrop) {
                backdrop.classList.remove('active');
                backdrop.setAttribute('aria-hidden', 'true');
            }
        }

        /* Click toggle (all devices) */
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (item.classList.contains('open')) {
                closePanel();
            } else {
                openPanel();
            }
        });

        /* Hover intent (desktop pointer devices only) */
        if (canHover) {
            item.addEventListener('mouseenter', function () {
                clearTimeout(hoverTimers['leave_' + idx]);
                hoverTimers['enter_' + idx] = setTimeout(openPanel, 200);
            });
            item.addEventListener('mouseleave', function () {
                clearTimeout(hoverTimers['enter_' + idx]);
                hoverTimers['leave_' + idx] = setTimeout(closePanel, 350);
            });

            var panel = item.querySelector('.mega-panel, .dropdown');
            if (panel) {
                panel.addEventListener('mouseenter', function () {
                    clearTimeout(hoverTimers['leave_' + idx]);
                });
                panel.addEventListener('mouseleave', function () {
                    hoverTimers['leave_' + idx] = setTimeout(closePanel, 350);
                });
            }
        }

        /* Keyboard: Escape closes panel */
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && item.classList.contains('open')) {
                closePanel();
                btn.focus();
            }
        });
    });

    /* Click outside closes all */
    document.addEventListener('click', function () {
        closeAllPanels();
    });

    /* Backdrop click closes all */
    if (backdrop) {
        backdrop.addEventListener('click', function () {
            closeAllPanels();
        });
    }

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
    document.querySelectorAll('.nav-link[href], .dropdown a, .mega-nav__link, .mega-service-card, .mobile-nav-link[href], .mobile-dropdown a').forEach(function (link) {
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
