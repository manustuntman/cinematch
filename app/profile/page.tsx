'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [stats, setStats] = useState({ totalWatched: 0, totalToWatch: 0 });
  const [loading, setLoading] = useState(true);

  // Calcul du niveau et XP (1 film vu = 50 XP)
  const xp = stats.totalWatched * 50;
  const level = Math.floor(xp / 200) + 1;
  const xpNextLevel = level * 200;
  const xpProgress = Math.min((xp % 200) / 200 * 100, 100);

  // Badges cinéphile débloqués selon l'activité
  const badges = [
    { id: 1, title: '🎬 Premier Clap', desc: 'A enregistré son 1er film', unlocked: stats.totalWatched > 0 || stats.totalToWatch > 0 },
    { id: 2, title: '🍿 Grand Spectateur', desc: 'A vu 5 films ou plus', unlocked: stats.totalWatched >= 5 },
    { id: 3, title: '🔥 Collectionneur', desc: 'Plus de 10 films dans sa watchlist', unlocked: (stats.totalWatched + stats.totalToWatch) >= 10 },
    { id: 4, title: '⭐ Critique expert', desc: 'Niveau 3 atteint', unlocked: level >= 3 },
  ];

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from('watchlist').select('status');
      if (error) throw error;

      if (data) {
        const watched = data.filter(item => item.status === 'watched').length;
        const toWatch = data.filter(item => item.status === 'to_watch').length;
        setStats({ totalWatched: watched, totalToWatch: toWatch });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header avec bouton Retour propre */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <a 
            href="/" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              color: '#FFF', 
              padding: '6px 14px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: '600', 
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.15)' 
            }}
          >
            ← Retour
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #C084FC, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mon Profil & XP 👤
          </h1>
          <div style={{ width: '60px' }}></div> {/* Pour équilibrer le header */}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Chargement du profil...</p>
        ) : (
          <div>
            {/* CARTE DE NIVEAU */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px auto', border: '2px solid #FBBF24' }}>
                🏆
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Cinéphile Niveau {level}</h2>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '0 0 16px 0' }}>{xp} XP au total</p>

              {/* Barre de progression XP */}
              <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${xpProgress}%`, backgroundColor: '#FBBF24', height: '100%', transition: 'width 0.4s ease' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#A1A1AA' }}>Prochain niveau dans {xpNextLevel - xp} XP</span>
            </div>

            {/* STATISTIQUES RAPIDES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#C084FC', display: 'block', marginBottom: '4px' }}>{stats.totalWatched}</span>
                <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Films Vus 👁️</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#FBBF24', display: 'block', marginBottom: '4px' }}>{stats.totalToWatch}</span>
                <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Dans la Watchlist 📌</span>
              </div>
            </div>

            {/* BADGES DE CINÉPHILE */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>🎖️ Badges & Trophées</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  style={{
                    backgroundColor: badge.unlocked ? 'rgba(147, 51, 234, 0.15)' : 'rgba(24, 24, 27, 0.4)',
                    border: badge.unlocked ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '14px',
                    opacity: badge.unlocked ? 1 : 0.4
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: badge.unlocked ? '#FFF' : '#A1A1AA' }}>{badge.title}</h4>
                  <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0, lineHeight: '1.4' }}>{badge.desc}</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
