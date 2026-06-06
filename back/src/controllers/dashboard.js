const { Account, Transaction, Budget, SavingGoal, Task } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const accounts = await Account.findAll({ where: { userId } });
  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);

  const monthTx = await Transaction.findAll({ where: { userId, date: { [Op.between]: [startDate, endDate] } } });
  const monthlyIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const monthlyExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  const goals = await SavingGoal.findAll({ where: { userId } });
  const tasks = await Task.findAll({ where: { userId, status: { [Op.ne]: 'done' } }, limit: 5 });

  const recentTx = await Transaction.findAll({ where: { userId }, order: [['date', 'DESC']], limit: 10 });

  res.json({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance: monthlyIncome - monthlyExpense,
    accounts,
    goals,
    tasks,
    recentTransactions: recentTx
  });
};
