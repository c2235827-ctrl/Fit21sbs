import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type SubStatus = 'free' | 'pro' | 'grace' | 'expired' | null;

export interface Subscription {
  status: SubStatus;
  current_period_end: string | null;
  grace_period_end: string | null;
  isPro: boolean;
  isGrace: boolean;
  daysLeft: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    status: null,
    current_period_end: null,
    grace_period_end: null,
    isPro: false,
    isGrace: false,
    daysLeft: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const periodEnd = data.current_period_end
      ? new Date(data.current_period_end)
      : null;
    const graceEnd = data.grace_period_end
      ? new Date(data.grace_period_end)
      : null;

    const isPro =
      (data.status === 'pro' && periodEnd && periodEnd > now) ||
      (data.status === 'grace' && graceEnd && graceEnd > now) ||
      false;

    const isGrace =
      data.status === 'grace' && graceEnd && graceEnd > now || false;

    // Days left calculation
    let daysLeft = 0;
    if (isPro && periodEnd) {
      const diff = periodEnd.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    setSubscription({
      status: data.status,
      current_period_end: data.current_period_end,
      grace_period_end: data.grace_period_end,
      isPro,
      isGrace,
      daysLeft,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return { subscription, loading, refetch: fetchSubscription };
}
