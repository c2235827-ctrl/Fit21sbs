import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

export default function ChallengePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedChallengeData, setCompletedChallengeData] = useState<any>(null);

  // States for flow
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [actualVal, setActualVal] = useState('');
  const [note, setNote] = useState('');
  
  const shareCardRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'run', label: 'Run', icon: '🏃', unit: 'km' },
    { id: 'walk', label: 'Walk', icon: '🚶', unit: 'km' },
    { id: 'gym', label: 'Gym', icon: '💪', unit: '' },
    { id: 'water', label: 'Water', icon: '💧', unit: 'litres' },
    { id: 'sleep', label: 'Sleep', icon: '😴', unit: 'hours' },
    { id: 'read', label: 'Read', icon: '📖', unit: 'pages' },
    { id: 'pushups', label: 'Pushups', icon: '🔥', unit: 'reps' },
    { id: 'custom', label: 'Custom', icon: '✏️', unit: '' },
  ];

  useEffect(() => {
    checkToday();
  }, [user]);

  const checkToday = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('completions')
      .select('*, challenges(*)')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
      
    if (data) {
      setCompletedToday(true);
      setCompletedChallengeData(data);
    }
    setLoading(false);
  };

  const getUnit = () => {
    const c = categories.find(c => c.id === category);
    return c?.unit || '';
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challenge } = await supabase.from('challenges').insert({
      user_id: user.id,
      title: category,
      category: category,
      target_value: targetVal,
      target_unit: getUnit(),
      date: today
    }).select().single();

    if (challenge) {
      const { data: comp } = await supabase.from('completions').insert({
        user_id: user.id,
        challenge_id: challenge.id,
        actual_value: actualVal,
        note: note,
        date: today,
        completed_at: new Date().toISOString()
      }).select('*, challenges(*)').single();

      if (comp) {
        setCompletedChallengeData(comp);
      }
      
      setCompletedToday(true);
    }
    
    setLoading(false);
  };

  const downloadCard = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, {
         backgroundColor: '#0A0A0A',
         scale: 3,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `fit21-streak-${profile?.streak_count || 1}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  const shareToFeed = async () => {
    if (!user || !completedChallengeData) return;
    try {
       await supabase.from('posts').insert({
         user_id: user.id,
         content: `Completed my daily challenge!`,
         share_card_data: {
           challenge: completedChallengeData.challenges.title,
           value: completedChallengeData.actual_value,
           unit: completedChallengeData.challenges.target_unit,
           streak: profile?.streak_count || 1
         }
       });
       navigate('/home');
    } catch (err) {
       console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center justify-center px-4 max-w-md mx-auto relative content-container">
        <h1 className="font-syne font-extrabold text-xl text-white">Today's Challenge</h1>
      </header>

      <div className="pt-20 px-4 pb-24 flex flex-col gap-6">
        {completedToday && completedChallengeData ? (
          <div className="animate-fade-in flex flex-col items-center">
            
            {/* The Share Card Component */}
            <div 
              ref={shareCardRef}
              className="w-full aspect-[4/5] bg-gradient-to-br from-[#1A1A1A] to-[#050505] rounded-3xl border border-[#333] shadow-2xl p-8 flex flex-col justify-between mb-8 overflow-hidden relative"
            >
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1.5px)] bg-[length:24px_24px]"></div>
               
               <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <img 
                       src="https://cdn-icons-png.flaticon.com/512/12563/12563330.png" 
                       width="32" height="32" 
                       alt="Fit21 logo" 
                     />
                     <span className="font-syne font-extrabold text-white text-xl">Fit21</span>
                  </div>
                  <div className="bg-[#00E87A]/20 text-[#00E87A] font-inter font-bold px-3 py-1 rounded-full text-sm">
                    Verified
                  </div>
               </div>

               <div className="relative z-10 text-center flex flex-col items-center justify-center flex-1">
                  <div className="text-[80px] leading-none mb-4">
                     {categories.find(c => c.id === completedChallengeData.challenges.category)?.icon || '🔥'}
                  </div>
                  <div className="font-syne font-extrabold text-white text-[56px] leading-[1.1] mb-2 drop-shadow-md">
                     {completedChallengeData.actual_value}
                     <span className="text-3xl ml-1">{completedChallengeData.challenges.target_unit}</span>
                  </div>
                  <div className="font-syne font-bold text-[#aaa] text-2xl uppercase tracking-wider">
                     {completedChallengeData.challenges.title}
                  </div>
               </div>

               <div className="relative z-10 flex items-center justify-between border-t border-[#333] pt-6">
                  <div className="flex items-center gap-3">
                     {profile?.avatar_url ? (
                       <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover border-2 border-[#333]" />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center font-bold text-white">
                         {profile?.name?.charAt(0) || '?'}
                       </div>
                     )}
                     <div>
                        <div className="text-white font-inter font-bold">{profile?.name || 'User'}</div>
                        <div className="text-[#888] font-inter text-xs">Day {profile?.streak_count || 1} Streak</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[#00E87A] font-inter text-xs font-bold uppercase tracking-wider">Today</div>
                     <div className="text-[#fff] font-inter font-medium text-sm mt-1">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </div>
                  </div>
               </div>
            </div>

            <div className="w-full flex gap-3">
              <button 
                onClick={downloadCard}
                className="flex-1 bg-[#1A1A1A] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 border border-[#333] hover:bg-[#222]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download
              </button>
              <button 
                onClick={shareToFeed}
                className="flex-1 bg-[#00E87A] text-black font-bold py-4 rounded-full"
              >
                Post to Feed
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center flex flex-col items-center border border-[#2A2A2A] mb-6">
              <div className="text-4xl mb-4">🔥</div>
              <div className="font-syne font-extrabold text-[#00E87A] text-[64px] leading-none mb-1">
                {profile?.streak_count || 0}
              </div>
              <div className="font-inter text-[#aaa] text-sm font-medium mb-3">day streak</div>
              <div className="font-inter text-[#666] text-xs">
                Longest: {profile?.longest_streak || 0} days
              </div>
            </div>
            
            {step === 1 && (
              <div className="animate-fade-in">
                <h3 className="font-inter font-semibold text-lg text-white mb-4">What's your challenge today?</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${category === cat.id ? 'bg-[#00E87A]/10 border-[#00E87A]' : 'bg-[#1A1A1A] border-transparent hover:border-[#2A2A2A]'}`}
                    >
                      <span className="text-3xl mb-1">{cat.icon}</span>
                      <span className="font-inter text-sm font-medium text-white">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!category}
                  className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in flex flex-col items-center">
                <h3 className="font-inter font-semibold text-lg text-white mb-8">Set your target</h3>
                
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full bg-transparent text-center font-syne font-extrabold text-[56px] text-white focus:outline-none mb-2"
                  value={targetVal}
                  onChange={e => setTargetVal(e.target.value)}
                  autoFocus
                />
                <div className="text-[#00E87A] font-inter font-semibold text-lg mb-10">{getUnit()}</div>
                
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-[#1A1A1A] text-white font-bold py-4 rounded-full border border-[#333]"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!targetVal}
                    className="flex-1 bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in flex flex-col items-center">
                <h3 className="font-inter font-semibold text-lg text-white mb-6">Did you complete it?</h3>
                
                <div className="w-full mb-6">
                  <label className="text-[#aaa] text-sm font-inter mb-2 block">How much did you actually do?</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full bg-transparent text-center font-syne font-extrabold text-[48px] text-white focus:outline-none border-b-2 border-[#333] pb-2 focus:border-[#00E87A] transition-colors"
                    value={actualVal}
                    onChange={e => setActualVal(e.target.value)}
                  />
                  <div className="text-[#00E87A] font-inter text-center font-semibold text-md mt-2">{getUnit()}</div>
                </div>

                <div className="w-full mb-6 border-2 border-dashed border-[#2A2A2A] rounded-xl flex flex-col items-center justify-center p-6 bg-[#1A1A1A]/50">
                   <div className="text-3xl mb-2">📹</div>
                   <div className="text-[#aaa] font-inter text-sm font-semibold">Upload 30s proof video</div>
                   <div className="text-[#666] font-inter text-xs mt-1">(Mocked / Skipped for now)</div>
                </div>
                
                <button 
                  onClick={handleSubmit}
                  disabled={!actualVal || loading}
                  className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Challenge'}
                </button>
                
                <button 
                   onClick={() => setStep(2)}
                   className="mt-6 text-[#888] text-sm font-medium py-2 w-full text-center"
                >
                   Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
