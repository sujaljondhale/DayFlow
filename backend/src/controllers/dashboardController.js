const { getAsync, allAsync } = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const requestingUser = req.user;
    const today = new Date().toISOString().split('T')[0];

    const totalEmpRow = await getAsync(`SELECT COUNT(*) as count FROM users`);
    const totalEmployees = parseInt(totalEmpRow?.count || totalEmpRow?.['COUNT(*)'] || 0, 10);

    const presentRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'PRESENT'`);
    const presentToday = parseInt(presentRow?.count || presentRow?.['COUNT(*)'] || 0, 10);

    const onLeaveRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'ON_LEAVE'`);
    const onLeave = parseInt(onLeaveRow?.count || onLeaveRow?.['COUNT(*)'] || 0, 10);

    const absentRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'ABSENT'`);
    const absentToday = parseInt(absentRow?.count || absentRow?.['COUNT(*)'] || 0, 10);

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

    // Weekly attendance trend
    const trendRows = await allAsync(`
      SELECT date, 
             SUM(CASE WHEN check_in IS NOT NULL THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `);

    const attendanceTrend = (trendRows || []).map((t) => ({
      date: t.date,
      present: parseInt(t.present || 0, 10),
      absent: parseInt(t.absent || 0, 10),
    }));

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
