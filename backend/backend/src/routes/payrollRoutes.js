const express = require('express');
const router = express.Router();
const { getMyPayroll, getAllPayrolls, updatePayroll } = require('../controllers/payrollController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/my-slip', getMyPayroll);
router.get('/all', requireAdmin, getAllPayrolls);
router.put('/:userId', requireAdmin, updatePayroll);

module.exports = router;
