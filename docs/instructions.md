# Démarrage complet du projet

## Prérequis
- Docker Desktop installé et en cours d’exécution

## 1) Importer les données de la carte
```bash
cd web-carte/maps
chmod +x import.sh
./import.sh
```

## 2) Lancer toute la stack
Depuis la racine du projet :
```bash
docker-compose up -d
```

## 3) Lancer les migrations de la base PostgreSQL
Dans un autre terminal, depuis la racine du projet :
```bash
docker-compose exec backend php artisan migrate
```

## 4) Accès aux services
- Backend (API) : http://localhost:8000
- Frontend : http://localhost:5173
- Tile server : http://localhost:8080