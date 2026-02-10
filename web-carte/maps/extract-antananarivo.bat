@echo off
setlocal enabledelayedexpansion

rem Extrait Antananarivo depuis le PBF Madagascar en utilisant osmium-tool (Docker)

cd /d "%~dp0"

set "SOURCE_PBF=./data/madagascar-260118.osm.pbf"
set "TARGET_PBF=./data/antananarivo.osm.pbf"
set "REGION_PBF=./data/region.osm.pbf"

rem BBOX Antananarivo (approx.) : minLon,minLat,maxLon,maxLat
set "BBOX=47.35,-18.98,47.70,-18.75"

if not exist "%SOURCE_PBF%" (
  echo ❌ Fichier source introuvable : %SOURCE_PBF%
  echo 📥 Telechargez-le depuis : https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
  exit /b 1
)

echo 🧩 Extraction Antananarivo depuis Madagascar...

docker run --rm -v "%cd%/data:/data" stefda/osmium-tool ^
  osmium extract -b "%BBOX%" /data/madagascar-260118.osm.pbf -o /data/antananarivo.osm.pbf
if errorlevel 1 exit /b 1

echo ✅ Extraction terminee : %TARGET_PBF%

echo 🧩 Copie vers region.osm.pbf (nom attendu par le serveur)
copy /y "%TARGET_PBF%" "%REGION_PBF%" >nul
if errorlevel 1 exit /b 1

endlocal
