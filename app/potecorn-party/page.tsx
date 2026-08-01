'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PoteCornPartyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'menu' | 'solo' | 'duo'>('menu');
  const [userId, setUserId] = useState<string>('');

  const [swipeQueue, setSwipeQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [animatingDir, setAnimatingDir] = useState<'left' | 'right' | null>(null);

  // Nouvelles fonctionnalités (Famille, Trailer, Plateformes)
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  // Variables pour le suivi du doigt
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';

  useEffect(() => {
    setIsMounted(true);
    let storedId = localStorage.getItem('potecorn_uid');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('potecorn_uid', storedId);
    }
    setUserId(storedId);
  }, []);

  const fetchRandomMoviesForSwipe = async () => {
    setLoadingMovies(true);
    try {
      const randomPage = Math.floor(Math.random() * 20) + 1;
      // Ajout du filtre Famille/Animation
      const familyFilter = isFamilyMode ? '&with_genres=16,10751' : '';
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${randomPage}${familyFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const shuffled = [...data.results].sort(() => 0.5 - Math.random());
        setSwipeQueue(shuffled);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Erreur chargement swipe:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  // Recharger les films si on active/désactive le mode famille
  useEffect(() => {
    if (mode === 'solo') {
      fetchRandomMoviesForSwipe();
    }
  }, [mode, isFamilyMode]);

  // Charger les détails du film actuel (Trailer & Plateformes en France)
  useEffect(() => {
    const fetchMovieDetails = async () => {
      const currentMovie = swipeQueue[currentIndex];
      if (!currentMovie) return;

      setTrailerKey(null);
      setProviders([]);

      try {
        // Fetch Plateformes (Focus sur la région FR)
        const provRes = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/watch/providers?api_key=${API_KEY}`);
        const provData = await provRes.json();
        if (provData.results && provData.results.FR && provData.results.FR.flatrate) {
          setProviders(provData.results.FR.flatrate.slice(0, 3)); // Garde les 3 premiers
        }

        // Fetch Trailer
        const vidRes = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/videos?api_key=${API_KEY}&language=fr-FR`);
        const vidData = await vidRes.json();
        const trailer = vidData.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        
        // Fallback sur l'anglais si pas de trailer en FR
        if (!trailer) {
          const vidResEn = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/videos?api_key=${API_KEY}`);
          const vidDataEn = await vidResEn.json();
          const trailerEn = vidDataEn.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
          if (trailerEn) setTrailerKey(trailerEn.key);
        } else {
          setTrailerKey(trailer.key);
        }

      } catch (err) {
        console.error('Erreur détails film:', err);
      }
    };

    if (swipeQueue.length > 0) {
      fetchMovieDetails();
    }
  }, [currentIndex, swipeQueue]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (animatingDir) return;
    setAnimatingDir(direction);
    setIsDragging(false);
    setShowTrailer(false);

    const currentMovie = swipeQueue[currentIndex];
    if (currentMovie && userId) {
      const actionType = direction === 'right' ? 'liked' : 'disliked';
      
      try {
        await supabase.from('user_swipes').insert([
          {
            user_uid: userId,
            movie_id: currentMovie.id.toString(),
            title: currentMovie.title,
            poster_path: currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : null,
            action: actionType
          }
        ]);
      } catch (err) {
        console.error('Erreur sauvegarde swipe Supabase:', err);
      }
    }

    setTimeout(() => {
      setAnimatingDir(null);
      setTouchDeltaX(0);
      if (currentIndex < swipeQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        fetchRandomMoviesForSwipe();
      }
    }, 300);
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (showTrailer) return; // Désactiver le swipe si on regarde le trailer
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || showTrailer) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const onTouchEnd = () => {
    if (!isDragging || showTrailer) return;
    setIsDragging(false);

    if (touchDeltaX > 90) handleSwipe('right');
    else if (touchDeltaX < -90) handleSwipe('left');
    else setTouchDeltaX(0);
  };

  if (!isMounted) return null;

  const currentMovie = swipeQueue[currentIndex];
  const rotation = touchDeltaX * 0.08;

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      <style jsx global>{`
        @keyframes swipeLeft { to { transform: translateX(-120vw) rotate(-30deg); opacity: 0; } }
        @keyframes swipeRight { to { transform: translateX(120vw) rotate(30deg); opacity: 0; } }
        .animate-swipe-left { animation: swipeLeft 0.3s forwards ease-in; }
        .animate-swipe-right { animation: swipeRight 0.3s forwards ease-in; }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#EC4899', textTransform: 'uppercase' }}>Mode Interactif</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 0 0' }}>🔥 PoteCorn Party</h1>
          </div>
          <a href="/" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
            ← Accueil
          </a>
        </div>

        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
            <div 
              onClick={() => setMode('solo')}
              style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '20px', padding: '24px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👤📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Solo</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>Entraîne l'IA en swipant les affiches.</p>
            </div>

            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', opacity: 0.6 }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🍿👥</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Duo <span style={{ fontSize: '10px', backgroundColor: '#3F3F46', padding: '2px 6px', borderRadius: '6px', marginLeft: '6px' }}>Bientôt</span></h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>Trouve le film parfait à deux.</p>
            </div>
          </div>
        )}

        {mode === 'solo' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                ← Quitter
              </button>
              
              {/* TOGGLE MODE FAMILLE */}
              <button 
                onClick={() => setIsFamilyMode(!isFamilyMode)}
                style={{ 
                  backgroundColor: isFamilyMode ? '#4ADE80' : 'rgba(255,255,255,0.1)', 
                  color: isFamilyMode ? '#000' : '#FFF', 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isFamilyMode ? '🧸 Mode Famille ON' : '🧸 Mode Famille'}
              </button>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '460px', overflow: 'hidden' }}>
              
              {loadingMovies ? (
                <div style={{ textAlign: 'center', color: '#A1A1AA' }}><span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🍿</span><p>Recherche de pépites...</p></div>
              ) : currentMovie ? (
                <div
                  className={animatingDir === 'left' ? 'animate-swipe-left' : animatingDir === 'right' ? 'animate-swipe-right' : ''}
                  onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                  onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd}
                  style={{ 
                    width: '100%', maxWidth: '340px', backgroundColor: '#18181B', borderRadius: '24px', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                    position: 'absolute', cursor: 'grab', userSelect: 'none', touchAction: 'none',
                    transform: animatingDir ? undefined : `translateX(${touchDeltaX}px) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease',
                    zIndex: 10
                  }}
                >
                  {/* TAMPONS VISUELS */}
                  {touchDeltaX > 20 && <div style={{ position: 'absolute', top: '30px', left: '20px', zIndex: 20, border: '4px solid #4ADE80', color: '#4ADE80', padding: '8px 16px', borderRadius: '12px', fontSize: '20px', fontWeight: '900', transform: 'rotate(-15deg)', backgroundColor: 'rgba(0,0,0,0.7)', opacity: Math.min(touchDeltaX / 80, 1) }}>✨ JE VALIDE</div>}
                  {touchDeltaX < -20 && <div style={{ position: 'absolute', top: '30px', right: '20px', zIndex: 20, border: '4px solid #EF4444', color: '#EF4444', padding: '8px 16px', borderRadius: '12px', fontSize: '20px', fontWeight: '900', transform: 'rotate(15deg)', backgroundColor: 'rgba(0,0,0,0.7)', opacity: Math.min(Math.abs(touchDeltaX) / 80, 1) }}>❌ RED FLAG</div>}

                  <div style={{ position: 'relative', height: '460px' }}>
                    
                    {/* AFFICHAGE TRAILER OU IMAGE */}
                    {showTrailer && trailerKey ? (
                      <iframe 
                        width="100%" height="100%" 
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=0`} 
                        frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
                        style={{ pointerEvents: 'auto', backgroundColor: '#000' }}
                      />
                    ) : (
                      <img src={currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : 'https://via.placeholder.com/340x460'} alt={currentMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    )}

                    {!showTrailer && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, rgba(24,24,27,1), rgba(24,24,27,0))', pointerEvents: 'none' }} />
                    )}
                    
                    {!showTrailer && (
                      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', pointerEvents: 'none' }}>
                        
                        {/* PLATEFORMES DE STREAMING */}
                        {providers.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {providers.map((p: any) => (
                              <img key={p.provider_id} src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
                            ))}
                          </div>
                        )}

                        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                          {currentMovie.title}
                        </h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.9)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>★ {currentMovie.vote_average?.toFixed(1)}</span>
                            <span style={{ color: '#D4D4D8', fontSize: '12px', fontWeight: '600' }}>{currentMovie.release_date?.split('-')[0]}</span>
                          </div>
                          
                          {/* BOUTON TRAILER */}
                          {trailerKey && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }}
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', pointerEvents: 'auto' }}
                            >
                              ▶ Trailer
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BOUTON FERMER TRAILER */}
                    {showTrailer && (
                      <button onClick={(e) => { e.stopPropagation(); setShowTrailer(false); }} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30, pointerEvents: 'auto' }}>
                        ✕
                      </button>
                    )}

                  </div>
                </div>
              ) : null}
            </div>

            {/* BOUTONS ACTION */}
            {!loadingMovies && currentMovie && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px', marginTop: '20px' }}>
                <button onClick={() => handleSwipe('left')} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid #EF4444', color: '#EF4444', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20 }}>❌</button>
                <button onClick={() => handleSwipe('right')} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '2px solid #4ADE80', color: '#4ADE80', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20 }}>✨</button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
