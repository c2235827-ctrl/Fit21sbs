import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active path
  const path = location.pathname;

  const NavItem = ({ to, label, icon, isCenter = false }: any) => {
    const isActive = path === to;
    const color = isActive ? '#00E87A' : '#444444';
    
    if (isCenter) {
      return (
        <div 
          onClick={() => navigate(to)}
          className="flex-1 flex flex-col items-center justify-center relative cursor-pointer"
        >
          <div 
            className="w-12 h-12 bg-[#00E87A] rounded-full flex items-center justify-center text-white"
            style={{ transform: 'translateY(-8px)', boxShadow: '0 4px 12px rgba(0, 232, 122, 0.3)' }}
          >
            {icon}
          </div>
        </div>
      );
    }
    
    return (
      <div 
        onClick={() => navigate(to)}
        className="flex-1 flex flex-col items-center justify-center cursor-pointer gap-1"
      >
        <div style={{ color }}>{icon}</div>
        <span style={{ color, fontSize: '10px', fontWeight: isActive ? 600 : 400, fontFamily: 'Inter' }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-16 bg-[#111111] border-t border-[#2A2A2A] z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="w-full max-w-md mx-auto flex h-full items-center">
        <NavItem to="/home" label="Home" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        } />
        
        <NavItem to="/leaderboard" label="Board" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
        } />
        
        <NavItem to="/challenge" label="Challenge" isCenter={true} icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        } />
        
        <NavItem to="/journal" label="Journal" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        } />
        
        <NavItem to="/profile" label="Profile" icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        } />
      </div>
    </div>
  );
}
