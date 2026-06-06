# Fintech

Application de gestion financière personnelle — Angular 21 + Express.js + MySQL.

## Stack
- **Frontend** : Angular 21.2.0 (standalone, signals)
- **Backend** : Express.js + Sequelize ORM
- **Base de données** : MySQL 8
- **Déploiement** : mono-serveur (backend sert le frontend buildé)

## Démarrage rapide
```bash
cd back
cp .env.example .env    # éditer les credentials
npm run db:migrate      # créer les tables
npm run build           # build Angular
npm start               # http://localhost:3000
```

Voir `DEPLOY.md` pour la mise en production complète.
