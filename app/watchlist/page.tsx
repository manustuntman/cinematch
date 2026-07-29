'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function WatchlistPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('watchlist').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setMovies(data);
    }
    setLoading(false);
  };

  const removeMovie = async (id: string) => {
    await supabase.from('watchlist').delete().eq('id', id);
    fetchWatchlist();
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#A1A1AA', fontSize: '12px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>← Retour à la roulette</a>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 20px 0', background: 'linear-gradient(to right, #C084FC, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📌 Ma Watchlist ({movies.length})
        </h1>

        {loading ? (
          <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '40px 0' }}>Chargement de tes films...</p>
        ) : movies.length === 0 ? (
          <p style={{ color: '#A1A1AA', textAlign: 'center', padding: '40px 0' }}>Aucun film enregistré pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
            {movies.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={item.poster_path} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 4px 0' }}>{item.title}</h3>
                    <span style={{ fontSize: '10px', color: item.status === 'watched' ? '#10B981' : '#FBBF24', fontWeight: '700' }}>
                      {item.status === 'watched' ? '👁️ Vu' : '📌 À voir'}
                    </span>
                  </div>
                  <button onClick={() => removeMovie(item.id)} style={{ marginTop: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: 'none', fontSize: '10px', padding: '6px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
