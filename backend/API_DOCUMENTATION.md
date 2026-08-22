#  Dayflow HRMS - API Documentation (Odoo Hackathon Sync)
**Base URL**: `http://localhost:5001/api/v1`  
**Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`
---
## 🔐 1. Authentication & User Credentials (`/auth`)
### `POST /auth/signup`
Registers a new Admin/HR or Employee user. Generates Employee ID automatically using the format `[OI][First 2 letters of first & last name][YYYY][0001]`.
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@dayflow.com",
  "password": "Password123!",
  "role": "EMPLOYEE",
  "companyName": "Odoo India",
  "department": "Engineering",
  "jobPosition": "Full Stack Developer",
  "phone": "+91 9123456789",
  "address": "Flat 402, Green Valley, Pune"
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 2,
    "employeeId": "OIJODO20260001",
    "name": "John Doe",
    "email": "john.doe@dayflow.com",
    "role": "EMPLOYEE",
    "companyName": "Odoo India",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=John%20Doe"
  }
}
```
---
### `POST /auth/login`
Authenticates a user using **Email** OR **Employee ID**.
- **Request Body**:
```json
{
  "loginId": "OIJODO20230002",
  "password": "emp123"
}
```
*(or using `"email": "admin@dayflow.com"`, `"password": "admin123"`)*
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": 2,
    "employeeId": "OIJODO20230002",
    "name": "John Doe",
    "email": "john.doe@dayflow.com",
    "phone": "+91 9123456789",
    "role": "EMPLOYEE",
    "companyName": "Odoo India",
    "department": "Engineering",
    "jobPosition": "Full Stack Developer",
    "joiningDate": "2023-06-01",
    "address": "Flat 402, Green Valley, Pune",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    "status": "PRESENT"
  }
}
```
---
### `GET /auth/me`
Gets the profile of the currently logged-in user.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`)**: Returns current user object.
---
## 👥 2. Employees Module (`/employees`)
### `GET /employees`
Returns a list of all employees (Cards View). Supports search, filtering by attendance status (`PRESENT`, `ABSENT`, `ON_LEAVE`), and department.
- **Query Parameters**:
  - `search` (optional): Filter by name, email, employee ID, or position
  - `status` (optional): `PRESENT` | `ABSENT` | `ON_LEAVE`
  - `department` (optional): e.g. `Engineering`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "count": 3,
  "employees": [
    {
      "id": 1,
      "employee_id": "OIADUS20220001",
      "name": "Admin Officer",
      "email": "admin@dayflow.com",
      "phone": "+91 9876543210",
      "role": "ADMIN",
      "company_name": "Odoo India",
      "department": "Human Resources",
      "job_position": "HR Director",
      "joining_date": "2022-01-15",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      "status": "PRESENT"
    }
  ]
}
```
---
### `GET /employees/:id`
Fetch single employee full profile details.
*(Note: `salaryInfo` is included ONLY for Admin/HR users)*.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "employee": {
    "id": 2,
    "employee_id": "OIJODO20230002",
    "name": "John Doe",
    "email": "john.doe@dayflow.com",
    "phone": "+91 9123456789",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "job_position": "Full Stack Developer",
    "joining_date": "2023-06-01",
    "address": "Flat 402, Green Valley, Pune",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    "status": "PRESENT"
  },
  "salaryInfo": {
    "monthly_wage": 50000,
    "basic_salary": 25000,
    "hra": 12500,
    "net_salary": 46800
  }
}
```
---
### `PUT /employees/:id`
Updates employee profile. Regular employees can update phone, address, avatarUrl. Admins can update all details.
- **Request Body**:
```json
{
  "phone": "+91 9123456789",
  "address": "New Address, Mumbai",
  "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=NewAvatar"
}
```
---
## ⏱️ 3. Attendance Management (`/attendance`)
### `POST /attendance/check-in`
Marks daily check-in (Systray Action). Updates status indicator to **PRESENT (Green Dot)**.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Check-in successful! Status updated to PRESENT.",
  "attendance": {
    "id": 1,
    "user_id": 2,
    "date": "2026-08-22",
    "check_in": "09:30:00",
    "check_out": null,
    "work_hours": 0,
    "status": "PRESENT"
  }
}
```
---
### `POST /attendance/check-out`
Marks daily check-out and calculates total work hours.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Check-out successful!",
  "attendance": {
    "id": 1,
    "user_id": 2,
    "date": "2026-08-22",
    "check_in": "09:30:00",
    "check_out": "18:00:00",
    "work_hours": 8.5,
    "status": "PRESENT"
  }
}
```
---
### `GET /attendance/today`
Returns today's check-in status for the logged-in user.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "date": "2026-08-22",
  "isCheckedIn": true,
  "attendance": { ... }
}
```
---
### `GET /attendance/logs`
Returns attendance log records (Employee views own, Admin views all).
- **Query Parameters**: `startDate`, `endDate`, `userId`
---
## 🏝️ 4. Leave & Time-Off Management (`/leaves`)
### `POST /leaves/apply`
Submits a leave application.
- **Request Body**:
```json
{
  "leaveType": "PAID",
  "startDate": "2026-09-01",
  "endDate": "2026-09-03",
  "reason": "Personal work",
  "attachmentUrl": ""
}
```
---
### `GET /leaves`
Returns leave applications (Filtered by `status` or `userId`).
---
### `GET /leaves/balance`
Returns available leave quota balances.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "balance": {
    "paidLeave": { "total": 24, "used": 5, "available": 19 },
    "sickLeave": { "total": 12, "used": 0, "available": 12 },
    "unpaidLeave": { "used": 0 }
  }
}
```
---
### `PATCH /leaves/:id/status` *(Admin/HR Only)*
Approve or reject leave request. (If approved, sets status to `ON_LEAVE` / Airplane Icon).
- **Request Body**:
```json
{
  "status": "APPROVED",
  "adminComment": "Approved by HR"
}
```
---
## 💵 5. Payroll & Salary Management (`/payroll`)
### `GET /payroll/my-slip`
Returns automatic breakdown of employee salary according to Excalidraw specs.
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "payroll": {
    "monthlyWage": 50000,
    "yearlyWage": 600000,
    "basicSalary": 25000,
    "hra": 12500,
    "standardAllowance": 3332.5,
    "performanceBonus": 2082.5,
    "lta": 2082.5,
    "fixedAllowance": 4970,
    "pfDeduction": 3000,
    "profTax": 200,
    "totalDeductions": 3200,
    "netSalary": 46800
  }
}
```
---
### `PUT /payroll/:userId` *(Admin/HR Only)*
Updates an employee's wage and auto-recalculates all salary components.
- **Request Body**:
```json
{
  "monthlyWage": 65000
}
```
---
## 📊 6. Dashboard Aggregations (`/dashboard/stats`)
### `GET /dashboard/stats`
Returns total employee counts, status distributions, pending approvals, and user's today check-in status.
