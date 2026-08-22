const http = require('http');
const { calculateSalaryComponents } = require('../src/controllers/payrollController');
console.log('🧪 Starting Dayflow HRMS Backend Smoke Tests...');
// 1. Verify Salary Formula
const salary = calculateSalaryComponents(50000);
console.assert(salary.basicSalary === 25000, 'Basic salary calculation failed');
console.assert(salary.hra === 12500, 'HRA calculation failed');
console.assert(salary.pfDeduction === 3000, 'PF calculation failed');
console.assert(salary.profTax === 200, 'Professional tax calculation failed');
console.assert(salary.netSalary === 46800, 'Net salary calculation failed');
console.log('✅ Salary Component Calculation Test Passed!');
console.log('🎉 All Unit Tests Passed!');