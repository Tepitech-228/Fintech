const sequelize = require('./db/config');
const { User, Account, Category, Transaction, Budget, SavingGoal, Task, Project } = require('./models/index');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.sync({ force: true });

    const hashedPw = await bcrypt.hash('pass123', 10);
    const user = await User.create({ name: 'Koffi', email: 'koffi@example.com', password: hashedPw, currency: 'XOF', locale: 'fr-TG' });

    const checking = await Account.create({ userId: user.id, name: 'Compte Courant', type: 'checking', balance: 25000, color: '#0f172a' });
    const savings = await Account.create({ userId: user.id, name: 'Compte Épargne BOA', type: 'savings', balance: 30000, color: '#10b981' });
    const investment = await Account.create({ userId: user.id, name: 'Compte Investissement', type: 'investment', balance: 0, color: '#6366f1' });
    const debt = await Account.create({ userId: user.id, name: 'Dette Moto', type: 'credit', balance: 0, color: '#ef4444' });

    const cats = await Category.bulkCreate([
      { userId: user.id, name: 'Salaire', type: 'income', color: '#10b981', icon: 'work' },
      { userId: user.id, name: 'Freelance', type: 'income', color: '#0ea5e9', icon: 'computer' },
      { userId: user.id, name: 'Revenus Passifs', type: 'income', color: '#8b5cf6', icon: 'trending_up' },
      { userId: user.id, name: 'Alimentation', type: 'expense', color: '#ef4444', icon: 'restaurant' },
      { userId: user.id, name: 'Transport', type: 'expense', color: '#f59e0b', icon: 'directions_car' },
      { userId: user.id, name: 'Logement', type: 'expense', color: '#6366f1', icon: 'home' },
      { userId: user.id, name: 'Loisirs', type: 'expense', color: '#ec4899', icon: 'sports_esports' },
      { userId: user.id, name: 'Santé', type: 'expense', color: '#14b8a6', icon: 'local_hospital' },
      { userId: user.id, name: 'Éducation', type: 'expense', color: '#8b5cf6', icon: 'school' },
      { userId: user.id, name: 'Shopping', type: 'expense', color: '#f97316', icon: 'shopping_bag' },
      { userId: user.id, name: 'Abonnements', type: 'expense', color: '#78716c', icon: 'subscriptions' },
      { userId: user.id, name: 'Épargne', type: 'investment', color: '#10b981', icon: 'savings' },
      { userId: user.id, name: 'Bourse', type: 'investment', color: '#6366f1', icon: 'trending_up' },
      { userId: user.id, name: 'Crypto', type: 'investment', color: '#f59e0b', icon: 'currency_bitcoin' },
      { userId: user.id, name: 'Remboursement Moto', type: 'debt', color: '#dc2626', icon: 'credit_card' }
    ]);

    const txns = [];
    const today = new Date();

    txns.push({
      userId: user.id, accountId: debt.id, categoryId: cats[14].id, type: 'debt', amount: 220000,
      description: 'Prêt moto Kawasaki', date: '2026-04-15', status: 'completed'
    });
    txns.push({
      userId: user.id, accountId: checking.id, categoryId: cats[14].id, type: 'income', amount: 220000,
      description: 'Fonds prêt moto reçus', date: '2026-04-15', status: 'completed'
    });

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      if (i === 0) {
        txns.push({ userId: user.id, accountId: checking.id, categoryId: cats[0].id, type: 'income', amount: 120000, description: 'Salaire mensuel', date, status: 'completed' });
        txns.push({ userId: user.id, accountId: savings.id, categoryId: cats[11].id, type: 'investment', amount: 10000, description: 'Virement épargne mensuel', date, status: 'completed' });
        continue;
      }
      const rand = Math.random();
      if (rand < 0.04) {
        txns.push({ userId: user.id, accountId: checking.id, categoryId: cats[1].id, type: 'income', amount: 25000, description: 'Freelance - mission', date, status: 'completed' });
      }
      if (rand > 0.95) {
        txns.push({ userId: user.id, accountId: debt.id, categoryId: cats[14].id, type: 'income', amount: 15000, description: 'Remboursement moto', date, status: 'completed' });
        txns.push({ userId: user.id, accountId: checking.id, categoryId: cats[14].id, type: 'expense', amount: 15000, description: 'Remboursement moto depuis CC', date, status: 'completed' });
      }
      const expenseCats = [
        { id: cats[3].id, max: 4000 }, { id: cats[4].id, max: 2000 }, { id: cats[5].id, max: 20000 },
        { id: cats[6].id, max: 2000 }, { id: cats[7].id, max: 1500 }, { id: cats[8].id, max: 1000 },
        { id: cats[9].id, max: 3000 }, { id: cats[10].id, max: 1500 }
      ];
      const ec = expenseCats[Math.floor(Math.random() * expenseCats.length)];
      const amount = 300 + Math.random() * ec.max;
      txns.push({
        userId: user.id, accountId: checking.id, categoryId: ec.id,
        type: 'expense', amount: Math.round(amount), description: `Dépense ${(cats.find(c => c.id === ec.id)?.name || '').toLowerCase()}`, date, status: 'completed'
      });
    }
    await Transaction.bulkCreate(txns);

    await Budget.bulkCreate([
      { userId: user.id, categoryId: cats[3].id, month: '2026-06', amount: 50000 },
      { userId: user.id, categoryId: cats[4].id, month: '2026-06', amount: 20000 },
      { userId: user.id, categoryId: cats[5].id, month: '2026-06', amount: 30000 },
      { userId: user.id, categoryId: cats[6].id, month: '2026-06', amount: 15000 },
      { userId: user.id, categoryId: cats[7].id, month: '2026-06', amount: 5000 },
      { userId: user.id, categoryId: cats[8].id, month: '2026-06', amount: 5000 },
      { userId: user.id, categoryId: cats[9].id, month: '2026-06', amount: 10000 },
      { userId: user.id, categoryId: cats[10].id, month: '2026-06', amount: 5000 },
      { userId: user.id, categoryId: cats[14].id, month: '2026-06', amount: 15000 }
    ]);

    await SavingGoal.bulkCreate([
      { userId: user.id, name: 'Rembourser Dette Moto', targetAmount: 220000, currentAmount: 15000, deadline: '2026-12-31', color: '#ef4444' },
      { userId: user.id, name: 'Fonds d\'Urgence', targetAmount: 300000, currentAmount: 30000, deadline: null, color: '#10b981' },
      { userId: user.id, name: 'Investir en Bourse', targetAmount: 500000, currentAmount: 0, deadline: '2027-12-31', color: '#6366f1' }
    ]);

    await Task.bulkCreate([
      { userId: user.id, title: 'Négocier échéancier dette moto', description: 'Contacter le vendeur pour un étalement', dueDate: '2026-06-05', priority: 'high', status: 'todo', category: 'Dette' },
      { userId: user.id, title: 'Ouvrir compte investissement', description: 'Rechercher les meilleures options', dueDate: '2026-06-15', priority: 'high', status: 'todo', category: 'Investissement' },
      { userId: user.id, title: 'Établir budget mensuel', description: 'Suivi dépenses sur 120 000 FCFA', dueDate: '2026-06-01', priority: 'high', status: 'in_progress', category: 'Budget' },
      { userId: user.id, title: 'Automatiser épargne', description: 'Virement auto le jour de paie', dueDate: '2026-06-10', priority: 'medium', status: 'todo', category: 'Épargne' },
      { userId: user.id, title: 'Chercher missions freelance', description: 'Compléter les revenus', dueDate: '2026-06-10', priority: 'medium', status: 'todo', category: 'Carrière' }
    ]);

    await Project.bulkCreate([
      { userId: user.id, name: 'Remboursement Moto', description: 'Rembourser les 220 000 FCFA', budget: 220000, spent: 15000, status: 'active', startDate: '2026-04-15', endDate: '2026-12-31', color: '#ef4444' },
      { userId: user.id, name: 'Portefeuille Investissement', description: 'Constituer un portefeuille diversifié', budget: 500000, spent: 0, status: 'planning', color: '#6366f1' },
      { userId: user.id, name: 'Formation Wordpress', description: 'Freelance pour revenus complémentaires', budget: 50000, spent: 12000, status: 'active', startDate: '2026-04-01', endDate: '2026-07-31', color: '#8b5cf6' }
    ]);

    console.log('Seed OK - Koffi (Togo) : mini-banque prête');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
