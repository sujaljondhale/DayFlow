# Dayflow HRMS

> **Every workday, perfectly aligned.**

Dayflow is a modern **Human Resource Management System (HRMS)** designed to digitize and streamline employee management, attendance, leave management, payroll visibility, and HR approval workflows.

Built for the **Odoo Hackathon**, Dayflow provides separate experiences for **Admin/HR** and **Employees**, with a responsive, production-oriented SaaS interface.

The system covers authentication, employee profiles, attendance tracking, leave requests, payroll, dashboards, analytics, and role-based access control.

### Website link: https://day-flow-it9a.vercel.app/dashboard

### Video link: https://drive.google.com/file/d/1w4F6YTRqiGNB-fwoadNjcBwOGnLWUEfH/view?usp=sharing

### credentials:
* admin: admin@dayflow.com.        password : admin123
* emp: john.doe@dayflow.com.       password : emp123
---

## ✨ Features

### 🔐 Authentication

* Employee/Admin/HR registration
* Login using Email or Employee ID
* JWT authentication
* Current-user session restoration
* Protected routes
* Role-based authorization
* Secure password handling
* Logout

### 👥 Employee Management

* Employee directory
* Employee search
* Filter by department
* Filter by attendance status
* Employee profile
* Personal information
* Job information
* Joining date
* Profile picture
* Role and department
* Role-based profile editing

### ⏱️ Attendance

* Daily check-in
* Daily check-out
* Today's attendance status
* Work-hour calculation
* Attendance history
* Daily attendance view
* Weekly attendance view
* Admin/HR attendance monitoring
* Employee-specific attendance access

Supported statuses include:

* `PRESENT`
* `ABSENT`
* `HALF-DAY`
* `LEAVE`
* `ON_LEAVE`

### 🏝️ Leave Management

Employees can:

* Apply for leave
* Select leave type
* Select date range
* Add a reason
* View leave requests
* View leave status
* View leave balance

Admin/HR can:

* View leave requests
* Approve requests
* Reject requests
* Add HR/Admin comments

Supported leave types:

* `PAID`
* `SICK`
* `UNPAID`

Supported request statuses:

* `PENDING`
* `APPROVED`
* `REJECTED`

### 💵 Payroll

Employees can:

* View their salary information
* View salary breakdown
* View deductions
* View net salary

Admin/HR can:

* View employee payroll
* Update monthly wage
* Trigger backend salary recalculation

Payroll includes:

* Monthly wage
* Yearly wage
* Basic salary
* HRA
* Standard allowance
* Performance bonus
* LTA
* Fixed allowance
* PF deduction
* Professional tax
* Total deductions
* Net salary

### 📊 Dashboard

Employee dashboard includes:

* Welcome section
* Today's attendance
* Check-in/check-out
* Work hours
* Leave balance
* Pending leave requests
* Recent activity
* Quick actions
* Payroll shortcut

Admin/HR dashboard includes:

* Total employees
* Attendance distribution
* Present employees
* Absent employees
* Employees on leave
* Pending approvals
* Employee overview
* Leave overview
* Analytics

### 📈 Reports & Analytics

The frontend provides an architecture for:

* Attendance reports
* Leave reports
* Employee reports
* Payroll/salary analytics
* Department-based analytics
* Date-based filtering
* Charts and data visualization

Only metrics supported by the backend API should be presented as real data.

### 🔔 Notifications

The UI includes an extensible notification architecture for:

* Leave approval
* Leave rejection
* Leave submission
* Attendance reminders
* Payroll updates
* HR announcements

> A dedicated notifications API is not included in the currently supplied API documentation, so notification persistence should be connected when such an endpoint becomes available.

---

# 🏗️ Architecture

```text
┌───────────────────────────────┐
│       Dayflow Frontend        │
│                               │
│ React + TypeScript + Vite     │
│ Tailwind + shadcn/ui          │
│ TanStack Query                │
│ React Hook Form + Zod         │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│        Backend API            │
│                               │
│ Node.js + Express             │
│ TypeScript                    │
│ JWT Authentication            │
│ Prisma ORM                    │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│         PostgreSQL            │
│                               │
│ Users / Employees             │
│ Attendance                    │
│ Leaves                        │
│ Leave Balances                │
│ Payroll                       │
│ Departments                   │
│ Companies                     │
└───────────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router
* TanStack Query
* React Hook Form
* Zod
* Lucide React
* Recharts
* date-fns

## Backend

Recommended backend stack:

* Node.js
* Express.js
* TypeScript
* Prisma

## Database

**PostgreSQL**

PostgreSQL is recommended because Dayflow contains strongly related HR data such as employees, attendance, leave requests, leave balances, and payroll.

---

# 📁 Project Structure

```text
dayflow/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── employees.api.ts
│   │   │   ├── attendance.api.ts
│   │   │   ├── leaves.api.ts
│   │   │   ├── payroll.api.ts
│   │   │   └── dashboard.api.ts
│   │   │
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── payroll/
│   │   │   └── profile/
│   │   │
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── types/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── package.json
│
└── README.md
```

---

# ⚙️ Environment Variables

## Frontend

Create:

```text
frontend/.env
```

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

## Backend

Example:

```env
PORT=5001
DATABASE_URL=postgresql://postgres:password@localhost:5432/dayflow
JWT_SECRET=your-secure-secret
```

Do not commit secrets to Git.

Add `.env` to `.gitignore`.

---

# 🗄️ Database

Dayflow should use **PostgreSQL** with **Prisma ORM**.

Recommended core entities:

```text
Company
   │
   ├── Department
   │
   └── User/Employee
           │
           ├── Attendance
           ├── Leave
           ├── LeaveBalance
           └── Payroll
```

Recommended database tables:

```text
companies
departments
users
attendance
leaves
leave_balances
payroll
notifications
```

Payroll should be treated as sensitive information and access must be controlled by backend authorization.

---

# 🔌 API

Base URL:

```text
http://localhost:5001/api/v1
```

Authentication header:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication

### Register

```http
POST /auth/signup
```

Example:

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

### Login

```http
POST /auth/login
```

Login supports Email or Employee ID.

```json
{
  "loginId": "OIJODO20230002",
  "password": "emp123"
}
```

### Current User

```http
GET /auth/me
```

Requires authentication.

---

# 👥 Employees API

### Get Employees

```http
GET /employees
```

Optional query parameters:

```text
search
status
department
```

Example:

```text
GET /employees?search=john&status=PRESENT&department=Engineering
```

### Get Employee

```http
GET /employees/:id
```

### Update Employee

```http
PUT /employees/:id
```

Regular employees can update supported personal fields such as:

* phone
* address
* avatar

Admin users can update broader employee information.

---

# ⏱️ Attendance API

### Check In

```http
POST /attendance/check-in
```

### Check Out

```http
POST /attendance/check-out
```

### Today's Attendance

```http
GET /attendance/today
```

### Attendance Logs

```http
GET /attendance/logs
```

Supported query parameters:

```text
startDate
endDate
userId
```

---

# 🏝️ Leave API

### Apply for Leave

```http
POST /leaves/apply
```

Example:

```json
{
  "leaveType": "PAID",
  "startDate": "2026-09-01",
  "endDate": "2026-09-03",
  "reason": "Personal work",
  "attachmentUrl": ""
}
```

### Get Leaves

```http
GET /leaves
```

### Get Leave Balance

```http
GET /leaves/balance
```

### Approve / Reject Leave

```http
PATCH /leaves/:id/status
```

Example:

```json
{
  "status": "APPROVED",
  "adminComment": "Approved by HR"
}
```

---

# 💵 Payroll API

### My Salary Slip

```http
GET /payroll/my-slip
```

### Update Employee Salary

Admin/HR only:

```http
PUT /payroll/:userId
```

Example:

```json
{
  "monthlyWage": 65000
}
```

The backend is responsible for recalculating salary components.

---

# 📊 Dashboard API

```http
GET /dashboard/stats
```

Provides dashboard aggregation data such as:

* employee counts
* attendance/status distribution
* pending approvals
* today's check-in status

---

# 🔐 Role-Based Access

## Employee

Employees can:

```text
Dashboard
My Profile
My Attendance
Apply Leave
My Leave Requests
Leave Balance
My Payroll
```

Employees should not have access to:

```text
Other employee payroll
Salary administration
Leave approval
Company-wide HR management
```

## Admin / HR

Admin/HR can access:

```text
Dashboard
Employees
Employee Profiles
Attendance
Leave Management
Leave Approvals
Payroll Management
Reports
Analytics
```

The frontend should hide unauthorized actions for a better UX, but **backend authorization must always remain authoritative**.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone <repository-url>
cd dayflow
```

## 2. Configure PostgreSQL

Create a PostgreSQL database:

```text
dayflow
```

Configure:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/dayflow
```

## 3. Install backend dependencies

```bash
cd backend
npm install
```

## 4. Run Prisma migrations

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

## 5. Start backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5001
```

API:

```text
http://localhost:5001/api/v1
```

## 6. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## 7. Configure frontend

Create:

```text
.env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

## 8. Start frontend

```bash
npm run dev
```

Open the URL shown by Vite, typically:

```text
http://localhost:5173
```

---

# 🧪 Development

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Preview production frontend:

```bash
npm run preview
```

---

# 🔄 Typical User Flows

## Employee

```text
Login
  ↓
Employee Dashboard
  ↓
Check In
  ↓
Work
  ↓
Check Out
  ↓
Attendance Updated
```

Leave:

```text
Dashboard
  ↓
Apply Leave
  ↓
Select Leave Type
  ↓
Select Dates
  ↓
Add Reason
  ↓
Submit
  ↓
Pending
  ↓
HR Approval
  ↓
Approved / Rejected
```

Payroll:

```text
Dashboard
  ↓
Payroll
  ↓
Salary Breakdown
  ↓
View Net Salary
```

## Admin / HR

```text
Login
  ↓
HR Dashboard
  ↓
Employees
  ↓
Employee Profile
```

Leave approval:

```text
Dashboard
  ↓
Pending Leave Requests
  ↓
Review Request
  ↓
Approve / Reject
  ↓
Add Comment
  ↓
Status Updated
```

Payroll:

```text
Employees
  ↓
Select Employee
  ↓
Payroll
  ↓
Update Monthly Wage
  ↓
Confirm
  ↓
Backend Recalculates Salary
```

---

# 🎨 UI/UX Principles

Dayflow should feel like a modern enterprise SaaS product.

The interface should prioritize:

* Clarity
* Speed
* Accessibility
* Consistency
* Responsiveness
* Strong visual hierarchy
* Minimal friction
* Clear feedback

The application should provide:

* Light mode
* Dark mode
* Responsive layouts
* Skeleton loaders
* Empty states
* Error states
* Toast notifications
* Confirmation dialogs
* Accessible forms
* Keyboard navigation
* Mobile-friendly workflows

Avoid:

* Generic admin-dashboard styling
* Excessive gradients
* Excessive glassmorphism
* Unnecessary animations
* Fake data presented as real API data
* Broken buttons
* Empty pages
* Unfinished placeholder UI

---

# 🔒 Security

Important security principles:

* Never store passwords as plain text.
* Hash passwords using a secure password hashing algorithm.
* Keep JWT secrets on the backend.
* Never expose sensitive salary data to unauthorized users.
* Validate all backend input.
* Enforce authorization on the backend.
* Do not rely only on frontend route protection.
* Handle expired JWTs correctly.
* Never commit `.env` files containing secrets.

---

# 📱 Responsive Design

Dayflow is designed for:

* Desktop
* Laptop
* Tablet
* Mobile

Mobile users should have easy access to:

* Dashboard
* Check In / Check Out
* Attendance
* Leave
* Payroll
* Profile

Tables should transform into usable cards or responsive layouts on smaller screens.

---

# ♿ Accessibility

Dayflow should follow good accessibility practices:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible dialogs
* Proper form labels
* Screen-reader-friendly controls
* Sufficient contrast
* Status indicators that don't rely only on color

---

# 📌 API Limitations

The currently supplied API documentation does not provide dedicated endpoints for some planned UI capabilities, including:

* Notifications
* Document management
* Dedicated report-generation endpoints
* Email notification APIs

These should therefore be implemented as extensible frontend architecture rather than fake functionality.

When backend APIs become available, they can be added without restructuring the entire application.

---

# 🏆 Hackathon Focus

The primary demo flow should showcase:

1. Authentication
2. Role-based dashboard
3. Employee management
4. Employee profile
5. Attendance check-in/out
6. Attendance history
7. Leave application
8. Leave approval
9. Leave balance
10. Payroll visibility
11. Admin salary management
12. Analytics
13. Responsive design

The complete experience should demonstrate how Dayflow simplifies everyday HR operations.

---

# 📄 Requirements

The Dayflow HRMS requirements cover:

* Secure authentication
* Role-based access
* Employee profile management
* Attendance tracking
* Leave/time-off management
* Admin approval workflows
* Payroll visibility
* Analytics and reports

The supplied requirements describe Admin/HR as having management and approval privileges while Employees primarily manage their own profile, attendance, leave and salary information.

The requirements also specify daily/weekly attendance, check-in/check-out, leave approval, payroll administration, and future notification/reporting capabilities.

---

# 🔮 Future Enhancements

Potential future additions:

* Email notifications
* Real-time notifications
* Employee documents
* Advanced report generation
* PDF salary slips
* Attendance export
* Leave calendar
* Organization hierarchy
* Multiple companies
* Advanced payroll configuration
* Audit logs
* HR announcements
* Employee onboarding workflows
* Performance management
* Odoo integration

---

# 👨‍💻 Development Philosophy

Dayflow should not be treated as a collection of CRUD pages.

It should be built as a complete HR product.

Every interaction should clearly communicate:

> **What is happening?**
> **What should I do?**
> **What happened after I did it?**
> **What can I do next?**

The goal is a frontend and backend that are:

* Reliable
* Maintainable
* Secure
* Scalable
* Accessible
* Visually polished
* API-driven
* Hackathon-ready

---

## 📜 License

This project was created for the **Odoo Hackathon**.

Add the project's final license here when the team decides on one.
