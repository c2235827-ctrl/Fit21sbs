import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const inputClass = `
    w-full bg-[#1A1A1A] border border-[#2A2A2A]
    focus:border-[#00E87A] outline-none
    text-white rounded-xl px-4 py-3.5
    font-inter text-base transition-colors
    placeholder:text-[#444]
  `;

  const labelClass = `
    block text-[#888] font-inter text-xs
    font-semibold uppercase tracking-wider mb-1.5
  `;

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
      if (err.message.includes('Invalid login')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(err.message);
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
      if (err.message.includes('already registered')) {
        setError('An account with this email already exists. Please log in.');
      } else {
        setError(err.message);
      }
      return;
    }

    // Auto sign in after signup (email confirmation disabled)
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
    });

    if (!loginErr) {
      navigate('/home', { replace: true });
    } else {
      // If email confirmation is required
      setSuccess(
        'Account created! Check your email to confirm, then log in.'
      );
      setMode('login');
    }
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
      setError(err.message);
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col
      items-center justify-start pt-12 pb-10 px-5 overflow-y-auto">

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://cdn-icons-png.flaticon.com/512/12563/12563330.png"
          alt="Fit21"
          width={56}
          height={56}
          className="mb-3"
        />
        <h1 className="font-syne font-extrabold text-2xl text-white
          tracking-tight">
          Fit21
        </h1>
        <p className="text-[#555] font-inter text-sm mt-1">
          Feel 21 Again.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#111] border border-[#1E1E1E]
        rounded-3xl p-6">

        {/* Mode tabs — only for login/signup */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#1A1A1A] rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl font-inter font-semibold
                text-sm transition-all ${mode === 'login'
                  ? 'bg-[#00E87A] text-black'
                  : 'text-[#666]'
                }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl font-inter font-semibold
                text-sm transition-all ${mode === 'signup'
                  ? 'bg-[#00E87A] text-black'
                  : 'text-[#666]'
                }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Forgot password header */}
        {mode === 'forgot' && (
          <div className="mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-[#666] flex items-center gap-2 mb-4 text-sm"
            >
              ← Back to login
            </button>
            <h2 className="font-syne font-bold text-white text-xl">
              Reset Password
            </h2>
            <p className="text-[#555] font-inter text-sm mt-1">
              Enter your email and we'll send a reset link.
            </p>
          </div>
        )}

        {/* Error / Success messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20
            rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 font-inter text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-[#00E87A]/10 border border-[#00E87A]/20
            rounded-xl px-4 py-3 mb-4">
            <p className="text-[#00E87A] font-inter text-sm">{success}</p>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={inputClass + ' pr-12'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(!showLoginPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                    text-[#555] hover:text-white transition-colors"
                >
                  {eyeIcon(showLoginPw)}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#00E87A] text-black font-inter
                font-bold py-4 rounded-full mt-2 text-base
                disabled:opacity-60 transition-all active:scale-95"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <button
              onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
              className="text-[#555] font-inter text-sm text-center
                hover:text-[#888] transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* ── SIGNUP FORM ── */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={signupPhone}
                onChange={e => setSignupPhone(e.target.value)}
                className={inputClass}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className={labelClass}>Country</label>
              <select
                value={signupCountry}
                onChange={e => {
                  setSignupCountry(e.target.value);
                  setSignupState('');
                }}
                className={inputClass + ' cursor-pointer'}
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                {signupCountry === 'Nigeria' ? 'State' : 'State / City'}
              </label>
              {signupCountry === 'Nigeria' ? (
                <select
                  value={signupState}
                  onChange={e => setSignupState(e.target.value)}
                  className={inputClass + ' cursor-pointer'}
                >
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Your state or city"
                  value={signupState}
                  onChange={e => setSignupState(e.target.value)}
                  className={inputClass}
                />
              )}
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  className={inputClass + ' pr-12'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPw(!showSignupPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                    text-[#555] hover:text-white transition-colors"
                >
                  {eyeIcon(showSignupPw)}
                </button>
              </div>
              {/* Password strength indicator */}
              {signupPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          pwStrength.score >= i ? pwStrength.colorClass : 'bg-[#2A2A2A]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-inter font-semibold ${pwStrength.textClass}`}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={signupConfirm}
                onChange={e => setSignupConfirm(e.target.value)}
                className={inputClass + (
                  signupConfirm && signupPassword !== signupConfirm
                    ? ' border-red-500/50'
                    : signupConfirm && signupPassword === signupConfirm
                    ? ' border-[#00E87A]/50'
                    : ''
                )}
                autoComplete="new-password"
              />
              {signupConfirm && signupPassword !== signupConfirm && (
                <p className="text-red-400 text-xs mt-1 font-inter">
                  Passwords don't match
                </p>
              )}
            </div>

            <button
              onClick={handleSignup}
              disabled={loading || signupPassword.length < 8 || signupPassword !== signupConfirm}
              className="w-full bg-[#00E87A] text-black font-inter
                font-bold py-4 rounded-full mt-2 text-base
                disabled:opacity-60 transition-all active:scale-95"
            >
              {loading ? 'Creating account...' : 'Create My Account 🔥'}
            </button>

            <p className="text-[#444] font-inter text-xs text-center leading-relaxed">
              By creating an account you agree to Fit21's terms.
              Your data is safe and never shared.
            </p>
          </div>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgot()}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <button
              onClick={handleForgot}
              disabled={loading}
              className="w-full bg-[#00E87A] text-black font-inter
                font-bold py-4 rounded-full text-base
                disabled:opacity-60 transition-all active:scale-95"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
