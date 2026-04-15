import { useState } from 'react';
import { Mail, Lock, User, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            email,
            role: 'employee',
            employee_id: employeeId.trim().toUpperCase(),
          }]);

        if (roleError) throw roleError;
        alert('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change in App.tsx handles redirect
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { access_type: 'offline', prompt: 'consent' } },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)' }}
          >
            <LayoutGrid size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2559]">Growify Digital LLP</h1>
          <p className="text-sm text-[#8F9BB3] mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to your dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEF0F6] p-8">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#1B2559] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={15} className="text-[#8F9BB3]" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="you@growify.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-[#1B2559] bg-[#F4F6FA] border border-[#EEF0F6] rounded-lg outline-none focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE] placeholder:text-[#8F9BB3] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#1B2559] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={15} className="text-[#8F9BB3]" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-[#1B2559] bg-[#F4F6FA] border border-[#EEF0F6] rounded-lg outline-none focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE] placeholder:text-[#8F9BB3] transition-colors"
                />
              </div>
            </div>

            {/* Employee ID (sign up only) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-[#1B2559] uppercase tracking-wider mb-1.5">
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={15} className="text-[#8F9BB3]" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GD0001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm text-[#1B2559] bg-[#F4F6FA] border border-[#EEF0F6] rounded-lg outline-none focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE] placeholder:text-[#8F9BB3] transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#8F9BB3]">Enter your Employee ID exactly as given by HR</p>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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
            <div className="flex-1 h-px bg-[#EEF0F6]" />
            <span className="text-[11px] text-[#8F9BB3]">or continue with</span>
            <div className="flex-1 h-px bg-[#EEF0F6]" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-[#1B2559] bg-[#F4F6FA] border border-[#EEF0F6] hover:border-[#4361EE] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          {/* Toggle sign up / sign in */}
          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-xs font-medium text-[#4361EE] hover:text-[#3A0CA3] transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
