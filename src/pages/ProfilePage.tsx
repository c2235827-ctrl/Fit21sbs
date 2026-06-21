import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import ProBadge from '../components/ProBadge';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const [showSettings, setShowSettings] = useState(false);
  const [streakDots, setStreakDots] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadStreakCalendar();
  }, [user]);

  const loadStreakCalendar = async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    
    const { data } = await supabase
      .from('streak_logs')
      .select('date, completed')
      .eq('user_id', user!.id)
      .gte('date', start.toISOString().split('T')[0])
      .order('date', { ascending: true });

    setStreakDots((data || [])
      .filter(d => d.completed)
      .map(d => d.date));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center justify-between px-4 max-w-md mx-auto relative content-container">
        <h1 className="font-syne font-extrabold text-xl text-white">Profile</h1>
        <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </header>

      <div className="pt-20 px-4 pb-24 flex flex-col gap-6">
        
        {/* PROFILE CARD */}
        <div className="flex flex-col items-center">
           <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full border-2 border-[#2A2A2A] overflow-hidden flex items-center justify-center bg-[#111]">
                 {profile?.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full object-cover" />
                 ) : (
                   <div className="font-bold text-3xl text-[#aaa]">{profile?.name?.charAt(0) || '?'}</div>
                 )}
              </div>
           </div>
           
           <div className="flex items-center gap-2 justify-center mb-1">
              <h2 className="font-syne font-extrabold text-2xl text-white">{profile?.name || 'User'}</h2>
              {subscription.isPro && <ProBadge />}
            </div>
           
           <div className="flex flex-col items-center gap-1">
             <p className="text-[#888] font-inter text-sm">
               {profile?.email || ''}
             </p>
             {(profile?.state || profile?.country) && (
               <p className="text-[#555] font-inter text-xs">
                 📍 {[profile?.state, profile?.country]
                   .filter(Boolean).join(', ')}
               </p>
             )}
           </div>
        </div>

        {/* PRO STATUS CARD */}
        {subscription.isPro ? (
          <div className="w-full bg-[#00E87A]/10 border border-[#00E87A]/30
            rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ProBadge size="md" />
              </div>
              <p className="text-[#aaa] font-inter text-xs">
                {subscription.isGrace
                  ? `Grace period — expires ${new Date(subscription.grace_period_end!).toLocaleDateString('en-NG')}`
                  : `Renews in ${subscription.daysLeft} days`
                }
              </p>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/pro')}
            className="w-full bg-gradient-to-r from-[#00E87A] to-[#00B85F]
              text-black font-bold py-4 rounded-2xl flex items-center
              justify-center gap-2 shadow-[0_4px_20px_rgba(0,232,122,0.25)]"
          >
            ⚡ Upgrade to Pro — ₦1,500/month
          </button>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col items-center justify-center border border-[#2A2A2A]">
             <div className="font-syne font-extrabold text-2xl text-[#00E87A]">{profile?.streak_count || 0}</div>
             <div className="font-inter text-xs text-[#888] mt-1 text-center leading-tight">Streak 🔥</div>
           </div>
           <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col items-center justify-center border border-[#2A2A2A]">
             <div className="font-syne font-extrabold text-2xl text-white">{profile?.longest_streak || 0}</div>
             <div className="font-inter text-xs text-[#888] mt-1 text-center leading-tight">Longest</div>
           </div>
           <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col items-center justify-center border border-[#2A2A2A]">
             <div className="font-syne font-extrabold text-2xl text-white">{profile?.total_challenges_completed || 0}</div>
             <div className="font-inter text-xs text-[#888] mt-1 text-center leading-tight">Done</div>
           </div>
        </div>

        {/* STREAK CALENDAR */}
        <div>
          <h3 className="font-syne font-bold text-lg text-white mb-3">Activity</h3>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
             <div className="text-center font-inter text-[#aaa] text-sm mb-4">Past 30 days</div>
             <div className="grid grid-cols-6 gap-2">
                {[...Array(30)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  const dateStr = d.toISOString().split('T')[0];
                  const completed = streakDots.includes(dateStr);
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-full 
                        ${completed ? 'bg-[#00E87A]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}
                      title={dateStr}
                    />
                  );
                })}
             </div>
          </div>
        </div>
      </div>

      {/* SETTINGS SHEET */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowSettings(false)}></div>
          <div className="bg-[#1A1A1A] rounded-t-3xl p-6 relative w-full max-w-md mx-auto animate-fade-in border-t border-[#333]">
             <div className="w-12 h-1.5 bg-[#333] rounded-full mx-auto mb-6"></div>
             <h3 className="font-syne font-extrabold text-xl text-white mb-6">Settings</h3>
             
             <button className="w-full bg-[#2A2A2A] text-white font-inter font-semibold py-4 rounded-xl mb-3">
               Edit Profile
             </button>
             
             <button onClick={handleSignOut} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-inter font-semibold py-4 rounded-xl">
               Sign Out
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
