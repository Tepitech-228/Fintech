const User = require('./User');
const Account = require('./Account');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const SavingGoal = require('./SavingGoal');
const Task = require('./Task');
const Project = require('./Project');
const AccountLedger = require('./AccountLedger');
const InvestmentPlan = require('./InvestmentPlan');

User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId' });
Account.hasMany(Category, { foreignKey: 'accountId', as: 'categories' });
Category.belongsTo(Account, { foreignKey: 'accountId' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

Account.hasMany(Transaction, { foreignKey: 'accountId', as: 'transactions' });
Transaction.belongsTo(Account, { foreignKey: 'accountId' });

Account.hasMany(AccountLedger, { foreignKey: 'accountId', as: 'ledger' });
AccountLedger.belongsTo(Account, { foreignKey: 'accountId' });
Transaction.hasMany(AccountLedger, { foreignKey: 'transactionId', as: 'ledgerEntries' });
AccountLedger.belongsTo(Transaction, { foreignKey: 'transactionId' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId' });
Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(SavingGoal, { foreignKey: 'userId', as: 'savingGoals' });
SavingGoal.belongsTo(User, { foreignKey: 'userId' });
SavingGoal.hasMany(Transaction, { foreignKey: 'goalId', as: 'goalTransactions' });
Transaction.belongsTo(SavingGoal, { foreignKey: 'goalId' });

User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(InvestmentPlan, { foreignKey: 'userId', as: 'investmentPlans' });
InvestmentPlan.belongsTo(User, { foreignKey: 'userId' });
InvestmentPlan.belongsTo(SavingGoal, { foreignKey: 'savingGoalId', as: 'savingGoal' });
SavingGoal.hasMany(InvestmentPlan, { foreignKey: 'savingGoalId', as: 'investmentPlans' });

module.exports = { User, Account, Category, Transaction, Budget, SavingGoal, Task, Project, AccountLedger, InvestmentPlan };
