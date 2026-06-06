const { Task } = require('../models');

exports.getAll = async (req, res) => {
  const { status, priority } = req.query;
  const where = { userId: req.userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  const tasks = await Task.findAll({ where, order: [['dueDate', 'ASC']] });
  res.json(tasks);
};

exports.create = async (req, res) => {
  const task = await Task.create({ ...req.body, userId: req.userId });
  res.status(201).json(task);
};

exports.update = async (req, res) => {
  const [updated] = await Task.update(req.body, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const task = await Task.findByPk(req.params.id);
  res.json(task);
};

exports.remove = async (req, res) => {
  const deleted = await Task.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};
