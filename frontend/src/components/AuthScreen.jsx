import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ArrowRight, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Scale,
  CreditCard,
  Repeat
} from 'lucide-react';
import { 
  loginWithEmail, 
  signupWithEmail, 
  loginWithGoogle, 
  getGoogleAuthConfig 
} from '../utils/auth';

export function AuthScreen({ onLoginSuccess, onTriggerToast }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [googleConfig, setGoogleConfig] = useState({ googleClientId: '', googleAuthEnabled: false });

  const googleButtonRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      const config = await getGoogleAuthConfig();
      if (active) {
        setGoogleConfig(config);
      }
    }
    loadConfig();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!googleConfig.googleClientId) return;

    let timeoutId;
    const initGoogleGIS = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleConfig.googleClientId,
            callback: async (response) => {
              if (!response?.credential) return;
              setIsLoading(true);
              setErrorMessage('');
              try {
                const user = await loginWithGoogle(response.credential);
                onTriggerToast(`Signed in with Google as ${user.name}`);
                onLoginSuccess(user);
              } catch (err) {
                setErrorMessage(err.message || 'Google sign-in failed.');
              } finally {
                setIsLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleButtonRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        } catch (err) {
          console.warn('[GIS] Error rendering Google button:', err);
        }
      } else {
        timeoutId = setTimeout(initGoogleGIS, 300);
      }
    };

    initGoogleGIS();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [googleConfig.googleClientId]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let user;
      if (mode === 'login') {
        user = await loginWithEmail(email, password);
        onTriggerToast(`Welcome back, ${user.name}!`);
      } else {
        user = await signupWithEmail(name, email, password, businessName);
        onTriggerToast(`Account created successfully! Welcome, ${user.name}!`);
      }
      onLoginSuccess(user);
    } catch (err) {
      console.error('[Auth Error]', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSimulated = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle();
      onTriggerToast(`Signed in with Google as ${user.name}`);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F1F5F9] dark:bg-[#1A222C]">
      {/* TailAdmin Auth Card Wrapper */}
      <div className="w-full max-w-5xl rounded-2xl border border-[#E2E8F0] bg-white shadow-xl dark:border-[#2E3A47] dark:bg-[#24303F] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANEL: TailAdmin Dark Navy Brand & Features Showcase */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#1C2434] p-8 xl:p-10 text-white relative overflow-hidden">
          {/* Subtle Background Glow Elements */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#3C50E0]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3C50E0] text-white shadow-md">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white leading-none">QuikLedgr</span>
                  <span className="rounded bg-[#3C50E0] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-[#8A99AD] font-medium tracking-wide mt-1">
                  Enterprise Ledger & Billing
                </p>
              </div>
            </div>

            <div className="mt-12 space-y-3">
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                Precision Double-Entry Invoicing for High-Growth Firms
              </h2>
              <p className="text-xs text-[#8A99AD] leading-relaxed">
                Streamline client agreements, automate accounts receivable, and enforce immutable financial audit trails across your entities.
              </p>
            </div>
          </div>

          {/* Middle Feature Highlights */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#3C50E0]/20 text-[#3C50E0] shrink-0 mt-0.5">
                <Scale size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Full Double-Entry Core</p>
                <p className="text-[11px] text-[#8A99AD]">Auto-posts revenue, AR, and cash entries directly to your general ledger.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CreditCard size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Zero-Login Client Portal</p>
                <p className="text-[11px] text-[#8A99AD]">Passcode-protected interactive payment portal with instant Stripe settlements.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Repeat size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Recurring Retainers & Dunning</p>
                <p className="text-[11px] text-[#8A99AD]">Automated monthly billing schedules with smart AR aging tracking.</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-6 border-t border-[#2E3A47] flex items-center gap-2.5 text-[11px] text-[#8A99AD]">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>256-bit AES encryption & multi-tenant isolation</span>
          </div>
        </div>

        {/* RIGHT PANEL: TailAdmin Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
          {/* Mobile-only Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3C50E0] text-white shadow-sm">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">QuikLedgr</span>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' ? 'Sign In to Workspace' : 'Create New Workspace'}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
              {mode === 'login' 
                ? 'Enter your account credentials to access your financial dashboards.' 
                : 'Setup your consulting entity, LLC, or firm in seconds.'}
            </p>
          </div>

          {/* TailAdmin Mode Pill Switcher */}
          <div className="flex items-center rounded-lg bg-[#F1F5F9] p-1 dark:bg-[#1A222C] mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#24303F] dark:text-white'
                  : 'text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#24303F] dark:text-white'
                  : 'text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400">
              {errorMessage}
            </div>
          )}

          {/* Google SSO Action */}
          <div className="mb-5">
            {googleConfig.googleAuthEnabled ? (
              <div ref={googleButtonRef} className="w-full flex justify-center" />
            ) : (
              <button 
                type="button" 
                onClick={handleGoogleSimulated}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-slate-200 dark:hover:bg-[#24303F] transition-all shadow-xs"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0] dark:border-[#2E3A47]" />
            </div>
            <div className="relative bg-white dark:bg-[#24303F] px-3 text-[11px] font-medium text-[#64748B] dark:text-[#8A99AD] uppercase tracking-wider">
              Or with credentials
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" />
                    <input 
                      type="text" 
                      className="w-full rounded-lg border border-[#E2E8F0] bg-transparent py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white transition-all"
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Registered Business / LLC Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" />
                    <input 
                      type="text" 
                      className="w-full rounded-lg border border-[#E2E8F0] bg-transparent py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white transition-all"
                      placeholder="e.g. Jenkins Advisory LLC"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      autoComplete="organization"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" />
                <input 
                  type="email" 
                  className="w-full rounded-lg border border-[#E2E8F0] bg-transparent py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Password <span className="text-rose-500">*</span>
                </label>
                {mode === 'signup' ? (
                  <span className="text-[10px] text-[#64748B] dark:text-[#8A99AD]">Min. 6 characters</span>
                ) : (
                  <span className="text-[10px] text-[#3C50E0] hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full rounded-lg border border-[#E2E8F0] bg-transparent py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white transition-all"
                  placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E2E8F0] text-[#3C50E0] focus:ring-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C]"
                  />
                  <span className="text-xs text-slate-600 dark:text-[#8A99AD]">Remember this device</span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-lg bg-[#3C50E0] py-3 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#3444bf] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              <span>
                {isLoading 
                  ? (mode === 'login' ? 'Authenticating...' : 'Creating workspace...') 
                  : (mode === 'login' ? 'Sign In to Workspace' : 'Create Account & Workspace')}
              </span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Footer toggle prompt */}
          <div className="mt-6 text-center text-xs text-[#64748B] dark:text-[#8A99AD]">
            {mode === 'login' ? (
              <span>
                Don't have a workspace account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(''); }}
                  className="font-bold text-[#3C50E0] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have a workspace account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(''); }}
                  className="font-bold text-[#3C50E0] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
