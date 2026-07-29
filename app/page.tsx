'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRandomMovie = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b'; 
      
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=fr-FR&page=1`
      );
      
      if (!response.ok) throw new Error("Erreur réseau TMDB");

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomData = data.results[randomIndex];

        setMovie({
          id: randomData.id.toString(),
          title: randomData.title,
          year: randomData.release_date ? randomData.release_date.substring(0, 4) : 'N/A',
          rating: randomData.vote_average ? randomData.vote_average.toFixed(1) : 'N/A',
          poster: randomData.poster_path ? `https://image.tmdb.org/t/p/w500${randomData.poster_path}` : '',
          overview: randomData.overview || "Aucun synopsis disponible en français.",
        });
      }
    } catch (error) {
      console.error("Erreur avec TMDB :", error);
    }
    setLoading(false);
  };

  const saveToSupabase = async (status: 'to_watch' | 'watched') => {
    if (!movie) return;
    setSaving(true);
    setFeedback(null);

    try {
      const { error } = await supabase.from('watchlist').insert([
        {
          movie_id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
          vote_average: parseFloat(movie.rating),
          status: status,
        },
      ]);

      if (error) throw error;

      setFeedback(status === 'to_watch' ? '📌 Ajouté à la Watchlist !' : '👁️ Marqué comme vu !');
    } catch (err: any) {
      console.error("Erreur Supabase :", err);
      setFeedback('⚠️ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchRandomMovie();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header CineMatch */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #C084FC, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          CineMatch 🎬
        </h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '6px' }}>IA & Recommandations Séries / Films</p>
      </div>

      {/* Carte Apple Glassmorphism */}
      <div style={{ width: '100%', maxWidth: '360px', borderRadius: '24px', backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '20px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        
        {loading || !movie ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#A1A1AA' }}>
            ⏳ Recherche du film parfait...
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#FBBF24' }}>
                🎰 Mode Roulette
              </span>
              <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                ★ {movie.rating} / 10
              </span>
            </div>

            {/* Poster */}
            <div style={{ position: 'relative', height: '260px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', backgroundColor: '#18181B' }}>
              {movie.poster ? (
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A1A1AA' }}>Affiche indisponible</div>
              )}
            </div>

            {/* Titre & Info */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
              {movie.title} <span style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: '400' }}>({movie.year})</span>
            </h2>

            {/* Synopsis */}
            <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.5', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {movie.overview}
            </p>

            {/* Message de confirmation */}
            {feedback && (
              <div style={{ fontSize: '12px', textAlign: 'center', marginBottom: '12px', padding: '6px', backgroundColor: 'rgba(192, 132, 252, 0.1)', color: '#C084FC', borderRadius: '8px' }}>
                {feedback}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={saving}
                  onClick={() => saveToSupabase('watched')}
                  style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '600', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  👁️ Vu
                </button>
                <button 
                  disabled={saving}
                  onClick={() => saveToSupabase('to_watch')}
                  style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '700', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  📌 Watchlist
                </button>
              </div>

              <button 
                onClick={fetchRandomMovie}
                style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#A1A1AA', fontSize: '12px', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              >
                🔄 Relancer un autre film
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lien Profil */}
      <a href="/profile" style={{ marginTop: '24px', fontSize: '12px', color: '#C084FC', textDecoration: 'none', fontWeight: '600' }}>
        👤 Voir mon Profil Utilisateur & Badges →
      </a>
    </main>
  );
}
