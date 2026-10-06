# Miette et l’arbre-monde

Une balade contemplative en 3D, à hauteur de fourmi. Miette commence sur une branche, au cœur d’un arbre gigantesque, puis choisit son chemin parmi la canopée, un jardin de fleurs-lanternes et les racines rêveuses. Pas de combat ni de course : le plaisir est de se perdre dans le décor, d’observer et de réveiller trois lueurs cachées.

## Jouer

- **Sur téléphone :** faites glisser le bouton rond en bas à gauche. Tirez vers le bas pour avancer ; poussez-le à gauche ou à droite pour orienter Miette. Elle s’arrête dès que vous relâchez.
- **Sur ordinateur :** utilisez les flèches ou **WASD**. **Observer** (ou la barre d’espace) révèle une petite histoire du lieu ; **M** ouvre le carnet.
- Le carnet conserve les lueurs découvertes sur l’appareil. Le site installable met aussi ses fichiers en cache pour les visites hors ligne après le premier chargement.

## Lancer en local

```sh
npm ci
npm run dev
```

Pour vérifier la version publiée :

```sh
npm run build
npm run preview
```

## APK Android

Le workflow **« Construire l’APK Android »** se lance à chaque push sur `main` ou sur une branche `arena/**`, et peut également être démarré depuis l’onglet **Actions** avec **Run workflow**. À la fin, téléchargez `miette-arbre-des-murmures-apk` dans **Artifacts**. Il s’agit d’un APK de débogage installable, construit avec Capacitor ; il n’est pas signé pour le Play Store.

Pour le construire localement après avoir installé le SDK Android :

```sh
npm ci
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Publication web

Le workflow **« Publier le jeu web »** construit `dist/` sur `main` et `arena/**` et en conserve aussi une copie dans **Artifacts**. Si GitHub Pages est activé, il déploie le site automatiquement ; sinon, activez **Settings → Pages → Build and deployment → GitHub Actions**. Le jeu est livré comme site statique et n’a besoin d’aucun serveur de jeu.

## Technologies

- Three.js : scène 3D procédurale, arbre, feuillage, particules et suivi de Miette.
- Vite : développement et compilation du site.
- Capacitor : conteneur Android généré par le workflow.
