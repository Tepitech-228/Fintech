# Audit et logique financière — Résumé des corrections et workflow

Date: 2026-06-05

## Objectif
Fournir un résumé clair des corrections appliquées à la logique financière, décrire le workflow actuel (création, modification, suppression, complétion de transaction et virements), et indiquer les commandes de migration et prochaines actions recommandées.

## Corrections appliquées (principales)
- Centralisation logique monétaire: `back/src/utils/money.js` (`computeDelta`, `parseAmount`).
- Changement du `status` par défaut de `Transaction` → `pending` (sécurité): `back/src/models/Transaction.js`.
- Atomisation des opérations modifiant soldes via transactions DB (`sequelize.transaction`) dans `back/src/controllers/transactions.js`.
- Endpoint explicite `POST /transactions/:id/complete` pour appliquer un `pending` → `completed` (atomique).
- Journal de mouvements (grand‑livre): nouveau modèle `AccountLedger` (`back/src/models/AccountLedger.js`) et enregistrement d'écritures à chaque changement de solde.
- Virements internes atomiques: écriture de deux transactions et deux écritures de ledger dans `back/src/controllers/transfers.js`.
- Correction du calcul des budgets: `getMonthlyOverview` compte uniquement les transactions `expense` (`back/src/controllers/budgets.js`).
- Validation d'entrée minimale pour `transactions` et `transfers`: `back/src/middleware/validation.js` et branchement dans `back/src/routes/index.js`.
- Migration helper (script simple): `back/src/db/migrate.js` + scripts `npm run db:migrate` / `npm run db:migrate:down`.

## Workflow financier actuel (fonctionnement détaillé)

1) Création d'une transaction (POST `/transactions`)
   - Middleware valide `amount`, `accountId`, `categoryId`, `date`.
   - Le type de transaction est déterminé depuis la `Category` associée.
   - La transaction est créée (par défaut `status: 'pending'` sauf si le client fournit un autre statut).
   - Si la transaction est créée avec `status: 'completed'`, alors dans la même transaction DB:
     - On calcule le `delta` via `computeDelta(account.type, txnType, amount)`.
     - On met à jour `Account.balance` (nouveau solde) et on écrit une ligne dans `AccountLedger` (change, balanceAfter, transactionId).
     - Si `goalId` et type `investment|income`, on crédite le `SavingGoal.currentAmount`.

2) Compléter une transaction (POST `/transactions/:id/complete`)
   - Utiliser si la transaction a été laissée en `pending` lors de la création.
   - Exécute les mêmes effets que ci‑dessus (mise à jour de solde et écritures ledger) à l'intérieur d'une transaction DB.

3) Mise à jour d'une transaction (PUT `/transactions/:id`)
   - Dans une transaction DB, si l'ancienne transaction était `completed`, on **inverse** son effet (on met à jour le solde et on écrit une écriture « reverse» dans `AccountLedger`).
   - On applique la mise à jour (changement de montant, compte, catégorie...).
   - Si le nouvel état est `completed`, on applique le nouvel effet (nouveau delta) et on écrit l'écriture correspondante.

4) Suppression d'une transaction (DELETE `/transactions/:id`)
   - Dans une transaction DB, si la transaction était `completed`, on inverse son effet sur le solde et on écrit une entrée de ledger de suppression, puis on supprime la transaction.

5) Virements internes (POST `/transfers`)
   - Validation d'entrée (fromAccountId, toAccountId, amount).
   - Crée deux transactions (`expense` sur compte source, `income` sur compte destination) et met à jour les deux soldes **atomiquement**.
   - Enregistre deux écritures dans `AccountLedger` pour traçabilité.

## Principes métier codés
- `computeDelta` règle les signes selon `account.type` et `transaction.type` (ex: comptes `credit` traités comme dette: achats augmentent la dette, paiements réduisent la dette).
- Les effets de solde sont toujours enregistrés dans `AccountLedger` avec `transactionId` quand approprié.
- Les budgets comptent uniquement les `expense` (revenus exclus).

## Modèles / fichiers clés ajoutés ou modifiés
- `back/src/utils/money.js` — utilité monétaire (`computeDelta`, `parseAmount`)
- `back/src/models/Transaction.js` — statut par défaut modifié
- `back/src/models/AccountLedger.js` — nouveau modèle grand‑livre
- `back/src/controllers/transactions.js` — atomisation, `complete` endpoint, ledger writes
- `back/src/controllers/transfers.js` — ledger writes pour virements
- `back/src/controllers/budgets.js` — correction du calcul de `spent`
- `back/src/middleware/validation.js` — validations simples
- `back/src/routes/index.js` — branchement des validations
- `back/src/db/migrate.js` — script de migration rapide
- `back/package.json` — scripts `db:migrate` / `db:migrate:down`

## Commandes utiles
- Appliquer les migrations (développement):
```bash
cd back
npm run db:migrate
```
- Annuler les migrations:
```bash
cd back
npm run db:migrate:down
```

## Recommandations & prochaines étapes
1. Mettre en place des migrations formelles (`sequelize-cli`) et tests dans CI avant d'appliquer en production.
2. Migrer le stockage des montants vers les centimes (integer) ou utiliser `decimal.js` pour précision et cohérence.
3. Ajouter une API de réconciliation périodique (job CRON) qui compare `sum(transactions)` vs `account.balance` et envoie des alertes si écart.
4. Ajouter tests unitaires + tests de concurrence (virements/creations simultanées) pour confirmer l'atomicité.
5. Ajouter historique complet des modifications d'objets critiques (audit users/actors) si requis par conformité.

## Notes de sécurité et exploitation
- Sauvegarder la DB avant toute migration en production.
- Vérifier les ENUMs et conversions selon votre dialecte (MySQL vs Postgres) avant `changeColumn`.
- Le script `src/db/migrate.js` est un outil rapide — préférez des migrations versionnées pour production.

---
Fichier généré automatiquement par l'audit. Pour modifications supplémentaires dites-moi ce que vous souhaitez détailler ou automatiser.
