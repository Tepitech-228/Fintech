const { DataTypes } = require('sequelize');
const sequelize = require('./config');

const qi = () => sequelize.getQueryInterface();

const tables = [
  {
    name: 'users',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      currency: { type: DataTypes.STRING(10), defaultValue: 'EUR' },
      locale: { type: DataTypes.STRING(10), defaultValue: 'fr-FR' },
      theme: { type: DataTypes.STRING(20), defaultValue: 'light' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'accounts',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      type: { type: DataTypes.ENUM('checking', 'savings', 'investment', 'cash', 'credit'), defaultValue: 'checking' },
      balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      currency: { type: DataTypes.STRING(10), defaultValue: 'EUR' },
      color: { type: DataTypes.STRING(20), defaultValue: '#0f172a' },
      icon: { type: DataTypes.STRING(50), defaultValue: 'account_balance' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'categories',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      type: { type: DataTypes.ENUM('income', 'expense', 'investment', 'debt'), defaultValue: 'expense' },
      color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' },
      icon: { type: DataTypes.STRING(50), defaultValue: 'category' },
      account_id: { type: DataTypes.INTEGER, allowNull: true },
      monthly_budget: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'transactions',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: false },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      goal_id: { type: DataTypes.INTEGER, allowNull: true },
      type: { type: DataTypes.ENUM('income', 'expense', 'investment', 'debt'), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
      recurring_interval: { type: DataTypes.STRING(20), allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'completed' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'budgets',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      month: { type: DataTypes.STRING(7), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'saving_goals',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      target_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      current_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      deadline: { type: DataTypes.DATEONLY, allowNull: true },
      color: { type: DataTypes.STRING(20), defaultValue: '#10b981' },
      icon: { type: DataTypes.STRING(50), defaultValue: 'savings' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'tasks',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
      status: { type: DataTypes.ENUM('todo', 'in_progress', 'done'), defaultValue: 'todo' },
      category: { type: DataTypes.STRING(100), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'projects',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      spent: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      status: { type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold'), defaultValue: 'planning' },
      start_date: { type: DataTypes.DATEONLY, allowNull: true },
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'account_ledgers',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      account_id: { type: DataTypes.INTEGER, allowNull: false },
      transaction_id: { type: DataTypes.INTEGER, allowNull: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      change: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      balance_after: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  },
  {
    name: 'investment_plans',
    schema: {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      frequency: { type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'), allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      target_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      saving_goal_id: { type: DataTypes.INTEGER, allowNull: false },
      next_execution_date: { type: DataTypes.DATEONLY, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    }
  }
];

async function up() {
  for (const t of tables) {
    try {
      await qi().createTable(t.name, t.schema);
      console.log(`  ✓ ${t.name}`);
    } catch (err) {
      if (err.message?.includes('already exists')) {
        console.log(`  ~ ${t.name} (already exists)`);
      } else {
        throw err;
      }
    }
  }
  console.log('All tables created');
}

async function down() {
  for (const t of tables.reverse()) {
    try {
      await qi().dropTable(t.name);
      console.log(`  ✗ ${t.name}`);
    } catch {
      console.log(`  ~ ${t.name} (not found)`);
    }
  }
  tables.reverse();
  console.log('All tables dropped');
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const arg = process.argv[2] || 'up';
    if (arg === 'down') await down(); else await up();
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
