// GA4 for Nacho's public website. Never include form values or chat messages.
(() => {
  if (window.nachosAnalyticsLoaded) return;
  window.nachosAnalyticsLoaded = true;
  const measurementId = 'G-2RL7E6P2RV';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  window.nachosTrack = function (event, parameters = {}) {
    window.gtag('event', event, {
      language: document.documentElement.lang || 'en',
      ...parameters,
      transport_type: 'beacon'
    });
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
  // The Instagram landing already tracks its own contact actions.
  if (location.pathname === '/bio/' || location.pathname === '/bio') return;
  document.addEventListener('click', event => {
    const target = event.target.closest?.('a,button');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    const channel = href.startsWith('tel:') ? 'call' :
      href.startsWith('sms:') ? 'sms' :
      href.startsWith('mailto:') ? 'email' :
      /maps\.app\.goo\.gl|google\.com\/maps/.test(href) ? 'directions' : null;
    if (channel) window.nachosTrack(channel + '_click');
    if (target.classList.contains('open-estimate')) window.nachosTrack('assessment_open');
    if (target.id === 'chatLauncher') window.nachosTrack('chat_open');
  });
})();
