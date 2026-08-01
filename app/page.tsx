'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';

  useEffect(() => {
    setIsMounted(true);

    const initHome = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}&language=fr-FR`);
        const data = await res.json();
        if (data.results) setTrendingMovies(data.results);
      } catch (err) {
        console.error('Erreur chargement tendances:', err);
      }

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

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) setSearchResults(data.results);
    } catch (err) {
      console.error('Erreur recherche:', err);
    }
  };

  if (!isMounted) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {announcement && (
          <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📢</span>
            <p style={{ fontSize: '13px', color: '#FBCFE8', margin: 0, fontWeight: '700', lineHeight: '1.4' }}>{announcement}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🍿 PoteCorn
            </h1>
            <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>Trouve le film parfait en solo ou en duo</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/profile" style={{ backgroundColor: '#27272A', color: '#FFF', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>Profil 👤</a>
            <a href="/playlists" style={{ backgroundColor: '#27272A', color: '#FFF', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>Playlists 📂</a>
            <a href="/backstage" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid rgba(251, 191, 36, 0.3)' }}>Backstage 🛠️</a>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <a href="/potecorn-party" style={{ display: 'block', background: 'linear-gradient(135deg, #9333EA, #EC4899)', borderRadius: '20px', padding: '20px', textDecoration: 'none', color: '#FFF', boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>🔥</span>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>Lancer une PoteCorn Party</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Swipe en solo ou rejoins un salon duo !</p>
          </a>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Rechercher un film..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '0 18px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>🔍</button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#EC4899', marginBottom: '10px' }}>Résultats de recherche</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {searchResults.map((movie) => (
                  <MovieCardWithPlaylist key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#FBBF24', marginBottom: '14px' }}>🔥 Tendances du Jour</h2>
          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            {trendingMovies.map((movie) => (
              <div key={movie.id} style={{ minWidth: '130px', maxWidth: '130px', flexShrink: 0 }}>
                <MovieCardWithPlaylist movie={movie} isCarousel />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

// Composant interne intégré pour gérer l'ajout aux playlists sans erreur de fichier externe
function MovieCardWithPlaylist({ movie, isCarousel = false }: { movie: any; isCarousel?: boolean }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchPl = async () => {
      const { data } = await supabase.from('playlists').select('*');
      if (data) setPlaylists(data);
    };
    fetchPl();
  }, []);

  const handleAdd = async (e: React.MouseEvent, playlistId: number) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const { error } = await supabase.from('playlist_movies').insert([
        {
          playlist_id: playlistId,
          tmdb_id: movie.id.toString(),
          title: movie.title,
          poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
        }
      ]);

      if (error) throw error;
      alert('Film ajouté à la playlist ! ✨');
      setShowDropdown(false);
    } catch (err) {
      alert('Ce film est déjà dans cette playlist.');
    }
  };

  return (
    <div style={{ backgroundColor: '#18181B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', width: isCarousel ? '130px' : '100%' }}>
      
      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
        <button 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDropdown(!showDropdown); }}
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
        >
          📂 +
        </button>

        {showDropdown && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '10px', minWidth: '150px', zIndex: 999, boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}>
            <p style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Ajouter à :</p>
            {playlists.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#71717A', margin: 0 }}>Aucune playlist</p>
            ) : (
              playlists.map((pl) => (
                <div 
                  key={pl.id} 
                  onClick={(e) => handleAdd(e, pl.id)}
                  style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', background: '#27272A' }}
                >
                  <span>{pl.icon || '🎬'}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.title}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450'} alt={movie.title} style={{ width: '100%', height: isCarousel ? '180px' : '200px', objectFit: 'cover' }} />
      <div style={{ padding: '10px' }}>
        <h4 style={{ fontSize: isCarousel ? '12px' : '13px', fontWeight: '800', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h4>
        {isCarousel && <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: '700' }}>★ {movie.vote_average?.toFixed(1)}</span>}
      </div>
    </div>
  );
}
