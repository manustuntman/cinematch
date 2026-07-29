'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    watchedCount: 0,
    toWatchCount: 0,
    moviesCount: 0,
    tvCount: 0,
    totalXP: 0,
    level: 1,
    xpProgress: 0,
  });

  const fetchProfileStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('watchlist').select('*');
      if (error) throw error;

      if (data) {
        const watched = data.filter((item) => item.status === 'watched');
        const toWatch = data.filter((item) => item.status === 'to_watch');

        // Comptage séparé des films et séries vus
        const moviesWatched = watched.filter((item) => item.media_type === 'movie' || !item.media_type).length;
        const tvWatched = watched.filter((item) => item.media_type === 'tv').length;

        // Calcul de l'XP (100 XP par film/série vu + 20 XP par élément en watchlist)
        const xpFromWatched = watched.length * 100;
        const xpFromToWatch = toWatch.length * 20;
        const calculatedXP = xpFromWatched + xpFromToWatch;

        // Système de niveau (Tous les 500 XP = 1 niveau)
        const currentLevel = Math.floor(calculatedXP / 500) + 1;
        const progressPercentage = ((calculatedXP % 500) / 500) * 100;

        setStats({
          watchedCount: watched.length,
          toWatchCount: toWatch.length,
          moviesCount: moviesWatched,
          tvCount: tvWatched,
          totalXP: calculatedXP,
          level: currentLevel,
          xpProgress: progressPercentage,
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil :', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileStats();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* HEADER DE NAVIGATION */}
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
            ← Accueil
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #C084FC, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mon Espace Cinéphile 👤
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Calcul de tes données...</p>
        ) : (
          <div>
            {/* CARTE NIVEAU & XP */}
            <div style={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              border: '1px solid rgba(192, 132, 252, 0.3)', 
              borderRadius: '24px', 
              padding: '24px', 
              marginBottom: '24px',
              textAlign: 'center',
              boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.2)'
            }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '3px solid #C084FC' }}>
                🎭
              </div>
              
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Niveau {stats.level}</h2>
              <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stats.totalXP} XP Cumulés
              </span>

              {/* JAUGE DE PROGRESSION XP */}
              <div style={{ marginTop: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '10px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${stats.xpProgress}%`, height: '100%', backgroundColor: '#9333EA', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '10px', color: '#A1A1AA', marginTop: '6px', display: 'block' }}>
                Prochain niveau dans {500 - (stats.totalXP % 500)} XP
              </span>
            </div>

            {/* GRILLE DES STATISTIQUES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>🎬</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.moviesCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Films vus</span>
              </div>

              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📺</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.tvCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Séries vues</span>
              </div>

              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📌</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.toWatchCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Dans la Watchlist</span>
              </div>

              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>🏆</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.watchedCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Total éléments vus</span>
              </div>
            </div>

            {/* BADGES & HAUTS FAITS */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#C084FC', margin: '0 0 16px 0' }}>
                🏅 Mes Badges & Succès
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Badge 1 : Premier Pas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: stats.watchedCount >= 1 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🍿</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Premier Pas</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir vu au moins 1 film ou série</p>
                  </div>
                </div>

                {/* Badge 2 : Sériephile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: stats.tvCount >= 3 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>📺</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Sériephile Averti</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir terminé au moins 3 séries</p>
                  </div>
                </div>

                {/* Badge 3 : Cinéphile Passionné */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: stats.moviesCount >= 10 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🎬</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Cinéphile Assidu</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir visionné 10 films</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
