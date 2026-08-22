const { getAsync, allAsync, queryAsync } = require('../config/db');

async function getEmployees(req, res) {
  try {
    const { search, status, department } = req.query;
    let sql = `SELECT id, employee_id, name, email, phone, role, company_name, department, job_position, joining_date, avatar_url, status FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(employee_id) LIKE $${params.length} OR LOWER(job_position) LIKE $${params.length})`;
    }

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND status = $${params.length}`;
    }

    if (department) {
      params.push(department.toLowerCase());
      sql += ` AND LOWER(department) = $${params.length}`;
    }

    sql += ` ORDER BY id ASC`;
    const employees = await allAsync(sql, params);

    return res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    console.error('getEmployees error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch employee list' });
  }
}

async function getEmployeeById(req, res) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    const user = await getAsync(`SELECT * FROM users WHERE id = $1`, [targetId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    delete user.password_hash;

    let payrollInfo = null;
    if (requestingUser.role === 'ADMIN' || requestingUser.role === 'HR') {
      payrollInfo = await getAsync(`SELECT * FROM payroll WHERE user_id = $1`, [targetId]);
    }

    return res.json({
      success: true,
      employee: user,
      salaryInfo: payrollInfo
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch employee details' });
  }
}

async function updateEmployee(req, res) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    const isAdminOrHR = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR';
    if (!isAdminOrHR && requestingUser.userId !== targetId) {
      return res.status(403).json({ success: false, error: 'Permission denied: Cannot edit another employee' });
    }

    const { name, phone, address, avatarUrl, department, jobPosition, role, status } = req.body;

    const existing = await getAsync(`SELECT * FROM users WHERE id = $1`, [targetId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    let updatedName = existing.name;
    let updatedPhone = phone !== undefined ? phone : existing.phone;
    let updatedAddress = address !== undefined ? address : existing.address;
    let updatedAvatar = avatarUrl !== undefined ? avatarUrl : existing.avatar_url;
    let updatedDept = existing.department;
    let updatedPos = existing.job_position;
    let updatedRole = existing.role;
    let updatedStatus = existing.status;

    if (isAdminOrHR) {
      if (name) updatedName = name;
      if (department) updatedDept = department;
      if (jobPosition) updatedPos = jobPosition;
      if (role && ['ADMIN', 'HR', 'EMPLOYEE'].includes(role.toUpperCase())) updatedRole = role.toUpperCase();
      if (status && ['PRESENT', 'ABSENT', 'ON_LEAVE'].includes(status.toUpperCase())) updatedStatus = status.toUpperCase();
    }

    await queryAsync(`
      UPDATE users
      SET name = $1, phone = $2, address = $3, avatar_url = $4, department = $5, job_position = $6, role = $7, status = $8
      WHERE id = $9
    `, [updatedName, updatedPhone, updatedAddress, updatedAvatar, updatedDept, updatedPos, updatedRole, updatedStatus, targetId]);

    const updatedUser = await getAsync(`SELECT id, employee_id, name, email, phone, role, company_name, department, job_position, joining_date, address, avatar_url, status FROM users WHERE id = $1`, [targetId]);

    return res.json({
      success: true,
      message: 'Employee profile updated successfully',
      employee: updatedUser
    });
  } catch (err) {
    console.error('updateEmployee error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  updateEmployee
};
