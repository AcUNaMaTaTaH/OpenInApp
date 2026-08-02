# OpenInApp

OpenInApp transforme un lien de tweet X/Twitter en un lien partageable qui tente d’ouvrir le tweet dans l’application X. Le projet est entièrement statique, sans suivi, sans dépendance et compatible avec GitHub Pages.

## Fonctionnement

Le générateur accepte uniquement les URL HTTPS des domaines `x.com`, `www.x.com`, `twitter.com`, `www.twitter.com` et `mobile.twitter.com`. Il extrait l’identifiant numérique et génère une URL de la forme :

```text
https://utilisateur.github.io/open-in-app/?x=2083774295998595510
```

À l’ouverture, la page reconstruit elle-même toutes les destinations depuis cet identifiant validé :

- iPhone/iPad : `twitter://status?id=IDENTIFIANT` ;
- Android : intent ciblant le paquet `com.twitter.android` ;
- ordinateur ou solution de secours : `https://x.com/i/status/IDENTIFIANT`.

Sur mobile, une tentative automatique est suivie d’un fallback web après environ 2,2 secondes. Le fallback est annulé si la page devient cachée. Un bouton manuel reste toujours visible.

## Limites importantes

Instagram et iOS contrôlent leurs mini-navigateurs. Selon leur version et les réglages de l’utilisateur, ils peuvent bloquer un deep link lancé automatiquement. OpenInApp ne contourne pas ces protections : le gros bouton manuel offre la solution la plus fiable lorsqu’une interaction est exigée. L’application X doit être installée. Le site n’envoie jamais automatiquement vers l’App Store.

## Tester localement

Node.js 18 ou plus récent suffit pour les tests :

```bash
npm test
```

Pour afficher le site, servez ce dossier avec le serveur statique de votre choix, par exemple `python -m http.server 8080`, puis ouvrez `http://localhost:8080`. Les liens externes réellement partagés doivent toutefois être servis en HTTPS.

## Créer le dépôt et publier

1. Sur GitHub, créez un dépôt public vide nommé `open-in-app` (sans README ni `.gitignore`).
2. Dans ce dossier, exécutez en remplaçant `VOTRE_COMPTE` :

```bash
git add .
git commit -m "Créer OpenInApp"
git remote add origin https://github.com/VOTRE_COMPTE/open-in-app.git
git push -u origin main
```

3. Sur GitHub, ouvrez **Settings → Pages**.
4. Dans **Build and deployment → Source**, choisissez **GitHub Actions**.
5. Ouvrez l’onglet **Actions** et attendez la fin du workflow « Déployer sur GitHub Pages ».
6. Le site sera disponible à `https://VOTRE_COMPTE.github.io/open-in-app/`.

Le workflow teste le JavaScript avant chaque déploiement sur la branche `main`.

## Test réel dans Instagram

1. Depuis le site publié, collez par exemple `https://x.com/interiorporn1/status/2083774295998595510?s=46`.
2. Copiez le lien généré.
3. Envoyez-le dans un vrai DM Instagram à un compte de test ou à un proche.
4. Ouvrez le lien depuis l’application Instagram sur iPhone puis Android si possible.
5. Vérifiez la tentative automatique, le bouton « Ouvrir dans l’application X » et le lien web secondaire.

Autres formats acceptés :

```text
https://twitter.com/compte/status/2083774295998595510
https://mobile.twitter.com/compte/status/2083774295998595510?s=46
```

## Renommer le dépôt

Les chemins sont relatifs : aucun changement de code n’est requis. Après renommage dans GitHub, mettez éventuellement à jour le remote local :

```bash
git remote set-url origin https://github.com/VOTRE_COMPTE/NOUVEAU_NOM.git
```

Le site devient `https://VOTRE_COMPTE.github.io/NOUVEAU_NOM/`. Les anciens liens ne sont pas automatiquement conservés.

## Domaine personnalisé

Dans **Settings → Pages → Custom domain**, saisissez votre domaine. Configurez ensuite les enregistrements DNS indiqués par GitHub et activez **Enforce HTTPS**. GitHub crée normalement le fichier `CNAME`; s’il disparaît lors d’un déploiement, ajoutez à la racine un fichier `CNAME` contenant uniquement votre domaine, puis commitez-le.

## Sécurité

Les protocoles non HTTPS, hôtes non autorisés et identifiants non numériques sont refusés. OpenInApp ne redirige jamais vers une URL fournie par l’utilisateur : les destinations sont reconstruites à partir de l’identifiant validé. Une Content Security Policy restrictive limite les ressources chargeables.
