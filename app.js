const ALLOWED_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com'
]);
const TWEET_ID_PATTERN = /^\d{6,25}$/;
const FALLBACK_DELAY_MS = 2200;

export function isValidTweetId(value) {
  return TWEET_ID_PATTERN.test(String(value ?? ''));
}

export function extractTweetId(input) {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    throw new Error('Saisissez une URL X ou Twitter complète et valide.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('Le lien doit obligatoirement utiliser HTTPS.');
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('Ce domaine n’est pas autorisé. Utilisez x.com ou twitter.com.');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  const statusIndex = parts.findIndex((part) => part.toLowerCase() === 'status');
  const id = statusIndex >= 0 ? parts[statusIndex + 1] : undefined;
  if (!isValidTweetId(id)) {
    throw new Error('Ce lien ne contient pas d’identifiant de tweet valide.');
  }
  return id;
}

export function buildWebUrl(id) {
  assertTweetId(id);
  return `https://x.com/i/status/${id}`;
}

export function buildIOSDeepLink(id) {
  assertTweetId(id);
  return `twitter://status?id=${id}`;
}

export function buildAndroidIntent(id) {
  assertTweetId(id);
  const fallback = encodeURIComponent(buildWebUrl(id));
  return `intent://twitter.com/i/status/${id}#Intent;package=com.twitter.android;scheme=https;S.browser_fallback_url=${fallback};end`;
}

export function buildShareUrl(id, locationLike = window.location) {
  assertTweetId(id);
  const url = new URL(locationLike.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('x', id);
  return url.href;
}

export function detectPlatform(userAgent, maxTouchPoints = 0) {
  const ua = String(userAgent ?? '');
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

export function createFallbackController({ onFallback, delay = FALLBACK_DELAY_MS, doc = document, win = window }) {
  let timerId;
  const cancel = () => {
    if (timerId !== undefined) win.clearTimeout(timerId);
    timerId = undefined;
  };
  const handleVisibility = () => { if (doc.hidden) cancel(); };
  const start = () => {
    cancel();
    timerId = win.setTimeout(onFallback, delay);
    doc.addEventListener('visibilitychange', handleVisibility, { once: true });
    win.addEventListener('pagehide', cancel, { once: true });
  };
  return { start, cancel };
}

function assertTweetId(id) {
  if (!isValidTweetId(id)) throw new TypeError('Identifiant de tweet invalide.');
}

function navigate(url, replace = false) {
  if (replace) window.location.replace(url);
  else window.location.href = url;
}

function setupGenerator() {
  const form = document.querySelector('#generator-form');
  const input = document.querySelector('#tweet-url');
  const result = document.querySelector('#result');
  const shareOutput = document.querySelector('#share-url');
  const formMessage = document.querySelector('#form-message');
  const copyMessage = document.querySelector('#copy-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    formMessage.textContent = '';
    copyMessage.textContent = '';
    result.hidden = true;
    try {
      shareOutput.value = buildShareUrl(extractTweetId(input.value));
      result.hidden = false;
      shareOutput.focus();
      shareOutput.select();
    } catch (error) {
      formMessage.textContent = error instanceof Error ? error.message : 'Le lien est invalide.';
      input.focus();
    }
  });

  document.querySelector('#copy-button').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareOutput.value);
      copyMessage.textContent = 'Lien copié ! Vous pouvez maintenant le partager.';
    } catch {
      shareOutput.focus();
      shareOutput.select();
      copyMessage.textContent = 'Sélectionnez le lien puis copiez-le manuellement.';
    }
  });
}

function setupOpener(id) {
  const webUrl = buildWebUrl(id);
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  if (platform === 'desktop') {
    navigate(webUrl, true);
    return;
  }

  document.querySelector('#generator-view').hidden = true;
  document.querySelector('#opener-view').hidden = false;
  const deepLink = platform === 'ios' ? buildIOSDeepLink(id) : buildAndroidIntent(id);
  const appLink = document.querySelector('#app-link');
  const webLink = document.querySelector('#web-link');
  appLink.href = deepLink;
  webLink.href = webUrl;

  const fallback = createFallbackController({ onFallback: () => navigate(webUrl, true) });
  appLink.addEventListener('click', () => fallback.start());
  document.querySelector('#back-button').addEventListener('click', () => {
    fallback.cancel();
    const cleanUrl = new URL(window.location.href);
    cleanUrl.search = '';
    cleanUrl.hash = '';
    window.history.replaceState(null, '', cleanUrl);
    document.querySelector('#opener-view').hidden = true;
    document.querySelector('#generator-view').hidden = false;
  });

  fallback.start();
  window.setTimeout(() => navigate(deepLink), 80);
}

if (typeof document !== 'undefined') {
  setupGenerator();
  const id = new URL(window.location.href).searchParams.get('x');
  if (id && isValidTweetId(id)) setupOpener(id);
}
