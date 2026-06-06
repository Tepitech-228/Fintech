const { Category, Account, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  const categories = await Category.findAll({
    where: { userId: req.userId },
    include: [{ model: Account, attributes: ['id', 'name'] }]
  });
  res.json(categories);
};

exports.create = async (req, res) => {
  const { accountId, monthlyBudget, ...rest } = req.body;
  const category = await Category.create({ ...rest, accountId: accountId || null, monthlyBudget: monthlyBudget || 0, userId: req.userId });
  const result = await Category.findByPk(category.id, { include: [{ model: Account, attributes: ['id', 'name'] }] });
  res.status(201).json(result);
};

exports.update = async (req, res) => {
  const [updated] = await Category.update(req.body, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const category = await Category.findByPk(req.params.id, { include: [{ model: Account, attributes: ['id', 'name'] }] });
  res.json(category);
};

exports.remove = async (req, res) => {
  const txnCount = await Transaction.count({ where: { categoryId: req.params.id, userId: req.userId } });
  if (txnCount > 0) return res.status(400).json({ error: `Impossible de supprimer cette catégorie : ${txnCount} transaction(s) liée(s)` });
  const deleted = await Category.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};

exports.getSummary = async (req, res) => {
  const { type } = req.query;
  const whereCat = { userId: req.userId };
  if (type) whereCat.type = type;
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const categories = await Category.findAll({
    where: whereCat,
    include: [
      { model: Transaction, as: 'transactions', where: { userId: req.userId }, required: false },
      { model: Account, attributes: ['id', 'name'] }
    ]
  });
  const summary = categories.map(c => {
    const total = c.transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    const monthlySpent = c.transactions
      .filter(t => t.date >= monthStart && t.date <= monthEnd)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const monthlyBudget = parseFloat(c.monthlyBudget || 0);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
      total,
      count: c.transactions.length,
      monthlyBudget,
      monthlySpent,
      budgetRemaining: monthlyBudget > 0 ? monthlyBudget - monthlySpent : null,
      accountId: c.accountId,
      Account: c.Account
    };
  });
  res.json(summary);
};
