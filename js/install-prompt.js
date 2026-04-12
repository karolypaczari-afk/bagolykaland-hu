(function () {
  'use strict';

  var APP_NAME = 'BagolykaLand';
  var SERVICE_WORKER_PATH = '/service-worker.js';
  var MANUAL_INSTALL_LABEL = 'Telepítés';
  var deferredPrompt = null;
  var previousBodyOverflow = '';
  var overlay = null;

  function track(eventName, params) {
    if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
      window.BKTracking.trackEvent(eventName, params || {});
    }
  }

  function detectEnvironment() {
    var ua = window.navigator.userAgent || '';
    var platform = window.navigator.platform || '';
    var maxTouchPoints = window.navigator.maxTouchPoints || 0;
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    var isAndroid = /Android/i.test(ua);
    var isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger/i.test(ua);
    var isInstagram = /Instagram/i.test(ua);
    var isGoogleApp = /\bGSA\/|GoogleApp/i.test(ua);
    var isInApp = isFacebook || isInstagram || isGoogleApp;
    var isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua);

    return {
      ios: isIOS,
      android: isAndroid,
      safari: isSafari,
      inApp: isInApp
    };
  }

  var env = detectEnvironment();

  function isStandalone() {
    if (window.navigator.standalone === true) {
      return true;
    }

    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(display-mode: standalone)').matches;
    }

    return false;
  }

  function getInstallMode() {
    if (isStandalone()) {
      return 'installed';
    }

    if (deferredPrompt) {
      return 'prompt';
    }

    if (env.ios) {
      return env.inApp ? 'ios-inapp' : 'ios-manual';
    }

    if (env.android) {
      return env.inApp ? 'android-inapp' : 'android-manual';
    }

    return 'desktop-manual';
  }

  function applyBrowserClasses() {
    var root = document.documentElement;
    root.classList.toggle('bk-in-app-browser', env.inApp);
    root.classList.toggle('bk-ios-browser', env.ios);
    root.classList.toggle('bk-android-browser', env.android);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in window.navigator)) {
      return;
    }

    if (!window.isSecureContext) {
      return;
    }

    window.navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' }).catch(function () {
      // The manual install help still works even if registration fails.
    });
  }

  function getButtons() {
    return document.querySelectorAll('.js-install-app');
  }

  function updateButtons() {
    var mode = getInstallMode();
    var buttons = getButtons();

    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];

      if (mode === 'installed') {
        button.hidden = true;
        continue;
      }

      button.hidden = false;
      button.setAttribute('data-install-mode', mode);
      button.setAttribute(
        'aria-label',
        mode === 'prompt' ? APP_NAME + ' telepítése' : 'Telepítési útmutató megnyitása'
      );

      var label = button.querySelector('.nav-install-label');
      if (label) {
        label.textContent = MANUAL_INSTALL_LABEL;
      }
    }
  }

  function bindButtons() {
    var buttons = getButtons();

    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      if (button.getAttribute('data-install-bound') === 'true') {
        continue;
      }

      button.setAttribute('data-install-bound', 'true');
      button.addEventListener('click', handleInstallClick);
    }
  }

  function ensureOverlay() {
    if (overlay) {
      return overlay;
    }

    var modal = document.createElement('div');
    modal.className = 'bk-install-modal';
    modal.setAttribute('role', 'document');

    var title = document.createElement('h2');
    title.className = 'bk-install-title';
    title.id = 'bk-install-title';

    var copy = document.createElement('p');
    copy.className = 'bk-install-copy';
    copy.id = 'bk-install-copy';

    var steps = document.createElement('ol');
    steps.className = 'bk-install-steps';
    steps.id = 'bk-install-steps';

    var actions = document.createElement('div');
    actions.className = 'bk-install-actions';

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'bk-install-close';
    closeButton.textContent = 'Rendben';
    closeButton.addEventListener('click', closeOverlay);

    actions.appendChild(closeButton);
    modal.appendChild(title);
    modal.appendChild(copy);
    modal.appendChild(steps);
    modal.appendChild(actions);

    overlay = document.createElement('div');
    overlay.className = 'bk-install-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'bk-install-title');
    overlay.setAttribute('aria-describedby', 'bk-install-copy');
    overlay.hidden = true;
    overlay.appendChild(modal);

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeOverlay();
      }
    });

    document.body.appendChild(overlay);
    document.addEventListener('keydown', handleEscapeKey);

    return overlay;
  }

  function handleEscapeKey(event) {
    if (event.key === 'Escape' && overlay && !overlay.hidden) {
      closeOverlay();
    }
  }

  function openOverlay(mode) {
    var installOverlay = ensureOverlay();
    var title = installOverlay.querySelector('.bk-install-title');
    var copy = installOverlay.querySelector('.bk-install-copy');
    var steps = installOverlay.querySelector('.bk-install-steps');
    var content = getOverlayContent(mode);

    title.textContent = content.title;
    copy.textContent = content.copy;
    steps.innerHTML = '';

    for (var i = 0; i < content.steps.length; i++) {
      var item = document.createElement('li');
      item.textContent = content.steps[i];
      steps.appendChild(item);
    }

    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    installOverlay.hidden = false;
    track('bk_install_help_opened', {
      install_mode: mode
    });
  }

  function closeOverlay() {
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
  }

  function getOverlayContent(mode) {
    if (mode === 'ios-manual') {
      return {
        title: 'Telepítsd a ' + APP_NAME + ' webappot',
        copy: 'iPhone-on vagy iPaden a telepítés a megosztási menüből indul.',
        steps: [
          'Koppints a Megosztás ikonra a böngészőben.',
          'Válaszd a "Főképernyőhöz adás" lehetőséget.',
          'Ellenőrizd a nevet, majd koppints a Hozzáadás gombra.'
        ]
      };
    }

    if (mode === 'ios-inapp') {
      return {
        title: 'Nyisd meg Safari-ban',
        copy: 'Ebben az alkalmazáson belüli böngészőben a telepítés nem mindig jelenik meg.',
        steps: [
          'Nyisd meg az oldalt Safari-ban.',
          'Koppints a Megosztás ikonra, majd a "Főképernyőhöz adás" lehetőségre.',
          'Ellenőrizd a nevet, majd koppints a Hozzáadás gombra.'
        ]
      };
    }

    if (mode === 'android-inapp') {
      return {
        title: 'Nyisd meg Chrome-ban',
        copy: 'A Facebook vagy Google alkalmazás böngészője nem mindig tud közvetlen telepítést indítani.',
        steps: [
          'Nyisd meg az oldalt Chrome-ban.',
          'Koppints a böngésző menüjére.',
          'Válaszd az "Alkalmazás telepítése" vagy a "Hozzáadás a főképernyőhöz" lehetőséget.'
        ]
      };
    }

    if (mode === 'android-manual' || mode === 'desktop-manual') {
      return {
        title: 'Telepítsd a ' + APP_NAME + ' webappot',
        copy: 'Ha a böngésző nem dob fel telepítési ablakot, a menüből akkor is hozzáadhatod alkalmazásként.',
        steps: [
          'Nyisd meg a böngésző menüjét.',
          'Keresd az "Alkalmazás telepítése", "Install app" vagy hasonló lehetőséget.',
          'Erősítsd meg a telepítést.'
        ]
      };
    }

    return {
      title: 'Telepítsd a ' + APP_NAME + ' webappot',
      copy: 'A böngésző felkínálja a telepítést, hogy gyorsabban elérd a webappot a kezdőképernyőről.',
      steps: [
        'Fogadd el a böngésző telepítési ajánlatát.',
        'Erősítsd meg a telepítést.',
        'Nyisd meg a webappot a kezdőképernyőről vagy az alkalmazáslistából.'
      ]
    };
  }

  function handleInstallClick(event) {
    var mode = getInstallMode();
    var button = event.currentTarget;

    track('bk_install_click', {
      install_mode: mode,
      button_location: button && button.closest('.header-actions') ? 'header' : 'page'
    });

    if (mode === 'prompt' && deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        track('bk_install_prompt_result', {
          install_mode: mode,
          outcome: choice && choice.outcome ? choice.outcome : 'unknown'
        });
        deferredPrompt = null;
        updateButtons();
      }).catch(function () {
        track('bk_install_prompt_result', {
          install_mode: mode,
          outcome: 'error'
        });
        deferredPrompt = null;
        updateButtons();
      });
      return;
    }

    if (button) {
      button.blur();
    }

    openOverlay(mode);
  }

  function boot() {
    applyBrowserClasses();
    bindButtons();
    updateButtons();
    registerServiceWorker();
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    track('bk_install_prompt_available', {
      install_mode: 'prompt'
    });
    updateButtons();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    track('bk_app_installed', {
      install_mode: 'installed'
    });
    closeOverlay();
    updateButtons();
  });

  document.addEventListener('navReady', function () {
    bindButtons();
    updateButtons();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
