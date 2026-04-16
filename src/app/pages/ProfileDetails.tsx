import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { MonthPicker } from "../components/MonthPicker";

const PIE_COLORS = ["#4361EE", "#EEF2FF"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DbEmployee {
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
  manager_name: string | null;
  monthly_late_count: number;
  strike_level: number;
}

interface DailyRecord {
  date: string;
  late_flag: string | null;
  check_in: string | null;
  check_out: string | null;
}

function buildCalendarGrid(
  year: number,
  month: number,
  records: DailyRecord[]
) {
  const recordMap: Record<number, DailyRecord> = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      recordMap[d.getDate()] = r;
    }
  });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number | null; record: DailyRecord | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, record: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, record: recordMap[d] ?? null });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, record: null });

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function getCellStyle(record: DailyRecord | null): string {
  if (!record) return "";
  if (record.late_flag === "YES" || record.late_flag === "LC")
    return "bg-orange-50 text-orange-500";
  if (record.late_flag === "LEAVE" || record.late_flag === "CL")
    return "bg-blue-50 text-blue-500";
  if (record.late_flag === "SL")
    return "bg-red-50 text-red-400";
  if (record.late_flag === "EL")
    return "bg-emerald-50 text-emerald-600";
  if (record.late_flag === "NO") return "bg-[#EEF2FF] text-[#4361EE]";
  return "bg-[#F4F6FA] text-[#8F9BB3]";
}

function getCellLabel(record: DailyRecord | null): string {
  if (!record) return "";
  if (record.late_flag === "YES" || record.late_flag === "LC") return "Late";
  if (record.late_flag === "LEAVE" || record.late_flag === "CL") return "CL";
  if (record.late_flag === "SL") return "SL";
  if (record.late_flag === "EL") return "EL";
  if (record.late_flag === "NO") return "On Time";
  return record.late_flag || "";
}

export function ProfileDetails() {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<DbEmployee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<{ sl_taken: number; cl_taken: number; el_taken: number; sl_left: number; cl_left: number; el_left: number } | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    supabase
      .from("strike_counter")
      .select("employee_id, name, department, designation, date_of_joining, manager_name, monthly_late_count, strike_level")
      .then(({ data }) => {
        if (data) {
          setEmployees(data as DbEmployee[]);
          setSelectedEmp(data[0] as DbEmployee);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedEmp) return;
    setLoadingRecords(true);
    setLeaveBalance(null);
    Promise.all([
      supabase
        .from("daily_records")
        .select("date, late_flag, check_in, check_out")
        .eq("employee_id", selectedEmp.employee_id),
      supabase
        .from("leave_balances")
        .select("sl_taken, cl_taken, el_taken, sl_left, cl_left, el_left")
        .eq("employee_id", selectedEmp.employee_id)
        .single(),
    ]).then(([drRes, lbRes]) => {
      setDailyRecords((drRes.data as DailyRecord[]) || []);
      if (lbRes.data) setLeaveBalance(lbRes.data);
      setLoadingRecords(false);
    });
  }, [selectedEmp]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Filter records based on selectedMonth
  const monthlyRecords = useMemo(() => {
    return dailyRecords.filter((r) => r.date.startsWith(selectedMonth));
  }, [dailyRecords, selectedMonth]);

  // Pie chart: on-time vs late vs leave for selected month
  const pieData = useMemo(() => {
    const onTime = monthlyRecords.filter((r) => r.late_flag === "NO").length;
    const late = monthlyRecords.filter(
      (r) => r.late_flag === "YES" || r.late_flag === "LC"
    ).length;
    // Leave days = total leaves taken from leave_balances (not date-specific)
    const leaveDays = leaveBalance
      ? (leaveBalance.sl_taken + leaveBalance.cl_taken + leaveBalance.el_taken)
      : 0;
    const total = (monthlyRecords.length + leaveDays) || 1;
    return [
      { name: "On Time", value: Math.round((onTime / total) * 100) },
      { name: "Late", value: Math.round((late / total) * 100) },
      { name: "Leave", value: Math.round((leaveDays / total) * 100) },
    ];
  }, [monthlyRecords, leaveBalance]);

  const PIE_COLORS_MULTI = ["#4361EE", "#F97316", "#EF4444"];

  const calendarWeeks = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return buildCalendarGrid(y, m, monthlyRecords);
  }, [selectedMonth, monthlyRecords]);

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [selectedMonth]);

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-[#8F9BB3] mb-4">
        <Link to="/" className="hover:text-[#4361EE] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#1B2559] font-medium">Employee Details</span>
      </div>

      <div className="flex gap-4">
        {/* LEFT: Profile Card */}
        {selectedEmp && (
          <div
            className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-5 flex flex-col gap-3"
            style={{ width: "280px", minWidth: "240px" }}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EEF2FF] mx-auto">
              <span className="text-xl font-bold text-[#4361EE]">
                {selectedEmp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1B2559]">{selectedEmp.name}</p>
              <p className="text-[11px] text-[#8F9BB3]">{selectedEmp.designation || "—"}</p>
            </div>
            <div className="border-t border-[#EEF0F6] pt-3 flex flex-col gap-2.5">
              {[
                { label: "Employee ID", value: selectedEmp.employee_id },
                { label: "Department", value: selectedEmp.department || "—" },
                { label: "Designation", value: selectedEmp.designation || "—" },
                { label: "Date of Joining", value: selectedEmp.date_of_joining ? new Date(selectedEmp.date_of_joining).toLocaleDateString("en-IN") : "—" },
                { label: "Manager", value: selectedEmp.manager_name || "—" },
                { label: "Strike Level", value: String(selectedEmp.strike_level) },
                { label: "Late Days (Month)", value: String(selectedEmp.monthly_late_count) },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-2">
                  <span className="text-[11px] text-[#8F9BB3] w-28 shrink-0">{f.label}</span>
                  <span className="text-[11px] text-[#1B2559] font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTER: Pie Chart + Calendar */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Pie chart */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#1B2559]">Attendance Breakdown</h3>
              <div className="flex items-center gap-2">
                <MonthPicker value={selectedMonth} onChange={setSelectedMonth} align="right" />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={68}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS_MULTI[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, ""]} contentStyle={{ fontSize: "11px", border: "1px solid #EEF0F6", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS_MULTI[i] }} />
                    <div>
                      <p className="text-sm font-semibold text-[#1B2559]">{entry.value}%</p>
                      <p className="text-[11px] text-[#8F9BB3]">{entry.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave Balance Cards */}
          {leaveBalance && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sick Leave', taken: leaveBalance.sl_taken, left: leaveBalance.sl_left, color: 'text-red-500', bar: 'bg-red-400' },
                { label: 'Casual Leave', taken: leaveBalance.cl_taken, left: leaveBalance.cl_left, color: 'text-[#4361EE]', bar: 'bg-[#4361EE]' },
                { label: 'Earned Leave', taken: leaveBalance.el_taken, left: leaveBalance.el_left, color: 'text-emerald-600', bar: 'bg-emerald-500' },
              ].map((item) => {
                const total = item.taken + item.left || 1;
                return (
                  <div key={item.label} className="bg-white rounded-xl border border-[#EEF0F6] p-3 shadow-sm">
                    <p className="text-[10px] font-semibold text-[#8F9BB3] uppercase tracking-wider mb-1">{item.label}</p>
                    <div className="flex items-end justify-between mb-1.5">
                      <span className={`text-lg font-bold ${item.color}`}>{item.left}</span>
                      <span className="text-[10px] text-[#8F9BB3]">{item.taken} used</span>
                    </div>
                    <div className="h-1.5 bg-[#EEF0F6] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${Math.round((item.taken / total) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1B2559]">
                Attendance Calendar — {monthLabel}
              </h3>
              <div className="flex items-center gap-2">
                <MonthPicker value={selectedMonth} onChange={setSelectedMonth} align="right" />
              </div>
            </div>
            {loadingRecords ? (
              <div className="text-center text-sm text-[#8F9BB3] py-8">Loading...</div>
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_OF_WEEK.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-[#8F9BB3] py-1">{d}</div>
                  ))}
                </div>
                {calendarWeeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-t border-[#EEF0F6]">
                    {week.map((cell, ci) => {
                      const [y, m]    = selectedMonth.split('-').map(Number);
                      const cellObj   = cell.day ? new Date(y, m - 1, cell.day) : null;
                      const isSunday  = cellObj ? cellObj.getDay() === 0 : false;
                      const isPast    = cellObj ? cellObj <= new Date() : false;
                      // Absent = no record OR record with null late_flag
                      const showAbsent = cell.day !== null
                        && (!cell.record || !cell.record.late_flag)
                        && !isSunday
                        && isPast;

                      return (
                        <div
                          key={ci}
                          className="relative min-h-[44px] px-1 pt-1 pb-1 border-l first:border-l-0 border-[#EEF0F6]"
                        >
                          {cell.day !== null && (
                            <>
                              <span className="text-[10px] font-semibold text-[#8F9BB3] block mb-0.5">{cell.day}</span>
                              {cell.record?.late_flag && cell.record.late_flag !== 'OFF' ? (
                                <div className={`text-[9px] font-medium px-1 py-0.5 rounded text-center ${getCellStyle(cell.record)}`}>
                                  {getCellLabel(cell.record)}
                                </div>
                              ) : showAbsent ? (
                                <div className="relative group">
                                  <div className="text-[9px] font-medium px-1 py-0.5 rounded text-center bg-gray-50 text-gray-500 border border-gray-100 italic transition-colors group-hover:bg-gray-100">
                                    Absent
                                  </div>
                                  {leaveBalance && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20
                                                    opacity-0 group-hover:opacity-100 pointer-events-none
                                                    transition-opacity duration-150
                                                    bg-[#1B2559] text-white rounded-lg px-2.5 py-2
                                                    shadow-xl whitespace-nowrap text-[8px] leading-4">
                                      <p className="font-bold mb-0.5 text-[9px]">Month's Leave Taken</p>
                                      {leaveBalance.sl_taken > 0 && <p>🔴 Sick Leave: <span className="font-semibold">{leaveBalance.sl_taken}d</span></p>}
                                      {leaveBalance.cl_taken > 0 && <p>🔵 Casual Leave: <span className="font-semibold">{leaveBalance.cl_taken}d</span></p>}
                                      {leaveBalance.el_taken > 0 && <p>🟢 Earned Leave: <span className="font-semibold">{leaveBalance.el_taken}d</span></p>}
                                      {leaveBalance.sl_taken === 0 && leaveBalance.cl_taken === 0 && leaveBalance.el_taken === 0 && (
                                        <p className="text-gray-300">No leaves recorded this month</p>
                                      )}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1B2559]" />
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#EEF0F6]">
              {[
                { label: 'On Time', cls: 'bg-[#EEF2FF] text-[#4361EE]' },
                { label: 'Late',    cls: 'bg-orange-50 text-orange-500' },
                { label: 'CL',      cls: 'bg-blue-50 text-blue-500' },
                { label: 'SL',      cls: 'bg-red-50 text-red-400' },
                { label: 'EL',      cls: 'bg-emerald-50 text-emerald-600' },
                { label: 'Absent',  cls: 'bg-gray-100 text-gray-400' },
              ].map(l => (
                <span key={l.label} className={`text-[9px] font-semibold px-2 py-0.5 rounded ${l.cls}`}>{l.label}</span>
              ))}
              <span className="text-[9px] text-[#8F9BB3] ml-auto">Leave dates shown when available in records</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Employees list */}
        <div
          className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4 flex flex-col"
          style={{ width: "240px", minWidth: "200px" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1B2559]">Employees</h3>
            <span className="text-[11px] text-[#8F9BB3] bg-[#F4F6FA] rounded-lg px-2 py-0.5">{employees.length}</span>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#F4F6FA] rounded-lg px-3 py-1.5 mb-3">
            <Search size={12} className="text-[#8F9BB3] shrink-0" />
            <input
              placeholder="Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[11px] text-[#1B2559] outline-none flex-1 placeholder:text-[#8F9BB3]"
            />
          </div>
          {/* List */}
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.employee_id}
                onClick={() => setSelectedEmp(emp)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors w-full ${
                  selectedEmp?.employee_id === emp.employee_id
                    ? "bg-[#EEF2FF] text-[#4361EE]"
                    : "hover:bg-[#F4F6FA] text-[#1B2559]"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-[#4361EE]">
                    {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate">{emp.name}</p>
                  <p className="text-[10px] text-[#8F9BB3] truncate">{emp.employee_id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
