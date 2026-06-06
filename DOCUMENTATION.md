# Trackr - Application de Gestion Financière

Application web de gestion de finances personnelles avec suivi des comptes, transactions, budgets, epargne, projets et taches.

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular 21 (standalone components) |
| Backend | Express.js (Node.js) |
| ORM | Sequelize |
| Base de donnees | MySQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Charts | Chart.js |
| UI | Custom CSS (design system via variables CSS) |

---

## Architecture

```
Front/                    Back/
  src/                      src/
    app/                      server.js           # Point d'entree
      app.ts                  db/
      app.config.ts             config.js         # Connexion MySQL
      app.routes.ts             init.js           # Reset DB (force sync)
      models/                 middleware/
        index.ts                index.js          # Auth JWT
      services/               models/
        api.service.ts          index.js          # Associations
        format.ts               User.js, Account.js, ...
      resolvers/              controllers/
        data.resolver.ts        login.js, accounts.js, ...
      layouts/                routes/
        sidebar.ts  + .html     index.js          # Toutes les routes
      pages/                  seed.js             # Donnees de test
        dashboard/
        portefeuille/
        accounts/
        transactions/
        budget-analysis/
        savings/
        projects-tasks/
        bilan/
        settings/
        calendar/
        transaction-form/
      components/
        chart/
        loading/
    public/
      logodepense.png
```

---

## Base de Donnees

### Tables

| Table | Description | Colonnes principales |
|-------|-------------|---------------------|
| `Users` | Utilisateurs | id, name, email, password (hashe), currency, locale, theme |
| `Accounts` | Comptes bancaires | id, userId, name, type (checking/savings/investment/cash/credit), balance, currency, color |
| `Categories` | Categories de transactions | id, userId, name, type (income/expense/investment/debt), color, accountId (optionnel), monthlyBudget |
| `Transactions` | Transactions | id, userId, accountId, categoryId, goalId (optionnel), type, amount, description, date, isRecurring, recurringInterval, status |
| `Budgets` | Budgets mensuels par categorie | id, userId, categoryId, month (YYYY-MM), amount |
| `SavingGoals` | Objectifs d'epargne | id, userId, name, targetAmount, currentAmount, deadline, color |
| `Tasks` | Taches | id, userId, title, description, dueDate, priority (low/medium/high), status (todo/in_progress/done) |
| `Projects` | Projets | id, userId, name, description, budget, spent, status (planning/active/completed/on_hold), startDate, endDate, color |

### Relations

```
User 1---N Account (userId)
User 1---N Category (userId)
User 1---N Transaction (userId)
User 1---N Budget (userId)
User 1---N SavingGoal (userId)
User 1---N Task (userId)
User 1---N Project (userId)

Account 1---N Category (accountId)        [optionnel]
Account 1---N Transaction (accountId)

Category 1---N Transaction (categoryId)
Category 1---N Budget (categoryId)

SavingGoal 1---N Transaction (goalId)     [optionnel]
```

---

## API REST

### Authentification

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion (email + password) |
| POST | `/api/auth/register` | Inscription |

Toutes les routes suivantes necessitent un token JWT (header `Authorization: Bearer <token>`) ou le header `x-user-id` (dev).

### Comptes

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/accounts` | Liste des comptes |
| GET | `/api/accounts/:id` | Detail d'un compte |
| POST | `/api/accounts` | Creer un compte |
| PUT | `/api/accounts/:id` | Modifier un compte |
| DELETE | `/api/accounts/:id` | Supprimer (bloque si transactions liees) |

### Categories

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/categories` | Liste des categories |
| GET | `/api/categories/summary` | Resume par categorie (total, monthlySpent, budgetRemaining) |
| POST | `/api/categories` | Creer une categorie |
| PUT | `/api/categories/:id` | Modifier une categorie |
| DELETE | `/api/categories/:id` | Supprimer une categorie |

### Transactions

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/transactions` | Liste (filtres : type, categoryId, accountId, date) |
| GET | `/api/transactions/:id` | Detail |
| GET | `/api/transactions/monthly/:year/:month` | Transactions du mois |
| POST | `/api/transactions` | Creer (met a jour le solde du compte + objectif epargne) |
| PUT | `/api/transactions/:id` | Modifier (inverse l'effet ancien, applique le nouveau) |
| DELETE | `/api/transactions/:id` | Supprimer (inverse l'effet sur le solde) |

### Budgets

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/budgets` | Liste des budgets |
| GET | `/api/budgets/overview/:year/:month` | Vue d'ensemble (avec depenses reelles) |
| POST | `/api/budgets` | Creer un budget |
| PUT | `/api/budgets/:id` | Modifier |
| DELETE | `/api/budgets/:id` | Supprimer |

### Epargne

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/savings` | Liste des objectifs |
| POST | `/api/savings` | Creer un objectif |
| PUT | `/api/savings/:id` | Modifier |
| DELETE | `/api/savings/:id` | Supprimer |

### Taches et Projets

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/tasks` | Liste des taches |
| POST | `/api/tasks` | Creer |
| PUT | `/api/tasks/:id` | Modifier |
| DELETE | `/api/tasks/:id` | Supprimer |
| GET | `/api/projects` | Liste des projets |
| POST | `/api/projects` | Creer |
| PUT | `/api/projects/:id` | Modifier |
| DELETE | `/api/projects/:id` | Supprimer |

### Virements et Rapport

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/transfers` | Virement entre comptes (2 transactions, atomique) |
| GET | `/api/report/monthly/:year/:month` | Rapport mensuel (revenus, depenses, budget, top categories) |
| GET | `/api/dashboard` | Tableau de bord (soldes, transactions recentes, objectifs) |
| POST | `/api/recurring/process` | Generer les transactions recurrentes |

### Profil

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/profile` | Profil utilisateur |
| PUT | `/api/profile` | Modifier le profil |

---

## Pages Frontend

| Route | Page | Donnees chargees (resolver) |
|-------|------|----------------------------|
| `/` | Dashboard | Tableau de bord + graphique 6 mois |
| `/portefeuille` | Portefeuille | Comptes, depenses, distribution, projets, taches |
| `/accounts` | Avoirs | Liste des comptes + formulaire virement |
| `/transactions` | Depenses | Transactions, categories, comptes, objectifs |
| `/budget-analysis` | Budget & Analyse | Categories, resume, budgets du mois |
| `/savings` | Epargne | Objectifs d'epargne |
| `/projects-tasks` | Projets & Taches | Projets et taches |
| `/bilan` | Bilan Mensuel | Rapport du mois (revenus, depenses, taux d'epargne) |
| `/settings` | Parametres | Profil utilisateur |
| `/calendar` | Calendrier | Transactions du mois, taches, projets |
| `/transaction/:id` | Edition transaction | Categories, comptes, transaction (si edition) |

---

## Logique Metier

### Solde des comptes (balance)

- Compte **non-credit** + transaction `income` : `balance += amount`
- Compte **non-credit** + transaction `expense/investment/debt` : `balance -= amount`
- Compte **credit** : `balance += amount` quel que soit le type (la dette diminue)
- Les mises a jour de solde utilisent `parseFloat()` pour les calculs

### Virement

- Cree 2 transactions dans une transaction SQL atomique :
  - Depense sur le compte source
  - Revenu sur le compte destination
- Utilise une categorie interne `Virement Interne` (auto-creee)
- Verifie le solde suffisant (compte non-credit uniquement)

### Objectifs d'epargne

- `currentAmount` augmente a la creation d'une transaction liee (type `investment` ou `income`)
- Diminue a la suppression
- Ajuste a la modification

### Transactions recurrentes

- Filtrées par `isRecurring: true` et `status: completed`
- La prochaine date est calculee selon `recurringInterval` (daily/weekly/monthly/yearly)
- Ignore si un doublon existe deja
- Cree la transaction + met a jour le solde

---

## Corrections de Bugs Appliquees

| Fichier | Bug | Correctif |
|---------|-----|-----------|
| `report.js` | `b.spent` inexistant → budget spent = 0 | Calcule depuis les vraies transactions du mois |
| `transactions.js` (update) | `SavingGoal.currentAmount` non ajuste sur edition | Reverse/apply du goal amount (comme create/remove) |
| `transactions.js` (update) | `type` pouvait diverger de la categorie via body | `type` derive de la categorie si `categoryId` change ; `type` du body supprime |
| `accounts.js` (remove) | Suppression possible avec des transactions liees | Bloque si `txnCount > 0` |
| `accounts.js` (create/update) | `balance` pouvait etre force via body (mass-assignment) | Whitelist `ALLOWED_FIELDS` |
| `transfers.js` | Virement depuis un compte credit contournait le check de solde | Bloque si `fromAccount.type === 'credit'` |
| `api.service.ts` | `NgZone.run()` avec async cassait la detection de changements | Retrait de `ngZone.run()` |
| Tous les composants | Donnees non chargees au premier clic (change detection) | Route resolvers + ActivatedRoute |

---

## Installation

### Prerequis
- Node.js (v22+)
- MySQL (8.0+)
- npm

### Backend

```bash
cd back/
cp .env.example .env    # Editer les identifiants MySQL
npm install
npm run seed            # Donnees de test
npm run dev             # Demarre sur http://localhost:3000
```

### Frontend

```bash
cd Front/
npm install
npm start               # Demarre sur http://localhost:4200
```

### Identifiants de test

- Email : `koffi@example.com`
- Mot de passe : `pass123`
