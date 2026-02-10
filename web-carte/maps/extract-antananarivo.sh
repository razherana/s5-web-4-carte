#!/bin/bash
# Extrait Antananarivo depuis le PBF Madagascar en utilisant osmium-tool (Docker)

set -e

SOURCE_PBF="./data/madagascar-260118.osm.pbf"
TARGET_PBF="./data/antananarivo.osm.pbf"
REGION_PBF="./data/region.osm.pbf"
DOWNLOAD_URL="https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"

# BBOX Antananarivo (approx.) : minLon,minLat,maxLon,maxLat
BBOX="47.35,-18.98,47.70,-18.75"

if [ ! -f "$SOURCE_PBF" ]; then
  echo "❌ Fichier source introuvable : $SOURCE_PBF"
  echo "📥 Téléchargement Antananarivo"

  mkdir -p ./data
  curl -L -o "$SOURCE_PBF" "$DOWNLOAD_URL"
fi

echo "🧩 Extraction Antananarivo depuis Madagascar..."

docker run --rm -v "$PWD/data:/data" stefda/osmium-tool \
  osmium extract -b "$BBOX" /data/madagascar-260118.osm.pbf -o /data/antananarivo.osm.pbf --overwrite

echo "✅ Extraction terminée : $TARGET_PBF"

echo "🧩 Copie vers region.osm.pbf (nom attendu par le serveur)"
cp -f "$TARGET_PBF" "$REGION_PBF"
