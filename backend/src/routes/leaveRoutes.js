const express = require('express');
const router = express.Router();
const { 
  applyLeave, 
  getLeaves, 
  updateLeaveStatus, 
  getLeaveBalance, 
  getLeaveAllocations, 
  setLeaveAllocation 
} = require('../controllers/leaveController');

const { requireAuth, requireAdmin } = require('../middleware/auth');
router.use(requireAuth);
router.post('/apply', applyLeave);
router.post('/', applyLeave);
router.get('/', getLeaves);
router.get('/balance', getLeaveBalance);

router.get('/allocations', getLeaveAllocations);
router.post('/allocations', requireAdmin, setLeaveAllocation);
router.put('/allocations', requireAdmin, setLeaveAllocation);
router.patch('/:id/status', requireAdmin, updateLeaveStatus);
router.put('/:id/status', requireAdmin, updateLeaveStatus);
module.exports = router;