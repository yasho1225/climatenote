import React, { useState, useEffect } from 'react';
import { Droplets, Flame } from 'lucide-react';
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

  useEffect(() => {
    void loadMyStats();
    const onRefresh = () => void loadMyStats();
    window.addEventListener('app-became-active', onRefresh);
    return () => window.removeEventListener('app-became-active', onRefresh);
  }, [userProfile?.id, userProfile?.total_notes]);

  const loadMyStats = async () => {
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
        .gte('created_at', start)
        .lte('created_at', end);

      if (data) {
        setCo2Kg(data.reduce((sum, r) => sum + (r.co2_saved_kg || 0), 0));
        setWaterLiters(data.reduce((sum, r) => sum + (r.water_saved_liters || 0), 0));
      }
    } catch (err) {
      console.error('Error loading impact stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const mastery = getMasteryLevel(userProfile?.total_notes || 0);
  const xpPercent = Math.round((mastery.xp / mastery.xpMax) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sage-600 text-sm">Loading impact...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-6 space-y-4 pt-2">
      {/* Mastery card */}
      <div className="card-highlight text-center">
        <div className="w-36 h-36 mx-auto mb-4 rounded-full bg-gradient-to-b from-sky-200 to-sage-300 flex items-center justify-center shadow-card border-4 border-white/60">
          <span className="text-6xl" role="img" aria-label="Planet">🌍</span>
        </div>
        <p className="text-[10px] font-bold tracking-widest text-sage-700 uppercase mb-1">
          Current Mastery
        </p>
        <h2 className="text-xl font-bold text-forest">
          Level {mastery.level}: {mastery.title}
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-forest whitespace-nowrap">
            {mastery.xp} / {mastery.xpMax} XP
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-surface p-4">
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-xs text-sage-600">Water saved</p>
          <p className="text-2xl font-bold text-forest mt-0.5">
            {waterLiters >= 1000 ? `${(waterLiters / 1000).toFixed(0)}k` : Math.round(waterLiters)}L
          </p>
          <p className="text-[10px] text-sage-400 mt-1">This month</p>
        </div>
        <div className="card-surface p-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <span className="text-xs font-bold text-earth">CO₂</span>
          </div>
          <p className="text-xs text-sage-600">CO₂ reduced</p>
          <p className="text-2xl font-bold text-earth mt-0.5">
            {co2Kg < 1 ? co2Kg.toFixed(1) : Math.round(co2Kg)}kg
          </p>
          <p className="text-[10px] text-sage-400 mt-1">This month</p>
        </div>
      </div>

      {/* Streak card */}
      <div className="card-surface px-5 py-4 flex items-center justify-between">
        <span className="font-bold text-forest">Activity Streak</span>
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-forest">{userProfile?.streak || 0} Days</span>
        </div>
      </div>
    </div>
  );
}
