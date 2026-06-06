const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const AccountLedger = sequelize.define('AccountLedger', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accountId: { type: DataTypes.INTEGER, allowNull: false },
  transactionId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  change: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  balanceAfter: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true }
}, { timestamps: true, updatedAt: false });

module.exports = AccountLedger;
