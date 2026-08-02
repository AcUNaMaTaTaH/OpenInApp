# OpenInApp

OpenInApp transforme un lien de réseau social en lien partageable qui tente d’ouvrir le contenu dans l’application correspondante. Le projet est entièrement statique, sans suivi, sans dépendance et compatible avec GitHub Pages.

## Fonctionnement

Le générateur accepte uniquement les URL HTTPS de X/Twitter, Instagram, TikTok, YouTube, Facebook, Threads, Reddit, LinkedIn, Pinterest et Snapchat. Il identifie le réseau, normalise le lien et génère une page de partage propre à la plateforme :

```text
https://utilisateur.github.io/OpenInApp/x.html?target=...
```

À l’ouverture, la page revalide le domaine et reconstruit toutes les destinations. Un lien ne peut pas être transformé en redirecteur vers un autre domaine.

- iPhone/iPad : deep link public lorsqu’il est stable (notamment X, YouTube, Reddit, Pinterest et Snapchat), sinon lien universel HTTPS ;
- Android : intent ciblant explicitement l’application du réseau avec fallback HTTPS ;
- ordinateur : ouverture directe du contenu sur le site du réseau.

Sur mobile, une tentative automatique retardée est suivie d’un fallback web. Le fallback est annulé si la page devient cachée. Pour éviter un blocage observé dans certains mini-navigateurs Instagram, le même lien n’est pas rouvert automatiquement une deuxième fois pendant 30 minutes dans la même session : le bouton manuel reste disponible. Les anciens liens `?x=IDENTIFIANT` restent compatibles.

Chaque réseau possède une page avec des métadonnées Open Graph statiques et un visuel OpenInApp. GitHub Pages ne peut pas récupérer dynamiquement le texte et l’image de la publication cible : cela nécessiterait un serveur et parfois les API officielles des réseaux.

## Limites importantes

Instagram et iOS contrôlent leurs mini-navigateurs. Selon leur version, le réseau et les réglages de l’utilisateur, ils peuvent bloquer un deep link lancé automatiquement. OpenInApp ne contourne pas ces protections : le gros bouton manuel offre la solution la plus fiable lorsqu’une interaction est exigée. L’application correspondante doit être installée. Le site n’envoie jamais automatiquement vers l’App Store ou Google Play.

## Tester localement

Node.js 18 ou plus récent suffit pour les tests :

```bash
npm test
```

Pour afficher le site, servez ce dossier avec le serveur statique de votre choix, par exemple `python -m http.server 8080`, puis ouvrez `http://localhost:8080`. Les liens externes réellement partagés doivent toutefois être servis en HTTPS.

## Créer le dépôt et publier

1. Sur GitHub, créez un dépôt public vide, par exemple `OpenInApp` (sans README ni `.gitignore`).
2. Dans ce dossier, exécutez en remplaçant `VOTRE_COMPTE` :

```bash
git add .
git commit -m "Créer OpenInApp"
git remote add origin https://github.com/VOTRE_COMPTE/OpenInApp.git
git push -u origin main
```

3. Sur GitHub, ouvrez **Settings → Pages**.
4. Dans **Build and deployment → Source**, choisissez **GitHub Actions**.
5. Ouvrez l’onglet **Actions** et attendez la fin du workflow « Déployer sur GitHub Pages ».
6. Le site sera disponible à `https://VOTRE_COMPTE.github.io/OpenInApp/`.

Le workflow teste le JavaScript avant chaque déploiement sur la branche `main`.

## Test réel dans Instagram

1. Depuis le site publié, collez par exemple `https://x.com/interiorporn1/status/2083774295998595510?s=46`.
2. Copiez le lien généré.
3. Envoyez-le dans un vrai DM Instagram à un compte de test ou à un proche.
4. Ouvrez le lien depuis l’application Instagram sur iPhone puis Android si possible.
5. Vérifiez la tentative automatique, le bouton d’ouverture manuelle et le lien web secondaire.
6. Revenez dans Instagram et rouvrez immédiatement le même lien : la seconde ouverture doit attendre une pression sur le bouton.

Autres formats acceptés :

```text
https://twitter.com/compte/status/2083774295998595510
https://mobile.twitter.com/compte/status/2083774295998595510?s=46
https://www.instagram.com/reel/ABC123/
https://www.tiktok.com/@compte/video/1234567890123456789
https://youtu.be/dQw4w9WgXcQ
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

Les protocoles non HTTPS, hôtes non autorisés, identifiants de publication invalides et URL contenant des identifiants de connexion sont refusés. Chaque destination reçue depuis un lien partagé est revalidée et normalisée avant navigation : OpenInApp ne peut pas devenir un redirecteur ouvert. Une Content Security Policy restrictive limite les ressources chargeables.
