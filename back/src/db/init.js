const sequelize = require('./config');
const models = require('../models');

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync({ force: true });
    console.log('All tables synced');
  } catch (err) {
    console.error('DB init error:', err);
  } finally {
    process.exit(0);
  }
}

initDB();
