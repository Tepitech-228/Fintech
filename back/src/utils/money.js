function parseAmount(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(n)) throw new Error('Invalid amount');
  return Number(n);
}

/**
 * computeDelta(accountType, txnType, amount)
 * Returns the value to add to account.balance when applying a transaction.
 * Rules (default sensible behaviour):
 * - Non-credit accounts: income = +, expense = -, investment = - (money out), debt = - (debt payment)
 * - Credit accounts: income = - (payment reduces debt), expense = + (purchase increases debt), investment = +, debt = +
 */
function computeDelta(accountType, txnType, amount) {
  const a = parseAmount(amount);
  if (accountType === 'credit') {
    if (txnType === 'income') return -a; // payment reduces debt
    return a; // expense, investment, debt increase debt
  }
  // non-credit accounts
  if (txnType === 'income') return a;
  // expense, investment, debt: money leaves the account
  return -a;
}

module.exports = { computeDelta, parseAmount };
