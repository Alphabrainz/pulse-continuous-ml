import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Flame, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Brain
} from 'lucide-react';
import PulseLogo from './PulseLogo';
import { firebaseAuthService } from '../services/firebaseAuthService';

export default function PortalGatekeeper({ onAuthenticated }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email and a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const user = await firebaseAuthService.signUpWithEmail(email, password, name);
      setSuccessMsg(`Welcome, ${user.displayName || 'Explorer'}! Unlocking Pulse Portal...`);
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated(user);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await firebaseAuthService.signInWithEmail(email, password);
      setSuccessMsg(`Welcome back, ${user.displayName || 'Explorer'}! Entering portal...`);
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated(user);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Sign in failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await firebaseAuthService.signInWithGoogle();
      setSuccessMsg('Authenticated with Google! Unlocking portal...');
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated(user);
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemoSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await firebaseAuthService.signInAsGuest();
      setSuccessMsg('Instant Demo Account Activated! Entering portal...');
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated(user);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Demo access failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email to receive a password reset link.');
      return;
    }
    setLoading(true);
    try {
      await firebaseAuthService.sendPasswordReset(email);
      setSuccessMsg('Password reset instructions sent! Check your inbox.');
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      zIndex: 20,
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(12, 15, 26, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(139, 43, 226, 0.35)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        position: 'relative'
      }}>
        {/* Top Glow & Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'inline-block', marginBottom: '8px', cursor: 'default' }}>
            <PulseLogo size="large" animated={true} showText={true} badge="2.5" />
          </div>
          
          <h1 style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.3px',
            margin: '6px 0 4px'
          }}>
            {mode === 'signup' ? 'Create Your Pulse Account' : mode === 'signin' ? 'Welcome Back to Pulse AI' : 'Reset Your Password'}
          </h1>

          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.4
          }}>
            {mode === 'signup' 
              ? 'Sign up with Firebase to enter the Pulse portal.' 
              : mode === 'signin' 
              ? 'Sign in to access your models, chats, and speech synthesis.' 
              : 'Enter your registered email to reset access.'}
          </p>

          {/* Inbuilt Firebase Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(255, 122, 0, 0.12)',
            border: '1px solid rgba(255, 122, 0, 0.35)',
            marginTop: '10px'
          }}>
            <Flame size={13} style={{ color: '#FF7A00' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF9E42', letterSpacing: '0.2px' }}>
              ⚡ Inbuilt Firebase API Engine • 0 Setup Required
            </span>
          </div>
        </div>

        {/* Tab Switcher: Sign Up vs Sign In */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              background: mode === 'signup' ? 'rgba(139, 43, 226, 0.35)' : 'transparent',
              color: mode === 'signup' ? '#FFFFFF' : 'var(--text-muted)',
              border: mode === 'signup' ? '1px solid rgba(139, 43, 226, 0.5)' : 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            Sign Up (New Account)
          </button>

          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              background: mode === 'signin' ? 'rgba(0, 112, 243, 0.35)' : 'transparent',
              color: mode === 'signin' ? '#FFFFFF' : 'var(--text-muted)',
              border: mode === 'signin' ? '1px solid rgba(0, 112, 243, 0.5)' : 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            Sign In (Existing User)
          </button>
        </div>

        {/* Alert Feedback Messages */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FF6B6B',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(0, 214, 143, 0.15)',
            border: '1px solid rgba(0, 214, 143, 0.35)',
            color: '#00D68F',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            <Check size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Form */}
        <form onSubmit={mode === 'signup' ? handleSignUp : mode === 'signin' ? handleSignIn : handleForgotPassword}>
          {/* Display Name (in Sign Up mode only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                Full Name / Display Nickname
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anirudh"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password Field (for Sign In & Sign Up) */}
          {mode !== 'forgot' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ fontSize: '11px', color: '#0070F3', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (in Sign Up mode only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '11px',
              background: mode === 'signup'
                ? 'linear-gradient(135deg, #8B2BE2 0%, #4F2BED 50%, #0070F3 100%)'
                : 'linear-gradient(135deg, #0070F3 0%, #00D68F 100%)',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(139, 43, 226, 0.35)',
              transition: 'all 0.18s ease'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="pulse-wave-anim" />
                <span>Authenticating with Firebase...</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Sign Up &amp; Enter Pulse Portal</span>
                <ArrowRight size={15} />
              </>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In &amp; Enter Pulse Portal</span>
                <ArrowRight size={15} />
              </>
            ) : (
              <span>Send Password Reset Email</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0 16px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          <span>Or Quick Access</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Quick Instant Sign-In Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.18s ease'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 1-Click Demo / Guest Entry */}
          <button
            type="button"
            onClick={handleGuestDemoSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 214, 143, 0.08)',
              border: '1px solid rgba(0, 214, 143, 0.28)',
              color: '#00D68F',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.18s ease'
            }}
          >
            <Zap size={14} style={{ color: '#00D68F' }} />
            <span>⚡ Instant Demo Entry (1-Click Test)</span>
          </button>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={12} style={{ color: '#FF7A00' }} />
            <span>Firebase Cloud Sync</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Brain size={12} style={{ color: '#A78BFA' }} />
            <span>Edge NLP &amp; Sentiment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={12} style={{ color: '#0070F3' }} />
            <span>Groq LPU™ 450 t/s</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} style={{ color: '#4285F4' }} />
            <span>Google Gemini 3.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
