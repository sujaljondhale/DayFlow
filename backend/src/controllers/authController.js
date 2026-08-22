const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAsync, queryAsync, allAsync } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function generateEmployeeId(name, joiningYear = new Date().getFullYear()) {
  const parts = name.trim().split(' ').filter(Boolean);
  let fn = 'XX';
  let ln = 'XX';

  if (parts.length >= 2) {
    fn = parts[0].slice(0, 2).toUpperCase();
    ln = parts[parts.length - 1].slice(0, 2).toUpperCase();
  } else if (parts.length === 1) {
    fn = parts[0].slice(0, 2).toUpperCase();
    ln = parts[0].slice(0, 2).toUpperCase();
  }

  const prefix = `OI${fn}${ln}${joiningYear}`;
  
  const rows = await allAsync(
    `SELECT employee_id FROM users WHERE employee_id LIKE $1`,
    [`${prefix}%`]
  );
  
  const serial = String(rows.length + 1).padStart(4, '0');
  return `${prefix}${serial}`;
}

async function register(req, res) {
  try {
    const { name, email, password, role, companyName, department, jobPosition, phone, address, avatarUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existingUser = await getAsync(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    const currentYear = new Date().getFullYear();
    const employeeId = await generateEmployeeId(name, currentYear);
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = (role && ['ADMIN', 'HR', 'EMPLOYEE'].includes(role.toUpperCase())) ? role.toUpperCase() : 'EMPLOYEE';
    const userAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const insertResult = await queryAsync(`
      INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      employeeId,
      name.trim(),
      email.toLowerCase().trim(),
      phone || '',
      passwordHash,
      userRole,
      companyName || 'Odoo India',
      department || 'General',
      jobPosition || 'Employee',
      new Date().toISOString().split('T')[0],
      address || '',
      userAvatar,
      'ABSENT'
    ]);

    const newUserId = insertResult.rows[0].id;

    // Initialize default payroll entry
    const baseWage = 40000;
    const basic = baseWage * 0.5;
    const hra = basic * 0.5;
    const stdAllow = basic * 0.1333;
    const perfBonus = basic * 0.0833;
    const lta = basic * 0.0833;
    const fixedAllow = baseWage - (basic + hra + stdAllow + perfBonus + lta);
    const pf = basic * 0.12;
    const profTax = 200;
    const netSalary = baseWage - (pf + profTax);

    await queryAsync(`
      INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [newUserId, baseWage, basic, hra, stdAllow, perfBonus, lta, fixedAllow, pf, profTax, netSalary]);

    const token = jwt.sign(
      { userId: newUserId, email: email.toLowerCase().trim(), role: userRole, employeeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUserId,
        employeeId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: userRole,
        companyName: companyName || 'Odoo India',
        avatarUrl: userAvatar
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

async function login(req, res) {
  try {
    const { loginId, email, password } = req.body;
    const identifier = (loginId || email || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Employee ID and password are required' });
    }

    const user = await getAsync(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(employee_id) = $1`,
      [identifier]
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Please check your Email/Employee ID.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please try again.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, employeeId: user.employee_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName: user.company_name,
        department: user.department,
        jobPosition: user.job_position,
        joiningDate: user.joining_date,
        address: user.address,
        avatarUrl: user.avatar_url,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await getAsync(`SELECT * FROM users WHERE id = $1`, [req.user.userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    delete user.password_hash;
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
