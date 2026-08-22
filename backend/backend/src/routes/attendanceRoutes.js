const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getTodayAttendance, getAttendanceLogs } = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/logs', getAttendanceLogs);

module.exports = router;
