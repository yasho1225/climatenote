import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Flame, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { getMasteryLevel } from '../lib/userDisplay';
import { getAppDateRange } from '../lib/appTimezone';

interface ImpactDashboardProps {
  userProfile: UserProfile | null;
}

export default function ImpactDashboard({ userProfile }: ImpactDashboardProps) {
  const [waterLiters, setWaterLiters] = useState(0);
  const [co2Kg, setCo2Kg] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMyStats = useCallback(async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }
    try {
      const { start, end } = getAppDateRange('monthly');
      const { data } = await supabase
        .from('note_impacts')
        .select('co2_saved_kg, water_saved_liters, created_at')
        .eq('user_id', userProfile.id)
        .eq('needs_review', false)
        .gte('created_at', start)
        .lte('created_at', end);

      if (data) {
        setCo2Kg(data.reduce((sum, r) => sum + (r.co2_saved_kg || 0), 0));
        setWaterLiters(data.reduce((sum, r) => sum + (r.water_saved_liters || 0), 0));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error loading impact stats:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void loadMyStats();
    const onRefresh = () => void loadMyStats();
    window.addEventListener('app-became-active', onRefresh);
    return () => window.removeEventListener('app-became-active', onRefresh);
  }, [loadMyStats]);

  const mastery = getMasteryLevel(userProfile?.total_notes || 0);
  const xpPercent = Math.round((mastery.xp / mastery.xpMax) * 100);

  if (loading) {
    return (
      <div className="app-screen py-16 text-center">
        <div className="animate-pulse text-ink-muted text-sm font-medium">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="app-screen space-y-4">
      <div className="app-card p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-ink-soft leading-relaxed">
          <strong className="text-ink">Estimated impact only.</strong> Figures are modeled from your
          action notes using published averages — not verified measurements. High-confidence
          classifications only (≥70%).
        </p>
      </div>

      <div className="app-feature-card text-center py-7">
        <p className="text-[10px] font-bold tracking-[0.14em] text-sage-600 uppercase mb-1">
          Activity Level
        </p>
        <h2 className="text-xl font-bold text-ink">
          Level {mastery.level}: {mastery.title}
        </h2>
        <p className="text-xs text-ink-muted mt-1">{userProfile?.total_notes || 0} notes logged</p>
        <div className="mt-4 flex items-center gap-3 px-2">
          <div className="flex-1 h-2.5 bg-white/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-ink whitespace-nowrap">
            {mastery.xp} / {mastery.xpMax} XP
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="app-card p-4">
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5 text-sky-600" strokeWidth={2} aria-hidden />
          </div>
          <p className="text-xs text-ink-muted font-medium">Est. water impact</p>
          <p className="text-2xl font-bold text-ink mt-0.5">
            {waterLiters >= 1000 ? `${(waterLiters / 1000).toFixed(0)}k` : Math.round(waterLiters)}L
          </p>
          <p className="text-[10px] text-ink-muted mt-1">This month · modeled</p>
        </div>
        <div className="app-card p-4">
          <div className="w-10 h-10 rounded-full bg-terracotta-light flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold text-terracotta">CO₂</span>
          </div>
          <p className="text-xs text-ink-muted font-medium">Est. CO₂ impact</p>
          <p className="text-2xl font-bold text-earth mt-0.5">
            {co2Kg < 1 ? co2Kg.toFixed(1) : Math.round(co2Kg)}kg
          </p>
          <p className="text-[10px] text-ink-muted mt-1">This month · modeled</p>
        </div>
      </div>

      <div className="app-card px-5 py-4 flex items-center justify-between">
        <span className="font-bold text-ink">Activity Streak</span>
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-orange-500" strokeWidth={2} aria-hidden />
          <span className="font-bold text-ink">{userProfile?.streak || 0} Days</span>
        </div>
      </div>
    </div>
  );
}
