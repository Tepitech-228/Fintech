const { Transaction, Account, Category } = require('../models');
const { Op } = require('sequelize');

function getDelta(accType, txnType, amount) {
  if (accType === 'credit') return txnType === 'income' ? amount : -amount;
  return txnType === 'income' ? amount : -amount;
}

exports.process = async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const recurring = await Transaction.findAll({
    where: { userId, isRecurring: true, status: 'completed' },
    include: [{ model: Category }]
  });

  let created = 0;
  for (const t of recurring) {
    const lastDate = new Date(t.date);
    let nextDate = new Date(lastDate);

    switch (t.recurringInterval) {
      case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      default: continue;
    }

    const nextStr = nextDate.toISOString().slice(0, 10);
    if (nextStr > today) continue;

    const existing = await Transaction.findOne({
      where: { userId, categoryId: t.categoryId, amount: t.amount, date: nextStr, description: t.description }
    });
    if (existing) continue;

    const category = await Category.findByPk(t.categoryId);
    if (!category) continue;

    const newTxn = await Transaction.create({
      userId, accountId: t.accountId, categoryId: t.categoryId, goalId: t.goalId,
      type: category.type, amount: t.amount, description: t.description,
      date: nextStr, isRecurring: true, recurringInterval: t.recurringInterval, status: 'completed'
    });

    const account = await Account.findByPk(t.accountId);
    if (account) {
      const delta = getDelta(account.type, category.type, parseFloat(t.amount));
      await account.update({ balance: parseFloat(account.balance) + delta });
    }

    created++;
  }

  res.json({ processed: recurring.length, created });
};
