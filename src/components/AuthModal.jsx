import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Flame, 
  Check, 
  AlertCircle, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink
} from 'lucide-react';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { firebaseFirestoreService } from '../services/firebaseFirestoreService';
import { isFirebaseConfigured } from '../services/firebase';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onOpenSettings,
  onSyncCompleted
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const configured = isFirebaseConfigured();

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await firebaseAuthService.signInWithGoogle();
      setSuccessMsg('Successfully signed in with Google!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await firebaseAuthService.signInAsGuest();
      setSuccessMsg('Signed in as Guest!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Guest sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await firebaseAuthService.sendPasswordReset(email);
        setSuccessMsg('Password reset link sent! Check your inbox.');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await firebaseAuthService.signUpWithEmail(email, password, displayName);
        setSuccessMsg('Account created successfully! Welcome to Pulse AI.');
      } else {
        await firebaseAuthService.signInWithEmail(email, password);
        setSuccessMsg('Welcome back!');
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await firebaseAuthService.logOut();
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Sign-out failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    setSyncing(true);
    setErrorMsg('');
    try {
      const res = await firebaseFirestoreService.uploadAllLocalConversations(currentUser.uid);
      setSuccessMsg(`Successfully synced ${res.uploadedCount} conversation(s) to Cloud Firestore!`);
      if (onSyncCompleted) onSyncCompleted();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync conversations.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(14, 17, 27, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.9), 0 0 45px -10px rgba(255, 122, 0, 0.2)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.2), rgba(255, 68, 0, 0.35))',
                border: '1px solid rgba(255, 122, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flame size={20} style={{ color: '#FF7A00' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
                {currentUser ? 'Firebase Account' : 'Pulse Cloud Sync'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                {currentUser ? 'Real-time multi-device cloud synchronizer' : 'Secure authentication powered by Google Firebase'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Configuration Notice if Firebase credentials missing */}
        {!configured && (
          <div 
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 122, 0, 0.08)',
              border: '1px solid rgba(255, 122, 0, 0.25)',
              marginBottom: '18px',
              fontSize: '12px',
              color: '#FFB266',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle size={16} style={{ color: '#FF7A00', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600 }}>Firebase credentials needed for live cloud sync.</span>
              <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '11px', lineHeight: 1.4 }}>
                Add your Firebase Project config in Settings to enable real-time Google Auth & Cloud Firestore.
              </p>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings('firebase');
                  }}
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#FF7A00',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Configure Firebase credentials in Settings <ExternalLink size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {errorMsg && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 68, 68, 0.12)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              color: '#FF8585',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 214, 143, 0.12)',
              border: '1px solid rgba(0, 214, 143, 0.3)',
              color: '#00D68F',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <Check size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: USER IS SIGNED IN */}
        {currentUser ? (
          <div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '18px'
              }}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: '2px solid #FF7A00',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--spectral-conic)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: '#0D101A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF'
                    }}
                  >
                    {(currentUser.displayName || currentUser.email || 'P')[0].toUpperCase()}
                  </div>
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {currentUser.displayName || (currentUser.isAnonymous ? 'Guest Researcher' : 'Pulse Explorer')}
                  </h3>
                  <span 
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: currentUser.isAnonymous ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 214, 143, 0.15)',
                      color: currentUser.isAnonymous ? 'var(--text-muted)' : '#00D68F',
                      fontWeight: 600
                    }}
                  >
                    {currentUser.isAnonymous ? 'Guest' : currentUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentUser.email || (currentUser.isAnonymous ? 'Local sandbox account' : 'Authenticated')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D68F', boxShadow: '0 0 6px #00D68F' }} />
                  <span style={{ fontSize: '11px', color: '#00D68F', fontWeight: 500 }}>
                    Cloud Firestore Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'rgba(255, 122, 0, 0.12)',
                  border: '1px solid rgba(255, 122, 0, 0.35)',
                  color: '#FF7A00',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: syncing ? 'wait' : 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing conversations...' : 'Sync Local Conversations to Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FF4D4D';
                  e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: AUTH FORMS (SIGN IN / SIGN UP) */
          <div>
            {/* Mode Tabs */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '18px'
              }}
            >
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'signin' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: mode === 'signin' ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.16s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'signup' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: mode === 'signup' ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.16s ease'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Google One-Click Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '11px 16px',
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#1F1F1F',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                border: 'none',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                marginBottom: '14px',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              {/* Google G SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mode === 'signup' && (
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {mode !== 'forgot' && (
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (minimum 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '11px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              )}

              {/* Forgot password toggle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {mode === 'signin' ? (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                ) : mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#FF7A00', fontSize: '11.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Back to Sign In
                  </button>
                ) : null}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF7A00, #FF5500)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 16px rgba(255, 122, 0, 0.35)',
                  marginTop: '4px',
                  transition: 'all 0.18s ease'
                }}
              >
                {loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
              </button>
            </form>

            {/* Guest Sandbox Option */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.16s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ShieldCheck size={13} />
                <span>Continue as Guest / Anonymous Sandbox</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
