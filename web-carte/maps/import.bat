@echo off
setlocal enabledelayedexpansion

rem Script d'import des donnees OSM (Antananarivo ou Madagascar)

cd /d "%~dp0"

echo 🗺️  Demarrage du serveur OSM avec import des donnees...
echo.
echo 📦 Ce processus va :
echo   - Importer le fichier antananarivo.osm.pbf (si disponible)
echo   - Sinon importer madagascar-260118.osm.pbf
echo   - Creer la base de donnees PostgreSQL
echo   - Generer les tuiles de base
echo.
echo ⏱️  Duree estimee : 10-30 minutes selon votre machine
echo.

rem Choisir le fichier a importer (priorite a Antananarivo)
set "DATA_FILE=./data/antananarivo.osm.pbf"
if not exist "%DATA_FILE%" set "DATA_FILE=./data/madagascar-260118.osm.pbf"

rem Verifier que le fichier OSM existe
if not exist "%DATA_FILE%" (
  echo ❌ Erreur : aucun fichier OSM trouve dans ./data/
  echo.
  echo 📥 Telechargez Madagascar : https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
  echo 🧩 Ou creez l'extrait Antananarivo : .\extract-antananarivo.bat
  exit /b 1
)

echo ✅ Fichier selectionne : %DATA_FILE%
if exist "./data/antananarivo.osm.pbf" if exist "./data/madagascar-260118.osm.pbf" (
  echo ⚠️  Attention : deux fichiers .osm.pbf detectes.
  echo     Gardez seulement antananarivo.osm.pbf pour un import cible.
)

rem Copier vers le nom attendu par le serveur
echo 🧩 Preparation du fichier region.osm.pbf...
copy /y "%DATA_FILE%" "./data/region.osm.pbf" >nul
if errorlevel 1 exit /b 1

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
