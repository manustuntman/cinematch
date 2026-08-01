'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';

  useEffect(() => {
    setIsMounted(true);

    const initHome = async () => {
      // 1. Session utilisateur
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // 2. Charger les tendances TMDB
      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}&language=fr-FR`);
        const data = await res.json();
        if (data.results) {
          setTrendingMovies(data.results);
        }
      } catch (err) {
        console.error('Erreur chargement tendances:', err);
      }

      // 3. Charger les annonces du Mégaphone
      try {
        const { data: annData } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (annData && annData.length > 0) {
          setAnnouncement(annData[0].message);
        }
      } catch (err) {
        console.error('Erreur chargement annonce:', err);
      }
    };

    initHome();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Erreur recherche:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* BANNIÈRE MÉGAPHONE (ANNONCE OFFICIELLE) */}
        {announcement && (
          <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📢</span>
            <p style={{ fontSize: '13px', color: '#FBCFE8', margin: 0, fontWeight: '700', lineHeight: '1.4' }}>{announcement}</p>
          </div>
        )}

        {/* EN-TÊTE ET NAVIGATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🍿 PoteCorn
            </h1>
            <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>Trouve le film parfait en solo ou en duo</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/profile" style={{ backgroundColor: '#27272A', color: '#FFF', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              Profil 👤
            </a>
            <a href="/playlists" style={{ backgroundColor: '#27272A', color: '#FFF', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              Playlists 📂
            </a>
            <a href="/backstage" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
              Backstage 🛠️
            </a>
          </div>
        </div>

        {/* BOUTON PRINCIPAL SWIPE PARTY */}
        <div style={{ marginBottom: '30px' }}>
          <a href="/potecorn-party" style={{ display: 'block', background: 'linear-gradient(135deg, #9333EA, #EC4899)', borderRadius: '20px', padding: '20px', textDecoration: 'none', color: '#FFF', boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>🔥</span>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>Lancer une PoteCorn Party</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Swipe en solo ou rejoins un salon duo !</p>
          </a>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Rechercher un film..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '0 18px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              🔍
            </button>
          </form>

          {/* RÉSULTATS DE RECHERCHE */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#EC4899', marginBottom: '10px' }}>Résultats de recherche</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {searchResults.map((movie) => (
                  <div key={movie.id} style={{ backgroundColor: '#18181B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                      <AddToPlaylistButton movie={{ id: movie.id, title: movie.title, poster_path: movie.poster_path }} />
                    </div>
                    <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450'} alt={movie.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TENDANCES DU JOUR (CARROUSEL / LISTE) */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#FBBF24', marginBottom: '14px' }}>🔥 Tendances du Jour</h2>
          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            {trendingMovies.map((movie) => (
              <div key={movie.id} style={{ minWidth: '130px', maxWidth: '130px', backgroundColor: '#18181B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, position: 'relative' }}>
                
                {/* BOUTON D'AJOUT RAPIDE AUX PLAYLISTS */}
                <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                  <AddToPlaylistButton movie={{ id: movie.id, title: movie.title, poster_path: movie.poster_path }} />
                </div>

                <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450'} alt={movie.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h4>
                  <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: '700' }}>★ {movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
