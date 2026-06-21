import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProGate from '../components/ProGate';

type Status = 'idle' | 'running' | 'paused' | 'finished';

export default function RunTrackerPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('idle');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number}[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'active' | 'denied'>('pending');

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const distSimRef = useRef<number | null>(null);

  useEffect(() => {
    // Request geolocation
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus('active');
          if (status === 'running') {
            setCoordinates(prev => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }]);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setGpsStatus('denied');
        },
        { enableHighAccuracy: true }
      );
      watchIdRef.current = id;
    } else {
      setGpsStatus('denied');
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearTimers();
    };
  }, [navigator.geolocation, status]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (distSimRef.current) clearInterval(distSimRef.current);
    timerRef.current = null;
    distSimRef.current = null;
  };

  useEffect(() => {
    if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      distSimRef.current = window.setInterval(() => {
        setDistance(prev => Number((prev + 0.01).toFixed(2)));
      }, 3000);
    } else {
      clearTimers();
    }

    return () => clearTimers();
  }, [status]);

  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleResume = () => setStatus('running');
  const handleFinish = () => setStatus('finished');

  const handlePostToCommunity = async () => {
    if (!user) return;
    try {
      await supabase.from('posts').insert({
        user_id: user.id,
        content: `Just finished a run!`,
        share_card_data: {
          challenge: 'Run Tracked',
          value: distance.toFixed(2),
          unit: 'km',
          streak: profile?.streak_count || 1
        }
      });
      navigate('/home');
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const paceMinutes = distance > 0 ? (duration / 60) / distance : 0;
  const paceSecs = Math.floor((paceMinutes % 1) * 60);
  const pace = distance > 0 ? `${Math.floor(paceMinutes)}:${paceSecs.toString().padStart(2, '0')} /km` : '--:--';
  const calories = Math.floor(distance * 60);

  return (
    <ProGate feature="GPS Run Tracker">
      <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center px-4 max-w-md mx-auto content-container">
        <button onClick={() => navigate('/challenge')} className="text-white p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-syne font-extrabold text-xl text-white ml-2">Run Tracker</h1>
      </header>

      <div className="pt-20 px-4 pb-24 flex flex-col items-center flex-1">
        
        {/* Timer Display */}
        <div className="text-center mt-6 mb-8">
          <div className="font-syne font-extrabold text-[56px] leading-none text-white tracking-widest">
            {formatTime(duration)}
          </div>
          <div className="font-inter text-[#aaa] text-sm mt-2 uppercase tracking-widest">Duration</div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8">
          <div className="bg-[#1A1A1A] p-4 rounded-2xl flex flex-col items-center border border-[#2A2A2A]">
            <div className="font-syne font-extrabold text-2xl text-[#00E87A]">{distance.toFixed(2)}</div>
            <div className="font-inter text-[#666] text-xs mt-1">KM</div>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-2xl flex flex-col items-center border border-[#2A2A2A]">
            <div className="font-syne font-extrabold text-xl text-[#00E87A] mt-1">{pace}</div>
            <div className="font-inter text-[#666] text-xs mt-1">PACE</div>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-2xl flex flex-col items-center border border-[#2A2A2A]">
            <div className="font-syne font-extrabold text-2xl text-[#00E87A]">{calories}</div>
            <div className="font-inter text-[#666] text-xs mt-1">KCAL</div>
          </div>
        </div>

        {/* Map Area */}
        <div className="w-full h-[240px] bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] flex items-center justify-center relative overflow-hidden mb-8">
          {gpsStatus === 'active' ? (
            <div className="text-[#00E87A] font-inter font-bold text-sm flex items-center gap-2">
              <span className="animate-pulse">📍</span> GPS Active
            </div>
          ) : gpsStatus === 'denied' ? (
            <div className="text-[#ff4444] font-inter font-bold text-sm flex items-center gap-2">
              ⚠️ GPS not available
            </div>
          ) : (
            <div className="text-[#aaa] font-inter text-sm flex items-center gap-2">
              Locating...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-auto w-full flex flex-col gap-3">
          {status === 'idle' && (
            <button 
              onClick={handleStart}
              className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full text-lg"
            >
              START RUN
            </button>
          )}

          {status === 'running' && (
            <div className="flex gap-3">
              <button 
                onClick={handlePause}
                className="flex-1 bg-[#1A1A1A] text-white font-bold py-4 rounded-full border border-[#333] text-lg hover:bg-[#222]"
              >
                PAUSE
              </button>
              <button 
                onClick={handleFinish}
                className="flex-1 bg-[#00E87A] text-black font-bold py-4 rounded-full text-lg"
              >
                FINISH
              </button>
            </div>
          )}

          {status === 'paused' && (
            <div className="flex gap-3">
               <button 
                onClick={handleResume}
                className="flex-1 bg-[#00E87A] text-black font-bold py-4 rounded-full text-lg"
              >
                RESUME
              </button>
              <button 
                onClick={handleFinish}
                className="flex-[0.5] bg-[#1A1A1A] text-white font-bold py-4 rounded-full border border-[#333] text-lg"
              >
                FINISH
              </button>
            </div>
          )}

          {status === 'finished' && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={handlePostToCommunity}
                className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full text-lg"
              >
                Post to Community
              </button>
              <button 
                onClick={() => navigate('/challenge')}
                className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-full border border-[#333] text-lg"
              >
                Back to Challenge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProGate>
  );
}
