/**
 * BagolykaLand Lead Capture Loader
 * Defers loading of popup.css + popup.js until user interaction or idle time.
 * Usage: <script src="/js/lead-capture-loader.js"
 *               data-popup-css="/css/popup.css"
 *               data-popup-src="/js/popup.js"
 *               defer></script>
 */
(function () {
    'use strict';

    var loaderScript = document.currentScript;
    if (!loaderScript) {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
            if (scripts[i].src && scripts[i].src.indexOf('lead-capture-loader.js') !== -1) {
                loaderScript = scripts[i];
                break;
            }
        }
    }

    function injectStylesheet(id, href) {
        if (!href || document.getElementById(id)) return;
        var link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function injectScript(id, src, callback) {
        if (!src) { if (typeof callback === 'function') callback(); return; }
        var existing = document.getElementById(id);
        if (existing) {
            if (typeof callback === 'function') {
                if (existing.getAttribute('data-loaded') === 'true') callback();
                else existing.addEventListener('load', callback, { once: true });
            }
            return;
        }
        var script = document.createElement('script');
        script.id = id;
        script.async = true;
        script.src = src;
        script.addEventListener('load', function () {
            script.setAttribute('data-loaded', 'true');
            if (typeof callback === 'function') callback();
        }, { once: true });
        document.head.appendChild(script);
    }

    var hasBooted = false;
    var idleHandle = null;
    var fallbackTimer = null;
    var startListenersBound = false;

    function clearIdleHandle() {
        if (idleHandle === null) return;
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleHandle);
        else window.clearTimeout(idleHandle);
        idleHandle = null;
    }

    function removeStartListeners() {
        if (!startListenersBound) return;
        window.removeEventListener('pointerdown', startBoot, true);
        window.removeEventListener('keydown', startBoot, true);
        window.removeEventListener('touchstart', startBoot, true);
        window.removeEventListener('scroll', handleScrollStart, { passive: true });
        startListenersBound = false;
    }

    function boot() {
        if (hasBooted) return;
        hasBooted = true;
        clearIdleHandle();
        removeStartListeners();
        if (fallbackTimer !== null) { window.clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (!loaderScript) return;

        var popupCss = loaderScript.getAttribute('data-popup-css');
        var popupSrc = loaderScript.getAttribute('data-popup-src');

        injectStylesheet('bk-popup-css', popupCss);
        injectScript('bk-popup-script', popupSrc);
    }

    function startBoot() { boot(); }

    function handleScrollStart() {
        if (window.scrollY >= 160) boot();
    }

    function scheduleIdleBoot() {
        if (idleHandle !== null || hasBooted) return;
        if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(startBoot, { timeout: 4000 });
            return;
        }
        idleHandle = window.setTimeout(startBoot, 2500);
    }

    function bindStartListeners() {
        if (startListenersBound) return;
        window.addEventListener('pointerdown', startBoot, true);
        window.addEventListener('keydown', startBoot, true);
        window.addEventListener('touchstart', startBoot, true);
        window.addEventListener('scroll', handleScrollStart, { passive: true });
        startListenersBound = true;
    }

    function start() {
        bindStartListeners();
        scheduleIdleBoot();
        fallbackTimer = window.setTimeout(startBoot, 6000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
