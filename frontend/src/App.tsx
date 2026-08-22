import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, BarChart3, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, Clock3, Eye, FileText, Filter, LayoutDashboard,
  LifeBuoy, Menu, MoreHorizontal, Pencil, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Target, Users, WalletCards, X, XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  getGetAttendanceLogsQueryKey, getGetAttendanceTodayQueryKey, getGetDashboardStatsQueryKey,
  getGetEmployeeQueryKey, getGetEmployeesQueryKey, getGetLeaveBalanceQueryKey,
  getGetLeavesQueryKey, getGetMeQueryKey, getGetMyPayrollQueryKey, useApplyLeave,
  useCheckIn, useCheckOut, useGetAttendanceLogs, useGetAttendanceToday, useGetDashboardStats,
  useGetEmployee, useGetEmployees, useGetLeaveBalance, useGetLeaves, useGetMe,
  useGetMyPayroll, useHealthCheck, useLogin, useSignup, useUpdateEmployee, useUpdateLeaveStatus,
  useUpdatePayroll,
} from '@/api';
import type { Attendance, DashboardStats, Employee, Leave, Payroll, User } from '@/api';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';

const queryClient = new QueryClient();

const navItems: { label: string; href: string; icon: LucideIcon; section: string }[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, section: 'Workspace' },
  { label: 'People', href: '/employees', icon: Users, section: 'Workspace' },
  { label: 'Attendance', href: '/attendance', icon: Clock3, section: 'Workspace' },
  { label: 'Leave desk', href: '/leaves', icon: CalendarDays, section: 'Workspace' },
  { label: 'Payroll', href: '/payroll', icon: WalletCards, section: 'Workspace' },
  { label: 'Reports', href: '/reports', icon: BarChart3, section: 'Insights' },
];

const initials = (name?: string | null) => (name || 'DF').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const money = (value?: number | null) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const shortDate = (date?: string | null) => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const fullDate = (date?: string | null) => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatTime = (value?: string | null) => {
  if (!value) return '—';
  if (/^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const weekdayLabel = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 3) : parsed.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
};
const friendlyError = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Try again.';

function Avatar({ name, src, size = 'md' }: { name?: string | null; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  return src ? <img data-testid="img-avatar" src={src} alt={name || 'Profile'} className={`avatar avatar-${size}`} /> :
    <span data-testid="text-avatar" className={`avatar avatar-${size} avatar-fallback`}>{initials(name)}</span>;
}

function StatusPill({ value }: { value?: string | null }) {
  const normalized = (value || 'unknown').toLowerCase();
  const tone = normalized.includes('present') || normalized.includes('approved') || normalized === 'active' ? 'success' :
    normalized.includes('pending') || normalized.includes('half') ? 'warning' :
      normalized.includes('absent') || normalized.includes('rejected') || normalized.includes('inactive') ? 'danger' : 'neutral';
  return <span data-testid={`status-${normalized}`} className={`status-pill status-${tone}`}><span className="status-dot" />{value || 'Unknown'}</span>;
}

function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, className = '', testId }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string; testId?: string;
}) {
  return <button data-testid={testId} type={type} onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>{children}</button>;
}

function MetricCard({ label, value, note, icon: Icon, accent = 'teal', onClick }: { label: string; value: string | number; note: string; icon: LucideIcon; accent?: string; onClick?: () => void }) {
  return <button data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={onClick} className={`metric-card metric-${accent}`}>
    <span className="metric-icon"><Icon size={17} /></span>
    <span className="metric-label">{label}</span>
    <strong className="metric-value">{value}</strong>
    <span className="metric-note">{note}</span>
  </button>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="page-header">
    <div><div className="eyebrow">{eyebrow || 'Dayflow workspace'}</div><h1 data-testid="text-page-title">{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="header-action">{action}</div>}
  </header>;
}

function Skeleton({ className = '' }: { className?: string }) { return <div className={`skeleton ${className}`} />; }
function QueryState({ loading, error, onRetry, children }: { loading?: boolean; error?: unknown; onRetry?: () => void; children: ReactNode }) {
  if (loading) return <div className="skeleton-stack"><Skeleton className="h-20" /><Skeleton className="h-44" /><Skeleton className="h-32" /></div>;
  if (error) return <div className="empty-state error-state"><XCircle size={28} /><h3>Could not load this view</h3><p>{friendlyError(error)}</p><Button variant="secondary" onClick={onRetry} testId="button-retry">Try again</Button></div>;
  return <>{children}</>;
}

function Sidebar({ user, onClose }: { user?: User; onClose?: () => void }) {
  const [location] = useLocation();
  return <aside className="sidebar side-glass">
    <div className="brand-row"><div className="brand-mark">D</div><span>dayflow</span><button data-testid="button-close-menu" onClick={onClose} className="mobile-close"><X size={18} /></button></div>
    <div className="company-switcher"><div className="company-orb">O</div><div><strong>{user?.company || 'Orbit & Co.'}</strong><small>People operations</small></div><ChevronDown size={15} /></div>
    <nav className="sidebar-nav">
      {['Workspace', 'Insights'].map((section) => <div key={section} className="nav-section"><span className="nav-caption">{section}</span>{navItems.filter((item) => item.section === section).map(({ label, href, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`} className={`nav-link ${location === href || (href === '/employees' && location.startsWith('/employees/')) ? 'active' : ''}`} onClick={onClose}><Icon size={17} /><span>{label}</span>{label === 'Leave desk' && <span className="nav-count">3</span>}</Link>)}</div>)}
    </nav>
    <div className="sidebar-bottom">
      <Link href="/settings" data-testid="link-settings" className="nav-link"><Settings2 size={17} /><span>Settings</span></Link>
      <div className="sidebar-user"><Avatar name={user?.name} src={user?.avatar} size="sm" /><div><strong>{user?.name || 'Your account'}</strong><small>{user?.role || 'Member'}</small></div><MoreHorizontal size={16} /></div>
    </div>
  </aside>;
}

function Topbar({ user, onMenu }: { user?: User; onMenu: () => void }) {
  const [, setLocation] = useLocation();
  return <div className="topbar"><button data-testid="button-open-menu" onClick={onMenu} className="mobile-menu"><Menu size={20} /></button><div className="topbar-context"><span className="live-dot pulse-dot" />All systems calm <span className="topbar-sep">/</span> {user?.company || 'Orbit & Co.'}</div><div className="topbar-actions"><button data-testid="button-search" onClick={() => setLocation('/employees')} className="top-icon"><Search size={18} /></button><button data-testid="button-notifications" onClick={() => setLocation('/leaves')} className="top-icon notification"><Bell size={18} /><i /></button><Link href="/profile" data-testid="link-top-profile" className="top-profile"><Avatar name={user?.name} src={user?.avatar} size="sm" /><span>{user?.name?.split(' ')[0] || 'Profile'}</span><ChevronDown size={14} /></Link></div></div>;
}

function Shell({ children }: { children: ReactNode }) {
  const { data: user } = useGetMe();
  const health = useHealthCheck();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell grain"><Sidebar user={user} onClose={() => setMenuOpen(false)} /><div className={`mobile-sidebar ${menuOpen ? 'open' : ''}`}><Sidebar user={user} onClose={() => setMenuOpen(false)} /></div><main className="main-shell"><Topbar user={user} onMenu={() => setMenuOpen(true)} /><div className="health-ribbon" data-testid="status-health"><span className="live-dot pulse-dot" />{health.data?.status || 'Workspace status syncing'}</div><div className="page-content page-enter">{children}</div></main></div>;
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const stats = useGetDashboardStats();
  const today = useGetAttendanceToday();
  const leaves = useGetLeaves();
  const qc = useQueryClient();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const data = stats.data as DashboardStats | undefined;
  const todayData = today.data as Attendance | undefined;
  const trend = data?.attendanceTrend || [];
  const maxTrend = Math.max(...trend.map((d) => Math.max(d.present, d.absent)), 1);
  const pending = (leaves.data || []).filter((leave) => leave.status?.toLowerCase() === 'pending').slice(0, 4);
  const doAttendance = () => {
    const action = todayData?.checkIn && !todayData.checkOut ? checkOut : checkIn;
    action.mutate(undefined, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAttendanceTodayQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() }); } });
  };
  return <Shell><PageHeader eyebrow={`Good morning, ${user?.name?.split(' ')[0] || 'there'}`} title="The pulse of your people" description="A clear view of what is moving today, and where your attention will matter most." action={<Button onClick={doAttendance} disabled={checkIn.isPending || checkOut.isPending} testId="button-attendance-action">{todayData?.checkIn && !todayData.checkOut ? <><ArrowDownRight size={16} /> Clock out</> : <><Target size={16} /> Start my day</>}</Button>} />
     <QueryState loading={stats.isLoading} error={stats.error} onRetry={() => stats.refetch()}><div className="stagger">
      <section className="metric-grid">
        <MetricCard label="Total people" value={data?.totalEmployees ?? 0} note="Across your workspace" icon={Users} accent="teal" />
        <MetricCard label="Present today" value={data?.presentToday ?? 0} note={`${data?.totalEmployees ? Math.round((data.presentToday / data.totalEmployees) * 100) : 0}% of the team`} icon={CheckCircle2} accent="yellow" />
        <MetricCard label="On leave" value={data?.onLeave ?? 0} note="Away from the office" icon={CalendarDays} accent="orange" />
        <MetricCard label="Needs review" value={data?.pendingLeaves ?? 0} note="Leave requests waiting" icon={FileText} accent="plum" onClick={() => setLocation('/leaves')} />
      </section>
       <section className="dashboard-grid">
         <div className="panel trend-panel"><div className="panel-head"><div><span className="eyebrow">Attendance rhythm</span><h2>Steady is a signal</h2></div><span className="date-chip">Last 7 days <ChevronDown size={14} /></span></div><div className="chart-legend"><span><i className="legend-present" />Present</span><span><i className="legend-absent" />Absent</span></div><div className="bar-chart">{(trend.length ? trend : Array.from({ length: 7 }, (_, i) => ({ date: String(i), present: 0, absent: 0 }))).map((day, i) => <div className="bar-group" key={`${day.date}-${i}`}><div className="bars"><span className="bar bar-present bar-rise" style={{ height: `${Math.max((day.present / maxTrend) * 100, day.present ? 8 : 3)}%` }} /><span className="bar bar-absent bar-rise" style={{ height: `${Math.max((day.absent / maxTrend) * 100, day.absent ? 8 : 3)}%` }} /></div><small>{weekdayLabel(day.date)}</small></div>)}</div></div>
         <div className="panel focus-panel"><div className="panel-head"><div><span className="eyebrow">My day</span><h2>Make it count</h2></div><Clock3 size={20} className="panel-icon" /></div><div className="focus-time">{formatTime(todayData?.checkIn)}</div><p>{todayData?.checkIn ? todayData.checkOut ? `Wrapped up at ${formatTime(todayData.checkOut)}` : 'Your day is in motion.' : 'Clock in when you are ready.'}</p><div className="day-progress"><span style={{ width: todayData?.checkOut ? '100%' : todayData?.checkIn ? '47%' : '0%' }} /></div><div className="focus-meta"><span>Today</span><strong>{todayData?.workHours ? `${todayData.workHours}h logged` : 'No hours logged yet'}</strong></div></div>
      </section>
      <section className="dashboard-grid lower-grid"><div className="panel"><div className="panel-head"><div><span className="eyebrow">Team map</span><h2>Where people sit</h2></div><Link href="/employees" className="text-link" data-testid="link-view-people">View directory <ArrowRight size={14} /></Link></div><div className="department-list">{(data?.departmentDistribution || []).slice(0, 5).map((dept, i) => <div className="department-row" key={dept.department}><span className={`department-avatar dept-${i}`}>{initials(dept.department)}</span><span className="department-name">{dept.department}</span><div className="mini-track"><span style={{ width: `${data?.totalEmployees ? (dept.count / data.totalEmployees) * 100 : 0}%` }} /></div><strong>{dept.count}</strong></div>)}</div></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">Attention queue</span><h2>Leave requests</h2></div><Link href="/leaves" className="text-link" data-testid="link-view-leaves">Open desk <ArrowRight size={14} /></Link></div>{leaves.isLoading ? <Skeleton className="h-24" /> : pending.length ? <div className="request-list">{pending.map((leave) => <Link href="/leaves" className="request-row" key={leave.id} data-testid={`row-pending-leave-${leave.id}`}><Avatar name={leave.user?.name} src={leave.user?.avatar} size="sm" /><span><strong>{leave.user?.name || 'Team member'}</strong><small>{leave.type} · {shortDate(leave.startDate)}</small></span><StatusPill value={leave.status} /></Link>)}</div> : <div className="compact-empty"><Check size={16} />Nothing waiting for your review.</div>}</div></section>
    </div></QueryState>
  </Shell>;
}

function Employees() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const params = useMemo(() => ({ search: search || undefined, status: status || undefined }), [search, status]);
  const query = useGetEmployees(params);
  const employees = query.data || [];
  return <Shell><PageHeader eyebrow="People directory" title="The people behind the work" description="Find context quickly. Every profile is a little more than a name in a list." action={<Button onClick={() => document.getElementById('directory-search')?.focus()} variant="secondary" testId="button-find-person"><Search size={15} /> Find a person</Button>} />
    <div className="toolbar glass-strong"><div className="search-box"><Search size={17} /><input id="directory-search" data-testid="input-search-employees" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, role or employee ID" /></div><div className="filter-wrap"><Filter size={15} /><select data-testid="select-status-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><span className="toolbar-count">{employees.length} people</span></div>
    <QueryState loading={query.isLoading} error={query.error} onRetry={() => query.refetch()}>{employees.length ? <div className="employee-grid">{employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} />)}</div> : <div className="empty-state"><Users size={30} /><h3>No people found</h3><p>Try a different search or clear the filters.</p><Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }} testId="button-clear-filters">Clear filters</Button></div>}</QueryState>
  </Shell>;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  return <Link href={`/employees/${employee.id}`} className="employee-card glass" data-testid={`card-employee-${employee.id}`}><div className="employee-card-top"><Avatar name={employee.name} src={employee.avatar} size="lg" /><StatusPill value={employee.status} /></div><h3>{employee.name}</h3><p>{employee.jobPosition}</p><div className="employee-card-foot"><span>{employee.department}</span><span className="mono">{employee.employeeId}</span></div></Link>;
}

function EmployeeProfile() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetEmployee(id);
  const update = useUpdateEmployee();
  const [editing, setEditing] = useState(false);
  const employee = query.data as Employee | undefined;
  const [form, setForm] = useState({ name: '', department: '', jobPosition: '', phone: '', address: '' });
  const startEdit = () => { if (employee) setForm({ name: employee.name, department: employee.department, jobPosition: employee.jobPosition, phone: employee.phone || '', address: employee.address || '' }); setEditing(true); };
  const save = (e: FormEvent) => { e.preventDefault(); update.mutate({ id, data: form }, { onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: getGetEmployeeQueryKey(id) }); queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() }); } }); };
  return <Shell><QueryState loading={query.isLoading} error={query.error} onRetry={() => query.refetch()}>{employee && <><Link href="/employees" className="back-link" data-testid="link-back-employees"><ArrowLeft size={15} /> Back to directory</Link><div className="profile-hero glass-strong"><div className="profile-identity"><Avatar name={employee.name} src={employee.avatar} size="lg" /><div><StatusPill value={employee.status} /><h1 data-testid="text-employee-name">{employee.name}</h1><p>{employee.jobPosition} <span>·</span> {employee.department}</p></div></div><Button variant="secondary" onClick={startEdit} testId="button-edit-employee"><Pencil size={15} /> Edit profile</Button></div><div className="profile-layout"><section className="panel"><div className="panel-head"><div><span className="eyebrow">Profile details</span><h2>Work identity</h2></div><ShieldCheck size={19} className="panel-icon" /></div>{editing ? <form onSubmit={save} className="form-grid"><Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} /><Field label="Job position" value={form.jobPosition} onChange={(v) => setForm({ ...form, jobPosition: v })} /><Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /><Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} wide /><div className="form-actions"><Button variant="ghost" onClick={() => setEditing(false)} testId="button-cancel-edit">Cancel</Button><Button type="submit" disabled={update.isPending} testId="button-save-employee">{update.isPending ? 'Saving…' : 'Save changes'}</Button></div></form> : <div className="detail-list"><Detail label="Employee ID" value={employee.employeeId} mono /><Detail label="Email" value={employee.email} /><Detail label="Phone" value={employee.phone} /><Detail label="Joined" value={fullDate(employee.joiningDate)} /><Detail label="Address" value={employee.address} /></div>}</section><section className="panel profile-note"><Sparkles size={21} /><span className="eyebrow">A note for this profile</span><h2>People are not rows.</h2><p>Keep the context around the work visible, useful and respectful. Profile changes are shared with authorised people operations teammates.</p></section></div></>}</QueryState></Shell>;
}

function Attendance() {
  const [range, setRange] = useState<'week' | 'today'>('week');
  const logs = useGetAttendanceLogs(range === 'today' ? { startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) } : undefined);
  const today = useGetAttendanceToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const qc = useQueryClient();
  const todayData = today.data;
  const action = () => { const mutation = todayData?.checkIn && !todayData.checkOut ? checkOut : checkIn; mutation.mutate(undefined, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAttendanceTodayQueryKey() }); qc.invalidateQueries({ queryKey: getGetAttendanceLogsQueryKey() }); } }); };
  return <Shell><PageHeader eyebrow="Attendance desk" title="Time, with context" description="A lightweight record of presence that keeps the whole team in sync." action={<Button onClick={action} testId="button-attendance-toggle">{todayData?.checkIn && !todayData.checkOut ? 'Clock out' : 'Clock in'} <ArrowRight size={15} /></Button>} /><div className="attendance-summary"><div className="panel attendance-clock"><span className="eyebrow">Your attendance today</span><div className="live-clock">{todayData?.checkIn ? new Date(todayData.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not started'}</div><div className="clock-meta"><StatusPill value={todayData?.status || 'Not started'} /><span>{todayData?.workHours ? `${todayData.workHours} working hours` : 'Ready when you are'}</span></div></div><div className="panel attendance-streak"><span className="eyebrow">This week</span><div className="streak-dots">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < 3 ? 'done' : ''}><Check size={13} /></span>)}</div><strong>3 of 5 days recorded</strong><p>Consistency creates useful visibility.</p></div></div><div className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">Your log</span><h2>Attendance history</h2></div><div className="segmented"><button data-testid="button-today-range" className={range === 'today' ? 'active' : ''} onClick={() => setRange('today')}>Today</button><button data-testid="button-week-range" className={range === 'week' ? 'active' : ''} onClick={() => setRange('week')}>This week</button></div></div><QueryState loading={logs.isLoading} error={logs.error} onRetry={() => logs.refetch()}>{logs.data?.length ? <AttendanceTable logs={logs.data} /> : <div className="compact-empty"><Clock3 size={16} />No attendance records for this period.</div>}</QueryState></div></Shell>;
}

function AttendanceTable({ logs }: { logs: Attendance[] }) {
  return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Check in</th><th>Check out</th><th>Work hours</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} data-testid={`row-attendance-${log.id}`}><td><strong>{shortDate(log.date)}</strong><small>{new Date(log.date).toLocaleDateString([], { weekday: 'long' })}</small></td><td><StatusPill value={log.status} /></td><td className="mono">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td className="mono">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td><strong>{log.workHours ? `${log.workHours}h` : '—'}</strong></td></tr>)}</tbody></table></div>;
}

function Leaves() {
  const query = useGetLeaves();
  const balance = useGetLeaveBalance();
  const updateStatus = useUpdateLeaveStatus();
  const [filter, setFilter] = useState('all');
  const leaves = (query.data || []).filter((leave) => filter === 'all' || leave.status?.toLowerCase() === filter);
  const changeStatus = (id: string, status: string) => updateStatus.mutate({ id, data: { status } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetLeavesQueryKey() }) });
  return <Shell><PageHeader eyebrow="Leave desk" title="Time away, made visible" description="Make room for rest without losing the thread of the work." action={<Link href="/leaves/apply" data-testid="link-apply-leave" className="btn btn-primary"><Plus size={16} /> Apply for leave</Link>} /><div className="balance-grid">{(balance.data || []).map((item) => <div className="balance-card glass" key={item.type}><div className="balance-head"><span>{item.type}</span><CalendarDays size={16} /></div><strong>{item.available}</strong><small>days available</small><div className="balance-track"><span style={{ width: `${item.total ? (item.used / item.total) * 100 : 0}%` }} /></div><div className="balance-foot"><span>{item.used} used</span><span>{item.total} total</span></div></div>)}</div><div className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">Request stream</span><h2>Leave requests</h2></div><div className="segmented">{['all', 'pending', 'approved', 'rejected'].map((value) => <button key={value} data-testid={`button-leave-filter-${value}`} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div><QueryState loading={query.isLoading} error={query.error} onRetry={() => query.refetch()}>{leaves.length ? <div className="table-wrap"><table><thead><tr><th>Person</th><th>Type</th><th>Dates</th><th>Status</th><th className="align-right">Action</th></tr></thead><tbody>{leaves.map((leave) => <tr key={leave.id} data-testid={`row-leave-${leave.id}`}><td><div className="person-cell"><Avatar name={leave.user?.name} src={leave.user?.avatar} size="sm" /><span><strong>{leave.user?.name || 'You'}</strong><small>{leave.user?.department || 'Personal request'}</small></span></div></td><td>{leave.type}</td><td><strong>{shortDate(leave.startDate)} — {shortDate(leave.endDate)}</strong><small>{leave.reason}</small></td><td><StatusPill value={leave.status} /></td><td className="align-right">{leave.status?.toLowerCase() === 'pending' ? <div className="table-actions"><Button variant="secondary" onClick={() => changeStatus(leave.id, 'approved')} disabled={updateStatus.isPending} testId={`button-approve-leave-${leave.id}`}><Check size={14} /> Approve</Button><Button variant="ghost" onClick={() => changeStatus(leave.id, 'rejected')} disabled={updateStatus.isPending} testId={`button-reject-leave-${leave.id}`}><X size={14} /></Button></div> : <span className="muted-text">Reviewed</span>}</td></tr>)}</tbody></table></div> : <div className="compact-empty"><CalendarDays size={16} />There are no {filter === 'all' ? '' : filter} leave requests.</div>}</QueryState></div></Shell>;
}

function ApplyLeave() {
  const [, setLocation] = useLocation();
  const apply = useApplyLeave();
  const [form, setForm] = useState({ type: 'Annual leave', startDate: '', endDate: '', reason: '' });
  const submit = (e: React.FormEvent) => { e.preventDefault(); apply.mutate({ data: form }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetLeavesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetLeaveBalanceQueryKey() }); setLocation('/leaves'); } }); };
  return <Shell><Link href="/leaves" className="back-link" data-testid="link-back-leaves"><ArrowLeft size={15} /> Back to leave desk</Link><div className="form-page"><PageHeader eyebrow="New leave request" title="Make space for what matters" description="Your manager will receive this request as soon as you submit it." /><form onSubmit={submit} className="panel leave-form"><div className="form-grid"><label><span>Leave type</span><select data-testid="select-leave-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Annual leave</option><option>Sick leave</option><option>Personal leave</option><option>Unpaid leave</option></select></label><div /><Field label="Start date" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} /><Field label="End date" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} /><label className="wide"><span>Reason</span><textarea data-testid="input-leave-reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="A little context helps your team plan." rows={5} /></label></div><div className="form-actions"><Button variant="ghost" onClick={() => setLocation('/leaves')} testId="button-cancel-leave">Cancel</Button><Button type="submit" disabled={apply.isPending || !form.startDate || !form.endDate || !form.reason} testId="button-submit-leave">{apply.isPending ? 'Sending…' : 'Send request'} <ArrowRight size={15} /></Button></div>{apply.error && <p className="form-error">{friendlyError(apply.error)}</p>}</form></div></Shell>;
}

function Payroll({ detail = false }: { detail?: boolean }) {
  const { userId } = useParams<{ userId: string }>();
  const { data: me } = useGetMe();
  const query = useGetMyPayroll();
  const update = useUpdatePayroll();
  const payroll = query.data as Payroll | undefined;
  const [editing, setEditing] = useState(false);
  const [wage, setWage] = useState('');
  const canEdit = me?.role?.toLowerCase().includes('admin') || me?.role?.toLowerCase().includes('hr');
  const save = () => update.mutate({ userId: userId || me?.id || '', data: { monthlyWage: Number(wage) } }, { onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: getGetMyPayrollQueryKey() }); } });
  const totalEarnings = Object.values(payroll?.earnings || {}).reduce((sum, value) => sum + value, 0);
  const totalDeductions = Object.values(payroll?.deductions || {}).reduce((sum, value) => sum + value, 0);
  return <Shell><PageHeader eyebrow={detail ? 'Payroll detail' : 'Your payroll'} title="Know what lands" description="A private, transparent view of your compensation for the current cycle." action={<Button variant="secondary" onClick={() => window.print()} testId="button-download-payslip"><FileText size={15} /> Download payslip</Button>} /><QueryState loading={query.isLoading} error={query.error} onRetry={() => query.refetch()}>{payroll && <div className="payroll-layout"><section className="payroll-hero"><div><span className="eyebrow">Net salary · Current month</span><strong data-testid="text-net-salary">{money(payroll.netSalary)}</strong><p>Processed on the last working day of the month</p></div><div className="payroll-seal"><ShieldCheck size={24} /><span>Private<br />view</span></div></section><div className="payroll-stats"><div className="panel"><span className="eyebrow">Monthly wage</span><strong>{money(payroll.monthlyWage)}</strong>{canEdit && <Button variant="ghost" onClick={() => { setWage(String(payroll.monthlyWage)); setEditing(true); }} testId="button-edit-payroll"><Pencil size={13} /> Edit</Button>}</div><div className="panel"><span className="eyebrow">Yearly wage</span><strong>{money(payroll.yearlyWage)}</strong><small>Before deductions</small></div><div className="panel"><span className="eyebrow">Take-home ratio</span><strong>{payroll.monthlyWage ? `${Math.round((payroll.netSalary / payroll.monthlyWage) * 100)}%` : '—'}</strong><small>Of gross monthly pay</small></div></div><div className="payroll-columns"><section className="panel"><div className="panel-head"><div><span className="eyebrow">Monthly breakdown</span><h2>Earnings</h2></div><span className="amount-positive">+{money(totalEarnings)}</span></div>{Object.entries(payroll.earnings || {}).map(([label, value]) => <div className="money-row" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}{!Object.keys(payroll.earnings || {}).length && <div className="compact-empty">No earnings breakdown available.</div>}</section><section className="panel"><div className="panel-head"><div><span className="eyebrow">Monthly breakdown</span><h2>Deductions</h2></div><span className="amount-negative">−{money(totalDeductions)}</span></div>{Object.entries(payroll.deductions || {}).map(([label, value]) => <div className="money-row" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}{!Object.keys(payroll.deductions || {}).length && <div className="compact-empty">No deductions breakdown available.</div>}</section></div></div>}</QueryState>{editing && <div className="modal-backdrop"><div className="modal glass-strong"><div className="panel-head"><div><span className="eyebrow">Authorised edit</span><h2>Update monthly wage</h2></div><Button variant="icon" onClick={() => setEditing(false)} testId="button-close-payroll"><X size={17} /></Button></div><Field label="Monthly wage" type="number" value={wage} onChange={setWage} /><div className="form-actions"><Button variant="ghost" onClick={() => setEditing(false)} testId="button-cancel-payroll">Cancel</Button><Button onClick={save} disabled={update.isPending} testId="button-save-payroll">Save wage</Button></div></div></div>}</Shell>;
}

function PayrollRoute() { return <Payroll />; }
function PayrollDetailRoute() { return <Payroll detail />; }

function Reports() {
  const stats = useGetDashboardStats();
  const data = stats.data as DashboardStats | undefined;
  const max = Math.max(...(data?.departmentDistribution || []).map((d) => d.count), 1);
  return <Shell><PageHeader eyebrow="Signals & reports" title="A better read on the work" description="Patterns worth noticing, without burying the useful bit in a spreadsheet." action={<Button variant="secondary" onClick={() => window.print()} testId="button-export-report"><ArrowDownRight size={15} /> Export snapshot</Button>} /><QueryState loading={stats.isLoading} error={stats.error} onRetry={() => stats.refetch()}><div className="report-grid"><section className="panel report-wide"><div className="panel-head"><div><span className="eyebrow">Attendance pulse</span><h2>Presence over time</h2></div><Activity size={19} className="panel-icon" /></div><div className="report-line-chart">{(data?.attendanceTrend || []).map((item, i) => <div className="line-column" key={item.date}><div className="line-point" style={{ bottom: `${Math.max((item.present / Math.max(data?.totalEmployees || 1, 1)) * 100, 5)}%` }} /><div className="line-fill" style={{ height: `${Math.max((item.present / Math.max(data?.totalEmployees || 1, 1)) * 100, 5)}%` }} /><small>{new Date(item.date).toLocaleDateString([], { weekday: 'short' }).slice(0, 2)}</small></div>)}</div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">Team composition</span><h2>By department</h2></div></div><div className="report-depts">{(data?.departmentDistribution || []).map((item) => <div className="report-dept" key={item.department}><div><span>{item.department}</span><strong>{item.count}</strong></div><div className="mini-track"><span style={{ width: `${(item.count / max) * 100}%` }} /></div></div>)}</div></section><section className="panel report-callout"><Sparkles size={21} /><span className="eyebrow">The useful question</span><h2>What deserves a closer look?</h2><p>Attendance data is most helpful when it starts a conversation, not when it ends one.</p><Link href="/attendance" className="text-link" data-testid="link-report-attendance">Explore attendance <ArrowRight size={14} /></Link></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">Current snapshot</span><h2>Workforce health</h2></div></div><div className="health-list"><div><span>Present today</span><strong>{data?.presentToday || 0}</strong></div><div><span>Absent today</span><strong>{data?.absentToday || 0}</strong></div><div><span>On leave</span><strong>{data?.onLeave || 0}</strong></div><div><span>Pending leaves</span><strong>{data?.pendingLeaves || 0}</strong></div></div></section></div></QueryState></Shell>;
}

function Profile() {
  const { data: user } = useGetMe();
  return <Shell><PageHeader eyebrow="Your profile" title="A little more context" description="Keep your work identity current so the right details reach the right people." action={<Button variant="secondary" onClick={() => document.getElementById('profile-name')?.focus()} testId="button-edit-own-profile"><Pencil size={15} /> Edit details</Button>} /><div className="profile-layout"><section className="panel profile-card"><div className="profile-large"><Avatar name={user?.name} src={user?.avatar} size="lg" /><div><h2 data-testid="text-profile-name">{user?.name || 'Your profile'}</h2><p>{user?.jobPosition || 'Team member'} · {user?.department || 'Unassigned'}</p><StatusPill value={user?.role || 'Member'} /></div></div><div className="detail-list"><Detail label="Email" value={user?.email} /><Detail label="Employee ID" value={user?.employeeId} mono /><Detail label="Company" value={user?.company} /><Detail label="Role" value={user?.role} /></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">Personal preferences</span><h2>How Dayflow feels</h2></div><Sparkles size={18} className="panel-icon" /></div><div className="preference-list"><div><span><Bell size={16} /> Notifications</span><button data-testid="button-toggle-notifications" className="toggle is-on" onClick={(e) => e.currentTarget.classList.toggle('is-on')}><i /></button></div><div><span><ShieldCheck size={16} /> Profile visibility</span><span className="muted-text">Team only</span></div></div></section></div></Shell>;
}

function Settings() {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const toggle = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('dayflow-theme', next ? 'dark' : 'light'); };
  return <Shell><PageHeader eyebrow="Workspace settings" title="Tune the room" description="Small choices that make a long workday feel more like yours." /><div className="settings-layout"><section className="panel"><div className="panel-head"><div><span className="eyebrow">Appearance</span><h2>Visual preferences</h2></div><Sparkles size={18} className="panel-icon" /></div><div className="setting-row"><div><strong>Theme</strong><p>Choose a softer light or a deep night workspace.</p></div><button data-testid="button-toggle-theme" onClick={toggle} className="theme-toggle"><span className={!dark ? 'selected' : ''}>Light</span><span className={dark ? 'selected' : ''}>Night</span></button></div><div className="setting-row"><div><strong>Reduced motion</strong><p>Keep transitions quiet when you need focus.</p></div><button data-testid="button-toggle-motion" className="toggle" onClick={(e) => e.currentTarget.classList.toggle('is-on')}><i /></button></div></section><section className="panel support-card"><LifeBuoy size={22} /><span className="eyebrow">Need a hand?</span><h2>We keep the people work moving.</h2><p>Reach the workspace support team when a process feels unclear or a detail needs care.</p><Button variant="secondary" onClick={() => window.location.href = 'mailto:people@dayflow.co'} testId="button-contact-support">Contact support <ArrowRight size={15} /></Button></section></div></Shell>;
}

function Field({ label, value, onChange, type = 'text', wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return <label className={wide ? 'wide' : ''}><span>{label}</span><input data-testid={`input-${label.toLowerCase().replaceAll(' ', '-')}`} required={label !== 'Phone' && label !== 'Address'} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Detail({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) { return <div className="detail-row"><span>{label}</span><strong data-testid={`text-detail-${label.toLowerCase().replaceAll(' ', '-')}`} className={mono ? 'mono' : ''}>{value || 'Not added'}</strong></div>; }



function Router() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isAuthRoute = location === '/login' || location === '/signup';

  if (!isAuthenticated && !isAuthRoute) {
    return <RedirectTo href="/login" />;
  }

  if (isAuthenticated && isAuthRoute) {
    return <RedirectTo href="/dashboard" />;
  }

  return <ErrorBoundary resetKey={location}>{isAuthRoute ? <Switch><Route path="/login" component={Login} /><Route path="/signup" component={Signup} /></Switch> : <Switch><Route path="/" component={() => <RedirectTo href="/dashboard" />} /><Route path="/dashboard" component={Dashboard} /><Route path="/employees" component={Employees} /><Route path="/employees/:id" component={EmployeeProfile} /><Route path="/attendance" component={Attendance} /><Route path="/leaves/apply" component={ApplyLeave} /><Route path="/leaves" component={Leaves} /><Route path="/payroll/:userId" component={PayrollDetailRoute} /><Route path="/payroll" component={PayrollRoute} /><Route path="/reports" component={Reports} /><Route path="/profile" component={Profile} /><Route path="/settings" component={Settings} /><Route component={NotFound} /></Switch>}</ErrorBoundary>;
}
function RedirectTo({ href }: { href: string }) { const [, setLocation] = useLocation(); useEffect(() => setLocation(href), [href, setLocation]); return null; }

function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}><Router /></WouterRouter><Toaster /></TooltipProvider></AuthProvider></QueryClientProvider>;
}

export default App;