import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function JournalPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'journal' | 'habits'>('journal');
  
  // Journal State
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState<number>(5);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Habits State
  const [habits, setHabits] = useState<any[]>([]);

  const moodOptions = [
    { emoji: '😄', label: 'Great' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Bad' },
    { emoji: '😢', label: 'Terrible' },
  ];

  useEffect(() => {
    if (tab === 'habits') {
      fetchHabits();
    }
  }, [tab]);

  const fetchHabits = async () => {
    if (!user) return;
    const { data } = await supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true);
    setHabits(data || []);
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
    alert('Entry saved!');
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
             <div className="text-center font-syne font-bold text-white text-lg py-2">
                &lt; {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} &gt;
             </div>

             {habits.length === 0 ? (
                <div className="bg-[#1A1A1A] p-6 rounded-2xl text-center mt-4">
                  <p className="text-gray-400 font-inter text-sm w-48 mx-auto leading-relaxed">No habits added yet. Track daily routines.</p>
                </div>
             ) : (
                habits.map(habit => (
                  <div key={habit.id} className="border-b border-[#1A1A1A] pb-4 mb-4">
                    <div className="flex">
                      <div className="w-[120px] shrink-0 font-inter font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                        <span>{habit.icon}</span> {habit.name}
                      </div>
                      <div className="flex-1 overflow-x-auto flex gap-2 pl-2 pb-2">
                        {/* Placeholder days */}
                        {[...Array(7)].map((_, i) => (
                           <div key={i} className="w-8 h-8 shrink-0 border border-[#2A2A2A] rounded-md bg-[#111111]"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
             )}

             <button className="fixed bottom-24 right-4 w-14 h-14 bg-[#00E87A] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,232,122,0.3)] z-20 transition-transform active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
