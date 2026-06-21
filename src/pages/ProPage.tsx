import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

// Flutterwave public key
const FLW_PUBLIC_KEY = 'FLWPUBK_TEST-XXXX'; // Replace with real key

const PRO_FEATURES = [
  { icon: '🏃', label: 'GPS Run Tracker', free: false, pro: true },
  { icon: '✅', label: 'Unlimited Habits', free: '3 only', pro: 'Unlimited' },
  { icon: '📓', label: 'Journal History', free: '5 entries', pro: 'Unlimited' },
  { icon: '📊', label: 'Streak Analytics', free: false, pro: true },
  { icon: '🏆', label: 'Pro Badge on Profile', free: false, pro: true },
  { icon: '📤', label: 'Share Card (no watermark)', free: false, pro: true },
  { icon: '🔥', label: 'Daily Challenge', free: true, pro: true },
  { icon: '🌍', label: 'Community Feed', free: true, pro: true },
  { icon: '🥇', label: 'Leaderboard', free: true, pro: true },
];

export default function ProPage() {
  const { user, profile } = useAuth();
  const { subscription, refetch } = useSubscription();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = () => {
    if (!user || !profile) return;
    setPaying(true);

    const txRef = `fit21-${user.id}-${Date.now()}-new`;

    // Flutterwave inline popup
    // FlutterwaveCheckout is loaded via script tag in index.html
    (window as any).FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount: 1500,
      currency: 'NGN',
      payment_options: 'card',
      customer: {
        email: profile.email || `${user.id}@fit21.sbs`,
        phone_number: profile.phone || '',
        name: profile.name || 'Fit21 User',
      },
      customizations: {
        title: 'Fit21 Pro',
        description: 'Monthly Pro subscription — ₦1,500/month',
        logo: 'https://cdn-icons-png.flaticon.com/512/12563/12563330.png',
      },
      meta: {
        user_id: user.id,
        payment_type: 'new',
      },
      callback: async (response: any) => {
        console.log('Payment response:', response);
        setPaying(false);

        if (response.status === 'successful') {
          // Webhook handles DB update
          // Wait 2 seconds then refetch subscription
          setTimeout(async () => {
            await refetch();
            setSuccess(true);
          }, 2000);
        }
      },
      onclose: () => {
        setPaying(false);
      },
    });
  };

  if (success || subscription.isPro) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0A] items-center justify-center p-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="font-syne font-extrabold text-3xl text-white mb-2 text-center">
          You're Pro!
        </h1>
        <p className="text-[#666] font-inter text-center mb-2">
          Fit21 Pro is active.
        </p>
        {subscription.current_period_end && (
          <p className="text-[#00E87A] font-inter text-sm text-center mb-8">
            Renews {new Date(subscription.current_period_end)
              .toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        <button
          onClick={() => navigate('/home')}
          className="bg-[#00E87A] text-black font-bold py-4 px-10 rounded-full"
        >
          Start Using Pro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-white mr-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="font-syne font-extrabold text-xl text-white">
          Fit21 Pro
        </h1>
      </div>

      <div className="px-4 pb-32 overflow-y-auto">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#00E87A]/20 to-[#00E87A]/5
          border border-[#00E87A]/30 rounded-3xl p-6 mb-6 text-center">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="font-syne font-extrabold text-white text-2xl mb-2">
            Unlock Everything
          </h2>
          <p className="text-[#aaa] font-inter text-sm leading-relaxed">
            GPS tracking, unlimited habits, full journal history,
            Pro badge, and more.
          </p>
          <div className="mt-4">
            <span className="font-syne font-extrabold text-[#00E87A] text-4xl">
              ₦1,500
            </span>
            <span className="text-[#666] font-inter text-sm ml-1">/month</span>
          </div>
          <p className="text-[#444] font-inter text-xs mt-1">
            Auto-renews monthly. Cancel anytime.
          </p>
        </div>

        {/* Grace period warning */}
        {subscription.isGrace && (
          <div className="bg-orange-500/10 border border-orange-500/30
            rounded-2xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-orange-400 font-inter font-semibold text-sm">
                Grace Period Active
              </p>
              <p className="text-orange-300/70 font-inter text-xs mt-1">
                Your Pro subscription expired. You have 2 days of grace
                access. Renew now to keep your Pro features.
              </p>
            </div>
          </div>
        )}

        {/* Feature comparison */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden mb-6">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-[#111] px-4 py-3 border-b border-[#2A2A2A]">
            <div className="text-[#666] font-inter text-xs font-semibold">FEATURE</div>
            <div className="text-[#666] font-inter text-xs font-semibold text-center">FREE</div>
            <div className="text-[#00E87A] font-inter text-xs font-semibold text-center">PRO ⚡</div>
          </div>

          {PRO_FEATURES.map((feat, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 px-4 py-3 items-center
                ${i < PRO_FEATURES.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{feat.icon}</span>
                <span className="text-white font-inter text-xs leading-tight">
                  {feat.label}
                </span>
              </div>
              <div className="text-center">
                {feat.free === true ? (
                  <span className="text-[#00E87A] text-base">✓</span>
                ) : feat.free === false ? (
                  <span className="text-[#444] text-base">✕</span>
                ) : (
                  <span className="text-[#666] font-inter text-xs">{feat.free}</span>
                )}
              </div>
              <div className="text-center">
                {feat.pro === true ? (
                  <span className="text-[#00E87A] text-base">✓</span>
                ) : (
                  <span className="text-[#00E87A] font-inter text-xs font-bold">{feat.pro}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-[#00E87A] font-syne font-bold text-lg">🔒</div>
            <div className="text-[#666] font-inter text-xs mt-1">Secure Payment</div>
          </div>
          <div className="text-center">
            <div className="text-[#00E87A] font-syne font-bold text-lg">↩️</div>
            <div className="text-[#666] font-inter text-xs mt-1">Cancel Anytime</div>
          </div>
          <div className="text-center">
            <div className="text-[#00E87A] font-syne font-bold text-lg">⚡</div>
            <div className="text-[#666] font-inter text-xs mt-1">Instant Access</div>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
        bg-[#0A0A0A] border-t border-[#2A2A2A] p-4
        pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-[#00E87A] text-black font-bold text-lg
            py-4 rounded-full disabled:opacity-60
            shadow-[0_0_30px_rgba(0,232,122,0.3)]
            transition-all active:scale-95"
        >
          {paying ? 'Opening payment...' : 'Subscribe for ₦1,500/month'}
        </button>
        <p className="text-[#444] font-inter text-xs text-center mt-2">
          Powered by Flutterwave · 100% secure
        </p>
      </div>
    </div>
  );
}
