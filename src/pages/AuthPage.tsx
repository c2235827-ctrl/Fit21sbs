import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'forgot';

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa',
  'Uganda', 'Tanzania', 'Ethiopia', 'Egypt',
  'United Kingdom', 'United States', 'Canada',
  'Germany', 'France', 'India', 'Other'
];

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi',
  'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState('');

  const showError = (err: any) => {
    if (!err) return;
    if (typeof err === 'string') {
      setError(err);
    } else if (err?.message) {
      setError(err.message);
    } else if (err?.error_description) {
      setError(err.error_description);
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCountry, setSignupCountry] = useState('Nigeria');
  const [signupState, setSignupState] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);

  // Forgot password field
  const [forgotEmail, setForgotEmail] = useState('');

  // ── LOGIN ──
  const handleLogin = async () => {
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    });
    setLoading(false);
    if (err) {
      if (err.message?.includes('Invalid login')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        showError(err);
      }
      return;
    }
    navigate('/home', { replace: true });
  };

  // ── SIGNUP ──
  const handleSignup = async () => {
    setError('');

    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!signupPhone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!signupCountry) {
      setError('Please select your country.');
      return;
    }
    if (!signupState.trim()) {
      setError('Please enter your state or city.');
      return;
    }
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      options: {
        data: {
          name: signupName.trim(),
          phone: signupPhone.trim(),
          country: signupCountry,
          state: signupState.trim(),
        },
      },
    });
    setLoading(false);

    if (err) {
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Please log in.');
      } else {
        showError(err);
      }
      return;
    }

    // Email confirmation is ON — don't auto-login
    // Just show success message and go to login tab
    setError('');
    setSuccess(
      '✅ Account created! Check your email inbox to confirm your account, then log in.'
    );
    setMode('login');
  };

  // ── FORGOT PASSWORD ──
  const handleForgot = async () => {
    setError('');
    if (!forgotEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim().toLowerCase(),
      { redirectTo: 'https://fit21.sbs/reset-password' }
    );
    setLoading(false);
    if (err) {
      showError(err);
      return;
    }
    setSuccess('Password reset link sent! Check your email.');
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', colorClass: '', textClass: '' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

    let label = 'Weak';
    let colorClass = 'bg-red-500';
    let textClass = 'text-red-400';

    if (score === 4) {
      label = 'Strong';
      colorClass = 'bg-[#00E87A]';
      textClass = 'text-[#00E87A]';
    } else if (score >= 2) {
      label = 'Good';
      colorClass = 'bg-yellow-500';
      textClass = 'text-yellow-500';
    }

    return { score, label, colorClass, textClass };
  };

  const pwStrength = getPasswordStrength(signupPassword);

  const eyeIcon = (show: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2">
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  );

  return (
    <div style={{
      minHeight: '100svh',
      background: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 20px 40px',
      overflowY: 'auto',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/12563/12563330.png"
          alt="Fit21"
          width={60}
          height={60}
          style={{ marginBottom: '12px', borderRadius: '16px' }}
        />
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '28px',
          color: '#FFFFFF',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Fit21
        </h1>
        <p style={{
          color: '#444',
          fontSize: '14px',
          margin: '4px 0 0',
        }}>
          Feel 21 Again.
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#141414',
        border: '1px solid #222',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>

        {/* Tab switcher */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex',
            background: '#1A1A1A',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px',
          }}>
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'login' ? '#00E87A' : 'transparent',
                color: mode === 'login' ? '#000' : '#555',
              }}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'signup' ? '#00E87A' : 'transparent',
                color: mode === 'signup' ? '#000' : '#555',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Forgot password back button */}
        {mode === 'forgot' && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#555',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                padding: 0,
              }}
            >
              ← Back to login
            </button>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '20px',
              color: '#fff',
              margin: '0 0 4px',
            }}>
              Reset Password
            </h2>
            <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
              We'll send a reset link to your email.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(255,68,68,0.08)',
            border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <p style={{
              color: '#FF6B6B',
              fontSize: '13px',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {typeof error === 'string'
                ? error
                : (error as any)?.message || 'Something went wrong. Try again.'}
            </p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div style={{
            background: 'rgba(0,232,122,0.08)',
            border: '1px solid rgba(0,232,122,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <p style={{ color: '#00E87A', fontSize: '13px', margin: 0 }}>
              {success}
            </p>
          </div>
        )}

        {/* Input helper */}
        {(() => {
          const Field = ({
            label, children
          }: { label: string, children: React.ReactNode }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                color: '#666',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}>
                {label}
              </label>
              {children}
            </div>
          );

          const inputStyle: React.CSSProperties = {
            width: '100%',
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '13px 16px',
            color: '#fff',
            fontSize: '15px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          };

          const selectStyle: React.CSSProperties = {
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            paddingRight: '40px',
          };

          const btnStyle: React.CSSProperties = {
            width: '100%',
            background: '#00E87A',
            color: '#000',
            border: 'none',
            borderRadius: '9999px',
            padding: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'opacity 0.2s',
          };

          // ── LOGIN ──
          if (mode === 'login') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Email">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={inputStyle}
                  autoComplete="email"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    autoComplete="current-password"
                    onFocus={e => e.target.style.borderColor = '#00E87A'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw(!showLoginPw)}
                    style={{
                      position: 'absolute', right: '14px',
                      top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: '#555', cursor: 'pointer', padding: 0,
                    }}
                  >
                    {eyeIcon(showLoginPw)}
                  </button>
                </div>
              </Field>

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <button
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: '#555', fontSize: '13px',
                  cursor: 'pointer', textAlign: 'center',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Forgot password?
              </button>
            </div>
          );

          // ── SIGNUP ──
          if (mode === 'signup') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Full Name">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  style={inputStyle}
                  autoComplete="name"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </Field>

              <Field label="Email Address">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={signupPhone}
                  onChange={e => setSignupPhone(e.target.value)}
                  style={inputStyle}
                  autoComplete="tel"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </Field>

              <Field label="Country">
                <select
                  value={signupCountry}
                  onChange={e => { setSignupCountry(e.target.value); setSignupState(''); }}
                  style={selectStyle}
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}
                      style={{ background: '#1A1A1A', color: '#fff' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={signupCountry === 'Nigeria' ? 'State' : 'State / City'}>
                {signupCountry === 'Nigeria' ? (
                  <select
                    value={signupState}
                    onChange={e => setSignupState(e.target.value)}
                    style={selectStyle}
                  >
                    <option value=""
                      style={{ background: '#1A1A1A', color: '#555' }}>
                      Select state
                    </option>
                    {NIGERIA_STATES.map(s => (
                      <option key={s} value={s}
                        style={{ background: '#1A1A1A', color: '#fff' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Your state or city"
                    value={signupState}
                    onChange={e => setSignupState(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00E87A'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                )}
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSignupPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    autoComplete="new-password"
                    onFocus={e => e.target.style.borderColor = '#00E87A'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPw(!showSignupPw)}
                    style={{
                      position: 'absolute', right: '14px',
                      top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: '#555', cursor: 'pointer', padding: 0,
                    }}
                  >
                    {eyeIcon(showSignupPw)}
                  </button>
                </div>
                {signupPassword && (
                  <div>
                    <div style={{
                      display: 'flex', gap: '4px', marginTop: '8px'
                    }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '9999px',
                          background: pwStrength.score >= i
                            ? (pwStrength.score <= 1 ? '#FF4444'
                              : pwStrength.score <= 2 ? '#FFA500'
                              : '#00E87A')
                            : '#2A2A2A',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <p style={{
                      fontSize: '11px', marginTop: '4px',
                      color: pwStrength.score <= 1 ? '#FF4444'
                        : pwStrength.score <= 2 ? '#FFA500'
                        : '#00E87A',
                    }}>
                      {pwStrength.label}
                    </p>
                  </div>
                )}
              </Field>

              <Field label="Confirm Password">
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={signupConfirm}
                  onChange={e => setSignupConfirm(e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: signupConfirm
                      ? signupPassword !== signupConfirm
                        ? 'rgba(255,68,68,0.5)'
                        : 'rgba(0,232,122,0.5)'
                      : '#2A2A2A',
                  }}
                  autoComplete="new-password"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => {
                    e.target.style.borderColor = signupConfirm
                      ? signupPassword !== signupConfirm
                        ? 'rgba(255,68,68,0.5)'
                        : 'rgba(0,232,122,0.5)'
                      : '#2A2A2A';
                  }}
                />
                {signupConfirm && signupPassword !== signupConfirm && (
                  <p style={{
                    color: '#FF6B6B', fontSize: '12px', margin: '2px 0 0'
                  }}>
                    Passwords don't match
                  </p>
                )}
              </Field>

              <button
                onClick={handleSignup}
                disabled={loading || signupPassword.length < 8
                  || signupPassword !== signupConfirm}
                style={{
                  ...btnStyle,
                  opacity: (loading || signupPassword.length < 8
                    || signupPassword !== signupConfirm) ? 0.5 : 1,
                }}
              >
                {loading ? 'Creating account...' : 'Create My Account 🔥'}
              </button>

              <p style={{
                color: '#333', fontSize: '12px',
                textAlign: 'center', lineHeight: 1.6, margin: 0,
              }}>
                By creating an account you agree to Fit21's terms.
              </p>
            </div>
          );

          // ── FORGOT PASSWORD ──
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Email Address">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleForgot()}
                  style={inputStyle}
                  autoComplete="email"
                  onFocus={e => e.target.style.borderColor = '#00E87A'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </Field>
              <button
                onClick={handleForgot}
                disabled={loading}
                style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
