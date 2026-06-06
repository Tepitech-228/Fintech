const { Transaction, Account, Category, SavingGoal, Budget } = require('../models');
const { Op } = require('sequelize');

exports.getMonthly = async (req, res) => {
  const { year, month } = req.params;
  const userId = req.userId;
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

  const transactions = await Transaction.findAll({
    where: { userId, date: { [Op.between]: [startDate, endDate] } },
    include: [{ model: Category }]
  });

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const investment = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + parseFloat(t.amount), 0);
  const debt = transactions.filter(t => t.type === 'debt').reduce((s, t) => s + parseFloat(t.amount), 0);

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const accounts = await Account.findAll({ where: { userId } });
  const netWorth = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
  const totalAssets = accounts.filter(a => parseFloat(a.balance) > 0).reduce((s, a) => s + parseFloat(a.balance), 0);
  const totalDebt = accounts.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(parseFloat(a.balance)), 0);

  const goals = await SavingGoal.findAll({ where: { userId } });
  const budgets = await Budget.findAll({ where: { userId, month: `${year}-${month}` }, include: [{ model: Category }] });

  const topCategories = await Category.findAll({
    where: { userId },
    include: [{
      model: Transaction, as: 'transactions',
      where: { userId, date: { [Op.between]: [startDate, endDate] } },
      required: false
    }]
  });
  const topCats = topCategories
    .map(c => ({ name: c.name, color: c.color, total: c.transactions.reduce((s, t) => s + parseFloat(t.amount), 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
  const budgetDetails = budgets.map(b => {
    const spent = transactions
      .filter(t => t.categoryId === b.categoryId)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    return {
      category: b.Category?.name || '?',
      budgeted: parseFloat(b.amount),
      spent,
      remaining: parseFloat(b.amount) - spent
    };
  });
  const totalBudgetSpent = budgetDetails.reduce((s, b) => s + b.spent, 0);

  res.json({
    period: `${year}-${month}`,
    income, expense, investment, debt,
    netBalance: income - expense,
    savingsRate: Math.round(savingsRate * 10) / 10,
    netWorth, totalAssets, totalDebt,
    goals: goals.map(g => ({
      name: g.name, target: parseFloat(g.targetAmount), current: parseFloat(g.currentAmount),
      progress: g.targetAmount > 0 ? Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100) : 0
    })),
    budgets: budgetDetails,
    totalBudget, totalBudgetSpent,
    topCategories: topCats,
    transactionCount: transactions.length
  });
};
