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

const AVAILABLE_TAGS = ['Cinema 🍿', 'En solo 🎧', 'En famille 👨‍👩‍👦', 'Coup de cœur ❤️', 'À revoir 🔄'];

export default function HomePage() {
  const [preferences, setPreferences] = useState<number[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  const [nowPlayingMovies, setNowPlayingMovies] = useState<any[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<any[]>([]);
  const [rouletteMovie, setRouletteMovie] = useState<any>(null);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<any>(null);

  // Crédits, Plateformes & Bande-annonce (Trailer)
  const [movieDetailsExt, setMovieDetailsExt] = useState<{ director: string; cast: string[]; providers: any[]; trailerKey: string | null }>({
    director: '',
    cast: [],
    providers: [],
    trailerKey: null,
  });
  const [loadingExt, setLoadingExt] = useState(false);

  // Champs du Notebook / Carnet de bord
  const [userNotes, setUserNotes] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [mode, setMode] = useState<'recommendations' | 'roulette'>('recommendations');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchNowPlaying = async () => {
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=fr-FR&page=1&region=FR`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setNowPlayingMovies(data.results.slice(0, 20));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async (selectedGenres: number[]) => {
    setLoading(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const genreQuery = selectedGenres.join(',');
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&with_genres=${genreQuery}&sort_by=popularity.desc&page=1`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setRecommendedMovies(data.results.slice(0, 20));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

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
          release_date: random.release_date,
          vote_average: random.vote_average,
          poster_path: random.poster_path,
          overview: random.overview || "Aucun synopsis disponible.",
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Récupérer le Réalisateur, le Casting, les Plateformes ET la Bande-annonce (Trailer YouTube)
  const fetchMovieExtraDetails = async (movieId: string | number) => {
    setLoadingExt(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      
      // 1. Crédits (Réalisateur & Acteurs)
      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}&language=fr-FR`);
      const creditsData = await creditsRes.json();
      
      const directorObj = creditsData.crew?.find((member: any) => member.job === 'Director');
      const directorName = directorObj ? directorObj.name : 'Non renseigné';
      const topCast = creditsData.cast ? creditsData.cast.slice(0, 4).map((c: any) => c.name) : [];

      // 2. Plateformes de Streaming (France)
      const providersRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`);
      const providersData = await providersRes.json();
      const flatrate = providersData.results?.FR?.flatrate || [];

      // 3. Videos / Trailer YouTube (Recherche FR puis EN si introuvable)
      let videoRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&language=fr-FR`);
      let videoData = await videoRes.json();
      
      let trailer = videoData.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      
      if (!trailer) {
        // Fallback en anglais si pas de trailer fr
        videoRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
        videoData = await videoRes.json();
        trailer = videoData.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      }

      setMovieDetailsExt({
        director: directorName,
        cast: topCast,
        providers: flatrate,
        trailerKey: trailer ? trailer.key : null,
      });
    } catch (err) {
      console.error("Erreur détails étendus :", err);
      setMovieDetailsExt({ director: 'N/A', cast: [], providers: [], trailerKey: null });
    }
    setLoadingExt(false);
  };

  const openMovieModal = (movie: any) => {
    setSelectedMovieDetail(movie);
    setUserNotes('');
    setUserRating(0);
    setSelectedTags([]);
    fetchMovieExtraDetails(movie.id);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const saveToSupabaseWithNotebook = async (status: 'to_watch' | 'watched') => {
    if (!selectedMovieDetail) return;
    setFeedback(null);

    try {
      const { error } = await supabase.from('watchlist').insert([
        {
          movie_id: selectedMovieDetail.id.toString(),
          title: selectedMovieDetail.title,
          poster_path: selectedMovieDetail.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovieDetail.poster_path}` : selectedMovieDetail.poster,
          vote_average: parseFloat(selectedMovieDetail.vote_average || 0),
          status: status,
          user_notes: userNotes,
          user_rating: userRating,
          user_tags: selectedTags
        },
      ]);

      if (error) throw error;
      setFeedback(status === 'to_watch' ? '📌 Enregistré dans ta Watchlist !' : '📖 Carnet de bord mis à jour !');
      setSelectedMovieDetail(null);
    } catch (err) {
      setFeedback(`⚠️ Erreur lors de la sauvegarde`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    fetchNowPlaying();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #C084FC, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            CineMatch 🎬
          </h1>
          <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '4px' }}>Ton assistant cinéma & carnet de bord</p>
        </div>

        {/* Navigation Rapide */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <a href="/watchlist" style={{ color: '#C084FC', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(192, 132, 252, 0.1)', padding: '6px 14px', borderRadius: '20px' }}>📌 Ma Watchlist</a>
          <a href="/profile" style={{ color: '#FBBF24', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '6px 14px', borderRadius: '20px' }}>👤 Mon Profil & XP</a>
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000 }}>
            {feedback}
          </div>
        )}

        {/* QUESTIONNAIRE + FILMS À L'AFFICHE */}
        {!isSetupComplete ? (
          <div>
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Quels sont tes genres préférés ? 🍿</h2>
              <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '20px' }}>Sélectionne tes catégories favorites.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                {GENRES_LIST.map((g) => {
                  const selected = preferences.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        if (selected) setPreferences(preferences.filter(id => id !== g.id));
                        else setPreferences([...preferences, g.id]);
                      }}
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
                onClick={() => {
                  setIsSetupComplete(true);
                  setMode('recommendations');
                  fetchRecommendations(preferences);
                }}
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

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                🔥 À l'affiche au cinéma ({nowPlayingMovies.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                {nowPlayingMovies.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => openMovieModal(item)}
                    style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  >
                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                      <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: '700' }}>★ {item.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ACCUEIL PERSONNALISÉ */
          <div>
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '16px', marginBottom: '20px' }}>
              <button onClick={() => setMode('recommendations')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', backgroundColor: mode === 'recommendations' ? '#9333EA' : 'transparent', color: '#FFF', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>🎯 Pour toi</button>
              <button onClick={() => { setMode('roulette'); fetchRandomMovie(); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', backgroundColor: mode === 'roulette' ? '#9333EA' : 'transparent', color: '#FFF', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>🎰 Roulette Express</button>
            </div>

            {mode === 'recommendations' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                {recommendedMovies.map((item) => (
                  <div key={item.id} onClick={() => openMovieModal(item)} style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                      <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: '700' }}>★ {item.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'roulette' && rouletteMovie && (
              <div onClick={() => openMovieModal(rouletteMovie)} style={{ maxWidth: '360px', margin: '0 auto', backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '20px', cursor: 'pointer' }}>
                <img src={`https://image.tmdb.org/t/p/w500${rouletteMovie.poster_path}`} alt={rouletteMovie.title} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '16px', marginBottom: '12px' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>{rouletteMovie.title}</h2>
                <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.4' }}>{rouletteMovie.overview}</p>
              </div>
            )}
          </div>
        )}

        {/* MODALE FICHE FILM COMPLÈTE (AVEC BANDE-ANNONCE YOUTUBE 🎬) */}
        {selectedMovieDetail && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '24px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
              
              <button onClick={() => setSelectedMovieDetail(null)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: '700', zIndex: 10 }}>✕</button>

              {/* Poster + Infos */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <img src={`https://image.tmdb.org/t/p/w500${selectedMovieDetail.poster_path}`} alt={selectedMovieDetail.title} style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{selectedMovieDetail.title}</h2>
                  <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                    ★ {selectedMovieDetail.vote_average?.toFixed(1)} / 10 (TMDB)
                  </span>
                  
                  <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 4px 0' }}>
                    <strong style={{ color: '#FFF' }}>Réalisateur :</strong> {loadingExt ? 'Chargement...' : movieDetailsExt.director || 'N/A'}
                  </p>

                  <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
                    <strong style={{ color: '#FFF' }}>Casting :</strong> {loadingExt ? 'Chargement...' : movieDetailsExt.cast.length > 0 ? movieDetailsExt.cast.join(', ') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Synopsis */}
              <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {selectedMovieDetail.overview}
              </p>

              {/* Plateformes de Streaming */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>
                  📺 Disponible en streaming (FR) :
                </span>
                {loadingExt ? (
                  <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Recherche des plateformes...</span>
                ) : movieDetailsExt.providers.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {movieDetailsExt.providers.map((provider: any) => (
                      <div key={provider.provider_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                        <img src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} alt={provider.provider_name} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                        <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>{provider.provider_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Non disponible en abonnement streaming actuellement</span>
                )}
              </div>

              {/* SECTION BANDE-ANNONCE (TRAILER YOUTUBE) 🎬 */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>
                  🎬 Bande-annonce officielle :
                </span>
                {loadingExt ? (
                  <div style={{ height: '180px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontSize: '12px' }}>
                    Chargement du trailer...
                  </div>
                ) : movieDetailsExt.trailerKey ? (
                  <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${movieDetailsExt.trailerKey}`}
                      title="Bande-annonce"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#A1A1AA', fontSize: '11px', textAlign: 'center' }}>
                    Aucune bande-annonce vidéo disponible.
                  </div>
                )}
              </div>

              {/* SECTIONS NOTEBOOK 📓 */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#C084FC', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📓 Mon Carnet de Bord
                </h3>

                {/* 1. Ma Note sur 5 ⭐ */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ma Note Personnelle :</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: star <= userRating ? 1 : 0.3 }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Tags de visionnage */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Contexte & Ambiance :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {AVAILABLE_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          style={{
                            backgroundColor: active ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                            border: active ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFF',
                            fontSize: '10px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Bloc Notes Libre */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mes remarques & répliques marquantes :</label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Écris ce que tu as pensé du film..."
                    style={{
                      width: '100%',
                      height: '70px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#FFF',
                      padding: '10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('watched')}
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    👁️ Marquer comme Vu (+ Carnet)
                  </button>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('to_watch')}
                    style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    📌 Watchlist (+ Carnet)
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
