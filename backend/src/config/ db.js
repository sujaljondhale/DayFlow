const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../dayflow.sqlite');
const db = new sqlite3.Database(dbPath);
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
async function initDB() {

  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'HR', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
      company_name TEXT DEFAULT 'Odoo India',
      department TEXT,
      job_position TEXT,
      joining_date TEXT,
      address TEXT,
      avatar_url TEXT,
      status TEXT CHECK(status IN ('PRESENT', 'ABSENT', 'ON_LEAVE')) DEFAULT 'ABSENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      work_hours REAL DEFAULT 0.0,
      status TEXT CHECK(status IN ('PRESENT', 'HALF_DAY', 'ABSENT')) DEFAULT 'ABSENT',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      leave_type TEXT CHECK(leave_type IN ('PAID', 'SICK', 'UNPAID')) NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL,
      reason TEXT,
      attachment_url TEXT,
      status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
      admin_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      monthly_wage REAL NOT NULL,
      basic_salary REAL NOT NULL,
      hra REAL NOT NULL,
      standard_allowance REAL NOT NULL,
      performance_bonus REAL NOT NULL,
      lta REAL NOT NULL,
      fixed_allowance REAL NOT NULL,
      pf_deduction REAL NOT NULL,
      prof_tax REAL DEFAULT 200.0,
      net_salary REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);


  // Seed sample data if empty
  const countRow = await getAsync(`SELECT COUNT(*) as count FROM users`);
  if (countRow.count === 0) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const empPasswordHash = await bcrypt.hash('emp123', 10);
    // 1. Admin / HR User
    await runAsync(`
      INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'OIADUS20220001',
      'Admin Officer',
      'admin@dayflow.com',
      '+91 9876543210',
      adminPasswordHash,
      'ADMIN',
      'Odoo India',
      'Human Resources',
      'HR Director',
      '2022-01-15',
      'Mumbai HQ Office, India',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      'PRESENT'
    ]);
    // 2. Sample Employee 1
    await runAsync(`
      INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'OIJODO20230002',
      'John Doe',
      'john.doe@dayflow.com',
      '+91 9123456789',
      empPasswordHash,
      'EMPLOYEE',
      'Odoo India',
      'Engineering',
      'Full Stack Developer',
      '2023-06-01',
      'Flat 402, Green Valley, Pune',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      'PRESENT'
    ]);
    // 3. Sample Employee 2
    await runAsync(`
      INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'OISASM20240003',
      'Sarah Smith',
      'sarah.smith@dayflow.com',
      '+91 9988776655',
      empPasswordHash,
      'EMPLOYEE',
      'Odoo India',
      'Product',
      'UX Designer',
      '2024-02-10',
      'B-12, Park Street, Bengaluru',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      'ON_LEAVE'
    ]);
    await runAsync(`
      INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
      VALUES (2, 50000, 25000, 12500, 3332.5, 2082.5, 2082.5, 4970, 3000, 200, 46800)
    `);
    await runAsync(`
      INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
      VALUES (3, 60000, 30000, 15000, 3999, 2499, 2499, 6003, 3600, 200, 56200)
    `);
    await runAsync(`
      INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status)
      VALUES (3, 'PAID', '2026-08-20', '2026-08-24', 5, 'Family vacation', 'APPROVED')
    `);
    console.log(' SQLite Database Seeded with Sample Dayflow Data');
  }
}
module.exports = {
  db,
  initDB,
  runAsync,
  getAsync,
  allAsync
};