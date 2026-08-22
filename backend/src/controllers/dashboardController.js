const { getAsync, allAsync } = require('../config/db');
async function getDashboardStats(req, res) {
  try {
    const requestingUser = req.user;
    const today = new Date().toISOString().split('T')[0];

    const totalEmpRow = await getAsync(`SELECT COUNT(*) as count FROM users`);
    const totalEmployees = totalEmpRow.count;

    const presentRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'PRESENT'`);
    const onLeaveRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'ON_LEAVE'`);
    const absentRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE status = 'ABSENT'`);
    const pendingLeaveRow = await getAsync(`SELECT COUNT(*) as count FROM leaves WHERE status = 'PENDING'`);
    const myAttendance = await getAsync(`SELECT * FROM attendance WHERE user_id = ? AND date = ?`, [requestingUser.userId, today]);
    const recentLeaves = await allAsync(`
      SELECT l.*, u.name as employee_name, u.avatar_url
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);
    return res.json({
      success: true,
      stats: {
        totalEmployees,
        presentCount: presentRow.count,
        onLeaveCount: onLeaveRow.count,
        absentCount: absentRow.count,
        pendingLeavesCount: pendingLeaveRow.count
      },
      myTodayStatus: {
        date: today,
        isCheckedIn: myAttendance && myAttendance.check_in && !myAttendance.check_out ? true : false,
        attendance: myAttendance || null
      },
      recentActivities: recentLeaves
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
}
module.exports = {
  getDashboardStats
};
