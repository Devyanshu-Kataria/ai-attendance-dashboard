import { useParams, Link } from "react-router";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, Download, Heart, Mail, Edit2 } from "lucide-react";
import { EMPLOYEES, TEAM_MEMBERS } from "../data/employees";

const CALENDAR_HOURS: Record<number, string | null> = {
  1: null,
  2: "9 hrs", 3: "8 hrs", 4: "9 hrs", 5: "9 hrs", 6: "7 hrs", 7: null,
  8: null, 9: "6 hrs", 10: "9 hrs", 11: "9 hrs", 12: "7.5 hrs", 13: "9 hrs", 14: null,
  15: null, 16: "8.5 hrs", 17: "8 hrs", 18: "9 hrs", 19: "9 hrs", 20: null, 21: "CL",
  22: null, 23: "9 hrs", 24: "8 hrs", 25: "9 hrs", 26: "9 hrs", 27: "8 hrs", 28: null,
  29: null, 30: "9 hrs", 31: "9 hrs",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// March 2020 starts on Sunday (day 0)
const MARCH_2020_START_DAY = 0;
const MARCH_2020_TOTAL_DAYS = 31;

function buildCalendarGrid() {
  const cells: Array<{ day: number | null; hours: string | null }> = [];
  // Empty cells before start
  for (let i = 0; i < MARCH_2020_START_DAY; i++) {
    cells.push({ day: null, hours: null });
  }
  for (let d = 1; d <= MARCH_2020_TOTAL_DAYS; d++) {
    cells.push({ day: d, hours: CALENDAR_HOURS[d] ?? null });
  }
  // Pad to complete the last row
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, hours: null });
  }
  // Group into weeks
  const weeks: Array<Array<{ day: number | null; hours: string | null }>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

const calendarWeeks = buildCalendarGrid();

const PIE_COLORS = ["#4361EE", "#EEF2FF"];

export function ProfileDetails() {
  const { id } = useParams();
  const emp = EMPLOYEES.find((e) => e.id === id) || EMPLOYEES[0];

  const pieData = [
    { name: "Present", value: emp.attendance },
    { name: "Absent", value: 100 - emp.attendance },
  ];

  const fields: Array<{ label: string; value: string }> = [
    { label: "Email", value: emp.email },
    { label: "Mobile Number", value: emp.mobile },
    { label: "Date of Birth", value: emp.dob },
    { label: "Blood Group", value: emp.bloodGroup },
    { label: "Country", value: emp.country },
    { label: "State", value: emp.state },
    { label: "Employee Type", value: emp.empType },
    { label: "Joining Date", value: emp.joiningDate },
    { label: "Employee ID", value: emp.id },
    { label: "Designation", value: emp.designation },
    { label: "Department", value: emp.department },
    { label: "Team", value: emp.team },
    { label: "Experience", value: emp.experience },
  ];

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-[#8F9BB3] mb-4">
        <Link to="/" className="hover:text-[#4361EE] transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/attendance" className="hover:text-[#4361EE] transition-colors">
          Attendance List
        </Link>
        <span>/</span>
        <span className="text-[#1B2559] font-medium">Profile Details</span>
      </div>

      <div className="flex gap-4">
        {/* LEFT: Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-5 flex flex-col" style={{ width: "320px", minWidth: "280px" }}>
          {/* Top section */}
          <div className="flex gap-4 mb-4 pb-4 border-b border-[#EEF0F6]">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-[#1B2559] mb-0.5">{emp.name}</h2>
              <p className="text-[11px] text-[#8F9BB3] mb-2">
                {emp.title} | {emp.type}
              </p>
              <p className="text-[11px] text-[#8F9BB3] leading-relaxed mb-3">
                {emp.bio}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <button className="w-6 h-6 rounded-lg border border-[#EEF0F6] flex items-center justify-center hover:bg-[#EEF2FF] transition-colors">
                  <Heart size={11} className="text-[#8F9BB3]" />
                </button>
                <button className="w-6 h-6 rounded-lg border border-[#EEF0F6] flex items-center justify-center hover:bg-[#EEF2FF] transition-colors">
                  <Mail size={11} className="text-[#8F9BB3]" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-semibold text-[#1B2559] leading-tight">
                    {emp.projectsCompleted}
                  </p>
                  <p className="text-[10px] text-[#8F9BB3]">Project Completed</p>
                </div>
                <div className="h-8 w-px bg-[#EEF0F6]" />
                <div>
                  <p className="text-lg font-semibold text-[#1B2559] leading-tight">
                    {String(emp.ongoingProjects).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-[#8F9BB3]">Ongoing</p>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <img
                src={emp.avatar}
                alt={emp.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-2.5 flex-1">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-[11px] text-[#8F9BB3] w-28 shrink-0">{f.label}</span>
                <span className="text-[11px] text-[#1B2559] font-medium">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Edit button */}
          <button className="mt-4 flex items-center gap-2 self-end text-xs text-[#4361EE] font-medium border border-[#4361EE] rounded-lg px-3 py-1.5 hover:bg-[#EEF2FF] transition-colors">
            <Edit2 size={11} />
            Edit Profile
          </button>
        </div>

        {/* CENTER: Attendance + Calendar */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Attendance Donut */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#1B2559]">% Of Attendance</h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-[#8F9BB3] border border-[#EEF0F6] rounded-lg px-2 py-1">
                  Month <ChevronDown size={11} />
                </button>
                <button className="flex items-center gap-1 text-xs text-[#8F9BB3] border border-[#EEF0F6] rounded-lg px-2 py-1">
                  2020 <ChevronDown size={11} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={52}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, ""]}
                      contentStyle={{
                        fontSize: "11px",
                        border: "1px solid #EEF0F6",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#4361EE]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1B2559]">{emp.attendance}%</p>
                    <p className="text-[11px] text-[#8F9BB3]">Present</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#EEF2FF]" style={{ border: "1px solid #4361EE" }} />
                  <div>
                    <p className="text-sm font-semibold text-[#1B2559]">{100 - emp.attendance}%</p>
                    <p className="text-[11px] text-[#8F9BB3]">Absent</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 text-[11px] text-[#4361EE] font-medium mt-2">
                  <Download size={12} />
                  Download Data
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1B2559]">
                Attendance Calendar - Mar, 2020
              </h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-[#8F9BB3] border border-[#EEF0F6] rounded-lg px-2 py-1">
                  Mar <ChevronDown size={11} />
                </button>
                <button className="flex items-center gap-1 text-xs text-[#8F9BB3] border border-[#EEF0F6] rounded-lg px-2 py-1">
                  2020 <ChevronDown size={11} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="w-full">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold text-[#8F9BB3] py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Weeks */}
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-t border-[#EEF0F6]">
                  {week.map((cell, ci) => (
                    <div
                      key={ci}
                      className={`relative min-h-[44px] px-1 pt-1 pb-1 border-l first:border-l-0 border-[#EEF0F6] ${
                        cell.day === 10 ? "bg-[#EEF2FF]" : ""
                      }`}
                    >
                      {cell.day !== null && (
                        <>
                          <span
                            className={`text-[10px] font-semibold block mb-0.5 ${
                              cell.day === 10
                                ? "text-[#4361EE]"
                                : "text-[#8F9BB3]"
                            }`}
                          >
                            {cell.day}
                          </span>
                          {cell.hours && (
                            <div
                              className={`text-[9px] font-medium px-1 py-0.5 rounded text-center ${
                                cell.hours === "CL"
                                  ? "bg-red-50 text-red-400"
                                  : cell.day === 10
                                  ? "bg-[#4361EE] text-white"
                                  : "bg-[#F4F6FA] text-[#8F9BB3]"
                              }`}
                            >
                              {cell.hours}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Team Members */}
        <div className="bg-white rounded-xl shadow-sm border border-[#EEF0F6] p-4" style={{ width: "220px", minWidth: "200px" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1B2559]">Team Members</h3>
            <span className="text-[11px] text-[#8F9BB3] bg-[#F4F6FA] rounded-lg px-2 py-0.5">
              16
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1B2559] leading-tight truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-[#8F9BB3] leading-tight">
                      {member.role}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1B2559] shrink-0">
                    {member.attendance}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#EEF2FF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4361EE] rounded-full"
                    style={{ width: `${member.attendance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
