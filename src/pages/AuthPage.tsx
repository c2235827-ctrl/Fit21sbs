import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  
  const initialStep = location.state?.step || 1;
  const [step, setStep] = useState(initialStep);
  
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [avatarObj, setAvatarObj] = useState<{file: File, url: string} | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // basic formatting
    let number = phone.replace(/\D/g, '');
    if (number.length === 10 && !number.startsWith('0')) {
      number = '234' + number;
    } else if (number.length === 11 && number.startsWith('0')) {
      number = '234' + number.slice(1);
    }
    const finalPhone = '+' + number;
    setFormattedPhone(finalPhone);

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      phone: finalPhone,
      options: { channel: 'sms' }
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      setStep(2);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
    
    if (newOtp.every(v => v !== '')) {
      submitOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    setLoading(true);
    setError('');
    
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms'
    });
    
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await refreshProfile();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setLoading(false);
      
      if (profile && profile.name && profile.name !== 'Fit21 User') {
        navigate('/home');
      } else {
        setStep(3);
      }
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarObj({
        file,
        url: URL.createObjectURL(file)
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    let finalAvatarUrl = null;
    
    if (avatarObj) {
      const ext = avatarObj.file.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarObj.file);
        
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }
    }

    const updates: any = { name: name.trim() };
    if (finalAvatarUrl) updates.avatar_url = finalAvatarUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setLoading(false);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
      navigate('/home');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] p-6 text-white items-center">
      <div className="pt-8 pb-12 flex flex-col items-center">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/12563/12563330.png" 
          width="64" height="64" 
          alt="Fit21 logo" 
        />
        <h1 className="font-syne font-extrabold text-[28px] mt-4">Fit21</h1>
      </div>
      
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div 
            key={s} 
            className={`w-2 h-2 rounded-full ${step >= s ? 'bg-[#00E87A]' : 'bg-[#2A2A2A]'}`}
          />
        ))}
      </div>

      <div className="w-full max-w-sm">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col items-center w-full">
            <h2 className="text-xl font-semibold mb-6 text-center">Enter your phone number</h2>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-4 text-lg mb-6 text-center focus:outline-none focus:border-[#00E87A] transition-colors"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button 
              type="submit" 
              className="w-full bg-[#00E87A] text-black font-bold text-[17px] py-4 rounded-full disabled:opacity-50"
              disabled={loading || phone.length < 5}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center w-full">
            <h2 className="text-xl font-semibold mb-6 text-center">Enter the 6-digit code</h2>
            <div className="flex gap-2 justify-center mb-8">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="number"
                  inputMode="numeric"
                  className="w-12 h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-center text-xl font-bold focus:outline-none focus:border-[#00E87A] transition-colors"
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            
            {loading && <div className="text-[#00E87A] font-medium animate-pulse">Verifying...</div>}
            
            <button 
              onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}
              className="text-[#666666] text-sm mt-4 hover:text-white"
              disabled={loading}
            >
              Resend code
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col items-center w-full">
            <h2 className="text-xl font-semibold mb-8 text-center">Set up your profile</h2>
            
            <label className="mb-8 cursor-pointer relative group">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarSelect}
                disabled={loading}
              />
              <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-[#2A2A2A] overflow-hidden flex items-center justify-center group-hover:border-[#00E87A] transition-colors">
                {avatarObj ? (
                  <img src={avatarObj.url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                )}
              </div>
            </label>

            <input
              type="text"
              placeholder="Your full name"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-4 text-lg mb-6 focus:outline-none focus:border-[#00E87A] transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
            
            <button 
              type="submit" 
              className="w-full bg-[#00E87A] text-black font-bold text-[17px] py-4 rounded-full disabled:opacity-50"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Saving...' : 'Create Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
