import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, UserCircle, CalendarDays, LayoutGrid, LogOut, Bell, ChevronDown, Calendar,
} from 'lucide-react';
import { useAuth } from '../App';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Attendance', path: '/attendance' },
  { icon: UserCircle, label: 'Employees', path: '/profile/D00433' },
  { icon: CalendarDays, label: 'Calendar', path: '#' },
  { icon: LayoutGrid, label: 'Reports', path: '#' },
];

export function Layout() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const userEmail = session?.user?.email ?? 'Admin';
  const displayName = userEmail.split('@')[0];
  // Build initials avatar from email
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F0F2F8] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[64px] bg-white flex flex-col items-center py-4 border-r border-[#EEF0F6] shrink-0 z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-8 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)' }}
          onClick={() => navigate('/')}
        >
          <LayoutGrid size={16} className="text-white" />
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4361EE]'
                    : 'text-[#8F9BB3] hover:bg-gray-50 hover:text-[#4361EE]'
                }`
              }
              title={item.label}
            >
              <item.icon size={18} />
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 mt-auto">
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8F9BB3] hover:text-red-500 hover:bg-red-50 transition-all"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-[56px] bg-white border-b border-[#EEF0F6] flex items-center px-5 gap-6 shrink-0">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#8F9BB3] leading-none">Attendance</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-semibold text-[#1B2559]">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Calendar size={11} className="text-[#8F9BB3]" />
              </div>
            </div>

            <div className="h-8 w-px bg-[#EEF0F6]" />

            <div className="flex flex-col">
              <span className="text-[10px] text-[#8F9BB3] leading-none">First Shift</span>
              <button className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-semibold text-[#1B2559]">9:00 AM to 5:00 PM</span>
                <ChevronDown size={11} className="text-[#8F9BB3]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-[#F4F6FA] flex items-center justify-center relative">
              <Bell size={15} className="text-[#4361EE]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" title={userEmail}>
              {/* Initials avatar */}
              <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[#4361EE]">{initials}</span>
              </div>
              <span className="text-xs font-semibold text-[#1B2559] max-w-[120px] truncate">{displayName}</span>
              <ChevronDown size={13} className="text-[#8F9BB3]" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
