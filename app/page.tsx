'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const GENRES_LIST = [
  { id: 878, name: 'Science-Fiction 🚀' },
  { id: 28, name: 'Action 💥' },
  { id: 53, name: 'Thriller 🔪' },
  { id: 12, name: 'Aventure 🗺️' },
  { id: 35, name: 'Comédie 😂' },
  { id: 18, name: 'Drame 🎭' },
  { id: 14, name: 'Fantastique 🧙' },
  { id: 9648, name: 'Mystère 🕵️' },
];

export default function HomePage() {
  // État du questionnaire et préférences
  const [preferences, setPreferences] = useState<number[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  // Films et UI
  const [recommendedMovies, setRecommendedMovies] = useState<any[]>([]);
  const [rouletteMovie, setRouletteMovie] = useState<any>(null);
  const [mode, setMode] = useState<'recommendations' | 'roulette'>('recommendations');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Charger les recommandations selon les genres choisis
  const fetchRecommendations = async (selectedGenres: number[]) => {
    setLoading(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const genreQuery = selectedGenres.join(',');
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&with_genres=${genreQuery}&sort_by=popularity.desc&page=1`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        setRecommendedMovies(data.results.slice(0, 8)); // Top 8 recommandations
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // 2. Lancer la roulette
  const fetchRandomMovie = async () => {
    setLoading(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const genreParam = preferences.length > 0 ? `&with_genres=${preferences.join(',')}` : '';
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc${genreParam}&page=${Math.floor(Math.random() * 5) + 1}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const random = data.results[Math.floor(Math.random() * data.results.length)];
        setRouletteMovie({
          id: random.id.toString(),
          title: random.title,
          year: random.release_date ? random.release_date.substring(0, 4) : 'N/A',
          rating: random.vote_average ? random.vote_average.toFixed(1) : 'N/A',
          poster: random.poster_path ? `https://image.tmdb.org/t/p/w500${random.poster_path}` : '',
          overview: random.overview || "Aucun synopsis disponible.",
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Basculer la sélection d'un genre
  const toggleGenre = (id: number) => {
    if (preferences.includes(id)) {
      setPreferences(preferences.filter(g => g !== id));
    } else {
      setPreferences([...preferences, id]);
    }
  };

  // Valider le questionnaire
  const handleSavePreferences = () => {
    if (preferences.length === 0) return;
    setIsSetupComplete(true);
    setMode('recommendations');
    fetchRecommendations(preferences);
  };

  // Sauvegarder dans Supabase
  const saveToSupabase = async (movieItem: any, status: 'to_watch' | 'watched') => {
    setFeedback(null);
    try {
      const { error } = await supabase.from('watchlist').insert([
        {
          movie_id: movieItem.id.toString(),
          title: movieItem.title,
          poster_path: movieItem.poster_path ? `https://image.tmdb.org/t/p/w500${movieItem.poster_path}` : movieItem.poster,
          vote_average: parseFloat(movieItem.vote_average || movieItem.rating || 0),
          status: status,
        },
      ]);
      if (error) throw error;
      setFeedback(`Ajouté à ta liste !`);
    } catch (err) {
      setFeedback(`Déjà dans ta liste`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #C084FC, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            CineMatch 🎬
          </h1>
          <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '4px' }}>Ton assistant cinéma sur-mesure</p>
        </div>

        {/* Navigation Rapide */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <a href="/watchlist" style={{ color: '#C084FC', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(192, 132, 252, 0.1)', padding: '6px 14px', borderRadius: '20px' }}>📌 Ma Watchlist</a>
          <a href="/profile" style={{ color: '#FBBF24', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '6px 14px', borderRadius: '20px' }}>👤 Mon Profil & XP</a>
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 100 }}>
            {feedback}
          </div>
        )}

        {/* --- ÉTAPE 1 : QUESTIONNAIRE DE GOÛTS --- */}
        {!isSetupComplete ? (
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Quels sont tes genres préférés ? 🍿</h2>
            <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '20px' }}>Sélectionne un ou plusieurs genres pour qu'on prépare tes recommandations.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
              {GENRES_LIST.map((g) => {
                const selected = preferences.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    style={{
                      backgroundColor: selected ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                      border: selected ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>

            <button
              disabled={preferences.length === 0}
              onClick={handleSavePreferences}
              style={{
                width: '100%',
                backgroundColor: preferences.length > 0 ? '#9333EA' : 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: preferences.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Découvrir mes recommandations ✨
            </button>
          </div>
        ) : (
          /* --- ÉTAPE 2 : ACCUEIL PERSONNALISÉ --- */
          <div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '16px', marginBottom: '20px' }}>
              <button
                onClick={() => setMode('recommendations')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', backgroundColor: mode === 'recommendations' ? '#9333EA' : 'transparent', color: '#FFF', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                🎯 Pour toi
              </button>
              <button
                onClick={() => { setMode('roulette'); fetchRandomMovie(); }}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', backgroundColor: mode === 'roulette' ? '#9333EA' : 'transparent', color: '#FFF', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                🎰 Roulette Express
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Basé sur tes critères</span>
              <button onClick={() => setIsSetupComplete(false)} style={{ background: 'none', border: 'none', color: '#C084FC', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                ✏️ Modifier mes goûts
              </button>
            </div>

            {/* VUE 1 : RECOMMANDATIONS SUR-MESURE */}
            {mode === 'recommendations' && (
              <div>
                {loading ? (
                  <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Analyse de tes goûts en cours...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {recommendedMovies.map((item) => (
                      <div key={item.id} style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                            <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: '700' }}>★ {item.vote_average?.toFixed(1)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                            <button onClick={() => saveToSupabase(item, 'watched')} style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', fontSize: '10px', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>👁️</button>
                            <button onClick={() => saveToSupabase(item, 'to_watch')} style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', fontSize: '10px', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>📌</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VUE 2 : MODE ROULETTE EXPRESS */}
            {mode === 'roulette' && (
              <div style={{ maxWidth: '360px', margin: '0 auto', backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '20px' }}>
                {loading || !rouletteMovie ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#A1A1AA' }}>⏳ Tirage au sort...</div>
                ) : (
                  <>
                    <div style={{ height: '260px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                      <img src={rouletteMovie.poster} alt={rouletteMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>{rouletteMovie.title} <span style={{ fontSize: '13px', color: '#A1A1AA' }}>({rouletteMovie.year})</span></h2>
                    <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.4', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rouletteMovie.overview}</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button onClick={() => saveToSupabase(rouletteMovie, 'watched')} style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>👁️ Vu</button>
                      <button onClick={() => saveToSupabase(rouletteMovie, 'to_watch')} style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>📌 Watchlist</button>
                    </div>
                    <button onClick={fetchRandomMovie} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#A1A1AA', padding: '8px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer' }}>🔄 Relancer un autre film</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
