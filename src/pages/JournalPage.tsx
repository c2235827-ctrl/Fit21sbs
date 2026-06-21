import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import ProGate from '../components/ProGate';

export default function JournalPage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [tab, setTab] = useState<'journal' | 'habits'>('journal');
  
  // Journal State
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState<number>(5);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [journalLoading, setJournalLoading] = useState(true);

  // Habits State
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<string, string[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const moodOptions = [
    { emoji: '😄', label: 'Great' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Bad' },
    { emoji: '😢', label: 'Terrible' },
  ];

  useEffect(() => {
    if (user) loadTodayEntry();
  }, [user]);

  useEffect(() => {
    if (tab === 'habits') {
      fetchHabits();
    }
  }, [tab, currentMonth]);

  const loadTodayEntry = async () => {
    setJournalLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single();

    if (data) {
      setContent(data.content || '');
      setMood(data.mood || '');
      setEnergy(data.energy_level || 5);
    }
    setJournalLoading(false);
  };

  const fetchHabits = async () => {
    if (!user) return;
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(subscription.isPro ? 100 : 3);
    setHabits(habitsData || []);

    // Fetch logs for current month
    const start = new Date(currentMonth.getFullYear(), 
      currentMonth.getMonth(), 1)
      .toISOString().split('T')[0];
    const end = new Date(currentMonth.getFullYear(), 
      currentMonth.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end);

    const logMap: Record<string, string[]> = {};
    logs?.forEach(log => {
      if (log.completed) {
        if (!logMap[log.habit_id]) logMap[log.habit_id] = [];
        logMap[log.habit_id].push(log.date);
      }
    });
    setHabitLogs(logMap);
  };

  const toggleHabitLog = async (habitId: string, date: string) => {
    const isCompleted = habitLogs[habitId]?.includes(date);
    if (isCompleted) {
      await supabase.from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user!.id)
        .eq('date', date);
      setHabitLogs(prev => ({
        ...prev,
        [habitId]: prev[habitId]?.filter(d => d !== date) || []
      }));
    } else {
      await supabase.from('habit_logs').upsert({
        habit_id: habitId,
        user_id: user!.id,
        date: date,
        completed: true
      });
      setHabitLogs(prev => ({
        ...prev,
        [habitId]: [...(prev[habitId] || []), date]
      }));
    }
  };

  const handleSaveJournal = async () => {
    if (!user || !content.trim() || !mood) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    
    await supabase.from('journal_entries').upsert({
      user_id: user.id,
      date: today,
      content,
      mood,
      energy_level: energy
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center justify-center px-4 max-w-md mx-auto relative content-container">
        {/* TABS IN HEADER */}
        <div className="flex bg-[#1A1A1A] p-1 rounded-full w-48 mx-auto">
          <button 
            onClick={() => setTab('journal')}
            className={`flex-1 py-1.5 text-sm font-bold font-inter rounded-full transition-all ${tab === 'journal' ? 'bg-[#00E87A] text-black shadow-md' : 'text-[#888]'}`}
          >
            Journal
          </button>
          <button 
            onClick={() => setTab('habits')}
            className={`flex-1 py-1.5 text-sm font-bold font-inter rounded-full transition-all ${tab === 'habits' ? 'bg-[#00E87A] text-black shadow-md' : 'text-[#888]'}`}
          >
            Habits
          </button>
        </div>
      </header>

      <div className="pt-20 px-4 pb-24 flex flex-col gap-6 w-full">
        {tab === 'journal' ? (
          <div className="animate-fade-in flex flex-col gap-6">
            
            {/* MOOD */}
            <div>
              <label className="text-white font-inter font-semibold mb-3 block text-sm">How are you feeling?</label>
              <div className="flex justify-between bg-[#1A1A1A] p-4 rounded-xl">
                {moodOptions.map(m => (
                  <button 
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-transform ${mood === m.label ? 'scale-110 bg-[#2A2A2A]' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ENERGY */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="text-white font-inter font-semibold text-sm">Energy Level</label>
                <span className="text-[#00E87A] font-inter font-bold text-sm">{energy}/10</span>
              </div>
              <input 
                type="range" 
                min="1" max="10" 
                value={energy}
                onChange={e => setEnergy(Number(e.target.value))}
                className="w-full accent-[#00E87A] h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* EDITOR */}
            <div>
              <textarea 
                className="w-full bg-[#1A1A1A] rounded-xl p-4 text-white text-[15px] font-inter leading-[1.7] focus:outline-none focus:ring-1 focus:ring-[#00E87A] transition-all resize-none min-h-[200px]"
                placeholder="How was your day? What did you push through? What are you proud of?"
                value={content}
                onChange={e => setContent(e.target.value)}
              ></textarea>
            </div>

            {saved && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#00E87A] text-black font-bold text-sm px-4 py-2 rounded-full z-50 animate-fade-in">
                ✓ Entry saved
              </div>
            )}
            <button 
              onClick={handleSaveJournal}
              disabled={saving || !content.trim() || !mood}
              className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col gap-4">
            {/* Month navigator */}
            <div className="flex items-center justify-between px-2">
              <button 
                onClick={() => setCurrentMonth(m => 
                  new Date(m.getFullYear(), m.getMonth() - 1, 1)
                )}
                className="text-[#666] px-3 py-1"
              >‹</button>
              <span className="font-syne font-bold text-white text-base">
                {currentMonth.toLocaleString('default', 
                  { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentMonth(m => 
                  new Date(m.getFullYear(), m.getMonth() + 1, 1)
                )}
                className="text-[#666] px-3 py-1"
              >›</button>
            </div>

            {habits.length === 0 ? (
              <div className="bg-[#1A1A1A] p-6 rounded-2xl text-center mt-4">
                <p className="text-gray-400 font-inter text-sm">
                  No habits yet. Tap + to add one.
                </p>
              </div>
            ) : habits.map(habit => {
              const daysInMonth = new Date(
                currentMonth.getFullYear(), 
                currentMonth.getMonth() + 1, 0
              ).getDate();
              const today = new Date().toISOString().split('T')[0];
              
              return (
                <div key={habit.id} 
                  className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{habit.icon}</span>
                    <span className="font-inter font-semibold text-white text-sm">
                      {habit.name}
                    </span>
                    <span className="ml-auto text-[#00E87A] text-xs font-bold">
                      {habitLogs[habit.id]?.length || 0}/{daysInMonth}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isCompleted = habitLogs[habit.id]?.includes(dateStr);
                      const isFuture = dateStr > today;
                      const isToday = dateStr === today;
                      
                      return (
                        <button
                          key={i}
                          onClick={() => !isFuture && toggleHabitLog(habit.id, dateStr)}
                          disabled={isFuture}
                          className={`w-8 h-8 rounded-md text-xs font-bold transition-all
                            ${isCompleted 
                              ? 'bg-[#00E87A] text-black' 
                              : isToday
                              ? 'border-2 border-[#00E87A] text-[#00E87A] bg-transparent'
                              : isFuture
                              ? 'bg-[#111] text-[#333] cursor-not-allowed'
                              : 'bg-[#2A2A2A] text-[#666]'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 bg-[#2A2A2A] rounded-full h-1.5">
                    <div 
                      className="bg-[#00E87A] h-1.5 rounded-full transition-all"
                      style={{ 
                        width: `${Math.round(
                          ((habitLogs[habit.id]?.length || 0) / daysInMonth) * 100
                        )}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Add habit FAB / Upgrade Prompt */}
            {habits.length >= 3 && !subscription.isPro ? (
              <div className="mt-4 mb-20">
                <ProGate feature="Unlimited Habits">
                  <div />
                </ProGate>
              </div>
            ) : (
              <button 
                className="fixed bottom-24 right-4 w-14 h-14 bg-[#00E87A] 
                  rounded-full flex items-center justify-center text-black 
                  shadow-[0_0_20px_rgba(0,232,122,0.3)] z-20 
                  transition-transform active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
