const { InvestmentPlan, SavingGoal, Category, Account, Transaction, AccountLedger } = require('../models');
const sequelize = require('../db/config');
const { computeDelta, parseAmount } = require('../utils/money');

function getNextExecutionDate(dateStr, frequency) {
  const date = new Date(dateStr);
  switch (frequency) {
    case 'daily': date.setDate(date.getDate() + 1); break;
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: throw new Error('Invalid frequency');
  }
  return date.toISOString().slice(0, 10);
}

async function getInvestmentCategory(userId, transaction) {
  let category = await Category.findOne({ where: { userId, type: 'investment', name: 'Investissement' }, transaction });
  if (!category) {
    category = await Category.create({ userId, type: 'investment', name: 'Investissement', color: '#10b981', icon: 'trending_up' }, { transaction });
  }
  return category;
}

function pickSourceAccount(accounts) {
  return accounts.find(a => a.type === 'checking' || a.type === 'savings') || accounts[0];
}

exports.list = async (req, res) => {
  const plans = await InvestmentPlan.findAll({ where: { userId: req.userId }, include: [{ model: SavingGoal, as: 'savingGoal' }] });
  res.json(plans);
};

exports.getById = async (req, res) => {
  const plan = await InvestmentPlan.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: SavingGoal, as: 'savingGoal' }] });
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json(plan);
};

exports.create = async (req, res) => {
  const { name, amount, frequency, startDate, endDate, targetAmount, savingGoalId, nextExecutionDate, isActive } = req.body;
  const goal = await SavingGoal.findOne({ where: { id: savingGoalId, userId: req.userId } });
  if (!goal) return res.status(400).json({ error: 'Saving goal not found' });

  const plan = await InvestmentPlan.create({
    userId: req.userId,
    name,
    amount: parseAmount(amount),
    frequency,
    startDate,
    endDate: endDate || null,
    targetAmount: parseAmount(targetAmount),
    savingGoalId,
    nextExecutionDate: nextExecutionDate || startDate,
    isActive: isActive !== false
  });

  res.status(201).json(plan);
};

exports.update = async (req, res) => {
  const plan = await InvestmentPlan.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!plan) return res.status(404).json({ error: 'Not found' });
  const data = {};
  for (const key of ['name', 'amount', 'frequency', 'startDate', 'endDate', 'targetAmount', 'savingGoalId', 'nextExecutionDate', 'isActive']) {
    if (req.body[key] !== undefined) data[key] = key === 'amount' || key === 'targetAmount' ? parseAmount(req.body[key]) : req.body[key];
  }
  if (data.savingGoalId) {
    const goal = await SavingGoal.findOne({ where: { id: data.savingGoalId, userId: req.userId } });
    if (!goal) return res.status(400).json({ error: 'Saving goal not found' });
  }
  await plan.update(data);
  res.json(plan);
};

exports.remove = async (req, res) => {
  const deleted = await InvestmentPlan.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};

exports.execute = async (req, res) => {
  const plan = await InvestmentPlan.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: SavingGoal, as: 'savingGoal' }] });
  if (!plan) return res.status(404).json({ error: 'Not found' });
  if (!plan.isActive) return res.status(400).json({ error: 'Plan inactive' });

  const result = await executePlan(plan, req.userId);
  res.json(result);
};

async function executePlan(plan, userId) {
  const now = new Date().toISOString().slice(0, 10);
  if (plan.nextExecutionDate > now) {
    return { executed: false, nextExecutionDate: plan.nextExecutionDate };
  }

  const accounts = await Account.findAll({ where: { userId }, order: [['id', 'ASC']] });
  const sourceAccount = pickSourceAccount(accounts);
  if (!sourceAccount) throw new Error('No source account available');

  const category = await getInvestmentCategory(userId);
  const tx = await sequelize.transaction();
  try {
    const transaction = await Transaction.create({
      userId,
      accountId: sourceAccount.id,
      categoryId: category.id,
      goalId: plan.savingGoalId,
      type: 'investment',
      amount: parseAmount(plan.amount),
      description: `Plan d'investissement ${plan.name}`,
      date: plan.nextExecutionDate,
      status: 'completed'
    }, { transaction: tx });

    const amount = parseAmount(transaction.amount);
    const delta = computeDelta(sourceAccount.type, 'investment', amount);
    const newBalance = parseFloat(sourceAccount.balance) + delta;
    await sourceAccount.update({ balance: newBalance }, { transaction: tx });
    await AccountLedger.create({ accountId: sourceAccount.id, transactionId: transaction.id, userId, change: delta, balanceAfter: newBalance, description: `Plan ${plan.name}` }, { transaction: tx });

    const goal = await SavingGoal.findByPk(plan.savingGoalId, { transaction: tx });
    if (goal) {
      await goal.update({ currentAmount: parseFloat(goal.currentAmount) + amount }, { transaction: tx });
    }

    let nextDate = getNextExecutionDate(plan.nextExecutionDate, plan.frequency);
    let isActive = plan.isActive;
    if (plan.endDate && nextDate > plan.endDate) {
      nextDate = plan.endDate;
      isActive = false;
    }

    await plan.update({ nextExecutionDate: nextDate, isActive }, { transaction: tx });
    await tx.commit();

    return { executed: true, plan: plan.toJSON(), transactionId: transaction.id, nextExecutionDate: nextDate, isActive };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

exports.executePlan = executePlan;
