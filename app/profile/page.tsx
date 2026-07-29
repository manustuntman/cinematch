'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [stats, setStats] = useState({ watchedCount: 0, toWatchCount: 0, xp: 0, level: 1, rank: 'Cinéphile Débutant' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data } = await supabase.from('watchlist').select('status');
      if (data) {
        const watched = data.filter((m) => m.status === 'watched').length;
        const toWatch = data.filter((m) => m.status === 'to_watch').length;
        const totalXp = watched * 50;
        const currentLevel = Math.floor(totalXp / 100) + 1;

        let currentRank = 'Cinéphile Curieux 🍿';
        if (currentLevel >= 3) currentRank = 'Grand Cinephile 🎬';
        if (currentLevel >= 5) currentRank = 'Expert Sci-Fi & Cinéma 🚀';

        setStats({ watchedCount: watched, toWatchCount: toWatch, xp: totalXp, level: currentLevel, rank: currentRank });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '450px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#A1A1AA', fontSize: '12px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>← Retour à la roulette</a>

        {/* Profil Card */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            🎬
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Membre CineMatch</h1>
          <p style={{ color: '#FBBF24', fontSize: '13px', fontWeight: '700', margin: '0 0 20px 0' }}>{stats.rank}</p>

          {/* XP & Level */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
              <span>Niveau {stats.level}</span>
              <span style={{ color: '#C084FC' }}>{stats.xp} XP</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.xp % 100}%`, height: '100%', backgroundColor: '#9333EA', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', display: 'block' }}>{stats.watchedCount}</span>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Films Vus</span>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#FBBF24', display: 'block' }}>{stats.toWatchCount}</span>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>En Watchlist</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
