/**
 * BAGOLYKALAND.HU — Interactive UI v3
 * Header/footer are now static HTML rendered by Eleventy.
 * This file handles interactive behaviours only.
 */
(function () {
    'use strict';

    var DESKTOP_NAV_BREAKPOINT = 1120;

    function track(eventName, params) {
        if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
            window.BKTracking.trackEvent(eventName, params || {});
        }
    }

    function getFirstFocusable(container) {
        if (!container) return null;
        return container.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
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
    var navViewportMedia = window.matchMedia ? window.matchMedia('(max-width: ' + DESKTOP_NAV_BREAKPOINT + 'px)') : null;

    function isMobileNavViewport() {
        return navViewportMedia ? navViewportMedia.matches : window.innerWidth <= DESKTOP_NAV_BREAKPOINT;
    }

    function clearHoverTimers() {
        Object.keys(hoverTimers).forEach(function (key) {
            clearTimeout(hoverTimers[key]);
            delete hoverTimers[key];
        });
    }

    function closeAllPanels() {
        clearHoverTimers();
        navItems.forEach(function (el) {
            if (el.classList.contains('open')) {
                el.classList.remove('open');
                var toggle = el.querySelector('.nav-link[aria-haspopup]');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
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

        var panel = item.querySelector('.mega-panel, .dropdown');
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

            if (panel) {
                panel.addEventListener('mouseenter', function () {
                    clearTimeout(hoverTimers['leave_' + idx]);
                });
                panel.addEventListener('mouseleave', function () {
                    hoverTimers['leave_' + idx] = setTimeout(closePanel, 350);
                });
            }
        }

        /* Keyboard support */
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && item.classList.contains('open')) {
                closePanel();
                btn.focus();
            }

            if (e.key === 'ArrowDown' && panel) {
                e.preventDefault();
                openPanel();
                var firstFocusable = getFirstFocusable(panel);
                if (firstFocusable) {
                    var focusTarget = function () {
                        firstFocusable.focus({ preventScroll: true });
                    };

                    if (window.requestAnimationFrame) {
                        window.requestAnimationFrame(function () {
                            setTimeout(focusTarget, 40);
                        });
                    } else {
                        setTimeout(focusTarget, 40);
                    }
                }
            }
        });

        if (panel) {
            panel.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    closePanel();
                    btn.focus();
                }
            });
        }

        item.addEventListener('focusout', function (e) {
            if (item.contains(e.relatedTarget)) return;
            closePanel();
        });
    });

    /* Click outside closes all */
    document.addEventListener('click', function (e) {
        if (e.target && e.target.closest('.nav-item')) return;
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

    function resetMobileSections() {
        if (!mobileNav) return;
        mobileNav.querySelectorAll('.mobile-nav-item').forEach(function (item) {
            item.classList.remove('open');
            var toggle = item.querySelector('.mobile-nav-link');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    }

    function closeMobileNav(options) {
        if (!hamburger || !mobileNav) return;
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileNav.setAttribute('inert', '');
        document.body.style.overflow = '';

        if (options && options.resetSections) {
            resetMobileSections();
        }
    }

    function openMobileNav() {
        if (!hamburger || !mobileNav) return;
        closeAllPanels();
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileNav.classList.add('open');
        mobileNav.setAttribute('aria-hidden', 'false');
        mobileNav.removeAttribute('inert');
        document.body.style.overflow = 'hidden';
    }

    function syncNavForViewport() {
        closeAllPanels();
        if (!hamburger || !mobileNav) return;

        if (!isMobileNavViewport()) {
            closeMobileNav({ resetSections: true });
            return;
        }

        if (!mobileNav.classList.contains('open')) {
            mobileNav.setAttribute('aria-hidden', 'true');
            mobileNav.setAttribute('inert', '');
            document.body.style.overflow = '';
        }
    }

    if (hamburger && mobileNav) {
        mobileNav.setAttribute('inert', '');

        hamburger.addEventListener('click', function () {
            var open = !hamburger.classList.contains('open');
            if (open) {
                openMobileNav();
            } else {
                closeMobileNav();
            }
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

        mobileNav.querySelectorAll('a[href]').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMobileNav();
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
                closeMobileNav();
            }
        });
    }

    if (navViewportMedia) {
        if (typeof navViewportMedia.addEventListener === 'function') {
            navViewportMedia.addEventListener('change', syncNavForViewport);
        } else if (typeof navViewportMedia.addListener === 'function') {
            navViewportMedia.addListener(syncNavForViewport);
        }
    } else {
        window.addEventListener('resize', syncNavForViewport, { passive: true });
    }

    syncNavForViewport();

    /* ------------------------------------------
       ACTIVE NAV LINK
    ------------------------------------------ */
    var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-link[href], .dropdown a, .mega-nav__link, .mega-nav__parent-link, .mega-service-card, .mega-blog-card, .mobile-nav-link[href], .mobile-dropdown a').forEach(function (link) {
        try {
            var lp = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
            if (lp === currentPath) link.classList.add('active');
        } catch (e) {}
    });

    document.querySelectorAll('.nav-item').forEach(function (item) {
        if (!item.querySelector('.dropdown a.active, .mega-panel a.active')) return;
        var toggle = item.querySelector('.nav-link[aria-haspopup]');
        if (toggle) toggle.classList.add('active');
    });

    document.querySelectorAll('.mobile-nav-item').forEach(function (item) {
        if (!item.querySelector('.mobile-dropdown a.active')) return;
        var toggle = item.querySelector('.mobile-nav-link');
        if (toggle) toggle.classList.add('active');
    });

    /* ------------------------------------------
       DISPATCH navReady for main.js
    ------------------------------------------ */
    document.dispatchEvent(new CustomEvent('navReady'));
}());
