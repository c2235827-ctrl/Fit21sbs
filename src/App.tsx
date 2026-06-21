import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ChallengePage from './pages/ChallengePage';
import LeaderboardPage from './pages/LeaderboardPage';
import JournalPage from './pages/JournalPage';
import ProfilePage from './pages/ProfilePage';
import RunTrackerPage from './pages/RunTrackerPage';
import ProPage from './pages/ProPage';
import BottomNav from './components/BottomNav';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-50">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/12563/12563330.png" 
          width="64" height="64" 
          alt="Fit21 logo" 
          className="animate-pulse opacity-80" 
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (profile && (!profile.name || profile.name === 'Fit21 User')) {
    // If user exists but no valid name, force profile setup
    return <Navigate to="/auth" state={{ step: 3 }} />;
  }

  return (
    <div className="pb-16 min-h-screen relative flex flex-col pt-[max(0px,env(safe-area-inset-top))]">
      <main className="flex-1 w-full max-w-md mx-auto relative content-container flex flex-col">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/challenge" element={
            <ProtectedRoute>
              <ChallengePage />
            </ProtectedRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journal" element={
            <ProtectedRoute>
              <JournalPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/run-tracker" element={
            <ProtectedRoute>
              <RunTrackerPage />
            </ProtectedRoute>
          } />

          <Route path="/pro" element={
            <ProtectedRoute>
              <ProPage />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
