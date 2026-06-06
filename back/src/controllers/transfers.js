const { Account, Transaction, Category, AccountLedger } = require('../models');
const sequelize = require('../db/config');

exports.getAll = async (req, res) => {
  const cat = await Category.findOne({ where: { userId: req.userId, name: 'Virement Interne' } });
  if (!cat) return res.json([]);

  const transactions = await Transaction.findAll({
    where: { userId: req.userId, categoryId: cat.id, status: 'completed' },
    include: [{ model: Account }],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  const transfers = [];
  const used = new Set();

  for (let i = 0; i < transactions.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < transactions.length; j++) {
      if (used.has(j)) continue;
      if (transactions[i].date === transactions[j].date &&
          Math.abs(parseFloat(transactions[i].amount) - parseFloat(transactions[j].amount)) < 0.01 &&
          transactions[i].type !== transactions[j].type) {
        const out = transactions[i].type === 'expense' ? transactions[i] : transactions[j];
        const inc = transactions[i].type === 'income' ? transactions[i] : transactions[j];
        transfers.push({
          id: out.id,
          date: out.date,
          amount: parseFloat(out.amount),
          description: out.description,
          fromAccount: out.Account,
          toAccount: inc.Account,
          createdAt: out.createdAt
        });
        used.add(i);
        used.add(j);
        break;
      }
    }
  }

  res.json(transfers);
};

exports.create = async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'fromAccountId, toAccountId et amount requis' });
  }
  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: 'Comptes source et destination identiques' });
  }

  const fromAccount = await Account.findOne({ where: { id: fromAccountId, userId: req.userId } });
  const toAccount = await Account.findOne({ where: { id: toAccountId, userId: req.userId } });
  if (!fromAccount || !toAccount) return res.status(404).json({ error: 'Compte introuvable' });

  if (fromAccount.type === 'credit') return res.status(400).json({ error: 'Virement depuis un compte crédit non autorisé' });

  const fromBalance = parseFloat(fromAccount.balance);
  if (fromBalance < amount) return res.status(400).json({ error: `Solde insuffisant sur ${fromAccount.name} (${fromBalance} FCFA)` });

  let cat = await Category.findOne({ where: { userId: req.userId, name: 'Virement Interne' } });
  if (!cat) cat = await Category.create({ userId: req.userId, name: 'Virement Interne', type: 'expense', color: '#6366f1' });

  const now = new Date().toISOString().slice(0, 10);
  const desc = description || `Virement vers ${toAccount.name}`;

  const txn = await sequelize.transaction();
  try {
    const outTxn = await Transaction.create({
      userId: req.userId, accountId: fromAccountId, categoryId: cat.id,
      type: 'expense', amount, description: desc, date: now, status: 'completed'
    }, { transaction: txn });
    const inTxn = await Transaction.create({
      userId: req.userId, accountId: toAccountId, categoryId: cat.id,
      type: 'income', amount, description: `Virement de ${fromAccount.name}`, date: now, status: 'completed'
    }, { transaction: txn });

    const newFromBalance = fromBalance - amount;
    const newToBalance = parseFloat(toAccount.balance) + amount;
    await fromAccount.update({ balance: newFromBalance }, { transaction: txn });
    await toAccount.update({ balance: newToBalance }, { transaction: txn });

    await AccountLedger.create({ accountId: fromAccount.id, transactionId: outTxn.id, userId: req.userId, change: -amount, balanceAfter: newFromBalance, description: `Transfer to ${toAccount.name}` }, { transaction: txn });
    await AccountLedger.create({ accountId: toAccount.id, transactionId: inTxn.id, userId: req.userId, change: amount, balanceAfter: newToBalance, description: `Transfer from ${fromAccount.name}` }, { transaction: txn });

    await txn.commit();
    res.status(201).json({
      message: `Virement de ${amount} FCFA effectué`,
      fromAccount: { id: fromAccount.id, name: fromAccount.name, balance: fromBalance - amount },
      toAccount: { id: toAccount.id, name: toAccount.name, balance: parseFloat(toAccount.balance) + amount },
      outgoing: outTxn,
      incoming: inTxn
    });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ error: 'Erreur lors du virement' });
  }
};
