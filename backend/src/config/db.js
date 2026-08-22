const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dayflow';
const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
// Helper functions matching standard query patterns
async function queryAsync(text, params = []) {
  return await pool.query(text, params);
}
async function getAsync(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}
async function allAsync(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}
async function initDB() {
  try {
    // 1. Users / Employees table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password_hash TEXT NOT NULL,
        role VARCHAR(20) CHECK (role IN ('ADMIN', 'HR', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
        company_name VARCHAR(100) DEFAULT 'Odoo India',
        department VARCHAR(100),
        job_position VARCHAR(100),
        joining_date DATE DEFAULT CURRENT_DATE,
        address TEXT,
        avatar_url TEXT,
        status VARCHAR(20) CHECK (status IN ('PRESENT', 'ABSENT', 'ON_LEAVE')) DEFAULT 'ABSENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // 2. Attendance table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in VARCHAR(20),
        check_out VARCHAR(20),
        work_hours NUMERIC(5,2) DEFAULT 0.00,
        status VARCHAR(20) CHECK (status IN ('PRESENT', 'HALF_DAY', 'ABSENT')) DEFAULT 'ABSENT'
      );
    `);
    // 3. Leaves / Time-off table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(20) CHECK (leave_type IN ('PAID', 'SICK', 'UNPAID')) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT,
        attachment_url TEXT,
        status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
        admin_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // 4. Payroll table
    // 4. Leave Allocations table (Dynamic admin-managed )
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS leave_allocations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(20) CHECK (leave_type IN ('PAID', 'SICK', 'UNPAID')) NOT NULL,
        allocated_days INT NOT NULL DEFAULT 0,
        year INT NOT NULL DEFAULT 2026,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, leave_type, year)
      );
    `);
    // 5. Payroll table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        monthly_wage NUMERIC(10,2) NOT NULL,
        basic_salary NUMERIC(10,2) NOT NULL,
        hra NUMERIC(10,2) NOT NULL,
        standard_allowance NUMERIC(10,2) NOT NULL,
        performance_bonus NUMERIC(10,2) NOT NULL,
        lta NUMERIC(10,2) NOT NULL,
        fixed_allowance NUMERIC(10,2) NOT NULL,
        pf_deduction NUMERIC(10,2) NOT NULL,
        prof_tax NUMERIC(10,2) DEFAULT 200.00,
        net_salary NUMERIC(10,2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Check if initial seed data is needed
    const countRow = await getAsync(`SELECT COUNT(*) as count FROM users`);
    if (parseInt(countRow.count, 10) === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const empPasswordHash = await bcrypt.hash('emp123', 10);
      // Admin / HR User
      // Admin User
      await queryAsync(`
        INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      // Employee 1
      // Employee 1 (John Doe)
      await queryAsync(`
        INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      // Employee 2
      // Employee 2 (Sarah Smith)
      await queryAsync(`
        INSERT INTO users (employee_id, name, email, phone, password_hash, role, company_name, department, job_position, joining_date, address, avatar_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      // Seed dynamic leave allocations for employees
      await queryAsync(`
        INSERT INTO leave_allocations (user_id, leave_type, allocated_days, year)
        VALUES 
          (2, 'PAID', 24, 2026),
          (2, 'SICK', 12, 2026),
          (3, 'PAID', 24, 2026),
          (3, 'SICK', 12, 2026)
      `);
      // Seed Payroll entries
      await queryAsync(`
        INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
        VALUES (2, 50000, 25000, 12500, 3332.50, 2082.50, 2082.50, 4970, 3000, 200, 46800)
      `);
      await queryAsync(`
        INSERT INTO payroll (user_id, monthly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_deduction, prof_tax, net_salary)
        VALUES (3, 60000, 30000, 15000, 3999, 2499, 2499, 6003, 3600, 200, 56200)
      `);
      // Seed sample leave request
      await queryAsync(`
        INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason, status)
        VALUES (3, 'PAID', '2026-08-20', '2026-08-24', 5, 'Family vacation', 'APPROVED')
      `);
      console.log('🐘 PostgreSQL Database Initialized & Seeded Successfully!');
    }
  } catch (err) {
    console.error('PostgreSQL Initialization Error:', err.message);
  }
}
module.exports = {
  pool,
  initDB,
  queryAsync,
  getAsync,
  allAsync
};