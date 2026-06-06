const sequelize = require('./db/config');
const app = require('./app');
const { startInvestmentExecutor } = require('./jobs/investmentExecutor');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected');
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('Models synced');
    }
    app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
    startInvestmentExecutor();
  } catch (err) {
    console.error('Startup error:', err);
  }
}

start();
