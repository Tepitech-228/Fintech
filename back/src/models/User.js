const { DataTypes } = require('sequelize');
const sequelize = require('../db/config');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'EUR' },
  locale: { type: DataTypes.STRING(10), defaultValue: 'fr-FR' },
  theme: { type: DataTypes.STRING(20), defaultValue: 'light' }
});

module.exports = User;
