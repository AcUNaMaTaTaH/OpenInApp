const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'si', 'feature', 's', 't']);
const FALLBACK_DELAY_MS = 3500;
const AUTO_OPEN_DELAY_MS = 700;
const REPEAT_COOLDOWN_MS = 30 * 60 * 1000;
const TWEET_ID_PATTERN = /^\d{6,25}$/;

export const NETWORKS = Object.freeze({
  x: {
    name: 'X', file: 'x.html', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
    androidPackage: 'com.twitter.android'
  },
  instagram: {
    name: 'Instagram', file: 'instagram.html', hosts: ['instagram.com', 'www.instagram.com'],
    androidPackage: 'com.instagram.android'
  },
  tiktok: {
    name: 'TikTok', file: 'tiktok.html', hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    androidPackage: 'com.zhiliaoapp.musically'
  },
  youtube: {
    name: 'YouTube', file: 'youtube.html', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
    androidPackage: 'com.google.android.youtube'
  },
  facebook: {
    name: 'Facebook', file: 'facebook.html', hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'],
    androidPackage: 'com.facebook.katana'
  },
  threads: {
    name: 'Threads', file: 'threads.html', hosts: ['threads.net', 'www.threads.net'],
    androidPackage: 'com.instagram.barcelona'
  },
  reddit: {
    name: 'Reddit', file: 'reddit.html', hosts: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com', 'redd.it'],
    androidPackage: 'com.reddit.frontpage'
  },
  linkedin: {
    name: 'LinkedIn', file: 'linkedin.html', hosts: ['linkedin.com', 'www.linkedin.com'],
    androidPackage: 'com.linkedin.android'
  },
  pinterest: {
    name: 'Pinterest', file: 'pinterest.html', hosts: ['pinterest.com', 'www.pinterest.com', 'pin.it'],
    androidPackage: 'com.pinterest'
  },
  snapchat: {
    name: 'Snapchat', file: 'snapchat.html', hosts: ['snapchat.com', 'www.snapchat.com'],
    androidPackage: 'com.snapchat.android'
  }
});

export function isValidTweetId(value) {
  return TWEET_ID_PATTERN.test(String(value ?? ''));
}

export function parseSocialUrl(input) {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    throw new Error('Saisissez une URL complète et valide.');
  }
  if (url.protocol !== 'https:') throw new Error('Le lien doit obligatoirement utiliser HTTPS.');
  if (url.username || url.password || url.port) throw new Error('Cette URL contient des éléments non autorisés.');

  const hostname = url.hostname.toLowerCase();
  const entry = Object.entries(NETWORKS).find(([, network]) => network.hosts.includes(hostname));
  if (!entry) throw new Error('Ce réseau n’est pas encore pris en charge.');
  const [platform, network] = entry;

  url.hostname = canonicalHost(platform, hostname);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
  }
  validateNetworkPath(platform, url);
  return { platform, name: network.name, url: url.href };
}

export function validateSharedTarget(platform, target) {
  const parsed = parseSocialUrl(target);
  if (parsed.platform !== platform || !NETWORKS[platform]) throw new Error('La destination ne correspond pas au réseau annoncé.');
  return parsed;
}

export function buildShareUrl(parsed, locationLike = window.location) {
  if (!parsed || !NETWORKS[parsed.platform]) throw new TypeError('Réseau invalide.');
  const validated = validateSharedTarget(parsed.platform, parsed.url);
  const current = new URL(locationLike.href);
  const directory = new URL('./', current);
  const share = new URL(NETWORKS[validated.platform].file, directory);
  share.searchParams.set('target', validated.url);
  return share.href;
}

export function buildWebDestination(platform, target) {
  return validateSharedTarget(platform, target).url;
}

export function buildIOSDestination(platform, target) {
  const { url } = validateSharedTarget(platform, target);
  const parsed = new URL(url);
  if (platform === 'x') {
    const id = tweetIdFromUrl(parsed);
    if (id) return `twitter://status?id=${id}`;
    const username = parsed.pathname.split('/').filter(Boolean)[0];
    if (username) return `twitter://user?screen_name=${encodeURIComponent(username)}`;
  }
  if (platform === 'youtube') {
    const videoId = youtubeVideoId(parsed);
    if (videoId) return `youtube://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }
  if (platform === 'facebook') return `fb://facewebmodal/f?href=${encodeURIComponent(url)}`;
  if (platform === 'reddit') return `reddit://${parsed.hostname}${parsed.pathname}${parsed.search}`;
  if (platform === 'pinterest') {
    const pinId = parsed.pathname.match(/\/pin\/(\d+)/)?.[1];
    if (pinId) return `pinterest://pin/${pinId}`;
  }
  if (platform === 'snapchat') {
    const username = parsed.pathname.match(/^\/add\/([A-Za-z0-9._-]+)\/?$/)?.[1];
    if (username) return `snapchat://add/${encodeURIComponent(username)}`;
  }
  // Les liens HTTPS universels sont plus stables que les schémas privés non documentés.
  return url;
}

export function buildAndroidDestination(platform, target) {
  const url = buildWebDestination(platform, target);
  const network = NETWORKS[platform];
  const withoutScheme = url.slice('https://'.length);
  return `intent://${withoutScheme}#Intent;scheme=https;package=${network.androidPackage};S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

// API historique conservée pour les anciens tests et liens X.
export function extractTweetId(input) {
  const parsed = parseSocialUrl(input);
  if (parsed.platform !== 'x') throw new Error('Ce lien n’est pas un lien X ou Twitter.');
  const id = tweetIdFromUrl(new URL(parsed.url));
  if (!isValidTweetId(id)) throw new Error('Ce lien ne contient pas d’identifiant de tweet valide.');
  return id;
}

export function buildWebUrl(id) { assertTweetId(id); return `https://x.com/i/status/${id}`; }
export function buildIOSDeepLink(id) { assertTweetId(id); return `twitter://status?id=${id}`; }
export function buildAndroidIntent(id) { assertTweetId(id); return buildAndroidDestination('x', buildWebUrl(id)); }

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
  };
  doc.addEventListener('visibilitychange', handleVisibility);
  win.addEventListener('pagehide', cancel);
  return { start, cancel };
}

export function shouldAutoOpen(storage, key, now = Date.now()) {
  try {
    const stored = storage.getItem(key);
    const previous = stored === null ? Number.NaN : Number(stored);
    if (Number.isFinite(previous) && now - previous < REPEAT_COOLDOWN_MS) return false;
    storage.setItem(key, String(now));
  } catch {
    // Le stockage peut être interdit dans certains mini-navigateurs : l’ouverture reste possible.
  }
  return true;
}

function canonicalHost(platform, hostname) {
  if (platform === 'x') return 'x.com';
  if (platform === 'youtube' && hostname === 'youtu.be') return hostname;
  if (platform === 'reddit' && hostname === 'redd.it') return hostname;
  if (platform === 'facebook' && hostname === 'fb.watch') return hostname;
  if (platform === 'tiktok' && ['vm.tiktok.com', 'vt.tiktok.com'].includes(hostname)) return hostname;
  if (platform === 'pinterest' && hostname === 'pin.it') return hostname;
  return NETWORKS[platform].hosts.find((host) => host.startsWith('www.')) ?? NETWORKS[platform].hosts[0];
}

function validateNetworkPath(platform, url) {
  if (!url.pathname || url.pathname === '/') throw new Error(`Ce lien ${NETWORKS[platform].name} ne désigne aucun contenu ou profil.`);
  if (platform === 'x' && /\/status\//i.test(url.pathname) && !tweetIdFromUrl(url)) {
    throw new Error('Ce lien ne contient pas d’identifiant de publication X valide.');
  }
  if (platform === 'youtube' && url.pathname === '/watch' && !youtubeVideoId(url)) {
    throw new Error('Ce lien YouTube ne contient pas d’identifiant de vidéo valide.');
  }
}

function tweetIdFromUrl(url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const index = parts.findIndex((part) => part.toLowerCase() === 'status');
  return index >= 0 && isValidTweetId(parts[index + 1]) ? parts[index + 1] : undefined;
}

function youtubeVideoId(url) {
  const candidate = url.hostname === 'youtu.be'
    ? url.pathname.split('/').filter(Boolean)[0]
    : url.pathname === '/watch'
      ? url.searchParams.get('v')
      : url.pathname.match(/^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{6,20})/)?.[1];
  return /^[A-Za-z0-9_-]{6,20}$/.test(candidate ?? '') ? candidate : undefined;
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
  if (!form) return;
  const input = document.querySelector('#social-url');
  const result = document.querySelector('#result');
  const shareOutput = document.querySelector('#share-url');
  const formMessage = document.querySelector('#form-message');
  const copyMessage = document.querySelector('#copy-message');
  const detected = document.querySelector('#detected-network');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    formMessage.textContent = '';
    copyMessage.textContent = '';
    result.hidden = true;
    try {
      const parsed = parseSocialUrl(input.value);
      shareOutput.value = buildShareUrl(parsed);
      detected.textContent = `Réseau détecté : ${parsed.name}`;
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

function setupLegacyXLink() {
  const id = new URL(window.location.href).searchParams.get('x');
  if (!id || !isValidTweetId(id)) return false;
  const target = buildWebUrl(id);
  navigate(buildShareUrl({ platform: 'x', url: target }), true);
  return true;
}

function setupOpener(platform) {
  const network = NETWORKS[platform];
  const target = new URL(window.location.href).searchParams.get('target');
  const message = document.querySelector('#opener-message');
  if (!network || !target) {
    message.textContent = 'Ce lien de partage est incomplet ou invalide.';
    document.querySelector('#app-link').hidden = true;
    document.querySelector('#web-link').hidden = true;
    return;
  }

  let webUrl;
  try {
    webUrl = buildWebDestination(platform, target);
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Ce lien est invalide.';
    document.querySelector('#app-link').hidden = true;
    document.querySelector('#web-link').hidden = true;
    return;
  }

  const device = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const appUrl = device === 'android'
    ? buildAndroidDestination(platform, webUrl)
    : buildIOSDestination(platform, webUrl);
  const appLink = document.querySelector('#app-link');
  const webLink = document.querySelector('#web-link');
  document.querySelector('#network-name').textContent = network.name;
  document.querySelector('#opener-title').textContent = `Ouverture dans ${network.name}…`;
  appLink.textContent = `Ouvrir dans l’application ${network.name}`;
  webLink.textContent = `Continuer sur le site ${network.name}`;
  appLink.href = appUrl;
  webLink.href = webUrl;

  if (device === 'desktop') {
    navigate(webUrl, true);
    return;
  }

  const fallback = createFallbackController({ onFallback: () => navigate(webUrl, true) });
  appLink.addEventListener('click', () => fallback.start());
  const autoKey = `openinapp:${platform}:${webUrl}`;
  if (shouldAutoOpen(window.sessionStorage, autoKey)) {
    message.textContent = 'Tentative d’ouverture automatique…';
    fallback.start();
    window.setTimeout(() => navigate(appUrl), AUTO_OPEN_DELAY_MS);
  } else {
    message.textContent = 'Ce lien a déjà été ouvert récemment. Utilisez le bouton pour l’ouvrir à nouveau.';
  }
}

if (typeof document !== 'undefined') {
  const platform = document.body.dataset.platform;
  if (platform) setupOpener(platform);
  else if (!setupLegacyXLink()) setupGenerator();
}
