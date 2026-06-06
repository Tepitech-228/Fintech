function isPositiveNumber(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return !Number.isNaN(n) && n > 0;
}

function validateTransactionInput(req, res, next) {
  const { amount, accountId, categoryId, date } = req.body;
  if (!isPositiveNumber(amount)) return res.status(400).json({ error: 'Invalid amount' });
  if (!accountId) return res.status(400).json({ error: 'accountId required' });
  if (!categoryId) return res.status(400).json({ error: 'categoryId required' });
  if (!date) return res.status(400).json({ error: 'date required' });
  next();
}

function validateTransferInput(req, res, next) {
  const { fromAccountId, toAccountId, amount } = req.body;
  if (!fromAccountId || !toAccountId) return res.status(400).json({ error: 'fromAccountId and toAccountId required' });
  if (!isPositiveNumber(amount)) return res.status(400).json({ error: 'Invalid amount' });
  next();
}

function validateInvestmentPlanInput(req, res, next) {
  const { name, amount, frequency, startDate, targetAmount, savingGoalId } = req.body;
  const allowedFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!isPositiveNumber(amount)) return res.status(400).json({ error: 'Invalid amount' });
  if (!allowedFrequencies.includes(frequency)) return res.status(400).json({ error: 'Invalid frequency' });
  if (!startDate) return res.status(400).json({ error: 'startDate required' });
  if (!isPositiveNumber(targetAmount)) return res.status(400).json({ error: 'Invalid targetAmount' });
  if (!savingGoalId) return res.status(400).json({ error: 'savingGoalId required' });
  next();
}

module.exports = { validateTransactionInput, validateTransferInput, validateInvestmentPlanInput };
