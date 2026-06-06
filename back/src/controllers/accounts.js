const { Account, Transaction, Category, SavingGoal, AccountLedger } = require('../models');
const sequelize = require('../db/config');
const { computeDelta, parseAmount } = require('../utils/money');

const ALLOWED_FIELDS = ['name', 'type', 'currency', 'color', 'icon'];

exports.getAll = async (req, res) => {
  const accounts = await Account.findAll({ where: { userId: req.userId } });
  res.json(accounts);
};

exports.getById = async (req, res) => {
  const account = await Account.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!account) return res.status(404).json({ error: 'Not found' });
  res.json(account);
};

exports.create = async (req, res) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const account = await Account.create({ ...data, balance: 0, userId: req.userId });
  res.status(201).json(account);
};

exports.update = async (req, res) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const [updated] = await Account.update(data, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const account = await Account.findByPk(req.params.id);
  res.json(account);
};

exports.remove = async (req, res) => {
  const txnCount = await Transaction.count({ where: { accountId: req.params.id, userId: req.userId } });
  if (txnCount > 0) return res.status(400).json({ error: `Impossible de supprimer ce compte : ${txnCount} transaction(s) liée(s)` });
  const deleted = await Account.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};

// Deposit into account: creates a completed transaction, updates balance and ledger atomically
exports.deposit = async (req, res) => {
  const accountId = req.params.id;
  const { amount, categoryId, description, date, goalId } = req.body;
  if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Invalid amount' });

  const account = await Account.findOne({ where: { id: accountId, userId: req.userId } });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const tx = await sequelize.transaction();
  try {
    // Determine category: use provided or find/create a generic income category
    let catId = categoryId;
    if (!catId) {
      let cat = await Category.findOne({ where: { userId: req.userId, type: 'income', name: 'Dépôt' }, transaction: tx });
      if (!cat) cat = await Category.create({ userId: req.userId, type: 'income', name: 'Dépôt', color: '#10b981', icon: 'account_balance' }, { transaction: tx });
      catId = cat.id;
    }

    const created = await Transaction.create({
      userId: req.userId,
      accountId: account.id,
      categoryId: catId,
      goalId: goalId || null,
      type: 'income',
      amount: parseAmount(amount),
      description: description || 'Approvisionnement',
      date: date || new Date().toISOString().slice(0, 10),
      status: 'completed'
    }, { transaction: tx });

    const parsed = parseAmount(created.amount);
    const delta = computeDelta(account.type, 'income', parsed);
    const newBalance = parseFloat(account.balance) + delta;
    await account.update({ balance: newBalance }, { transaction: tx });
    await AccountLedger.create({ accountId: account.id, transactionId: created.id, userId: req.userId, change: delta, balanceAfter: newBalance, description: `Deposit ${created.id}` }, { transaction: tx });

    if (created.goalId) {
      const goal = await SavingGoal.findByPk(created.goalId, { transaction: tx });
      if (goal) await goal.update({ currentAmount: parseFloat(goal.currentAmount) + parsed }, { transaction: tx });
    }

    await tx.commit();
    const full = await Transaction.findByPk(created.id, { include: [{ model: Category }] });
    res.status(201).json(full);
  } catch (err) {
    await tx.rollback();
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'approvisionnement' });
  }
};
