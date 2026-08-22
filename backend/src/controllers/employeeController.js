const { getAsync, allAsync, runAsync } = require('../config/db');
async function getEmployees(req, res) {
  try {
    const { search, status, department } = req.query;
    let sql = `SELECT id, employee_id, name, email, phone, role, company_name, department, job_position, joining_date, avatar_url, status FROM users WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(employee_id) LIKE ? OR LOWER(job_position) LIKE ?)`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status.toUpperCase());
    }
    if (department) {
      sql += ` AND LOWER(department) = ?`;
      params.push(department.toLowerCase());
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
    const user = await getAsync(`SELECT * FROM users WHERE id = ?`, [targetId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    delete user.password_hash;
   
    let payrollInfo = null;
    if (requestingUser.role === 'ADMIN' || requestingUser.role === 'HR') {
      payrollInfo = await getAsync(`SELECT * FROM payroll WHERE user_id = ?`, [targetId]);
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
    const existing = await getAsync(`SELECT * FROM users WHERE id = ?`, [targetId]);
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
    await runAsync(`
      UPDATE users
      SET name = ?, phone = ?, address = ?, avatar_url = ?, department = ?, job_position = ?, role = ?, status = ?
      WHERE id = ?
    `, [updatedName, updatedPhone, updatedAddress, updatedAvatar, updatedDept, updatedPos, updatedRole, updatedStatus, targetId]);
    const updatedUser = await getAsync(`SELECT id, employee_id, name, email, phone, role, company_name, department, job_position, joining_date, address, avatar_url, status FROM users WHERE id = ?`, [targetId]);
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
