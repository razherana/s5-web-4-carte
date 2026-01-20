# 🗺️ Module Carte Offline - OpenStreetMap

Serveur de tuiles OpenStreetMap local pour afficher la carte d'Antananarivo/Madagascar en mode **offline**.

## 📋 Prérequis

- Docker & Docker Compose installés
- Au moins 4 GB de RAM disponible
- 10-20 GB d'espace disque
- Le fichier `data/antananarivo.osm.pbf` (recommandé) **ou** `data/madagascar-260118.osm.pbf`

## 🚀 Installation et Démarrage

### Étape 0 : Extraire Antananarivo (recommandé)

Si vous voulez **uniquement Antananarivo**, utilisez le script d’extraction :

```bash
./extract-antananarivo.sh
```

Cela crée `data/antananarivo.osm.pbf` **et** `data/region.osm.pbf` (nom attendu par le serveur).

### Étape 1 : Import initial des données

La première fois, il faut importer les données OSM dans la base PostgreSQL :

```bash
./import.sh
```

Le script lance l’import puis démarre le serveur automatiquement.

⏱️ **Durée :** 10-30 minutes selon votre machine

L'import va :
- Créer une base PostgreSQL avec PostGIS
- Importer **Antananarivo** (si l’extrait existe) ou Madagascar
- Générer les métadonnées pour le serveur de tuiles

### Étape 2 : Relancer en mode serveur

Le serveur tourne maintenant en arrière-plan.

## 🌐 Utilisation

### URLs disponibles

- **Interface web :** http://localhost:8080
- **Tuiles PNG :** `http://localhost:8080/tile/{z}/{x}/{y}.png`

### Tester le serveur

Ouvrez [test-map.html](maps/test-map.html) dans un navigateur pour voir la carte interactive.

## 🧭 Intégration avec Leaflet

Dans votre application web :

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: 600px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Centrer sur Antananarivo
        var map = L.map('map').setView([-18.8792, 47.5079], 13);

        // Utiliser le serveur local
        L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
            maxZoom: 19,
            minZoom: 10,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Ajouter des markers pour les signalements
        L.marker([-18.8792, 47.5079]).addTo(map)
            .bindPopup('Exemple de signalement');
    </script>
</body>
</html>
```

## 📦 Structure du Projet

```
maps/
├── docker-compose.yml      # Configuration Docker
├── import.sh              # Script d'import automatique
├── README.md              # Cette documentation
├── test-map.html          # Page de test Leaflet
├── .gitignore             # Fichiers à ignorer
└── data/
    ├── antananarivo.osm.pbf      # Extrait Antananarivo (recommandé)
    └── madagascar-260118.osm.pbf # Données OSM Madagascar
```

## 🔧 Commandes Utiles

### Arrêter le serveur
```bash
docker-compose down
```

### Voir les logs
```bash
docker-compose logs -f
```

### Réimporter les données (nettoyage complet)
```bash
docker-compose down -v
docker-compose up
```

### Vérifier l'état
```bash
docker-compose ps
```

## 🌍 Mode Online vs Offline

### Web (avec ce module)
- **Offline :** Utilise `http://localhost:8080` (ce serveur Docker)
- **Online :** Peut utiliser `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### Mobile
- **Toujours online :** Les applications mobiles utilisent les serveurs publics OSM
- Pas de Docker sur iOS/Android

## 📊 Consommation de Ressources

- **RAM :** ~2-4 GB pendant l'import, ~500 MB en fonctionnement
- **CPU :** ~80% pendant l'import, ~5% en fonctionnement
- **Disque :** ~8-15 GB pour Madagascar

## ❓ Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 8080 n'est pas utilisé : `lsof -i :8080`
- Augmentez la mémoire Docker dans les préférences

### L'import échoue
- Vérifiez l'espace disque disponible
- Assurez-vous d'avoir au moins 4 GB de RAM
- Réessayez avec un nettoyage complet : `docker-compose down -v`

### Les tuiles ne s'affichent pas
- Vérifiez que l'import est complété
- Testez l'URL : http://localhost:8080/tile/10/547/512.png
- Vérifiez la commande : doit être `run` et non `import`

## 🎯 Prochaines Étapes

1. ✅ Serveur OSM fonctionnel
2. ✅ Données Madagascar importées
3. → Intégrer Leaflet dans votre application web
4. → Ajouter les markers des signalements depuis Firebase
5. → Styliser la carte selon vos besoins

## 📝 Notes

- Ce module **ne gère que la carte**, pas les signalements
- Pour n’importer **que Antananarivo**, gardez uniquement `antananarivo.osm.pbf` dans `data/`
- Les signalements viennent de votre module web + Firebase
- La carte offline fonctionne uniquement sur le web, pas sur mobile
