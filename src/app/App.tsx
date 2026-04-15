import { useState, useEffect, createContext, useContext } from 'react';
import { RouterProvider } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase, type UserRole } from '../lib/supabase';
import { router } from './routes';
import { LoginPage } from './pages/Login';
import { EmployeeDashboard } from './pages/EmployeeDashboard';

// Auth context so child components (Layout, etc.) can access session
interface AuthContextValue {
  session: Session | null;
  userRole: UserRole | null;
  userEmployeeId: string | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  userRole: null,
  userEmployeeId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmployeeId, setUserEmployeeId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        setUserEmployeeId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [session]);

  const fetchUserRole = async () => {
    setRoleLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, employee_id')
      .eq('email', session!.user.email)
      .single();

    if (error) {
      console.error('Role fetch error:', error);
      setUserRole('employee');
    } else {
      setUserRole(data.role as UserRole);
      setUserEmployeeId(data.employee_id);
    }
    setRoleLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading || (session && roleLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F2F8]">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <p className="text-sm text-[#8F9BB3]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const ctx: AuthContextValue = { session, userRole, userEmployeeId, signOut };

  if (userRole === 'employee') {
    return (
      <AuthContext.Provider value={ctx}>
        <EmployeeDashboard />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={ctx}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  );
}
