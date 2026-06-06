const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const Account = sequelize.define('Account', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('checking', 'savings', 'investment', 'cash', 'credit'), defaultValue: 'checking' },
  balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), defaultValue: 'EUR' },
  color: { type: DataTypes.STRING(20), defaultValue: '#0f172a' },
  icon: { type: DataTypes.STRING(50), defaultValue: 'account_balance' }
});

module.exports = Account;
