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
    var hdr = document.getElementById('site-header');
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
    var HOVER_CLOSE_DELAY = 320;
    var HOVER_SAFE_X_PADDING = 28;
    var HOVER_SAFE_Y_PADDING = 18;
    var HOVER_OPEN_MODE = 'hover';
    var MANUAL_OPEN_MODE = 'manual';
    var activeHoverItem = null;

    function isMobileNavViewport() {
        return navViewportMedia ? navViewportMedia.matches : window.innerWidth <= DESKTOP_NAV_BREAKPOINT;
    }

    function normalizePathname(pathname) {
        var normalizedPath = (pathname || '/')
            .split('#')[0]
            .split('?')[0]
            .replace(/\/index\.html$/, '/');

        if (normalizedPath.indexOf('/pages/') === 0) {
            normalizedPath = normalizedPath.slice('/pages'.length);
        }

        return normalizedPath.replace(/\/$/, '') || '/';
    }

    function clearHoverTimer(key) {
        if (!hoverTimers[key]) return;
        clearTimeout(hoverTimers[key]);
        delete hoverTimers[key];
    }

    function clearHoverTimers() {
        Object.keys(hoverTimers).forEach(function (key) {
            clearTimeout(hoverTimers[key]);
            delete hoverTimers[key];
        });
    }

    function isPointInsideRect(clientX, clientY, rect, paddingX, paddingY) {
        return (
            clientX >= rect.left - paddingX &&
            clientX <= rect.right + paddingX &&
            clientY >= rect.top - paddingY &&
            clientY <= rect.bottom + paddingY
        );
    }

    function isPointWithinHoverSafeZone(clientX, clientY, item, panel) {
        if (!item || !panel) return false;

        var itemRect = item.getBoundingClientRect();
        var panelRect = panel.getBoundingClientRect();

        if (!panelRect.width || !panelRect.height) {
            return isPointInsideRect(clientX, clientY, itemRect, HOVER_SAFE_X_PADDING, HOVER_SAFE_Y_PADDING);
        }

        if (isPointInsideRect(clientX, clientY, itemRect, HOVER_SAFE_X_PADDING, HOVER_SAFE_Y_PADDING)) {
            return true;
        }

        if (isPointInsideRect(clientX, clientY, panelRect, HOVER_SAFE_X_PADDING, HOVER_SAFE_Y_PADDING)) {
            return true;
        }

        var corridorTop = Math.min(itemRect.bottom, panelRect.top) - HOVER_SAFE_Y_PADDING;
        var corridorBottom = Math.max(itemRect.bottom, panelRect.top) + HOVER_SAFE_Y_PADDING;
        var corridorLeft = itemRect.left - HOVER_SAFE_X_PADDING;
        var corridorRight = itemRect.right + HOVER_SAFE_X_PADDING;

        return (
            clientX >= corridorLeft &&
            clientX <= corridorRight &&
            clientY >= corridorTop &&
            clientY <= corridorBottom
        );
    }

    function keepActiveHoverAlive(event) {
        if (!canHover || !activeHoverItem || !activeHoverItem.classList.contains('open') || isMobileNavViewport()) return;

        var panel = activeHoverItem.querySelector('.mega-panel, .dropdown');
        var hoverIndex = activeHoverItem.getAttribute('data-hover-index');

        if (!panel || !hoverIndex) return;

        if (isPointWithinHoverSafeZone(event.clientX, event.clientY, activeHoverItem, panel)) {
            clearHoverTimer('leave_' + hoverIndex);
        }
    }

    function closeAllPanels() {
        clearHoverTimers();
        activeHoverItem = null;
        navItems.forEach(function (el) {
            if (el.classList.contains('open')) {
                el.classList.remove('open');
                el.removeAttribute('data-open-mode');
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

        item.setAttribute('data-hover-index', String(idx));

        var panel = item.querySelector('.mega-panel, .dropdown');
        var isMega = item.classList.contains('nav-item--mega');
        var leaveTimerKey = 'leave_' + idx;

        function openPanel(openMode) {
            var nextOpenMode = openMode || MANUAL_OPEN_MODE;

            if (item.classList.contains('open')) {
                item.setAttribute('data-open-mode', nextOpenMode);
                btn.setAttribute('aria-expanded', 'true');
                if (canHover) activeHoverItem = item;
                if (backdrop && isMega) {
                    backdrop.classList.add('active');
                    backdrop.setAttribute('aria-hidden', 'false');
                }
                return;
            }

            closeAllPanels();
            item.classList.add('open');
            item.setAttribute('data-open-mode', nextOpenMode);
            btn.setAttribute('aria-expanded', 'true');
            if (canHover) activeHoverItem = item;
            if (backdrop && isMega) {
                backdrop.classList.add('active');
                backdrop.setAttribute('aria-hidden', 'false');
            }
            track('bk_mega_open', { panel: btn.textContent.replace(/\s+/g, ' ').trim() });
        }

        function closePanel() {
            item.classList.remove('open');
            item.removeAttribute('data-open-mode');
            btn.setAttribute('aria-expanded', 'false');
            clearHoverTimer(leaveTimerKey);
            if (activeHoverItem === item) activeHoverItem = null;
            if (backdrop) {
                backdrop.classList.remove('active');
                backdrop.setAttribute('aria-hidden', 'true');
            }
        }

        function scheduleClose() {
            if (item.getAttribute('data-open-mode') === MANUAL_OPEN_MODE) return;
            clearHoverTimer(leaveTimerKey);
            hoverTimers[leaveTimerKey] = setTimeout(function () {
                if (item.matches(':focus-within')) return;
                closePanel();
            }, HOVER_CLOSE_DELAY);
        }

        /* Click toggle (all devices) */
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (item.classList.contains('open')) {
                if (item.getAttribute('data-open-mode') === MANUAL_OPEN_MODE) {
                    closePanel();
                } else {
                    openPanel(MANUAL_OPEN_MODE);
                }
            } else {
                openPanel(MANUAL_OPEN_MODE);
            }
        });

        /* Hover intent (desktop pointer devices only) */
        if (canHover) {
            item.addEventListener('pointerenter', function () {
                clearHoverTimer(leaveTimerKey);
                openPanel(HOVER_OPEN_MODE);
            });

            item.addEventListener('pointerleave', function (e) {
                if (e.relatedTarget && item.contains(e.relatedTarget)) return;
                scheduleClose();
            });

            if (panel) {
                panel.addEventListener('pointerenter', function () {
                    activeHoverItem = item;
                    clearHoverTimer(leaveTimerKey);
                });

                panel.addEventListener('pointerleave', function (e) {
                    if (e.relatedTarget && item.contains(e.relatedTarget)) return;
                    scheduleClose();
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

    if (canHover) {
        document.addEventListener('pointermove', keepActiveHoverAlive, { passive: true });
    }

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
    var currentPath = normalizePathname(window.location.pathname);
    document.querySelectorAll('.nav-link[href], .dropdown a, .mega-nav__link, .mega-nav__parent-link, .mega-service-card, .mega-blog-card, .mobile-nav-link[href], .mobile-dropdown a').forEach(function (link) {
        try {
            var lp = normalizePathname(new URL(link.href, location.origin).pathname);
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
       REVIEWS SLIDER
    ------------------------------------------ */
    (function initReviewsSlider() {
        var slider = document.querySelector('.reviews-slider');
        if (!slider) return;

        var track = slider.querySelector('.reviews-slider__track');
        var cards = track.querySelectorAll('.review-card');
        var prevBtn = slider.querySelector('.reviews-slider__arrow--prev');
        var nextBtn = slider.querySelector('.reviews-slider__arrow--next');
        var dotsContainer = slider.querySelector('.reviews-slider__dots');
        if (cards.length < 2) return;

        // How many cards visible at once
        function getPerView() {
            if (window.innerWidth <= 640) return 1;
            if (window.innerWidth <= 900) return 2;
            return 3;
        }

        var currentPage = 0;

        function getTotalPages() {
            var perView = getPerView();
            return Math.max(1, Math.ceil(cards.length / perView));
        }

        // Build dots
        function buildDots() {
            dotsContainer.innerHTML = '';
            var total = getTotalPages();
            for (var i = 0; i < total; i++) {
                var dot = document.createElement('button');
                dot.className = 'reviews-slider__dot' + (i === currentPage ? ' reviews-slider__dot--active' : '');
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', (i + 1) + '. oldal');
                dot.setAttribute('aria-selected', i === currentPage ? 'true' : 'false');
                dot.dataset.page = i;
                dotsContainer.appendChild(dot);
            }
        }

        function scrollToPage(page) {
            var totalPages = getTotalPages();
            if (page < 0) page = 0;
            if (page >= totalPages) page = totalPages - 1;
            currentPage = page;

            var perView = getPerView();
            var cardIndex = page * perView;
            if (cardIndex >= cards.length) cardIndex = cards.length - 1;

            var target = cards[cardIndex];
            var trackRect = track.getBoundingClientRect();
            var targetRect = target.getBoundingClientRect();
            var scrollLeft = target.offsetLeft - track.offsetLeft;
            track.scrollTo({ left: scrollLeft, behavior: 'smooth' });

            updateUI();
        }

        function updateUI() {
            var totalPages = getTotalPages();
            // Update dots
            var dots = dotsContainer.querySelectorAll('.reviews-slider__dot');
            dots.forEach(function (dot, i) {
                dot.classList.toggle('reviews-slider__dot--active', i === currentPage);
                dot.setAttribute('aria-selected', i === currentPage ? 'true' : 'false');
            });
            // Update arrows
            if (prevBtn) prevBtn.disabled = currentPage <= 0;
            if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
        }

        // Detect page from scroll position (for drag/swipe)
        function syncPageFromScroll() {
            var perView = getPerView();
            var cardWidth = cards[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 24);
            var rawPage = Math.round(track.scrollLeft / (cardWidth * perView));
            var totalPages = getTotalPages();
            currentPage = Math.max(0, Math.min(rawPage, totalPages - 1));
            updateUI();
        }

        // Scroll event — sync dots when user drags/swipes
        var scrollTimer;
        track.addEventListener('scroll', function () {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(syncPageFromScroll, 120);
        }, { passive: true });

        // Arrow clicks
        if (prevBtn) prevBtn.addEventListener('click', function () {
            stopAutoplay();
            scrollToPage(currentPage - 1);
            startAutoplay();
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            stopAutoplay();
            scrollToPage(currentPage + 1);
            startAutoplay();
        });

        // Dot clicks
        dotsContainer.addEventListener('click', function (e) {
            var dot = e.target.closest('.reviews-slider__dot');
            if (!dot) return;
            stopAutoplay();
            scrollToPage(parseInt(dot.dataset.page, 10));
            startAutoplay();
        });

        // Autoplay
        var autoplayInterval = null;
        var AUTOPLAY_DELAY = 6000;

        function startAutoplay() {
            if (autoplayInterval) return;
            autoplayInterval = setInterval(function () {
                var totalPages = getTotalPages();
                var nextPage = (currentPage + 1) % totalPages;
                scrollToPage(nextPage);
            }, AUTOPLAY_DELAY);
        }

        function stopAutoplay() {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }

        // Pause on hover/focus
        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('focusin', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
        slider.addEventListener('focusout', function (e) {
            if (!slider.contains(e.relatedTarget)) startAutoplay();
        });

        // Resize: rebuild dots, clamp page
        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                var totalPages = getTotalPages();
                if (currentPage >= totalPages) currentPage = totalPages - 1;
                buildDots();
                scrollToPage(currentPage);
            }, 200);
        });

        // Touch swipe support
        var touchStartX = 0;
        var touchStartScrollLeft = 0;
        track.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].clientX;
            touchStartScrollLeft = track.scrollLeft;
            stopAutoplay();
        }, { passive: true });

        track.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
                if (dx < 0) scrollToPage(currentPage + 1);
                else scrollToPage(currentPage - 1);
            }
            startAutoplay();
        }, { passive: true });

        // Init
        buildDots();
        updateUI();
        startAutoplay();

        // Track review slider interaction
        track.addEventListener('click', function (e) {
            var card = e.target.closest('.review-card');
            if (!card) return;
            track('bk_google_review_click', { click_variant: 'slider-card' });
        });
    }());

    /* ------------------------------------------
       HERO SLIDER
    ------------------------------------------ */
    (function initHeroSlider() {
        var slider = document.querySelector('.hero-slider');
        if (!slider) return;

        var slides = slider.querySelectorAll('.hero-slide');
        var dots = slider.querySelectorAll('.hero-dot');
        var prevBtn = slider.querySelector('.hero-arrow--prev');
        var nextBtn = slider.querySelector('.hero-arrow--next');
        var playPauseBtn = slider.querySelector('.hero-playpause');
        var iconPause = playPauseBtn && playPauseBtn.querySelector('.hero-icon-pause');
        var iconPlay = playPauseBtn && playPauseBtn.querySelector('.hero-icon-play');
        if (slides.length < 2) return;

        var current = 0;
        var interval = null;
        var DELAY = 4500;
        var playing = true;

        function goTo(index) {
            slides[current].classList.remove('hero-slide--active');
            dots[current].classList.remove('hero-dot--active');
            current = index;
            slides[current].classList.add('hero-slide--active');
            dots[current].classList.add('hero-dot--active');
        }

        function next() {
            goTo((current + 1) % slides.length);
        }

        function prev() {
            goTo((current - 1 + slides.length) % slides.length);
        }

        function startAutoplay() {
            if (interval) return;
            playing = true;
            slider.classList.remove('hero-slider--paused');
            interval = setInterval(next, DELAY);
            if (iconPause) { iconPause.style.display = ''; iconPlay.style.display = 'none'; }
            if (playPauseBtn) playPauseBtn.setAttribute('aria-label', 'Megállítás');
        }

        function stopAutoplay() {
            clearInterval(interval);
            interval = null;
            playing = false;
            slider.classList.add('hero-slider--paused');
            if (iconPause) { iconPause.style.display = 'none'; iconPlay.style.display = ''; }
            if (playPauseBtn) playPauseBtn.setAttribute('aria-label', 'Lejátszás');
        }

        function toggleAutoplay() {
            if (playing) { stopAutoplay(); } else { startAutoplay(); }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                var wasPlaying = playing;
                stopAutoplay();
                goTo(i);
                if (wasPlaying) startAutoplay();
            });
        });

        if (prevBtn) prevBtn.addEventListener('click', function () {
            var wasPlaying = playing;
            stopAutoplay();
            prev();
            if (wasPlaying) startAutoplay();
        });

        if (nextBtn) nextBtn.addEventListener('click', function () {
            var wasPlaying = playing;
            stopAutoplay();
            next();
            if (wasPlaying) startAutoplay();
        });

        if (playPauseBtn) playPauseBtn.addEventListener('click', toggleAutoplay);

        startAutoplay();
    }());

    /* ------------------------------------------
       DISPATCH navReady for main.js
    ------------------------------------------ */
    document.dispatchEvent(new CustomEvent('navReady'));
}());
