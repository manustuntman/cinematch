'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AVAILABLE_TAGS = ['Cinema 🍿', 'En solo 🎧', 'En famille 👨‍👩‍👦', 'Coup de cœur ❤️', 'À revoir 🔄'];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [movieDetailsExt, setMovieDetailsExt] = useState<{ director: string; cast: string[]; providers: any[]; trailerKey: string | null }>({
    director: '',
    cast: [],
    providers: [],
    trailerKey: null,
  });
  const [loadingExt, setLoadingExt] = useState(false);

  const [userNotes, setUserNotes] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('watchlist').select('*');
      if (error) throw error;
      if (data) setWatchlist(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchMovieExtraDetails = async (movieId: string | number, mediaType: string = 'movie') => {
    setLoadingExt(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const type = mediaType || 'movie';
      
      const creditsRes = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}/credits?api_key=${API_KEY}&language=fr-FR`);
      const creditsData = await creditsRes.json();
      
      const directorObj = type === 'movie' 
        ? creditsData.crew?.find((member: any) => member.job === 'Director')
        : creditsData.crew?.find((member: any) => member.job === 'Executive Producer');

      const directorName = directorObj ? directorObj.name : 'Non renseigné';
      const topCast = creditsData.cast ? creditsData.cast.slice(0, 4).map((c: any) => c.name) : [];

      const providersRes = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}/watch/providers?api_key=${API_KEY}`);
      const providersData = await providersRes.json();
      const flatrate = providersData.results?.FR?.flatrate || [];

      let videoRes = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}/videos?api_key=${API_KEY}&language=fr-FR`);
      let videoData = await videoRes.json();
      let trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      
      if (!trailer) {
        videoRes = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
        videoData = await videoRes.json();
        trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
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

  const openMovieModal = async (movie: any) => {
    setSelectedMovie(movie);
    setUserNotes(movie.user_notes || '');
    setUserRating(movie.user_rating || 0);
    setSelectedTags(movie.user_tags || []);
    if (movie.movie_id) {
      fetchMovieExtraDetails(movie.movie_id, movie.media_type);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const updateMovieInSupabase = async (newStatus?: 'to_watch' | 'watched') => {
    if (!selectedMovie) return;
    setFeedback(null);

    try {
      const updateData: any = {
        user_notes: userNotes,
        user_rating: userRating,
        user_tags: selectedTags,
      };
      if (newStatus) updateData.status = newStatus;

      const { error } = await supabase
        .from('watchlist')
        .update(updateData)
        .eq('id', selectedMovie.id);

      if (error) throw error;
      setFeedback('✨ Mis à jour avec succès !');
      setSelectedMovie(null);
      fetchWatchlist();
    } catch (err) {
      setFeedback('⚠️ Erreur lors de la mise à jour');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const deleteMovie = async (id: string) => {
    try {
      const { error } = await supabase.from('watchlist').delete().eq('id', id);
      if (error) throw error;
      fetchWatchlist();
      setSelectedMovie(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const watchedMovies = watchlist.filter(m => m.status === 'watched');
  const toWatchMovies = watchlist.filter(m => m.status === 'to_watch');

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', position: 'relative' }}>
        
        {/* Header */}
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
            Ma Watchlist 📌
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000 }}>
            {feedback}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Chargement de ta liste...</p>
        ) : watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#A1A1AA' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Ta liste est vide pour l'instant 📭</p>
            <p style={{ fontSize: '12px' }}>Explore l'accueil pour ajouter tes premiers films ou séries !</p>
          </div>
        ) : (
          <div>
            {/* SECTION À VOIR */}
            {toWatchMovies.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#C084FC' }}>📌 À voir ({toWatchMovies.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                  {toWatchMovies.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => openMovieModal(item)}
                      style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    >
                      <img src={item.poster_path} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                      <div style={{ padding: '10px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '700', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                        {item.user_rating > 0 && <span style={{ fontSize: '10px', color: '#FBBF24' }}>{'⭐'.repeat(item.user_rating)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION DÉJÀ VUS */}
            {watchedMovies.length > 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#FBBF24' }}>👁️ Déjà vus ({watchedMovies.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                  {watchedMovies.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => openMovieModal(item)}
                      style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    >
                      <img src={item.poster_path} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                      <div style={{ padding: '10px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '700', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                        {item.user_rating > 0 && <span style={{ fontSize: '10px', color: '#FBBF24' }}>{'⭐'.repeat(item.user_rating)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALE DE GESTION DU FILM DE LA WATCHLIST */}
        {selectedMovie && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '24px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
              
              <button onClick={() => setSelectedMovie(null)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: '700', zIndex: 10 }}>✕</button>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <img src={selectedMovie.poster_path} alt={selectedMovie.title} style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{selectedMovie.title}</h2>
                  <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                    ★ {selectedMovie.vote_average || 'N/A'}
                  </span>
                  
                  <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 4px 0' }}>
                    <strong style={{ color: '#FFF' }}>Réalisateur / Prod :</strong> {loadingExt ? 'Chargement...' : movieDetailsExt.director || 'N/A'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
                    <strong style={{ color: '#FFF' }}>Casting :</strong> {loadingExt ? 'Chargement...' : movieDetailsExt.cast.length > 0 ? movieDetailsExt.cast.join(', ') : 'N/A'}
                  </p>
                </div>
              </div>

              {movieDetailsExt.trailerKey && (
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>
                    🎬 Bande-annonce officielle :
                  </span>
                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${movieDetailsExt.trailerKey}`}
                      title="Bande-annonce"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#C084FC', margin: '0 0 12px 0' }}>
                  📓 Carnet de Bord Personnel
                </h3>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ma Note :</label>
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

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ambiance :</label>
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

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mes remarques :</label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Écris tes notes..."
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

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => updateMovieInSupabase(selectedMovie.status === 'watched' ? 'to_watch' : 'watched')}
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {selectedMovie.status === 'watched' ? '📌 Remettre à voir' : '👁️ Marquer comme Vu'}
                  </button>
                  <button 
                    onClick={() => updateMovieInSupabase()}
                    style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    💾 Enregistrer
                  </button>
                </div>

                <button 
                  onClick={() => deleteMovie(selectedMovie.id)}
                  style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  🗑️ Supprimer de la liste
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
