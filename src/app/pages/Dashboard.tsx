import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronDown, Filter, Plus, Search,
  Palette, Code2, BarChart2, TrendingUp, Users,
  AlertCircle, CheckCircle, Clock, ShieldAlert, User,
  Check, X,
} from 'lucide-react';
import { DEPARTMENTS } from '../data/employees';
import { supabase, type StrikeEmployee } from '../../lib/supabase';
import { useAuth } from '../App';

const chartData = [
  { day: '1-Mon', ontime: 70, late: 28 },
  { day: '2-Tue', ontime: 80, late: 30 },
  { day: '3-Wed', ontime: 85, late: 30 },
  { day: '4-Thu', ontime: 72, late: 22 },
  { day: '5-Fri', ontime: 90, late: 32 },
  { day: '6-Sat', ontime: 58, late: 18 },
  { day: '7-Sun', ontime: 100, late: 28 },
  { day: '8-Mon', ontime: 78, late: 24 },
  { day: '9-Tue', ontime: 88, late: 28 },
  { day: '10-Wed', ontime: 95, late: 30 },
];

const deptIcons: Record<string, React.ReactNode> = {
  Design: <Palette size={14} className="text-[#4361EE]" />,
  Development: <Code2 size={14} className="text-[#7B2FBE]" />,
  'Data Science': <BarChart2 size={14} className="text-[#00B4D8]" />,
  Sales: <TrendingUp size={14} className="text-[#F77F00]" />,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-[#EEF0F6] text-xs">
        <p className="text-[#8F9BB3] mb-1 font-medium">{label}</p>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full bg-[#4361EE]" />
          <span className="text-[#1B2559]">On-Time: <strong>{payload[0]?.value}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#B0C4FF]" />
          <span className="text-[#1B2559]">Late: <strong>{payload[1]?.value}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

function getBadge(count: number, excused: string | null) {
  if (excused === 'APPROVED') return <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4361EE] rounded-full text-[10px] font-bold">Excused</span>;
  if (excused === 'PENDING') return <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold animate-pulse">Pending</span>;
  if (count >= 3) return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">Critical</span>;
  if (count === 2) return <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-[10px] font-bold">At Risk</span>;
  return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Safe</span>;
}

const FILTER_TABS = [
  { label: 'All Late', filter: (e: StrikeEmployee) => e.monthly_late_count >= 1 },
  { label: 'Critical', filter: (e: StrikeEmployee) => e.monthly_late_count >= 3 },
  { label: 'At Risk', filter: (e: StrikeEmployee) => e.monthly_late_count === 2 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [activeFilterTab, setActiveFilterTab] = useState(0);
  const [employees, setEmployees] = useState<StrikeEmployee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('strike_counter').select('*');
    if (error) console.error('Error fetching data:', error);
    else setEmployees(data || []);
    setLoading(false);
  };

  const handleExcuseAction = async (employeeId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch('http://localhost:5678/webhook/hr-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          action,
          hrManager: session?.user?.email || 'Unknown HR',
        }),
      });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employee_id === employeeId ? { ...emp, excused: action } : emp
        )
      );
    } catch {
      alert('Failed to update status. Is n8n running?');
    }
  };

  const total = employees.length;
  const lateTotal = employees.filter((e) => e.monthly_late_count > 0).length;
  const onTime = total - lateTotal;
  const atRisk = employees.filter((e) => e.monthly_late_count === 2).length;
  const critical = employees.filter((e) => e.monthly_late_count >= 3).length;

  const filtered = employees
    .filter(FILTER_TABS[activeFilterTab].filter)
    .filter((e) =>
      !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.monthly_late_count - a.monthly_late_count);

  return (
    <div className="p-4 h-full">
      <p className="text-xs text-[#8F9BB3] mb-3">Dashboard</p>

      <div className="flex gap-3 h-[calc(100%-32px)]">
        {/* LEFT PANEL */}
        <div className="flex flex-col gap-3" style={{ width: '52%' }}>
          {/* Metrics row */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total', value: total, icon: <User size={11} />, color: 'text-[#1B2559]' },
              { label: 'Late', value: lateTotal, icon: <Clock size={11} />, color: 'text-red-500' },
              { label: 'On Time', value: onTime, icon: <CheckCircle size={11} />, color: 'text-emerald-500' },
              { label: 'At Risk', value: atRisk, icon: <AlertCircle size={11} />, color: 'text-yellow-500' },
              { label: 'Critical', value: critical, icon: <ShieldAlert size={11} />, color: 'text-red-600' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-3 shadow-sm border border-[#EEF0F6] text-center">
                <div className={`flex items-center justify-center gap-1 text-[10px] text-[#8F9BB3] mb-1 ${card.color}`}>
                  {card.icon}
                  <span>{card.label}</span>
                </div>
                <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EEF0F6] flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1B2559]">
                Attendance Status — {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-[#8F9BB3] border border-[#EEF0F6] rounded-lg px-2 py-1">
                  All Departments <Filter size={11} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4361EE]" />
                <span className="text-[11px] text-[#8F9BB3]">On-time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B0C4FF]" />
                <span className="text-[11px] text-[#8F9BB3]">Late</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8F9BB3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8F9BB3' }} axisLine={false} tickLine={false} domain={[0, 125]} ticks={[0, 25, 50, 75, 100, 125]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F6FA' }} />
                <Bar dataKey="ontime" fill="#4361EE" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" fill="#B0C4FF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row */}
          <div className="flex gap-3" style={{ height: '140px' }}>
            {/* Pending appeals */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EEF0F6] flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#1B2559]">Pending Appeals</h3>
                <button className="text-[11px] text-[#4361EE] font-medium" onClick={() => navigate('/attendance')}>View all</button>
              </div>
              <div className="flex flex-col gap-1.5">
                {employees.filter((e) => e.excused === 'PENDING').slice(0, 3).map((emp) => (
                  <div key={emp.employee_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-[#1B2559]">{emp.name}</p>
                      <p className="text-[10px] text-[#8F9BB3]">{emp.employee_id}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleExcuseAction(emp.employee_id, 'APPROVED')}
                        className="flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[10px] font-medium transition-colors">
                        <Check size={10} className="mr-0.5" /> Approve
                      </button>
                      <button onClick={() => handleExcuseAction(emp.employee_id, 'REJECTED')}
                        className="flex items-center px-2 py-0.5 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[10px] font-medium transition-colors">
                        <X size={10} className="mr-0.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {employees.filter((e) => e.excused === 'PENDING').length === 0 && (
                  <p className="text-[11px] text-[#8F9BB3]">No pending appeals.</p>
                )}
              </div>
            </div>

            {/* Add employee */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EEF0F6] flex flex-col items-center justify-center" style={{ width: '150px' }}>
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-2">
                <Users size={22} className="text-[#4361EE]" />
              </div>
              <button
                className="flex items-center gap-1 bg-[#4361EE] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#3451DD] transition-colors"
                onClick={() => navigate('/attendance')}
              >
                <Plus size={11} /> View All
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL - Departments */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EEF0F6] overflow-auto" style={{ width: '22%' }}>
          <h3 className="text-sm font-semibold text-[#1B2559] mb-3">All Departments</h3>
          <div className="flex flex-col gap-3">
            {DEPARTMENTS.map((dept) => (
              <div key={dept.name} className="border border-[#EEF0F6] rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] text-[#8F9BB3] leading-none">Total</p>
                    <p className="text-xl font-semibold text-[#1B2559] leading-tight">{dept.total}</p>
                  </div>
                  <div className="text-right text-[10px] text-[#8F9BB3] space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      <span>On-time</span>
                      <span className="font-semibold text-[#1B2559]">{String(dept.ontime).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span>Late</span>
                      <span className="font-semibold text-[#1B2559]">{String(dept.late).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span>Leave</span>
                      <span className="font-semibold text-[#1B2559]">{dept.leave > 0 ? String(dept.leave).padStart(2, '0') : '--'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8F9BB3]">
                  {deptIcons[dept.name]}
                  <span>{dept.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - Strike Counter Employees */}
        <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] flex flex-col overflow-hidden" style={{ width: '26%' }}>
          <div className="p-4 border-b border-[#EEF0F6]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#1B2559]">Late Employees</span>
              <button onClick={fetchData} className="text-[10px] text-[#4361EE] font-medium hover:underline">Refresh</button>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-3">
              {FILTER_TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveFilterTab(i)}
                  className={`text-[11px] pb-1.5 transition-colors ${
                    activeFilterTab === i
                      ? 'text-[#4361EE] border-b-2 border-[#4361EE] font-medium'
                      : 'text-[#8F9BB3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#EEF0F6]">
            <div className="flex-1 flex items-center gap-2 bg-[#F4F6FA] rounded-lg px-3 py-1.5">
              <Search size={12} className="text-[#8F9BB3]" />
              <input
                placeholder="Search employees"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[11px] text-[#1B2559] outline-none flex-1 placeholder:text-[#8F9BB3]"
              />
            </div>
          </div>

          {/* Employee list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[11px] text-[#8F9BB3]">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-[#8F9BB3]">No employees found.</div>
            ) : (
              filtered.map((emp) => (
                <div
                  key={emp.employee_id}
                  className="flex items-start gap-2 px-4 py-3 border-b border-[#EEF0F6] hover:bg-[#F9FAFB] transition-colors"
                >
                  {/* Initials avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#4361EE]">
                      {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1B2559] leading-tight truncate">{emp.name}</p>
                    <p className="text-[10px] text-[#8F9BB3]">{emp.employee_id}</p>
                    <div className="flex items-center justify-between mt-1">
                      {getBadge(emp.monthly_late_count, emp.excused)}
                      <span className="text-[10px] text-[#8F9BB3]">{emp.monthly_late_count} late days</span>
                    </div>
                    {emp.excused !== 'APPROVED' && (
                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={() => handleExcuseAction(emp.employee_id, 'APPROVED')}
                          className="flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[10px] font-medium transition-colors"
                        >
                          <Check size={9} className="mr-0.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleExcuseAction(emp.employee_id, 'REJECTED')}
                          className="flex items-center px-1.5 py-0.5 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[10px] font-medium transition-colors"
                        >
                          <X size={9} className="mr-0.5" /> Reject
                        </button>
                      </div>
                    )}
                    {emp.excused === 'APPROVED' && (
                      <span className="text-[10px] text-[#4361EE] mt-1 block">✓ Excused</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
