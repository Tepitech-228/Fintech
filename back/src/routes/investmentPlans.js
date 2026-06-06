const router = require('express').Router();
const investmentPlans = require('../controllers/investmentPlans');
const { validateInvestmentPlanInput } = require('../middleware/validation');

router.get('/', investmentPlans.list);
router.get('/:id', investmentPlans.getById);
router.post('/', validateInvestmentPlanInput, investmentPlans.create);
router.put('/:id', validateInvestmentPlanInput, investmentPlans.update);
router.delete('/:id', investmentPlans.remove);
router.post('/:id/execute', investmentPlans.execute);

module.exports = router;
