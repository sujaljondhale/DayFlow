const { getAsync, allAsync, queryAsync } = require('../config/db');

function calculateSalaryComponents(monthlyWage) {
  const wage = parseFloat(monthlyWage);
  const basic = parseFloat((wage * 0.50).toFixed(2));
  const hra = parseFloat((basic * 0.50).toFixed(2));
  const standardAllowance = parseFloat((basic * 0.1333).toFixed(2));
  const performanceBonus = parseFloat((basic * 0.0833).toFixed(2));
  const lta = parseFloat((basic * 0.0833).toFixed(2));
  
  const componentSum = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = parseFloat((wage - componentSum).toFixed(2));

  const pfDeduction = parseFloat((basic * 0.12).toFixed(2));
  const profTax = 200.00;

  const totalDeductions = pfDeduction + profTax;
  const netSalary = parseFloat((wage - totalDeductions).toFixed(2));

  return {
    monthlyWage: wage,
    yearlyWage: wage * 12,
    basicSalary: basic,
    hra,
    standardAllowance,
    performanceBonus,
    lta,
    fixedAllowance,
    pfDeduction,
    profTax,
    totalDeductions,
    netSalary
  };
}

async function getMyPayroll(req, res) {
  try {
    const userId = req.user.userId;
    const record = await getAsync(`SELECT * FROM payroll WHERE user_id = $1`, [userId]);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Payroll details not configured yet' });
    }

    const calculated = calculateSalaryComponents(record.monthly_wage);

    return res.json({
      success: true,
      payroll: {
        id: record.id,
        userId: record.user_id,
        ...calculated,
        updatedAt: record.updated_at
      }
    });
  } catch (err) {
    console.error('getMyPayroll error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch payroll slip' });
  }
}

async function getAllPayrolls(req, res) {
  try {
    const rows = await allAsync(`
      SELECT p.*, u.name as employee_name, u.employee_id, u.job_position, u.department, u.avatar_url
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      ORDER BY u.name ASC
    `);

    const payrolls = rows.map(row => {
      const calc = calculateSalaryComponents(row.monthly_wage);
      return {
        id: row.id,
        userId: row.user_id,
        employeeName: row.employee_name,
        employeeId: row.employee_id,
        jobPosition: row.job_position,
        department: row.department,
        avatarUrl: row.avatar_url,
        ...calc
      };
    });

    return res.json({ success: true, count: payrolls.length, payrolls });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch all payrolls' });
  }
}

async function updatePayroll(req, res) {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { monthlyWage } = req.body;

    if (!monthlyWage || isNaN(monthlyWage) || monthlyWage <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive monthlyWage is required' });
    }

    const user = await getAsync(`SELECT id FROM users WHERE id = $1`, [targetUserId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const calc = calculateSalaryComponents(monthlyWage);

    const existing = await getAsync(`SELECT id FROM payroll WHERE user_id = $1`, [targetUserId]);
    if (existing) {
      await queryAsync(`
        UPDATE payroll
        SET monthly_wage = $1, basic_salary = $2, hra = $3, standard_allowance = $4, performance_bonus = $5, lta = $6, fixed_allowance = $7, pf_deduction = $8, prof_tax = $9, net_salary = $10, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $11
      `, [calc.monthlyWage, calc.basicSalary, calc.hra, calc.standardAllowance, calc.performanceBonus, calc.lta, calc.fixedAllowance, calc.pfDeduction, calc.profTax, calc.netSalary, targetUserId]);
    } else {
      await queryAsync(`
        INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [targetUserId, calc.monthlyWage, calc.basicSalary, calc.hra, calc.standardAllowance, calc.performanceBonus, calc.lta, calc.fixedAllowance, calc.pfDeduction, calc.profTax, calc.netSalary]);
    }

    return res.json({
      success: true,
      message: 'Payroll updated and recalculated successfully',
      payroll: { userId: targetUserId, ...calc }
    });
  } catch (err) {
    console.error('updatePayroll error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update payroll' });
  }
}

module.exports = {
  calculateSalaryComponents,
  getMyPayroll,
  getAllPayrolls,
  updatePayroll
};
