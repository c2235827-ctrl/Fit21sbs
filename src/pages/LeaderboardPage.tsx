import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'week' | 'all'>('week');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, [tab]);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      if (tab === 'week') {
        const { data: weekData } = await supabase
          .from('weekly_leaderboard')
          .select('*')
          .limit(50);
        data = weekData || [];
      } else {
        const { data: allData } = await supabase
          .from('leaderboard')
          .select('*')
          .limit(50);
        data = allData || [];
      }

      setLeaders(data);

      if (user) {
        const rank = data.findIndex(p => p.id === user.id) + 1;
        const me = data.find(p => p.id === user.id);
        if (me) setMyRank({ rank, ...me });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'bg-[#FFD700]/10 border-[#FFD700]/30', num: 'text-[#FFD700]' }; // Gold
    if (index === 1) return { bg: 'bg-[#C0C0C0]/10 border-[#C0C0C0]/30', num: 'text-[#C0C0C0]' }; // Silver
    if (index === 2) return { bg: 'bg-[#CD7F32]/10 border-[#CD7F32]/30', num: 'text-[#CD7F32]' }; // Bronze
    return { bg: 'bg-[#1A1A1A] border-transparent', num: 'text-[#555]' };
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center justify-center px-4 max-w-md mx-auto relative content-container">
        <h1 className="font-syne font-extrabold text-xl text-white">Leaderboard</h1>
      </header>

      <div className="pt-20 px-4 pb-24 flex flex-col gap-4">
        
        {/* TABS */}
        <div className="flex bg-[#1A1A1A] p-1 rounded-full w-full">
          <button 
            onClick={() => setTab('week')}
            className={`flex-1 py-3 text-sm font-bold font-inter rounded-full transition-all ${tab === 'week' ? 'bg-[#00E87A] text-black shadow-md' : 'text-[#888]'}`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTab('all')}
            className={`flex-1 py-3 text-sm font-bold font-inter rounded-full transition-all ${tab === 'all' ? 'bg-[#00E87A] text-black shadow-md' : 'text-[#888]'}`}
          >
            All Time
          </button>
        </div>

        {/* MY RANK CARD */}
        {myRank && (
          <div className="bg-[#1A1A1A] border border-[#00E87A]/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,232,122,0.1)] sticky top-20 z-20">
            <div className="flex items-center gap-4">
              <div className="font-syne font-extrabold text-2xl text-white w-8">#{myRank.rank}</div>
              {myRank.avatar_url ? (
                <img src={myRank.avatar_url} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center font-bold text-[#aaa]">
                  {myRank.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="text-white font-inter font-bold text-[15px]">You</div>
                <div className="text-[#00E87A] font-inter text-xs font-semibold mt-1">
                  {myRank.total_challenges_completed || 0} completed
                </div>
              </div>
            </div>
            <div className="font-syne font-extrabold text-[#00E87A] text-xl">
              {myRank.streak_count} 🔥
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="flex flex-col gap-2 mt-4">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-[#1A1A1A] rounded-2xl"></div>
              ))}
            </div>
          ) : (
            leaders.map((leader, i) => {
              const style = getRankStyle(i);
              return (
                <div key={leader.id} className={`${style.bg} border rounded-2xl p-4 flex items-center justify-between transition-all`}>
                  <div className="flex items-center gap-4">
                    <div className={`font-syne font-extrabold text-2xl w-8 text-center ${style.num}`}>
                      {i === 0 ? '👑' : i + 1}
                    </div>
                    {leader.avatar_url ? (
                      <img src={leader.avatar_url} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#333] flex items-center justify-center font-bold text-[#aaa]">
                        {leader.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="text-white font-inter font-semibold text-[15px]">
                      {leader.name || 'User'}
                    </div>
                  </div>
                  <div className="font-syne font-extrabold text-[#00E87A] text-lg">
                    {leader.streak_count} 🔥
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
