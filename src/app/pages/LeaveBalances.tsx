import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, RefreshCw } from 'lucide-react';
import { supabase, type LeaveBalance } from '../../lib/supabase';
import { useAuth } from '../App';

function LeaveBar({ taken, left, color }: { taken: number; left: number; color: string }) {
  const total = taken + left;
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#EEF0F6] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-[#8F9BB3] w-14 text-right">{taken} / {total}</span>
    </div>
  );
}

export function LeaveBalances() {
  const { session } = useAuth();
  const [leaves, setLeaves] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
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

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-[#8F9BB3] mb-4">
        <Link to="/" className="hover:text-[#4361EE] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#1B2559] font-medium">Leave Balances</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#1B2559]">Leave Balances</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#EEF0F6] rounded-lg px-3 py-1.5 shadow-sm">
            <input
              placeholder="Search by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-[#1B2559] outline-none placeholder:text-[#8F9BB3] w-40"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Sick Leave (SL)', taken: filtered.reduce((s, e) => s + e.sl_taken, 0), left: filtered.reduce((s, e) => s + e.sl_left, 0), color: 'bg-red-400' },
          { label: 'Casual Leave (CL)', taken: filtered.reduce((s, e) => s + e.cl_taken, 0), left: filtered.reduce((s, e) => s + e.cl_left, 0), color: 'bg-[#4361EE]' },
          { label: 'Earned Leave (EL)', taken: filtered.reduce((s, e) => s + e.el_taken, 0), left: filtered.reduce((s, e) => s + e.el_left, 0), color: 'bg-emerald-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#EEF0F6] p-5 shadow-sm">
            <p className="text-[10px] font-semibold text-[#8F9BB3] uppercase tracking-wider mb-1">{card.label}</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-[#1B2559]">{card.taken}</span>
              <span className="text-xs text-[#8F9BB3]">{card.left} remaining</span>
            </div>
            <LeaveBar taken={card.taken} left={card.left} color={card.color} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_repeat(6,1fr)] gap-3 px-5 py-3 border-b border-[#EEF0F6] bg-[#FAFBFF]">
          {['Employee', 'ID', 'SL Taken', 'CL Taken', 'EL Taken', 'SL Left', 'CL Left', 'EL Left'].map((h) => (
            <span key={h} className="text-[11px] font-semibold text-[#8F9BB3] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#8F9BB3]">Loading leave data...</div>
        ) : fetchError ? (
          <div className="py-12 text-center text-sm text-red-400">
            Error: {fetchError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8F9BB3]">No records found.</div>
        ) : (
          filtered.map((emp, i) => (
            <div
              key={emp.employee_id}
              className={`grid grid-cols-[2fr_1fr_repeat(6,1fr)] gap-3 px-5 py-3 items-center hover:bg-[#F9FAFB] transition-colors ${
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
                <span className="text-xs font-semibold text-[#1B2559] truncate">{emp.employee_name}</span>
              </div>

              {/* ID */}
              <span className="text-xs text-[#8F9BB3]">{emp.employee_id}</span>

              {/* SL Taken */}
              <span className="text-xs font-medium text-red-500">{emp.sl_taken}</span>

              {/* CL Taken */}
              <span className="text-xs font-medium text-[#4361EE]">{emp.cl_taken}</span>

              {/* EL Taken */}
              <span className="text-xs font-medium text-emerald-600">{emp.el_taken}</span>

              {/* SL Left */}
              <span className={`text-xs font-medium ${emp.sl_left === 0 ? 'text-red-400' : 'text-[#1B2559]'}`}>
                {emp.sl_left}
              </span>

              {/* CL Left */}
              <span className={`text-xs font-medium ${emp.cl_left === 0 ? 'text-red-400' : 'text-[#1B2559]'}`}>
                {emp.cl_left}
              </span>

              {/* EL Left */}
              <span className={`text-xs font-medium ${emp.el_left === 0 ? 'text-red-400' : 'text-[#1B2559]'}`}>
                {emp.el_left}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}