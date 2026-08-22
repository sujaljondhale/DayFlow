import { Router, type IRouter } from "express";

const router: IRouter = Router();

type Employee = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  jobPosition: string;
  status: string;
  phone: string;
  address: string;
  joiningDate: string;
  role: string;
  avatar: string | null;
};

const employees: Employee[] = [
  { id: "e1", name: "Maya Patel", email: "maya.patel@dayflow.com", employeeId: "DF-1042", department: "Product", jobPosition: "Product Designer", status: "PRESENT", phone: "+91 98765 43210", address: "Bandra West, Mumbai", joiningDate: "2023-04-18", role: "EMPLOYEE", avatar: null },
  { id: "e2", name: "Arjun Mehta", email: "arjun.mehta@dayflow.com", employeeId: "DF-1031", department: "Engineering", jobPosition: "Staff Engineer", status: "PRESENT", phone: "+91 98204 11220", address: "Indiranagar, Bengaluru", joiningDate: "2022-09-12", role: "EMPLOYEE", avatar: null },
  { id: "e3", name: "Nisha Rao", email: "nisha.rao@dayflow.com", employeeId: "DF-1017", department: "People", jobPosition: "People Partner", status: "ON_LEAVE", phone: "+91 98901 88220", address: "Koregaon Park, Pune", joiningDate: "2021-11-03", role: "HR", avatar: null },
  { id: "e4", name: "Leo Martins", email: "leo.martins@dayflow.com", employeeId: "DF-1008", department: "Sales", jobPosition: "Account Executive", status: "ABSENT", phone: "+91 98111 22770", address: "Hauz Khas, New Delhi", joiningDate: "2024-01-29", role: "EMPLOYEE", avatar: null },
  { id: "e5", name: "Sana Khan", email: "sana.khan@dayflow.com", employeeId: "DF-0998", department: "Marketing", jobPosition: "Brand Strategist", status: "PRESENT", phone: "+91 99001 22888", address: "Alkapuri, Vadodara", joiningDate: "2023-07-14", role: "EMPLOYEE", avatar: null },
];

const attendance: Array<{ id: string; date: string; status: string; checkIn: string | null; checkOut: string | null; workHours: number | null; userId: string }> = employees.map((employee, index) => ({
  id: `a${index + 1}`,
  date: new Date().toISOString().slice(0, 10),
  status: employee.status,
  checkIn: employee.status === "PRESENT" ? "09:0" + (index + 1) : null,
  checkOut: null,
  workHours: employee.status === "PRESENT" ? 5.75 : null,
  userId: employee.id,
}));

const leaves = [
  { id: "l1", type: "PAID", startDate: "2026-08-25", endDate: "2026-08-27", status: "PENDING", reason: "Family celebration", adminComment: null, user: employees[0] },
  { id: "l2", type: "SICK", startDate: "2026-08-19", endDate: "2026-08-19", status: "APPROVED", reason: "Doctor appointment", adminComment: "Approved by People Ops", user: employees[2] },
  { id: "l3", type: "PAID", startDate: "2026-08-11", endDate: "2026-08-12", status: "REJECTED", reason: "Personal travel", adminComment: "Please coordinate coverage first.", user: employees[3] },
];

const balances = [
  { type: "PAID", total: 24, used: 5, available: 19 },
  { type: "SICK", total: 12, used: 0, available: 12 },
  { type: "UNPAID", total: 0, used: 0, available: 0 },
];

const payroll = { monthlyWage: 86500, yearlyWage: 1038000, netSalary: 79240, earnings: { "Basic salary": 43250, HRA: 21625, "Standard allowance": 12000, "Performance bonus": 6500, LTA: 2500, "Fixed allowance": 625 }, deductions: { PF: 5180, "Professional tax": 2000, "Total deductions": 7180 } };

const currentUser = { id: "e1", name: "Maya Patel", email: "maya.patel@dayflow.com", role: "ADMIN", employeeId: "DF-1042", avatar: null, department: "Product", jobPosition: "Product Designer", company: "Dayflow Technologies" };

router.post("/auth/login", (req, res) => {
  const loginId = String(req.body?.loginId ?? "");
  if (!loginId || !req.body?.password) {
    res.status(400).json({ message: "Enter your email or employee ID and password." });
    return;
  }
  res.json({ token: "dayflow-demo-session", user: currentUser });
});
router.post("/auth/signup", (_req, res) => res.status(201).json({ token: "dayflow-demo-session", user: currentUser }));
router.get("/auth/me", (_req, res) => res.json(currentUser));

router.get("/dashboard/stats", (_req, res) => res.json({
  totalEmployees: employees.length, presentToday: 3, absentToday: 1, onLeave: 1, pendingLeaves: 1,
  departmentDistribution: [{ department: "Engineering", count: 1 }, { department: "Product", count: 1 }, { department: "People", count: 1 }, { department: "Sales", count: 1 }, { department: "Marketing", count: 1 }],
  attendanceTrend: [{ date: "Mon", present: 4, absent: 1 }, { date: "Tue", present: 5, absent: 0 }, { date: "Wed", present: 4, absent: 1 }, { date: "Thu", present: 4, absent: 1 }, { date: "Fri", present: 3, absent: 1 }],
}));

router.get("/employees", (req, res) => {
  const search = String(req.query.search ?? "").toLowerCase();
  const status = String(req.query.status ?? "");
  const department = String(req.query.department ?? "");
  res.json(employees.filter((employee) => (!search || `${employee.name} ${employee.email} ${employee.employeeId} ${employee.jobPosition}`.toLowerCase().includes(search)) && (!status || employee.status === status) && (!department || employee.department === department)));
});
router.get("/employees/:id", (req, res) => {
  const employee = employees.find((item) => item.id === req.params.id);
  employee ? res.json(employee) : res.status(404).json({ message: "Employee not found." });
});
router.put("/employees/:id", (req, res) => {
  const employee = employees.find((item) => item.id === req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found." });
    return;
  }
  Object.assign(employee, req.body);
  res.json(employee);
});

router.get("/attendance/today", (_req, res) => res.json(attendance[0]));
router.get("/attendance/logs", (_req, res) => res.json(attendance));
router.post("/attendance/check-in", (_req, res) => { attendance[0].status = "PRESENT"; attendance[0].checkIn = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); res.json(attendance[0]); });
router.post("/attendance/check-out", (_req, res) => { attendance[0].checkOut = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) as string; attendance[0].workHours = 8.5; res.json(attendance[0]); });

router.get("/leaves", (_req, res) => res.json(leaves));
router.get("/leaves/balance", (_req, res) => res.json(balances));
router.post("/leaves/apply", (req, res) => { const leave = { id: `l${leaves.length + 1}`, type: req.body.type, startDate: req.body.startDate, endDate: req.body.endDate, status: "PENDING", reason: req.body.reason, adminComment: null, user: employees[0] }; leaves.unshift(leave); res.status(201).json(leave); });
router.patch("/leaves/:id/status", (req, res) => { const leave = leaves.find((item) => item.id === req.params.id); if (!leave) { res.status(404).json({ message: "Leave request not found." }); return; } leave.status = req.body.status; leave.adminComment = req.body.adminComment ?? null; res.json(leave); });

router.get("/payroll/my-slip", (_req, res) => res.json(payroll));
router.put("/payroll/:userId", (req, res) => { payroll.monthlyWage = Number(req.body.monthlyWage); payroll.yearlyWage = payroll.monthlyWage * 12; payroll.netSalary = Math.round(payroll.monthlyWage * 0.916); res.json(payroll); });

export default router;