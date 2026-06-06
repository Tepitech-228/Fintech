const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const InvestmentPlan = sequelize.define('InvestmentPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  frequency: { type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'), allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  targetAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  savingGoalId: { type: DataTypes.INTEGER, allowNull: false },
  nextExecutionDate: { type: DataTypes.DATEONLY, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = InvestmentPlan;
