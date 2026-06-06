const cron = require('node-cron');
const { InvestmentPlan } = require('../models');
const { executePlan } = require('../controllers/investmentPlans');

function normalizeDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function runInvestmentPlans() {
  const today = normalizeDate(new Date());
  const plans = await InvestmentPlan.findAll({ where: { isActive: true, nextExecutionDate: { [require('sequelize').Op.lte]: today } } });
  let created = 0;
  for (const plan of plans) {
    try {
      const result = await executePlan(plan, plan.userId);
      if (result.executed) created++;
    } catch (err) {
      console.error('Investment plan execution failed for plan', plan.id, err.message);
    }
  }
  return { runDate: today, executed: created, totalDue: plans.length };
}

function startInvestmentExecutor() {
  cron.schedule('0 0 * * *', async () => {
    console.log('Investment executor running at', new Date().toISOString());
    await runInvestmentPlans();
  }, { scheduled: true, timezone: 'UTC' });
}

module.exports = { startInvestmentExecutor, runInvestmentPlans };
