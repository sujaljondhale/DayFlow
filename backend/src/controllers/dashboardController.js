const { getAsync, allAsync } = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const requestingUser = req.user;
    const today = new Date().toISOString().split('T')[0];
    const daysLimit = parseInt(req.query.days || 7, 10);

    const totalEmpRow = await getAsync(`SELECT COUNT(*) as count FROM users`);
    const totalEmployees = parseInt(totalEmpRow?.count || totalEmpRow?.['COUNT(*)'] || 0, 10);

    const presentAttRow = await getAsync(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM attendance 
      WHERE date = $1 AND check_in IS NOT NULL
    `, [today]);
    const presentAttCount = parseInt(presentAttRow?.count || presentAttRow?.['COUNT(*)'] || 0, 10);

    const presentStatusRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'PRESENT'`);
    const presentStatusCount = parseInt(presentStatusRow?.count || presentStatusRow?.['COUNT(*)'] || 0, 10);
    
    const presentToday = Math.max(presentAttCount, presentStatusCount);

    const onLeaveRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'ON_LEAVE'`);
    const onLeave = parseInt(onLeaveRow?.count || onLeaveRow?.['COUNT(*)'] || 0, 10);

    const absentToday = Math.max(0, totalEmployees - presentToday - onLeave);

    const pendingLeaveRow = await getAsync(`SELECT COUNT(*) as count FROM leaves WHERE status = 'PENDING'`);
    const pendingLeaves = parseInt(pendingLeaveRow?.count || pendingLeaveRow?.['COUNT(*)'] || 0, 10);

    const myAttendance = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND date = $2`, [requestingUser.userId, today]);

    const deptRows = await allAsync(`
      SELECT department, COUNT(*) as count
      FROM users
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY count DESC
    `);

    const departmentDistribution = (deptRows || []).map((d) => ({
      department: d.department,
      count: parseInt(d.count || 0, 10),
    }));

    // Dynamic Attendance trend for past N days
    const dates = [];
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const attendanceTrend = [];
    for (const d of dates) {
      const pRow = await getAsync(`SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = $1 AND check_in IS NOT NULL`, [d]);
      const present = parseInt(pRow?.count || pRow?.['COUNT(*)'] || 0, 10);
      const onLRow = await getAsync(`SELECT COUNT(DISTINCT user_id) as count FROM leaves WHERE status = 'APPROVED' AND start_date <= $1 AND end_date >= $1`, [d]);
      const onLeaveCount = parseInt(onLRow?.count || onLRow?.['COUNT(*)'] || 0, 10);
      const absent = Math.max(0, totalEmployees - present - onLeaveCount);
      attendanceTrend.push({ date: d, present, absent });
    }

    return res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        onLeave,
        absentToday,
        pendingLeaves,
        departmentDistribution,
        attendanceTrend,
      },
      myTodayStatus: {
        date: today,
        isCheckedIn: myAttendance && myAttendance.check_in && !myAttendance.check_out ? true : false,
        attendance: myAttendance || null,
      },
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
}

module.exports = {
  getDashboardStats,
};
