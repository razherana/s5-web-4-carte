#!/bin/bash
# Script d'import des données OSM (Antananarivo ou Madagascar)

echo "🗺️  Démarrage du serveur OSM avec import des données..."
echo ""
echo "📦 Ce processus va :"
echo "  - Importer le fichier antananarivo.osm.pbf (si disponible)"
echo "  - Sinon importer madagascar-260118.osm.pbf"
echo "  - Créer la base de données PostgreSQL"
echo "  - Générer les tuiles de base"
echo ""
echo "⏱️  Durée estimée : 10-30 minutes selon votre machine"
echo ""

# Choisir le fichier à importer (priorité à Antananarivo)
DATA_FILE="./data/antananarivo.osm.pbf"
if [ ! -f "$DATA_FILE" ]; then
    DATA_FILE="./data/madagascar-260118.osm.pbf"
fi

# Vérifier que le fichier OSM existe
if [ ! -f "$DATA_FILE" ]; then
    echo "❌ Erreur : aucun fichier OSM trouvé dans ./data/"
    echo ""
    echo "📥 Téléchargez Madagascar : https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"
    echo "🧩 Ou créez l'extrait Antananarivo : ./extract-antananarivo.sh"
    exit 1
fi

echo "✅ Fichier sélectionné : $DATA_FILE"
if [ -f "./data/antananarivo.osm.pbf" ] && [ -f "./data/madagascar-260118.osm.pbf" ]; then
    echo "⚠️  Attention : deux fichiers .osm.pbf détectés."
    echo "    Gardez seulement antananarivo.osm.pbf pour un import ciblé."
fi

# Copier vers le nom attendu par le serveur
echo "🧩 Préparation du fichier region.osm.pbf..."
cp -f "$DATA_FILE" ./data/region.osm.pbf

# Nettoyer les données existantes si besoin
read -p "⚠️  Supprimer les données existantes ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Nettoyage des volumes Docker..."
    docker-compose down -v
fi

# Lancer l'import en mode dédié
echo "🚀 Lancement de l'import (cela peut prendre du temps)..."
docker-compose run --rm osm-tileserver import

# Démarrer le serveur en mode run
echo "✅ Import terminé. Démarrage du serveur..."
docker-compose up -d

echo ""
echo "✅ Serveur démarré !"
echo "🌐 Le serveur est accessible sur : http://localhost:8080"
echo "📍 URL des tuiles : http://localhost:8080/tile/{z}/{x}/{y}.png"
