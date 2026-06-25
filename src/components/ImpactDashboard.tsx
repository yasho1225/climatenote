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
      <div className="app-screen py-16 text-center">
        <div className="animate-pulse text-ink-muted text-sm font-medium">Loading impact...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
          <Globe className="w-4 h-4" />
          <span>Estimated Environmental Impact</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Together We're Making a Difference</h2>
        <p className="text-gray-500">Every note you write represents a real action for the planet</p>
      </div>

      {/* Tab Switch */}
      {userProfile && (
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setTab('collective')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'collective' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
            🌍 Collective Impact
          </button>
          <button onClick={() => setTab('mine')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'mine' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
            ✨ My Impact
          </button>
        </div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-sage-600 uppercase mb-1">
          Current Mastery
        </p>
        <h2 className="text-xl font-bold text-ink">
          Level {mastery.level}: {mastery.title}
        </h2>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="app-card p-4">
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5 text-sky-600" strokeWidth={2} />
          </div>
          <p className="text-xs text-ink-muted font-medium">Water saved</p>
          <p className="text-2xl font-bold text-ink mt-0.5">
            {waterLiters >= 1000 ? `${(waterLiters / 1000).toFixed(0)}k` : Math.round(waterLiters)}L
          </p>
          <p className="text-[10px] text-ink-muted mt-1">This month</p>
        </div>
        <div className="app-card p-4">
          <div className="w-10 h-10 rounded-full bg-terracotta-light flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold text-terracotta">CO₂</span>
          </div>
          <p className="text-xs text-ink-muted font-medium">CO₂ reduced</p>
          <p className="text-2xl font-bold text-earth mt-0.5">
            {co2Kg < 1 ? co2Kg.toFixed(1) : Math.round(co2Kg)}kg
          </p>
          <p className="text-[10px] text-ink-muted mt-1">This month</p>
        </div>
      </div>

      {/* Streak */}
      <div className="app-card px-5 py-4 flex items-center justify-between">
        <span className="font-bold text-ink">Activity Streak</span>
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-orange-500" strokeWidth={2} />
          <span className="font-bold text-ink">{userProfile?.streak || 0} Days</span>
        </div>
      </div>
    </div>
  );
}
