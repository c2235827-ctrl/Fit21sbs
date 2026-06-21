import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default function ProGate({ children, feature }: ProGateProps) {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return <>{children}</>;

  if (!subscription.isPro) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6
        flex flex-col items-center text-center">
        <div className="text-4xl mb-3">⚡</div>
        <h3 className="font-syne font-bold text-white text-lg mb-2">
          {feature || 'This feature'} is Pro only
        </h3>
        <p className="text-[#666] font-inter text-sm mb-4 leading-relaxed">
          Upgrade to Fit21 Pro for ₦1,500/month and unlock this
          and all other Pro features.
        </p>
        <button
          onClick={() => navigate('/pro')}
          className="bg-[#00E87A] text-black font-bold py-3 px-8 rounded-full text-sm"
        >
          Upgrade to Pro ⚡
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
