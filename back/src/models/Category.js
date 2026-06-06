const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('income', 'expense', 'investment', 'debt'), defaultValue: 'expense' },
  color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' },
  icon: { type: DataTypes.STRING(50), defaultValue: 'category' },
  accountId: { type: DataTypes.INTEGER, allowNull: true },
  monthlyBudget: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }
});

module.exports = Category;
