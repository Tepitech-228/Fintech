module.exports = {
  up: async (qi, Sequelize) => {
    await qi.createTable('investment_plans', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      frequency: { type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      target_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      saving_goal_id: { type: Sequelize.INTEGER, allowNull: false },
      next_execution_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  down: async (qi, Sequelize) => {
    await qi.dropTable('investment_plans');
  }
};
