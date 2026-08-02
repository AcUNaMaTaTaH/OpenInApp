import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTweetId, isValidTweetId, buildIOSDeepLink,
  buildAndroidIntent, buildWebUrl, buildShareUrl, detectPlatform
} from '../app.js';

const ID = '2083774295998595510';

test('extrait un tweet x.com valide', () => assert.equal(extractTweetId(`https://x.com/interiorporn1/status/${ID}`), ID));
test('extrait un tweet twitter.com valide', () => assert.equal(extractTweetId(`https://twitter.com/user/status/${ID}`), ID));
test('ignore les paramètres de partage', () => assert.equal(extractTweetId(`https://mobile.twitter.com/user/status/${ID}?s=46&t=test`), ID));
test('refuse un faux domaine', () => assert.throws(() => extractTweetId(`https://x.com.exemple.com/user/status/${ID}`), /domaine/));
test('refuse HTTP', () => assert.throws(() => extractTweetId(`http://x.com/user/status/${ID}`), /HTTPS/));
test('refuse une URL sans identifiant', () => assert.throws(() => extractTweetId('https://x.com/user/status/'), /identifiant/));
test('refuse un identifiant non numérique', () => {
  assert.equal(isValidTweetId('123abc'), false);
  assert.throws(() => extractTweetId('https://x.com/user/status/123abc'), /identifiant/);
});
test('génère la destination web', () => assert.equal(buildWebUrl(ID), `https://x.com/i/status/${ID}`));
test('génère le deep link iOS', () => assert.equal(buildIOSDeepLink(ID), `twitter://status?id=${ID}`));
test('génère l’intent Android avec fallback encodé', () => assert.equal(
  buildAndroidIntent(ID),
  `intent://twitter.com/i/status/${ID}#Intent;package=com.twitter.android;scheme=https;S.browser_fallback_url=https%3A%2F%2Fx.com%2Fi%2Fstatus%2F${ID};end`
));
test('génère un lien partageable relatif au dépôt Pages', () => assert.equal(
  buildShareUrl(ID, { href: 'https://utilisateur.github.io/open-in-app/index.html?old=1#x' }),
  `https://utilisateur.github.io/open-in-app/index.html?x=${ID}`
));
test('détecte iOS, iPadOS, Android et ordinateur', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (iPhone)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Macintosh)', 5), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 15)'), 'android');
  assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0)'), 'desktop');
});
