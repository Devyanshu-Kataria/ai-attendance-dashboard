import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, RefreshCw } from 'lucide-react';
import { supabase, type LeaveBalance } from '../../lib/supabase';
import { useAuth } from '../App';
import { MonthPicker } from '../components/MonthPicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
  SL: '#F87171', // red-400
  CL: '#4361EE', // primary blue
  EL: '#10B981', // emerald-500
};

function KpiBurnBar({ label, taken, left, color, bgClass }: { label: string; taken: number; left: number; color: string; bgClass: string }) {
  const total = taken + left;
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  return (
    <div className="bg-white rounded-xl border border-[#EEF0F6] p-4 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-[#1B2559] uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-semibold text-[#8F9BB3]">{taken} /{total === 0 ? ' ?' : ` ${total}`} consumed</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[#EEF0F6] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${bgClass}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-bold w-7 text-right ${color}`}>{pct}%</span>
      </div>
    </div>
  );
}

function getRiskBadge(emp: LeaveBalance) {
  const isExhausted = emp.sl_left <= 0 || emp.cl_left <= 0 || emp.el_left <= 0;
  const isCriticalAbsence = emp.absent_days >= 5 || emp.lc_days >= 3;
  
  if (isExhausted || isCriticalAbsence) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Critical</span>;
  }
  
  const isLowLeave = emp.sl_left <= 3 || emp.cl_left <= 3 || emp.el_left <= 3;
  const isModerateAbsence = emp.absent_days >= 3 || emp.lc_days === 2;

  if (isLowLeave || isModerateAbsence) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">At Risk</span>;
  }
  
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Safe</span>;
}

export function LeaveBalances() {
  const { session } = useAuth();
  const [leaves, setLeaves] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const getMonthYearStr = (yyyyMm: string) => {
    const [yr, mo] = yyyyMm.split('-');
    const date = new Date(parseInt(yr), parseInt(mo) - 1);
    return `${date.toLocaleString('en-US', { month: 'long' })} ${yr}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('month_year', getMonthYearStr(selectedMonth))
      .order('employee_name', { ascending: true });
    if (error) {
      console.error('Leave fetch error:', error);
      setFetchError(error.message);
    } else {
      setLeaves(data || []);
    }
    setLoading(false);
  };

  const filtered = leaves.filter(
    (e) =>
      !searchQuery ||
      e.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart Data Preparation
  const stackedData = filtered.map(e => ({
    name: e.employee_name.split(' ')[0], // first name for fit
    SL: e.sl_taken,
    CL: e.cl_taken,
    EL: e.el_taken,
  }));

  const targetDepartments = new Set<string>();
  if (searchQuery) {
    filtered.forEach(e => targetDepartments.add(e.department || 'Other'));
  }

  const deptMap: Record<string, { SL: number; CL: number; EL: number; name: string }> = {};
  leaves.forEach(e => {
    const d = e.department || 'Other';
    // If a search is active, only show the departments of the matched employees.
    if (searchQuery && !targetDepartments.has(d)) return;
    
    if (!deptMap[d]) deptMap[d] = { name: d, SL: 0, CL: 0, EL: 0 };
    deptMap[d].SL += e.sl_taken;
    deptMap[d].CL += e.cl_taken;
    deptMap[d].EL += e.el_taken;
  });
  const deptData = Object.values(deptMap);

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-[#8F9BB3] mb-4">
        <Link to="/" className="hover:text-[#4361EE] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#1B2559] font-medium">Leave Balances & Analytics</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#1B2559]">Leave Analytics</h1>
        <div className="flex items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} align="left" />

          <div className="flex items-center gap-2 bg-white border border-[#EEF0F6] rounded-lg px-3 py-1.5 shadow-sm">
            <input
              placeholder="Search by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-[#1B2559] outline-none placeholder:text-[#8F9BB3] w-48"
            />
            <Search size={13} className="text-[#8F9BB3]" />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs text-[#4361EE] bg-white border border-[#EEF0F6] rounded-lg px-3 py-1.5 shadow-sm hover:border-[#4361EE] transition-colors font-medium"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Burn-Down KPI Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <KpiBurnBar label="Sick Leave (SL)" taken={leaves.reduce((s, e) => s + e.sl_taken, 0)} left={leaves.reduce((s, e) => s + e.sl_left, 0)} color="text-red-500" bgClass="bg-red-400" />
        <KpiBurnBar label="Casual Leave (CL)" taken={leaves.reduce((s, e) => s + e.cl_taken, 0)} left={leaves.reduce((s, e) => s + e.cl_left, 0)} color="text-[#4361EE]" bgClass="bg-[#4361EE]" />
        <KpiBurnBar label="Earned Leave (EL)" taken={leaves.reduce((s, e) => s + e.el_taken, 0)} left={leaves.reduce((s, e) => s + e.el_left, 0)} color="text-emerald-600" bgClass="bg-emerald-500" />
      </div>

      {/* Employee Search Quota Rings */}
      {filtered.length === 1 && searchQuery && (
        <div className="bg-white rounded-xl border border-[#EEF0F6] p-5 shadow-sm mb-5 transition-all">
          <h2 className="text-sm font-semibold text-[#1B2559] mb-4">Personal Quota Context: <span className="text-[#4361EE]">{filtered[0].employee_name}</span></h2>
          <div className="flex justify-around items-center">
            {[
              { label: 'SL', taken: filtered[0].sl_taken, left: filtered[0].sl_left, color: COLORS.SL },
              { label: 'CL', taken: filtered[0].cl_taken, left: filtered[0].cl_left, color: COLORS.CL },
              { label: 'EL', taken: filtered[0].el_taken, left: filtered[0].el_left, color: COLORS.EL },
            ].map((ring) => {
              const total = ring.taken + ring.left;
              const data = [
                { name: 'Taken', value: ring.taken },
                { name: 'Left', value: ring.left }
              ];
              return (
                <div key={ring.label} className="flex flex-col items-center">
                  <div style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%" cy="50%"
                          innerRadius={40} outerRadius={55}
                          startAngle={90} endAngle={-270}
                          dataKey="value" stroke="none"
                          isAnimationActive={true}
                        >
                          <Cell fill={ring.color} />
                          <Cell fill="#EEF0F6" />
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-[12px] font-bold mt-1 text-[#1B2559]">{ring.label} Consumption</span>
                  <span className="text-[11px] text-[#8F9BB3] font-medium">{ring.taken} taken / {total === 0 ? '?' : total} total</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Stacked Chart */}
        <div className="bg-white rounded-xl border border-[#EEF0F6] p-4 shadow-sm flex flex-col h-[320px]">
          <h2 className="text-[13px] font-bold text-[#1B2559] mb-4 uppercase tracking-wide">Leave Taken per Employee</h2>
          <div className="flex-1 overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200">
            <div style={{ minWidth: `${Math.max(filtered.length * 40, 400)}px`, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8F9BB3' }} interval={0} angle={-45} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8F9BB3' }} />
                  <Tooltip wrapperStyle={{ fontSize: 12 }} cursor={{ fill: '#F4F6FA' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="SL" stackId="a" fill={COLORS.SL} radius={[0,0,0,0]} />
                  <Bar dataKey="CL" stackId="a" fill={COLORS.CL} radius={[0,0,0,0]} />
                  <Bar dataKey="EL" stackId="a" fill={COLORS.EL} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Dept Grouped Chart */}
        <div className="bg-white rounded-xl border border-[#EEF0F6] p-4 shadow-sm flex flex-col h-[320px]">
          <h2 className="text-[13px] font-bold text-[#1B2559] mb-4 uppercase tracking-wide">Department Leave Breakdown</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8F9BB3' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8F9BB3' }} />
                <Tooltip wrapperStyle={{ fontSize: 12, borderRadius: '8px' }} cursor={{ fill: '#F4F6FA' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="SL" fill={COLORS.SL} radius={[2,2,0,0]} />
                <Bar dataKey="CL" fill={COLORS.CL} radius={[2,2,0,0]} />
                <Bar dataKey="EL" fill={COLORS.EL} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Risk Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] overflow-hidden">
        <div className="grid grid-cols-[1.8fr_0.9fr_1.1fr_0.7fr_0.7fr_0.7fr_0.8fr_repeat(6,0.6fr)] gap-2 px-5 py-4 border-b border-[#EEF0F6] bg-[#FAFBFF]">
          {['Employee', 'ID', 'Dept', 'Present', 'Absent', 'Late', 'Risk', 'SL', 'CL', 'EL', 'SL Left', 'CL Left', 'EL Left'].map((h) => (
            <span key={h} className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#8F9BB3]">Loading advanced analytics...</div>
        ) : fetchError ? (
          <div className="py-12 text-center text-sm text-red-400">Error: {fetchError}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8F9BB3]">No records found matching criteria.</div>
        ) : (
          filtered.map((emp, i) => (
            <div
              key={emp.employee_id}
              className={`grid grid-cols-[1.8fr_0.9fr_1.1fr_0.7fr_0.7fr_0.7fr_0.8fr_repeat(6,0.6fr)] gap-2 px-5 py-3 items-center hover:bg-[#F9FAFB] transition-colors ${
                i < filtered.length - 1 ? 'border-b border-[#EEF0F6]' : ''
              }`}
            >
              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#4361EE]">
                    {emp.employee_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#1B2559] truncate block">{emp.employee_name}</span>
                  <span className="text-[9px] text-[#8F9BB3] truncate block">{emp.designation}</span>
                </div>
              </div>
              <span className="text-[11px] text-[#8F9BB3] truncate">{emp.employee_id}</span>
              <span className="text-[11px] text-[#1B2559] truncate">{emp.department}</span>
              
              {/* Accurate counts */}
              <span className="text-[11px] font-medium text-emerald-500">{emp.present_days}</span>
              <span className={`text-[11px] font-medium ${emp.absent_days > 5 ? 'text-red-500' : 'text-[#1B2559]'}`}>{emp.absent_days}</span>
              <span className="text-[11px] font-medium text-yellow-500">{emp.lc_days}</span>
              
              {/* Risk */}
              <div className="flex items-center">
                {getRiskBadge(emp)}
              </div>

              {/* Leave breakdown */}
              <span className="text-[11px] font-medium text-red-500">{emp.sl_taken}</span>
              <span className="text-[11px] font-medium text-[#4361EE]">{emp.cl_taken}</span>
              <span className="text-[11px] font-medium text-emerald-500">{emp.el_taken}</span>
              <span className={`text-[11px] font-bold ${emp.sl_left === 0 ? 'text-red-500' : 'text-[#1B2559]'}`}>{emp.sl_left}</span>
              <span className={`text-[11px] font-bold ${emp.cl_left === 0 ? 'text-red-500' : 'text-[#1B2559]'}`}>{emp.cl_left}</span>
              <span className={`text-[11px] font-bold ${emp.el_left === 0 ? 'text-red-500' : 'text-[#1B2559]'}`}>{emp.el_left}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}