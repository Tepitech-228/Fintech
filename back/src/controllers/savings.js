const { SavingGoal } = require('../models');

exports.getAll = async (req, res) => {
  const goals = await SavingGoal.findAll({ where: { userId: req.userId } });
  res.json(goals);
};

exports.create = async (req, res) => {
  const goal = await SavingGoal.create({ ...req.body, userId: req.userId });
  res.status(201).json(goal);
};

exports.update = async (req, res) => {
  const [updated] = await SavingGoal.update(req.body, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const goal = await SavingGoal.findByPk(req.params.id);
  res.json(goal);
};

exports.remove = async (req, res) => {
  const deleted = await SavingGoal.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};
