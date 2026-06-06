const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const SavingGoal = sequelize.define('SavingGoal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  targetAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  deadline: { type: DataTypes.DATEONLY, allowNull: true },
  color: { type: DataTypes.STRING(20), defaultValue: '#10b981' },
  icon: { type: DataTypes.STRING(50), defaultValue: 'savings' }
});

module.exports = SavingGoal;
