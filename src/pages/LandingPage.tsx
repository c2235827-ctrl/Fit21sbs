import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const playerRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const toggleSound = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.muted = false;
        playerRef.current.volume = 0.8;
      } else {
        playerRef.current.muted = true;
      }
      setIsMuted(!isMuted);
    }
  };

  const openAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hero { position: relative; width: 100%; height: 100svh; min-height: 600px; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center; }
        
        .video-wrapper {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        
        .video-wrapper video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }

        .video-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.95) 100%); }
        .hero-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 24px; }
        .eyebrow { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 3.5px; text-transform: uppercase; color: #00E87A; margin-bottom: 20px; }
        .hero-h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(52px, 13vw, 108px); line-height: 0.85; letter-spacing: -4px; text-transform: uppercase; color: white; margin-bottom: 24px; }
        .hero-h1 .accent { color: #00E87A; }
        .hero-subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 18px; color: rgba(255,255,255,0.7); max-width: 460px; line-height: 1.625; margin: 0 auto 40px; }
        .pill-btn { display: inline-flex; align-items: center; gap: 12px; background: #25D366; color: white; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 18px; padding: 20px 48px; border-radius: 9999px; border: none; text-decoration: none; box-shadow: 0 0 40px rgba(37,211,102,0.35); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; pointer-events: auto; }
        .pill-btn:hover { transform: scale(1.05); box-shadow: 0 0 40px rgba(37,211,102,0.35); }
        .create-account-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255, 255, 255, 0.08); color: #FFFFFF; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; margin-top: 12px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: background 0.2s, transform 0.2s; -webkit-tap-highlight-color: transparent; pointer-events: auto; }
        .create-account-btn:hover, .create-account-btn:active { background: rgba(255, 255, 255, 0.15); transform: translateY(-2px); }
        .microcopy { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 13px; color: rgba(255,255,255,0.4); letter-spacing: 0.025em; margin-top: 16px; }
        .sound-toggle { position: absolute; bottom: 32px; right: 32px; z-index: 3; width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; pointer-events: auto; }
        .sound-toggle svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .footer { height: 60px; background: #0A0A0A; border-top: 1px solid #1a1a1a; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 24px; position: relative; z-index: 2; pointer-events: auto;}
        .footer p { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; }
        
        @media (max-width: 768px) {
          .hero-h1 { font-size: clamp(40px, 11vw, 52px); letter-spacing: -2px; line-height: 0.95; margin-bottom: 16px; }
          .hero-subtitle { font-size: 15px; margin-bottom: 24px; max-width: 300px; }
          .pill-btn { font-size: 16px; padding: 16px 32px; width: 100%; max-width: 320px; justify-content: center; }
          .create-account-btn { font-size: 14px; padding: 14px 20px; width: 100%; max-width: 320px; justify-content: center; white-space: normal; }
          .sound-toggle { bottom: 20px; right: 20px; width: 40px; height: 40px; }
          .footer p { font-size: 10px; }
          .microcopy { font-size: 12px; }
        }
      `}} />
      <section className="hero">
        <div className="video-wrapper">
          <video
            ref={playerRef}
            src="https://cdn.pixabay.com/video/2024/02/15/200657-913478674_large.mp4"
            autoPlay
            loop
            muted
            playsInline
            title="Background Video"
          />
        </div>
        <div className="video-overlay"></div>
        
        <div className="hero-content">
          <div className="eyebrow">FEEL 21 AGAIN</div>
          <h1 className="hero-h1">
            Chase the<br/>
            <span className="accent">Streak.</span>
          </h1>
          <p className="hero-subtitle">
            Daily challenges. A community that shows up every single day.
          </p>
          <a href="https://chat.whatsapp.com/DdQZz2IWdIw8JxwWRk8tuS" target="_blank" rel="noopener noreferrer" className="pill-btn">
            Join the Community
          </a>
          <button onClick={() => (window as any).openAuthModal()} className="create-account-btn">
            ✦ Create Account — Access Early Features
          </button>
          <div className="microcopy">Free to join. App features launching soon.</div>
        </div>

        <button className="sound-toggle" onClick={toggleSound} aria-label="Toggle Sound">
          {isMuted ? (
            <svg id="icon-muted" viewBox="0 0 24 24">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            <svg id="icon-sound" viewBox="0 0 24 24">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
      </section>
      
      <footer className="footer">
        <p>© 2026 Fit21. All rights reserved.</p>
      </footer>
    </>
  );
}
