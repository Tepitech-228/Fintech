# Trackr - Mise en production

## Prérequis
- Node.js 18+
- MySQL 8+
- npm

## 1. Configurer les variables d'environnement
```bash
cp back/.env.example back/.env
# Éditer back/.env avec vos credentials de production
```

Variables requises :
| Variable | Description |
|----------|-------------|
| `DB_HOST` | Hôte MySQL |
| `DB_PORT` | Port MySQL (3306) |
| `DB_NAME` | Nom de la base |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `PORT` | Port du serveur (3000) |
| `JWT_SECRET` | Clé secrète JWT (chaîne aléatoire longue) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Domaine du frontend (ex: `https://trackr.monsite.com`) |

## 2. Créer la base de données
```sql
CREATE DATABASE trackr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Initialiser les tables
```bash
cd back
npm run db:migrate
```

## 4. Builder le frontend et démarrer
```bash
npm run build    # Build Angular (output dans Front/dist/)
npm start        # Démarre le serveur (port 3000)
```

Le serveur sert l'API sur `/api/*` et le frontend sur toutes les autres routes.

## Déploiement avec PM2 (recommandé)
```bash
npm install -g pm2
pm2 start src/server.js --name trackr --update-env
pm2 save
pm2 startup
```
