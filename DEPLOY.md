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

---

## Déploiement sur Render

### 1. Provisionner une base MySQL

Render ne propose pas MySQL nativement. Options gratuites :
- **Aiven** (avien.io) — MySQL free tier, 1 GB RAM
- **PlanetScale** — MySQL-compatible serverless
- **Railway** — addon MySQL

Crée la base et note le `DB_HOST`, `DB_USER`, `DB_PASSWORD`.

### 2. Déployer via Blueprint (render.yaml)

Le fichier `render.yaml` est déjà configuré à la racine. Sur Render :
1. **Dashboard → New → Blueprint**
2. Connecte le repo `Tepitech-228/Fintech`
3. Render détecte automatiquement `render.yaml`
4. Renseigne les variables manquantes dans le Dashboard :
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD` (MySQL)
5. Lance le déploiement

### 3. Ou déploiement manuel (Web Service)

1. **Dashboard → New → Web Service**
2. Connecte le repo
3. **Root Directory** : `back`
4. **Build Command** : `npm install && npm run build`
5. **Start Command** : `npm start`
6. **Plan** : Free
7. Ajoute les variables d'env (voir render.yaml)
8. Crée et déploie

### 4. Migrations initiales

Après le premier déploiement, exécute les migrations :
```bash
# Via Render Shell ou un run ponctuel :
npm run db:migrate
```
