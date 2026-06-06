const { Transaction, Category, Account, SavingGoal, AccountLedger } = require('../models');
const sequelize = require('../db/config');
const { computeDelta, parseAmount } = require('../utils/money');

exports.getAll = async (req, res) => {
  const { type, categoryId, accountId, startDate, endDate, page = 1, limit = 50 } = req.query;
  const where = { userId: req.userId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (startDate && endDate) {
    where.date = { [require('sequelize').Op.between]: [startDate, endDate] };
  }
  const offset = (page - 1) * limit;
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [{ model: Category }, { model: Account }],
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit), offset: parseInt(offset)
  });
  res.json({ transactions: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
};

exports.getById = async (req, res) => {
  const t = await Transaction.findOne({
    where: { id: req.params.id, userId: req.userId },
    include: [{ model: Category }, { model: Account }]
  });
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
};

exports.create = async (req, res) => {
  const category = await Category.findOne({ where: { id: req.body.categoryId, userId: req.userId } });
  if (!category) return res.status(400).json({ error: 'Category not found' });
  const accountExists = req.body.accountId ? await Account.findOne({ where: { id: req.body.accountId, userId: req.userId } }) : null;
  if (req.body.accountId && !accountExists) return res.status(400).json({ error: 'Account not found' });

  const txnType = category.type;

  const tx = await sequelize.transaction();
  try {
    const created = await Transaction.create({ ...req.body, userId: req.userId, type: txnType, status: req.body.status || 'completed' }, { transaction: tx });

    if (created.status === 'completed') {
      const account = await Account.findByPk(created.accountId, { transaction: tx });
      if (account) {
        const amount = parseAmount(created.amount);
        const delta = computeDelta(account.type, txnType, amount);
        const newBalance = parseFloat(account.balance) + delta;
        await account.update({ balance: newBalance }, { transaction: tx });
        await AccountLedger.create({ accountId: account.id, transactionId: created.id, userId: req.userId, change: delta, balanceAfter: newBalance, description: `Transaction ${created.id}` }, { transaction: tx });
      }

      if (created.goalId) {
        const goal = await SavingGoal.findByPk(created.goalId, { transaction: tx });
        if (goal) {
          await goal.update({ currentAmount: parseFloat(goal.currentAmount) + parseFloat(created.amount) }, { transaction: tx });
        }
      }
    }

    await tx.commit();
    const full = await Transaction.findByPk(created.id, { include: [{ model: Category }, { model: Account }] });
    res.status(201).json(full);
  } catch (err) {
    await tx.rollback();
    res.status(500).json({ error: 'Erreur lors de la création de la transaction' });
  }
};

exports.update = async (req, res) => {
  const existing = await Transaction.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (req.body.categoryId) {
    const cat = await Category.findOne({ where: { id: req.body.categoryId, userId: req.userId } });
    if (!cat) return res.status(400).json({ error: 'Category not found' });
    req.body.type = cat.type;
  } else {
    delete req.body.type;
  }

  if (req.body.accountId) {
    const acc = await Account.findOne({ where: { id: req.body.accountId, userId: req.userId } });
    if (!acc) return res.status(400).json({ error: 'Account not found' });
  }

  const tx = await sequelize.transaction();
  try {
    // Reverse old effect if completed
    if (existing.status === 'completed') {
      const accountOld = await Account.findByPk(existing.accountId, { transaction: tx });
      if (accountOld) {
        const oldDelta = -computeDelta(accountOld.type, existing.type, parseAmount(existing.amount));
        const newBalanceOld = parseFloat(accountOld.balance) + oldDelta;
        await accountOld.update({ balance: newBalanceOld }, { transaction: tx });
        await AccountLedger.create({ accountId: accountOld.id, transactionId: existing.id, userId: req.userId, change: oldDelta, balanceAfter: newBalanceOld, description: `Reverse Transaction ${existing.id}` }, { transaction: tx });
      }

      if (existing.goalId) {
        const goal = await SavingGoal.findByPk(existing.goalId, { transaction: tx });
        if (goal) {
          await goal.update({ currentAmount: Math.max(0, parseFloat(goal.currentAmount) - parseFloat(existing.amount)) }, { transaction: tx });
        }
      }
    }

    await existing.update(req.body, { transaction: tx });

    // Apply new effect if completed
    if (existing.status === 'completed') {
      const accountNew = await Account.findByPk(existing.accountId, { transaction: tx });
      if (accountNew) {
        const newDelta = computeDelta(accountNew.type, existing.type, parseAmount(existing.amount));
        const newBalanceNew = parseFloat(accountNew.balance) + newDelta;
        await accountNew.update({ balance: newBalanceNew }, { transaction: tx });
        await AccountLedger.create({ accountId: accountNew.id, transactionId: existing.id, userId: req.userId, change: newDelta, balanceAfter: newBalanceNew, description: `Transaction ${existing.id}` }, { transaction: tx });
      }

      if (existing.goalId) {
        const goal = await SavingGoal.findByPk(existing.goalId, { transaction: tx });
        if (goal) {
          await goal.update({ currentAmount: parseFloat(goal.currentAmount) + parseFloat(existing.amount) }, { transaction: tx });
        }
      }
    }

    await tx.commit();
    const full = await Transaction.findByPk(existing.id, { include: [{ model: Category }, { model: Account }] });
    res.json(full);
  } catch (err) {
    await tx.rollback();
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la transaction' });
  }
};

exports.remove = async (req, res) => {
  const existing = await Transaction.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const tx = await sequelize.transaction();
  try {
    if (existing.status === 'completed') {
      const account = await Account.findByPk(existing.accountId, { transaction: tx });
      if (account) {
        const delta = -computeDelta(account.type, existing.type, parseAmount(existing.amount));
        const newBalance = parseFloat(account.balance) + delta;
        await account.update({ balance: newBalance }, { transaction: tx });
        await AccountLedger.create({ accountId: account.id, transactionId: existing.id, userId: req.userId, change: delta, balanceAfter: newBalance, description: `Remove Transaction ${existing.id}` }, { transaction: tx });
      }

      if (existing.goalId) {
        const goal = await SavingGoal.findByPk(existing.goalId, { transaction: tx });
        if (goal) {
          await goal.update({ currentAmount: Math.max(0, parseFloat(goal.currentAmount) - parseFloat(existing.amount)) }, { transaction: tx });
        }
      }
    }

    await existing.destroy({ transaction: tx });
    await tx.commit();
    res.status(204).send();
  } catch (err) {
    await tx.rollback();
    res.status(500).json({ error: 'Erreur lors de la suppression de la transaction' });
  }
};

exports.getMonthly = async (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);
  const transactions = await Transaction.findAll({
    where: { userId: req.userId, date: { [require('sequelize').Op.between]: [startDate, endDate] } },
    include: [{ model: Category }]
  });
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const investment = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + parseFloat(t.amount), 0);
  const debt = transactions.filter(t => t.type === 'debt').reduce((s, t) => s + parseFloat(t.amount), 0);
  res.json({ income, expense, investment, debt, balance: income - expense - investment - debt, transactions, count: transactions.length });
};

exports.getOverview = async (req, res) => {
  const { period = 'month', date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  const today = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  let startDate = new Date(today);
  let endDate = new Date(today);

  switch (period) {
    case 'day':
      break;
    case 'week':
      startDate.setUTCDate(today.getUTCDate() - today.getUTCDay());
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      break;
    case 'year':
      startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      endDate = new Date(Date.UTC(today.getUTCFullYear(), 11, 31));
      break;
    default:
      startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  }

  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);
  const transactions = await Transaction.findAll({
    where: { userId: req.userId, date: { [require('sequelize').Op.between]: [start, end] } },
    include: [{ model: Category }, { model: Account }],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  const totals = transactions.reduce((summary, tx) => {
    summary[tx.type] = (summary[tx.type] || 0) + parseFloat(tx.amount);
    return summary;
  }, { income: 0, expense: 0, investment: 0, debt: 0 });

  res.json({
    period,
    startDate: start,
    endDate: end,
    totals,
    balance: totals.income - totals.expense - totals.investment - totals.debt,
    transactions,
    count: transactions.length
  });
};

// Complete a pending transaction and apply balance/goal effects atomically
exports.complete = async (req, res) => {
  const tId = req.params.id;
  const existing = await Transaction.findOne({ where: { id: tId, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.status !== 'pending') return res.status(400).json({ error: 'Transaction not pending' });

  const tx = await sequelize.transaction();
  try {
    const account = await Account.findByPk(existing.accountId, { transaction: tx });
    if (account) {
      const amount = parseAmount(existing.amount);
      const delta = computeDelta(account.type, existing.type, amount);
      const newBalance = parseFloat(account.balance) + delta;
      await account.update({ balance: newBalance }, { transaction: tx });
      await AccountLedger.create({ accountId: account.id, transactionId: existing.id, userId: req.userId, change: delta, balanceAfter: newBalance, description: `Complete Transaction ${existing.id}` }, { transaction: tx });
    }

    if (existing.goalId) {
      const goal = await SavingGoal.findByPk(existing.goalId, { transaction: tx });
      if (goal) {
        await goal.update({ currentAmount: parseFloat(goal.currentAmount) + parseFloat(existing.amount) }, { transaction: tx });
      }
    }

    await existing.update({ status: 'completed' }, { transaction: tx });
    await tx.commit();
    const full = await Transaction.findByPk(existing.id, { include: [{ model: Category }, { model: Account }] });
    res.json(full);
  } catch (err) {
    await tx.rollback();
    res.status(500).json({ error: 'Erreur lors de la complétion de la transaction' });
  }
};
