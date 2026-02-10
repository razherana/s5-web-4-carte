@echo off
setlocal enabledelayedexpansion

rem Script d'import des donnees OSM (Antananarivo ou Madagascar)

cd /d "%~dp0"

set "DATA_DIR=%~dp0data"
if not exist "%DATA_DIR%\" (
  echo ❌ Erreur : dossier ./data/ introuvable dans %~dp0
  exit /b 1
)

rem Choisir le fichier a importer (priorite a Antananarivo)
set "DATA_FILE=%DATA_DIR%\antananarivo.osm.pbf"
if not exist "%DATA_FILE%" set "DATA_FILE=%DATA_DIR%\madagascar-260118.osm.pbf"

rem Verifier que le fichier OSM existe
if not exist "%DATA_FILE%" (
  echo ❌ Erreur : aucun fichier OSM trouve dans ./data/
  echo.
  echo 📥 Telechargez Madagascar : https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
  echo 🧩 Ou creez l'extrait Antananarivo : .\extract-antananarivo.bat
  exit /b 1
)

echo ✅ Fichier selectionne : %DATA_FILE%
if exist "%DATA_DIR%\antananarivo.osm.pbf" if exist "%DATA_DIR%\madagascar-260118.osm.pbf" (
  echo ⚠️  Attention : deux fichiers .osm.pbf detectes.
  echo     Gardez seulement antananarivo.osm.pbf pour un import cible.
)

rem Augmenter les timeouts Docker (reseau lent)
set "COMPOSE_HTTP_TIMEOUT=600"
set "DOCKER_CLIENT_TIMEOUT=600"

rem Preflight: verifier l'acces aux sources externes (evite un blocage silencieux)
set "WATER_URL=https://osmdata.openstreetmap.de/download/water-polygons-split-3857.zip"
set "SIMPLIFIED_URL=https://osmdata.openstreetmap.de/download/simplified-water-polygons-split-3857.zip"
for %%U in ("%WATER_URL%" "%SIMPLIFIED_URL%") do (
  powershell -NoProfile -Command "try { iwr -Method Head -Uri '%%~U' -TimeoutSec 15 | Out-Null; exit 0 } catch { exit 1 }"
  if errorlevel 1 (
    echo ❌ Acces impossible a %%~U
    echo    Verifiez proxy/pare-feu/DNS avant l'import.
    exit /b 1
  )
)

rem Copier vers le nom attendu par le serveur
echo 🧩 Preparation du fichier region.osm.pbf...
set "REGION_FILE=%DATA_DIR%\region.osm.pbf"
copy /y "%DATA_FILE%" "%REGION_FILE%" >nul
if errorlevel 1 (
  echo ❌ Erreur : impossible de copier vers %REGION_FILE%
  exit /b 1
)

rem Nettoyer les donnees existantes si besoin
set /p REPLY=⚠️  Supprimer les donnees existantes ? (y/N) 
if /i "%REPLY%"=="y" (
  echo 🧹 Nettoyage des volumes Docker...
  docker-compose down -v
)

rem Lancer l'import en mode dedie
echo 🚀 Lancement de l'import (cela peut prendre du temps)...
docker-compose run --rm osm-tileserver import
if errorlevel 1 exit /b 1

rem Demarrer le serveur en mode run
echo ✅ Import termine. Demarrage du serveur...
docker-compose up -d
if errorlevel 1 exit /b 1

echo.
echo ✅ Serveur demarre !
echo 🌐 Le serveur est accessible sur : http://localhost:8080
echo 📍 URL des tuiles : http://localhost:8080/tile/{z}/{x}/{y}.png

endlocal
