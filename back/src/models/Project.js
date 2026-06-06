const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  spent: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold'), defaultValue: 'planning' },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' }
});

module.exports = Project;
