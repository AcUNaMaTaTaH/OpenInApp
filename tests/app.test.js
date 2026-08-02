import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NETWORKS, parseSocialUrl, validateSharedTarget, buildShareUrl, buildOpenerUrl,
  buildWebDestination, buildIOSDestination, buildAndroidDestination,
  extractTweetId, isValidTweetId, detectPlatform
} from '../app.js';

const TWEET_ID = '2083774295998595510';

const CASES = [
  ['x', `https://x.com/interiorporn1/status/${TWEET_ID}?s=46`, `https://x.com/interiorporn1/status/${TWEET_ID}`],
  ['instagram', 'https://www.instagram.com/reel/ABC_123/?utm_source=test', 'https://www.instagram.com/reel/ABC_123/'],
  ['tiktok', 'https://www.tiktok.com/@user/video/7412345678901234567?is_from_webapp=1', 'https://www.tiktok.com/@user/video/7412345678901234567?is_from_webapp=1'],
  ['youtube', 'https://youtu.be/dQw4w9WgXcQ?si=tracking', 'https://youtu.be/dQw4w9WgXcQ'],
  ['facebook', 'https://www.facebook.com/user/posts/123?utm_campaign=test', 'https://www.facebook.com/user/posts/123'],
  ['threads', 'https://www.threads.net/@user/post/ABC123', 'https://www.threads.net/@user/post/ABC123'],
  ['reddit', 'https://www.reddit.com/r/webdev/comments/abc123/title/?utm_medium=share', 'https://www.reddit.com/r/webdev/comments/abc123/title/'],
  ['linkedin', 'https://www.linkedin.com/posts/user_example-123?utm_source=share', 'https://www.linkedin.com/posts/user_example-123'],
  ['pinterest', 'https://www.pinterest.com/pin/123456789/', 'https://www.pinterest.com/pin/123456789/'],
  ['snapchat', 'https://www.snapchat.com/add/example.user', 'https://www.snapchat.com/add/example.user']
];

for (const [platform, input, expected] of CASES) {
  test(`reconnaît et normalise ${NETWORKS[platform].name}`, () => {
    assert.deepEqual(parseSocialUrl(input), { platform, name: NETWORKS[platform].name, url: expected });
  });
}

test('accepte les anciens domaines Twitter et extrait le tweet', () => {
  assert.equal(extractTweetId(`https://mobile.twitter.com/user/status/${TWEET_ID}?s=46`), TWEET_ID);
  assert.equal(isValidTweetId(TWEET_ID), true);
});

test('refuse HTTP, les identifiants et les faux domaines', () => {
  assert.throws(() => parseSocialUrl('http://x.com/user/status/2083774295998595510'), /HTTPS/);
  assert.throws(() => parseSocialUrl('https://name:password@x.com/user'), /unsupported/);
  assert.throws(() => parseSocialUrl('https://x.com.example.com/user/status/2083774295998595510'), /not supported/);
  assert.throws(() => parseSocialUrl('https://evilinstagram.com/reel/ABC'), /not supported/);
});

test('refuse les contenus incomplets ou les identifiants X invalides', () => {
  assert.throws(() => parseSocialUrl('https://www.instagram.com/'), /does not point/);
  assert.throws(() => parseSocialUrl('https://x.com/user/status/not-a-number'), /valid X post ID/);
  assert.throws(() => parseSocialUrl('https://www.youtube.com/watch'), /valid video ID/);
});

test('empêche de déguiser une plateforme dans une page différente', () => {
  assert.throws(() => validateSharedTarget('instagram', `https://x.com/user/status/${TWEET_ID}`), /does not match/);
});

test('génère une page partageable relative au sous-dossier GitHub Pages', () => {
  const parsed = parseSocialUrl('https://www.instagram.com/p/ABC123/');
  assert.equal(
    buildShareUrl(parsed, { href: 'https://utilisateur.github.io/OpenInApp/index.html?old=1' }),
    'https://utilisateur.github.io/OpenInApp/instagram.html?target=https%3A%2F%2Fwww.instagram.com%2Fp%2FABC123%2F'
  );
});

test('sépare l’URL partagée de l’URL utilisée par le mini-navigateur', () => {
  const target = `https://x.com/user/status/${TWEET_ID}`;
  const shared = buildShareUrl({ platform: 'x', url: target }, { href: 'https://user.github.io/OpenInApp/' });
  const opener = buildOpenerUrl('x', target, { href: shared }, 'try-123');
  assert.equal(shared, `https://user.github.io/OpenInApp/x.html?target=https%3A%2F%2Fx.com%2Fuser%2Fstatus%2F${TWEET_ID}`);
  assert.equal(opener, `https://user.github.io/OpenInApp/open.html?platform=x&target=https%3A%2F%2Fx.com%2Fuser%2Fstatus%2F${TWEET_ID}&attempt=try-123`);
  assert.notEqual(new URL(shared).pathname, new URL(opener).pathname);
});

test('reconstruit toujours la destination web validée', () => {
  assert.equal(buildWebDestination('x', `https://twitter.com/user/status/${TWEET_ID}?s=46`), `https://x.com/user/status/${TWEET_ID}`);
});

test('génère les destinations iOS documentées ou universelles', () => {
  assert.equal(buildIOSDestination('x', `https://x.com/user/status/${TWEET_ID}`), `twitter://status?id=${TWEET_ID}`);
  assert.equal(buildIOSDestination('youtube', 'https://youtu.be/dQw4w9WgXcQ'), 'youtube://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(buildIOSDestination('pinterest', 'https://www.pinterest.com/pin/123456789/'), 'pinterest://pin/123456789');
  assert.equal(buildIOSDestination('instagram', 'https://www.instagram.com/p/ABC123/'), 'https://www.instagram.com/p/ABC123/');
});

test('génère un intent Android ciblé avec fallback sûr', () => {
  const web = 'https://www.instagram.com/reel/ABC123/';
  assert.equal(
    buildAndroidDestination('instagram', web),
    `intent://www.instagram.com/reel/ABC123/#Intent;scheme=https;package=com.instagram.android;S.browser_fallback_url=${encodeURIComponent(web)};end`
  );
});

test('détecte iOS, iPadOS, Android et ordinateur', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (iPhone)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Macintosh)', 5), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 15)'), 'android');
  assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0)'), 'desktop');
});
