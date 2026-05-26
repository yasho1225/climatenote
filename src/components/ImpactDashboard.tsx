import React, { useState, useEffect } from 'react';
import { Leaf, Droplets, Zap, Recycle, Users, StickyNote, TrendingUp, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface ImpactStats {
  total_co2_kg: number;
  total_plastic_g: number;
  total_water_liters: number;
  total_energy_kwh: number;
  total_notes: number;
  total_users: number;
  category_breakdown: Record<string, number>;
}

interface ImpactDashboardProps {
  userProfile: UserProfile | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  transportation: 'bg-blue-500',
  food:           'bg-green-500',
  waste:          'bg-yellow-500',
  energy:         'bg-orange-500',
  water:          'bg-cyan-500',
  shopping:       'bg-purple-500',
  other:          'bg-gray-400',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  transportation: '🚴',
  food:           '🥗',
  waste:          '♻️',
  energy:         '💡',
  water:          '💧',
  shopping:       '🛍️',
  other:          '🌿',
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const end = value;
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>;
}

export default function ImpactDashboard({ userProfile }: ImpactDashboardProps) {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [myStats, setMyStats] = useState<Partial<ImpactStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'collective' | 'mine'>('collective');

  useEffect(() => {
    loadStats();
  }, [userProfile]);

  const loadStats = async () => {
    try {
      // Collective stats via security-definer aggregate (no per-user impact leak)
      const { data: collective, error: collectiveError } = await supabase.rpc('get_collective_impact_stats');
      if (collectiveError) throw collectiveError;

      const { count: noteCount } = await supabase.from('user_notes').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });

      if (collective) {
        const breakdown = (collective.category_breakdown || {}) as Record<string, number>;
        setStats({
          total_co2_kg: collective.total_co2_kg || 0,
          total_plastic_g: collective.total_plastic_g || 0,
          total_water_liters: collective.total_water_liters || 0,
          total_energy_kwh: collective.total_energy_kwh || 0,
          total_notes: noteCount || 0,
          total_users: userCount || 0,
          category_breakdown: breakdown,
        });
      }

      // My personal stats
      if (userProfile) {
        const { data: myImpacts } = await supabase
          .from('note_impacts')
          .select('co2_saved_kg, plastic_saved_g, water_saved_liters, energy_saved_kwh')
          .eq('user_id', userProfile.id);

        if (myImpacts) {
          const myTotals = myImpacts.reduce((acc, row) => ({
            total_co2_kg:        acc.total_co2_kg + (row.co2_saved_kg || 0),
            total_plastic_g:     acc.total_plastic_g + (row.plastic_saved_g || 0),
            total_water_liters:  acc.total_water_liters + (row.water_saved_liters || 0),
            total_energy_kwh:    acc.total_energy_kwh + (row.energy_saved_kwh || 0),
          }), { total_co2_kg: 0, total_plastic_g: 0, total_water_liters: 0, total_energy_kwh: 0 });
          setMyStats({ ...myTotals, total_notes: myImpacts.length });
        }
      }
    } catch (err) {
      console.error('Error loading impact stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeStats = tab === 'collective' ? stats : myStats;

  const metricCards = [
    {
      label: 'CO₂ Saved',
      value: activeStats?.total_co2_kg || 0,
      unit: 'kg',
      decimals: 1,
      icon: <Leaf className="w-6 h-6" />,
      color: 'from-emerald-400 to-green-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      equivalent: activeStats?.total_co2_kg
        ? `≈ ${(((activeStats.total_co2_kg || 0) / 21).toFixed(0))} trees planted`
        : null,
    },
    {
      label: 'Plastic Prevented',
      value: (activeStats?.total_plastic_g || 0) / 1000,
      unit: 'kg',
      decimals: 2,
      icon: <Recycle className="w-6 h-6" />,
      color: 'from-yellow-400 to-orange-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      equivalent: activeStats?.total_plastic_g
        ? `≈ ${Math.round((activeStats.total_plastic_g || 0) / 10)} plastic bags`
        : null,
    },
    {
      label: 'Water Saved',
      value: activeStats?.total_water_liters || 0,
      unit: 'L',
      decimals: 0,
      icon: <Droplets className="w-6 h-6" />,
      color: 'from-cyan-400 to-blue-500',
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      equivalent: activeStats?.total_water_liters
        ? `≈ ${Math.round((activeStats.total_water_liters || 0) / 150)} showers saved`
        : null,
    },
    {
      label: 'Energy Saved',
      value: activeStats?.total_energy_kwh || 0,
      unit: 'kWh',
      decimals: 1,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-orange-400 to-red-500',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      equivalent: activeStats?.total_energy_kwh
        ? `≈ ${Math.round((activeStats.total_energy_kwh || 0) / 1.2)} phone charges`
        : null,
    },
  ];

  const totalActions = Object.values(stats?.category_breakdown || {}).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Calculating impact...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
          <Globe className="w-4 h-4" />
          <span>Real Environmental Impact</span>
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
      )}

      {/* Platform Totals (collective only) */}
      {tab === 'collective' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                <AnimatedNumber value={stats?.total_users || 0} />
              </p>
              <p className="text-xs text-gray-500">Climate Champions</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <StickyNote className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                <AnimatedNumber value={stats?.total_notes || 0} />
              </p>
              <p className="text-xs text-gray-500">Actions Committed</p>
            </div>
          </div>
        </div>
      )}

      {/* Impact Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`${card.text} opacity-80`}>{card.icon}</span>
              <span className={`text-xs font-medium ${card.text} opacity-60`}>{card.unit}</span>
            </div>
            <p className={`text-2xl font-bold ${card.text}`}>
              <AnimatedNumber value={card.value} decimals={card.decimals} />
            </p>
            <p className={`text-xs font-semibold ${card.text}`}>{card.label}</p>
            {card.equivalent && (
              <p className="text-xs text-gray-500">{card.equivalent}</p>
            )}
          </div>
        ))}
      </div>

      {/* Category Breakdown (collective only) */}
      {tab === 'collective' && stats && Object.keys(stats.category_breakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>What Our Community Is Doing</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.category_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const pct = Math.round((count / totalActions) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 capitalize flex items-center space-x-1">
                        <span>{CATEGORY_EMOJIS[category] || '🌿'}</span>
                        <span>{category}</span>
                      </span>
                      <span className="text-gray-400">{count} actions · {pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-400'} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty state for personal stats */}
      {tab === 'mine' && (!myStats || myStats.total_notes === 0) && (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🌱</div>
          <p className="text-gray-500 font-medium">Your impact journey starts with your first note!</p>
          <p className="text-gray-400 text-sm">Every action you commit to gets calculated here.</p>
        </div>
      )}

      {/* Note about AI calculation */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">How we calculate impact</p>
        <p>Your notes are analyzed by AI and matched to research-backed formulas from EPA, IPCC, and other trusted sources. Low-confidence results are reviewed by our team before counting.</p>
      </div>
    </div>
  );
}
