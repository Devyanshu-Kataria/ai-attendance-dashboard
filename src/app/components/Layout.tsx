import { Outlet, NavLink, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserCircle, CalendarDays, LogOut, Moon, Sun, Calendar, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../App';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Attendance', path: '/attendance' },
  { icon: CalendarDays, label: 'Employees', path: '/profile/D00433' },
  { icon: CalendarClock, label: 'Leave Balances', path: '/leaves' },
];

export function Layout() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const userEmail = session?.user?.email ?? 'Admin';
  const displayName = userEmail.split('@')[0];
  // Build initials avatar from email
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F0F2F8] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[64px] bg-white flex flex-col items-center py-4 border-r border-[#EEF0F6] shrink-0 z-10">
        <div className="h-9 mb-8" /> {/* Spacer to maintain position */}

        <nav className="flex flex-col items-center gap-4 flex-1">
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

          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full bg-[#F4F6FA] flex items-center justify-center transition-colors hover:bg-[#EEF2FF] dark:bg-[#1E293B] dark:hover:bg-[#334155]"
            >
              {isDark ? <Sun size={15} className="text-[#4361EE] dark:text-[#E2E8F0]" /> : <Moon size={15} className="text-[#4361EE]" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" title={userEmail}>
              {/* Initials avatar */}
              <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[#4361EE]">{initials}</span>
              </div>
              <span className="text-xs font-semibold text-[#1B2559] max-w-[120px] truncate">{displayName}</span>
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
