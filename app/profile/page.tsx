'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [stats, setStats] = useState({
    watchedCount: 0,
    toWatchCount: 0,
    moviesCount: 0,
    tvCount: 0,
    totalXP: 0,
    level: 1,
    xpProgress: 0,
  });
  const [swipes, setSwipes] = useState<any[]>([]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const storedId = localStorage.getItem('potecorn_uid') || '';
      setUserId(storedId);

      const { data: watchlistData, error: watchlistError } = await supabase.from('watchlist').select('*');
      if (watchlistError) throw watchlistError;

      if (watchlistData) {
        const watched = watchlistData.filter((item) => item.status === 'watched');
        const toWatch = watchlistData.filter((item) => item.status === 'to_watch');

        const moviesWatched = watched.filter((item) => item.media_type === 'movie' || !item.media_type).length;
        const tvWatched = watched.filter((item) => item.media_type === 'tv').length;

        const xpFromWatched = watched.length * 100;
        const xpFromToWatch = toWatch.length * 20;
        const calculatedXP = xpFromWatched + xpFromToWatch;

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

      if (storedId) {
        const { data: swipesData, error: swipesError } = await supabase
          .from('user_swipes')
          .select('*')
          .eq('user_uid', storedId)
          .order('created_at', { ascending: false });

        if (!swipesError && swipesData) {
          setSwipes(swipesData);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil :', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const likedMovies = swipes.filter(s => s.action === 'liked');
  const dislikedMovies = swipes.filter(s => s.action === 'disliked');

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* HEADER DE NAVIGATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFF', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #C084FC, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mon Profil
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Mise à jour des trophées...</p>
        ) : (
          <div>
            {/* CARTE NIVEAU & XP */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.2)' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '3px solid #C084FC' }}>
                🎭
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Niveau {stats.level}</h2>
              <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{stats.totalXP} XP Cumulés</span>
              <div style={{ marginTop: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '10px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${stats.xpProgress}%`, height: '100%', backgroundColor: '#9333EA', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '10px', color: '#A1A1AA', marginTop: '6px', display: 'block' }}>Prochain niveau dans {500 - (stats.totalXP % 500)} XP</span>
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
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>✨</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#4ADE80' }}>{likedMovies.length}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Films validés</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>❌</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#EF4444' }}>{dislikedMovies.length}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Red Flags</span>
              </div>
            </div>

            {/* BADGES & HAUTS FAITS */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#C084FC', margin: '0 0 16px 0' }}>🏅 Mes Badges & Succès</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {/* Badges de base */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: stats.watchedCount >= 1 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🍿</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Premier Pas</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir vu au moins 1 film ou série</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: stats.moviesCount >= 10 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🎬</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Cinéphile Assidu</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir visionné 10 films</p>
                  </div>
                </div>

                {/* NOUVEAUX BADGES THEMATIQUES */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: likedMovies.length >= 3 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🚀</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#60A5FA' }}>Explorateur Spatial</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Valider 3 œuvres d'exploration spatiale</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: likedMovies.length >= 5 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>⏳</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#F472B6' }}>Voyageur Temporel</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Trouver 5 pépites sur le voyage dans le temps</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: likedMovies.length >= 10 ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>☢️</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#FBBF24' }}>Survivant de l'Apocalypse</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Survivre à 10 films post-apocalyptiques</p>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION HISTORIQUE DES SWIPES */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#EC4899', margin: 0 }}>🔥 Historique PoteCorn Party</h3>
                <a href="/potecorn-party" style={{ fontSize: '11px', color: '#C084FC', textDecoration: 'none', fontWeight: '600' }}>Relancer →</a>
              </div>
              {swipes.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#A1A1AA', textAlign: 'center', margin: '20px 0' }}>Aucun film swipé.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {swipes.map((item) => (
                    <div key={item.id} style={{ backgroundColor: '#18181B', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                      <div style={{ height: '140px', backgroundColor: '#27272A', position: 'relative' }}>
                        {item.poster_path ? (
                          <img src={item.poster_path} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717A', fontSize: '10px' }}>Pas d'affiche</div>
                        )}
                        <span style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: item.action === 'liked' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(239, 68, 68, 0.9)', color: '#000', padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                          {item.action === 'liked' ? '✨' : '❌'}
                        </span>
                      </div>
                      <div style={{ padding: '6px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
