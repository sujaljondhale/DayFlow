const { getAsync, allAsync, queryAsync } = require('../config/db');

async function applyLeave(req, res) {
  try {
    const userId = req.user.userId;
    const rawLeaveType = req.body.leaveType || req.body.leave_type;
    const startDate = req.body.startDate || req.body.start_date;
    const endDate = req.body.endDate || req.body.end_date;
    const reason = req.body.reason || '';
    const attachmentUrl = req.body.attachmentUrl || req.body.attachment_url || '';

    if (!rawLeaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Leave type, start date, and end date are required' });
    }

    let leaveType = rawLeaveType.toString().toUpperCase();
    if (leaveType.includes('SICK')) {
      leaveType = 'SICK';
    } else if (leaveType.includes('UNPAID')) {
      leaveType = 'UNPAID';
    } else {
      leaveType = 'PAID';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, error: 'End date cannot be prior to start date' });
    }

    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const insertResult = await queryAsync(`
      INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, attachment_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
      RETURNING id
    `, [userId, leaveType, startDate, endDate, totalDays, reason, attachmentUrl]);

    const newLeave = await getAsync(`SELECT * FROM leaves WHERE id = $1`, [insertResult.rows[0].id]);

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: newLeave
    });
  } catch (err) {
    console.error('applyLeave error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit leave application' });
  }
}

async function getLeaves(req, res) {
  try {
    const requestingUser = req.user;
    const { status, userId } = req.query;

    const isAdminOrHR = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR';

    let sql = `
      SELECT l.*, u.name as employee_name, u.employee_id, u.avatar_url, u.department
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdminOrHR) {
      params.push(requestingUser.userId);
      sql += ` AND l.user_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      sql += ` AND l.user_id = $${params.length}`;
    }

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND l.status = $${params.length}`;
    }

    sql += ` ORDER BY l.created_at DESC`;

    const leaves = await allAsync(sql, params);
    return res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch leave requests' });
  }
}

async function updateLeaveStatus(req, res) {
  try {
    const leaveId = parseInt(req.params.id, 10);
    const { status, adminComment } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Status must be APPROVED or REJECTED' });
    }

    const leave = await getAsync(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }

    const newStatus = status.toUpperCase();
    await queryAsync(`
      UPDATE leaves
      SET status = $1, admin_comment = $2
      WHERE id = $3
    `, [newStatus, adminComment || '', leaveId]);

    if (newStatus === 'APPROVED') {
      await queryAsync(`UPDATE users SET status = 'ON_LEAVE' WHERE id = $1`, [leave.user_id]);
    }

    const updatedLeave = await getAsync(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);

    return res.json({
      success: true,
      message: `Leave request ${newStatus.toLowerCase()} successfully`,
      leave: updatedLeave
    });
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update leave status' });
  }
}

// Dynamic Leave Quotas calculation reading from DB leave_allocations table
async function getLeaveBalance(req, res) {
  try {
    const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : req.user.userId;
    const currentYear = new Date().getFullYear();

    // Fetch dynamic allocations set by Admin for this user
    const dbAllocations = await allAsync(
      `SELECT leave_type, allocated_days FROM leave_allocations WHERE user_id = $1 AND year = $2`,
      [targetUserId, currentYear]
    );

    // Fallback default quotas if admin hasn't set custom allocation
    let paidQuota = 24;
    let sickQuota = 12;

    dbAllocations.forEach(alloc => {
      if (alloc.leave_type === 'PAID') paidQuota = parseInt(alloc.allocated_days, 10);
      if (alloc.leave_type === 'SICK') sickQuota = parseInt(alloc.allocated_days, 10);
    });

    // Calculate approved leave days used by employee
    const approvedLeaves = await allAsync(
      `SELECT leave_type, SUM(total_days) as used_days FROM leaves WHERE user_id = $1 AND status = 'APPROVED' GROUP BY leave_type`,
      [targetUserId]
    );

    let usedPaid = 0;
    let usedSick = 0;
    let usedUnpaid = 0;

    approvedLeaves.forEach(row => {
      const days = parseInt(row.used_days, 10) || 0;
      if (row.leave_type === 'PAID') usedPaid = days;
      if (row.leave_type === 'SICK') usedSick = days;
      if (row.leave_type === 'UNPAID') usedUnpaid = days;
    });

    return res.json({
      success: true,
      year: currentYear,
      balance: {
        paidLeave: { total: paidQuota, used: usedPaid, available: Math.max(0, paidQuota - usedPaid) },
        sickLeave: { total: sickQuota, used: usedSick, available: Math.max(0, sickQuota - usedSick) },
        unpaidLeave: { used: usedUnpaid }
      }
    });
  } catch (err) {
    console.error('getLeaveBalance error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch leave balances' });
  }
}

// Admin API to fetch all leave allocations
async function getLeaveAllocations(req, res) {
  try {
    const { userId } = req.query;
    const currentYear = new Date().getFullYear();

    let sql = `
      SELECT la.*, u.name as employee_name, u.employee_id, u.department
      FROM leave_allocations la
      JOIN users u ON la.user_id = u.id
      WHERE la.year = $1
    `;
    const params = [currentYear];

    if (userId) {
      params.push(userId);
      sql += ` AND la.user_id = $2`;
    }

    sql += ` ORDER BY u.name ASC`;
    const allocations = await allAsync(sql, params);

    return res.json({ success: true, count: allocations.length, allocations });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch leave allocations' });
  }
}

// Admin API to dynamically allocate/update leave days for an employee
async function setLeaveAllocation(req, res) {
  try {
    const { userId, leaveType, allocatedDays, year } = req.body;

    if (!userId || !leaveType || allocatedDays === undefined) {
      return res.status(400).json({ success: false, error: 'userId, leaveType, and allocatedDays are required' });
    }

    const typeUpper = leaveType.toUpperCase();
    if (!['PAID', 'SICK', 'UNPAID'].includes(typeUpper)) {
      return res.status(400).json({ success: false, error: 'Invalid leave type. Must be PAID, SICK, or UNPAID' });
    }

    const allocYear = year || new Date().getFullYear();
    const days = parseInt(allocatedDays, 10);

    const user = await getAsync(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const existing = await getAsync(
      `SELECT id FROM leave_allocations WHERE user_id = $1 AND leave_type = $2 AND year = $3`,
      [userId, typeUpper, allocYear]
    );

    if (existing) {
      await queryAsync(
        `UPDATE leave_allocations SET allocated_days = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [days, existing.id]
      );
    } else {
      await queryAsync(
        `INSERT INTO leave_allocations (user_id, leave_type, allocated_days, year) VALUES ($1, $2, $3, $4)`,
        [userId, typeUpper, days, allocYear]
      );
    }

    return res.json({
      success: true,
      message: `Successfully allocated ${days} days of ${typeUpper} leave for employee #${userId}`,
      allocation: { userId, leaveType: typeUpper, allocatedDays: days, year: allocYear }
    });
  } catch (err) {
    console.error('setLeaveAllocation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to set leave allocation' });
  }
}

module.exports = {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalance,
  getLeaveAllocations,
  setLeaveAllocation
};
