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
  EyeOff
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md card p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <FileText size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            QuikLedgr
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise Invoicing & Secure Ledger System
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="material-filter-chips justify-center">
          <button 
            type="button"
            className={`material-chip-btn flex-1 justify-center ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMessage(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`material-chip-btn flex-1 justify-center ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Google Authentication */}
        <div className="flex justify-center">
          {googleConfig.googleAuthEnabled ? (
            <div ref={googleButtonRef} className="w-full flex justify-center" />
          ) : (
            <button 
              type="button" 
              className="btn btn-secondary w-full flex items-center justify-center gap-2 h-10"
              onClick={handleGoogleSimulated}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
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
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">
            or continue with email
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="form-group mb-0">
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    className="form-input pl-9" 
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Registered Business Name</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    className="form-input pl-9" 
                    placeholder="e.g. Jenkins Advisory LLC"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group mb-0">
            <label className="form-label">Email Address *</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                className="form-input pl-9" 
                placeholder="consultant@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Password *</label>
              {mode === 'signup' && (
                <span className="text-xs text-slate-400">Min. 6 chars</span>
              )}
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input pl-9 pr-9" 
                placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button 
                type="button" 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full mt-2"
            disabled={isLoading}
          >
            <span>
              {isLoading 
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-400 text-center">
          <ShieldCheck size={14} className="text-slate-500" />
          <span>Protected with AES client-side encryption</span>
        </div>
      </div>
    </div>
  );
}
