import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import VideoUploader from '../components/VideoUploader';

export default function ChallengePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedChallengeData, setCompletedChallengeData] = useState<any>(null);
  const [proofVideoUrl, setProofVideoUrl] = useState('');

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
        proof_video_url: proofVideoUrl || null,
        note: note,
        date: today,
        completed_at: new Date().toISOString()
      }).select('*, challenges(*)').single();

      if (comp) {
        setCompletedChallengeData(comp);
      }
      
      setCompletedToday(true);
      await refreshProfile();
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

            <div className="w-full grid grid-cols-3 gap-2">
              <button 
                onClick={downloadCard}
                className="flex flex-col items-center justify-center gap-1 bg-[#1A1A1A] text-white font-bold py-3 px-2 rounded-2xl border border-[#333] hover:bg-[#222]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span className="text-[10px] uppercase tracking-wider">Save</span>
              </button>
              
              <button
                onClick={() => {
                  const text = encodeURIComponent(
                    `I just completed my daily challenge on Fit21! 🔥\n` +
                    `${completedChallengeData?.actual_value}` +
                    `${completedChallengeData?.challenges?.target_unit} ` +
                    `${completedChallengeData?.challenges?.title}\n` +
                    `Day ${profile?.streak_count || 1} streak 💪\n\n` +
                    `Join me: https://fit21.sbs`
                  );
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="flex flex-col items-center justify-center gap-1 bg-[#25D366] text-white font-bold py-3 px-2 rounded-2xl border border-[#1DA851]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <span className="text-[10px] uppercase tracking-wider">WhatsApp</span>
              </button>

              <button 
                onClick={shareToFeed}
                className="flex flex-col items-center justify-center gap-1 bg-[#00E87A] text-black font-bold py-3 px-2 rounded-2xl"
              >
                <div style={{width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>🔥</div>
                <span className="text-[10px] uppercase tracking-wider">Post</span>
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
                  className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50 mb-3"
                >
                  Next
                </button>
                {(category === 'run' || category === 'walk') && (
                  <button
                    onClick={() => navigate('/run-tracker')}
                    className="w-full bg-[#1A1A1A] border border-[#00E87A] text-[#00E87A] font-bold py-3 rounded-full flex items-center justify-center gap-2"
                  >
                    📍 Track with GPS instead
                  </button>
                )}
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

                {user && (
    <div className="w-full mb-6">
      <VideoUploader
        userId={user.id}
        onUpload={(url) => setProofVideoUrl(url)}
      />
    </div>
  )}
                
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
