import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { loginWithEmail, signupWithEmail, loginWithGoogle, DEMO_USER } from '../utils/auth';

export function AuthScreen({ onLoginSuccess, onTriggerToast }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      let user;
      if (mode === 'login') {
        user = await loginWithEmail(email, password);
        onTriggerToast(`Welcome back, ${user.name}!`);
      } else {
        user = await signupWithEmail(name, email, password, businessName);
        onTriggerToast(`Account created! Welcome, ${user.name}!`);
      }
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle();
      onTriggerToast(`Signed in with Google as ${user.name}`);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage('Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithEmail(DEMO_USER.email, 'demoPassword123');
      onTriggerToast(`Signed in as demo consultant: ${user.name}`);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage('Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <FileText size={28} strokeWidth={2.5} color="white" />
          </div>
          <h1 className="auth-title">QuikLedgr</h1>
          <p className="auth-subtitle">
            Enterprise Invoicing & Secure Wire Payment Gateway
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMessage(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button 
          type="button" 
          className="google-auth-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit}>
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">YOUR FULL NAME</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Alexander Wright"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">BUSINESS NAME (OPTIONAL)</label>
                <div className="input-with-icon">
                  <Building size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Wright Advisory LLC"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">EMAIL ADDRESS</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Consultant Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* 1-Click Demo Login Pill */}
        <div className="auth-demo-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
              <Sparkles size={16} color="#059669" />
              <span>Instant Demo Access</span>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              1-Click Sign In
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Test the complete system pre-loaded with consultant profile and Blukers invoices.
          </div>
        </div>

        {/* Compliance Security Badge */}
        <div className="auth-footer-badge">
          <ShieldCheck size={14} color="#059669" />
          <span>Compliant with Blukers Consulting Agreement security guidelines</span>
        </div>
      </div>
    </div>
  );
}
