const { getAsync, allAsync, queryAsync } = require('../config/db');

async function checkIn(req, res) {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    let record = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND (date::text = $2 OR date = $2::date)`, [userId, today]);

    if (record && record.check_in && record.check_out) {
      return res.status(400).json({ success: false, error: 'Attendance already completed for today', record });
    }

    if (record && record.check_in) {
      return res.status(400).json({ success: false, error: 'Already checked in for today', record });
    }

    if (!record) {
      await queryAsync(`
        INSERT INTO attendance (user_id, date, check_in, status)
        VALUES ($1, $2, $3, 'PRESENT')
      `, [userId, today, nowTime]);
    }

    await queryAsync(`UPDATE users SET status = 'PRESENT' WHERE id = $1`, [userId]);

    record = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND (date::text = $2 OR date = $2::date)`, [userId, today]);

    return res.json({
      success: true,
      message: 'Check-in successful! Status updated to PRESENT.',
      attendance: record
    });
  } catch (err) {
    console.error('checkIn error:', err);
    return res.status(500).json({ success: false, error: 'Check-in failed' });
  }
}

async function checkOut(req, res) {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const record = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND (date::text = $2 OR date = $2::date)`, [userId, today]);

    if (!record || !record.check_in) {
      return res.status(400).json({ success: false, error: 'Cannot check out before checking in' });
    }

    const checkInDate = new Date(`${today}T${record.check_in}`);
    const checkOutDate = new Date(`${today}T${nowTime}`);
    const diffMs = checkOutDate - checkInDate;
    const hours = Math.max(0.1, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

    await queryAsync(`
      UPDATE attendance
      SET check_out = $1, work_hours = $2, status = 'PRESENT'
      WHERE id = $3
    `, [nowTime, hours, record.id]);

    await queryAsync(`UPDATE users SET status = 'PRESENT' WHERE id = $1`, [userId]);

    const updatedRecord = await getAsync(`SELECT * FROM attendance WHERE id = $1`, [record.id]);

    return res.json({
      success: true,
      message: 'Check-out successful!',
      attendance: updatedRecord
    });
  } catch (err) {
    console.error('checkOut error:', err);
    return res.status(500).json({ success: false, error: 'Check-out failed' });
  }
}

async function markAttendance(req, res) {
  try {
    const requestingUser = req.user;
    const isAdminOrHR = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR' || requestingUser.role === 'MANAGER';
    if (!isAdminOrHR) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin or Manager access required' });
    }

    const { userId, date, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ success: false, error: 'User ID and status are required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const upperStatus = status.toUpperCase();

    let record = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND (date::text = $2 OR date = $2::date)`, [userId, targetDate]);

    if (!record) {
      const checkInTime = upperStatus === 'PRESENT' ? '09:00:00' : null;
      const checkOutTime = upperStatus === 'PRESENT' ? '17:30:00' : null;
      const workHours = upperStatus === 'PRESENT' ? 8.50 : 0.00;
      await queryAsync(`
        INSERT INTO attendance (user_id, date, check_in, check_out, work_hours, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, targetDate, checkInTime, checkOutTime, workHours, upperStatus]);
    } else {
      const checkInTime = upperStatus === 'PRESENT' ? (record.check_in || '09:00:00') : null;
      const checkOutTime = upperStatus === 'PRESENT' ? (record.check_out || '17:30:00') : null;
      const workHours = upperStatus === 'PRESENT' ? (record.work_hours || 8.50) : 0.00;
      await queryAsync(`
        UPDATE attendance
        SET status = $1, check_in = $2, check_out = $3, work_hours = $4
        WHERE id = $5
      `, [upperStatus, checkInTime, checkOutTime, workHours, record.id]);
    }

    const today = new Date().toISOString().split('T')[0];
    if (targetDate === today) {
      await queryAsync(`UPDATE users SET status = $1 WHERE id = $2`, [upperStatus, userId]);
    }

    return res.json({ success: true, message: `Attendance marked as ${upperStatus}` });
  } catch (err) {
    console.error('markAttendance error:', err);
    return res.status(500).json({ success: false, error: 'Failed to mark attendance' });
  }
}

async function getTodayAttendance(req, res) {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const record = await getAsync(`SELECT * FROM attendance WHERE user_id = $1 AND (date::text = $2 OR date = $2::date)`, [userId, today]);

    let isCheckedIn = false;
    if (record && record.check_in && !record.check_out) {
      isCheckedIn = true;
    }

    return res.json({
      success: true,
      date: today,
      isCheckedIn,
      attendance: record || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch today attendance state' });
  }
}

async function getAttendanceLogs(req, res) {
  try {
    const requestingUser = req.user;
    const { startDate, endDate, userId } = req.query;

    const isAdminOrHR = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR' || requestingUser.role === 'MANAGER';
    
    let sql = `
      SELECT a.*, u.name as employee_name, u.employee_id, u.avatar_url
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdminOrHR) {
      params.push(requestingUser.userId);
      sql += ` AND a.user_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      sql += ` AND a.user_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND (a.date::text >= $${params.length} OR a.date >= $${params.length}::date)`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND (a.date::text <= $${params.length} OR a.date <= $${params.length}::date)`;
    }

    sql += ` ORDER BY a.date DESC, a.id DESC`;

    const logs = await allAsync(sql, params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('getAttendanceLogs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch attendance logs' });
  }
}

module.exports = {
  checkIn,
  checkOut,
  markAttendance,
  getTodayAttendance,
  getAttendanceLogs
};
