const { Budget, Category, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  const budgets = await Budget.findAll({
    where: { userId: req.userId },
    include: [{ model: Category }]
  });
  res.json(budgets);
};

exports.create = async (req, res) => {
  const cat = await Category.findOne({ where: { id: req.body.categoryId, userId: req.userId } });
  if (!cat) return res.status(400).json({ error: 'Category not found' });
  const data = { userId: req.userId, categoryId: req.body.categoryId, month: req.body.month, amount: req.body.amount };
  const budget = await Budget.create(data);
  const full = await Budget.findByPk(budget.id, { include: [{ model: Category }] });
  res.status(201).json(full);
};

exports.update = async (req, res) => {
  const data = {};
  for (const key of ['categoryId', 'month', 'amount']) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  if (data.categoryId) {
    const cat = await Category.findOne({ where: { id: data.categoryId, userId: req.userId } });
    if (!cat) return res.status(400).json({ error: 'Category not found' });
  }
  const [updated] = await Budget.update(data, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const budget = await Budget.findByPk(req.params.id, { include: [{ model: Category }] });
  res.json(budget);
};

exports.remove = async (req, res) => {
  const deleted = await Budget.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};

exports.getMonthlyOverview = async (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);
  const budgets = await Budget.findAll({
    where: { userId: req.userId, month: `${year}-${month}` },
    include: [{ model: Category }]
  });
  const transactions = await Transaction.findAll({
    where: { userId: req.userId, date: { [Op.between]: [startDate, endDate] } },
    include: [{ model: Category }]
  });
  const spentByCategory = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const key = t.categoryId;
    spentByCategory[key] = (spentByCategory[key] || 0) + parseFloat(t.amount);
  });
  const overview = budgets.map(b => ({
    ...b.toJSON(),
    spent: spentByCategory[b.categoryId] || 0,
    remaining: parseFloat(b.amount) - (spentByCategory[b.categoryId] || 0)
  }));
  res.json(overview);
};

exports.getAlerts = async (req, res) => {
  const budgets = await Budget.findAll({ where: { userId: req.userId }, include: [{ model: Category }] });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  const transactions = await Transaction.findAll({
    where: { userId: req.userId, type: 'expense', date: { [Op.between]: [startOfMonth.toISOString().slice(0, 10), endOfMonth.toISOString().slice(0, 10)] } }
  });
  const spentByCategory = {};
  transactions.forEach(t => {
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] || 0) + parseFloat(t.amount);
  });
  const alerts = budgets.flatMap(b => {
    const spent = spentByCategory[b.categoryId] || 0;
    const percent = b.amount > 0 ? (spent / parseFloat(b.amount)) * 100 : 0;
    if (percent >= 100) return [{ ...b.toJSON(), spent, alertType: 'OVER_BUDGET', percent }];
    if (percent >= 90) return [{ ...b.toJSON(), spent, alertType: 'NEAR_BUDGET', percent }];
    if (percent >= 80) return [{ ...b.toJSON(), spent, alertType: 'NEAR_BUDGET', percent }];
    return [];
  });
  res.json(alerts);
};
