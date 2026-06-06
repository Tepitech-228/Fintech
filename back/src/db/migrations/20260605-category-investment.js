module.exports = {
  up: async (qi, Sequelize) => {
    await qi.changeColumn('categories', 'type', {
      type: Sequelize.ENUM('income', 'expense', 'investment', 'debt'),
      allowNull: false,
      defaultValue: 'expense'
    });
  },
  down: async (qi, Sequelize) => {
    await qi.changeColumn('categories', 'type', {
      type: Sequelize.ENUM('income', 'expense', 'debt'),
      allowNull: false,
      defaultValue: 'expense'
    });
  }
};
