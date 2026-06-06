const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  accountId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  goalId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('income', 'expense', 'investment', 'debt'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  recurringInterval: { type: DataTypes.STRING(20), allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'completed' }
});

module.exports = Transaction;
