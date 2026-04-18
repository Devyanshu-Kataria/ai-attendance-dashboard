import { useState, useEffect } from 'react';
import { Lock, User, Mail, LayoutGrid, ShieldCheck, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail]       = useState('');
  const [empId, setEmpId]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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

  /** Surface errors as returned by Supabase directly */
  const friendlyError = (msg: string): string => {
    return msg; 
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = empId.trim().toUpperCase();

    try {
      if (isSignUp) {
        // ── 1. Save their Employee ID to their account ──
        // (RLS permitting, we can try this. If RLS blocks, we do it after but we must reload)
        const { error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (signUpError) throw signUpError;

        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            { email: cleanEmail, role: 'employee', employee_id: cleanEmpId }
          );

        if (upsertError) throw upsertError;

        // Force a clean reload so the dashboard fetches the newly created user_role
        window.location.href = '/';
        return;

      } else {
        // ── Sign In: just email + password ──
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = friendlyError(err.message ?? 'Something went wrong.');
      if (msg) setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { access_type: 'offline', prompt: 'consent' } },
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = friendlyError(err.message ?? 'Google sign-in failed.');
      if (msg) setErrorMsg(msg);
    }
  };

  const inputClass = "w-full pl-9 pr-3 py-2.5 text-sm text-[#1B2559] dark:text-white bg-[#F4F6FA] dark:bg-[#0B1437] border border-[#EEF0F6] dark:border-white/10 rounded-lg outline-none focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE] placeholder:text-[#8F9BB3] dark:placeholder:text-[#A3AED0] transition-colors";
  const labelClass = "block text-xs font-semibold text-[#1B2559] dark:text-white uppercase tracking-wider mb-1.5";
  const iconClass  = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none";

  return (
    <div className="min-h-screen bg-[#F0F2F8] dark:bg-[#0B1437] flex items-center justify-center p-4 transition-colors duration-200 relative">
      
      {/* Dark Mode Toggle (Top Right) */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-[#111C44] shadow-sm border border-[#EEF0F6] dark:border-white/10 flex items-center justify-center transition-all hover:bg-[#F4F6FA] dark:hover:bg-[#1E293B]"
      >
        {isDark ? <Sun size={16} className="text-[#A3AED0] hover:text-white" /> : <Moon size={16} className="text-[#1B2559] hover:text-[#4361EE]" />}
      </button>

      <div className="w-full max-w-md">

        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)' }}
          >
            <LayoutGrid size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2559] dark:text-white">Punctual.ai</h1>
          <p className="text-sm text-[#8F9BB3] dark:text-[#A3AED0] mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to your dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#111C44] rounded-2xl shadow-sm border border-[#EEF0F6] dark:border-white/10 p-8 transition-colors duration-200">
          <form onSubmit={handleAuth} className="space-y-5">

            {/* Email — always shown */}
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <div className={iconClass}><Mail size={15} className="text-[#8F9BB3] dark:text-[#A3AED0]" /></div>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Employee ID — sign-up only */}
            {isSignUp && (
              <div>
                <label className={labelClass}>Employee ID</label>
                <div className="relative">
                  <div className={iconClass}><User size={15} className="text-[#8F9BB3] dark:text-[#A3AED0]" /></div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GD0001"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#8F9BB3] dark:text-[#A3AED0]">
                  Enter the Employee ID provided by HR
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <div className={iconClass}><Lock size={15} className="text-[#8F9BB3] dark:text-[#A3AED0]" /></div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: loading ? '#8F9BB3' : 'linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)' }}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#EEF0F6] dark:bg-white/10" />
            <span className="text-[11px] text-[#8F9BB3] dark:text-[#A3AED0]">or</span>
            <div className="flex-1 h-px bg-[#EEF0F6] dark:bg-white/10" />
          </div>

          {/* Admin Login via Google */}
          <div>
            <button
              onClick={handleAdminLogin}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1B2559 0%, #3A0CA3 100%)' }}
            >
              <ShieldCheck size={16} className="text-white/90" />
              Admin Login
            </button>
            <p className="mt-2 text-center text-[11px] text-[#8F9BB3] dark:text-[#A3AED0]">
              🔒 For administrators only — sign in with your Google Workspace account
            </p>
          </div>

          {/* Toggle sign up / sign in */}
          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setEmpId(''); }}
              className="text-xs font-medium text-[#4361EE] dark:text-[#4361EE] hover:text-[#3A0CA3] dark:hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
