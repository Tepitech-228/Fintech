const { User } = require('../models');

exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'email', 'currency', 'locale', 'theme'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await User.update(updates, { where: { id: req.userId } });
  const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
  res.json(user);
};
