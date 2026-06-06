const { Project } = require('../models');

const ALLOWED_FIELDS = ['name', 'description', 'budget', 'status', 'startDate', 'endDate', 'color'];

exports.getAll = async (req, res) => {
  const projects = await Project.findAll({ where: { userId: req.userId }, order: [['createdAt', 'DESC']] });
  res.json(projects);
};

exports.create = async (req, res) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const project = await Project.create({ ...data, userId: req.userId });
  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const [updated] = await Project.update(data, { where: { id: req.params.id, userId: req.userId } });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  const project = await Project.findByPk(req.params.id);
  res.json(project);
};

exports.remove = async (req, res) => {
  const deleted = await Project.destroy({ where: { id: req.params.id, userId: req.userId } });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
};
