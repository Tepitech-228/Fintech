const router = require('express').Router();
const { auth } = require('../middleware');
const accounts = require('../controllers/accounts');
const categories = require('../controllers/categories');
const transactions = require('../controllers/transactions');
const transfers = require('../controllers/transfers');
const { validateTransactionInput, validateTransferInput } = require('../middleware/validation');
const investmentPlansRoutes = require('./investmentPlans');
const budgets = require('../controllers/budgets');
const savings = require('../controllers/savings');
const tasks = require('../controllers/tasks');
const projects = require('../controllers/projects');
const users = require('../controllers/users');
const dashboard = require('../controllers/dashboard');
const report = require('../controllers/report');
const recurring = require('../controllers/recurring');

const login = require('../controllers/login');

router.post('/auth/login', login.login);
router.post('/auth/register', login.register);

router.use(auth);

router.get('/dashboard', dashboard.getDashboard);

router.get('/accounts', accounts.getAll);
router.get('/accounts/:id', accounts.getById);
router.post('/accounts', accounts.create);
router.post('/accounts/:id/deposit', accounts.deposit);
router.put('/accounts/:id', accounts.update);
router.delete('/accounts/:id', accounts.remove);

router.get('/categories', categories.getAll);
router.post('/categories', categories.create);
router.put('/categories/:id', categories.update);
router.delete('/categories/:id', categories.remove);
router.get('/categories/summary', categories.getSummary);

router.get('/transactions', transactions.getAll);
router.get('/transactions/overview', transactions.getOverview);
router.get('/transactions/monthly/:year/:month', transactions.getMonthly);
router.get('/transactions/:id', transactions.getById);
router.post('/transactions', validateTransactionInput, transactions.create);
router.put('/transactions/:id', validateTransactionInput, transactions.update);
router.delete('/transactions/:id', transactions.remove);
router.post('/transactions/:id/complete', transactions.complete);

router.use('/investment-plans', investmentPlansRoutes);

router.get('/budgets', budgets.getAll);
router.post('/budgets', budgets.create);
router.put('/budgets/:id', budgets.update);
router.delete('/budgets/:id', budgets.remove);
router.get('/budgets/overview/:year/:month', budgets.getMonthlyOverview);
router.get('/budgets/alerts', budgets.getAlerts);

router.get('/savings', savings.getAll);
router.post('/savings', savings.create);
router.put('/savings/:id', savings.update);
router.delete('/savings/:id', savings.remove);

router.get('/tasks', tasks.getAll);
router.post('/tasks', tasks.create);
router.put('/tasks/:id', tasks.update);
router.delete('/tasks/:id', tasks.remove);

router.get('/projects', projects.getAll);
router.post('/projects', projects.create);
router.put('/projects/:id', projects.update);
router.delete('/projects/:id', projects.remove);

router.get('/profile', users.getProfile);
router.put('/profile', users.updateProfile);

router.get('/transfers', transfers.getAll);
router.post('/transfers', validateTransferInput, transfers.create);

router.get('/report/monthly/:year/:month', report.getMonthly);
router.post('/recurring/process', recurring.process);

module.exports = router;
