const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  month: { type: DataTypes.STRING(7), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
});

module.exports = Budget;
