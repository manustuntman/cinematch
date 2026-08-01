'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PoteCornPartyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'menu' | 'solo' | 'duo_setup' | 'duo'>('menu');
  const [userId, setUserId] = useState<string>('');
  
  // Gestion du Mode Duo
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedMovie, setMatchedMovie] = useState<any>(null);
  const [isAddedToWatchlist, setIsAddedToWatchlist] = useState(false);

  const [swipeQueue, setSwipeQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [animatingDir, setAnimatingDir] = useState<'left' | 'right' | null>(null);

  // Fonctionnalités précédentes
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  // Variables tactile
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
      const familyFilter = isFamilyMode ? '&with_genres=16,10751' : '';
      const excludedKeywords = '9714,212999,273611'; 
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${randomPage}${familyFilter}&without_keywords=${excludedKeywords}`;
      
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

  useEffect(() => {
    if (mode === 'solo' || mode === 'duo') {
      fetchRandomMoviesForSwipe();
    }
  }, [mode, isFamilyMode]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      const currentMovie = swipeQueue[currentIndex];
      if (!currentMovie) return;

      setTrailerKey(null);
      setProviders([]);

      try {
        const provRes = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/watch/providers?api_key=${API_KEY}`);
        const provData = await provRes.json();
        if (provData.results && provData.results.FR && provData.results.FR.flatrate) {
          setProviders(provData.results.FR.flatrate.slice(0, 3));
        }

        const vidRes = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/videos?api_key=${API_KEY}&language=fr-FR`);
        const vidData = await vidRes.json();
        const trailer = vidData.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        
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

  const joinRoom = () => {
    if (roomCodeInput.trim().length > 0) {
      setActiveRoom(roomCodeInput.trim().toUpperCase());
      setMode('duo');
    }
  };

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
            action: actionType,
            room_code: activeRoom || null
          }
        ]);

        if (actionType === 'liked' && activeRoom) {
          const { data: matchData, error: matchError } = await supabase
            .from('user_swipes')
            .select('*')
            .eq('room_code', activeRoom)
            .eq('movie_id', currentMovie.id.toString())
            .eq('action', 'liked')
            .neq('user_uid', userId);

          if (matchData && matchData.length > 0) {
            setMatchedMovie(currentMovie);
            setIsAddedToWatchlist(false); // Reset l'état du bouton
            setShowMatchModal(true);
          }
        }
      } catch (err) {
        console.error('Erreur sauvegarde swipe Supabase:', err);
      }
    }

    if (!showMatchModal) {
      passeAuSuivant();
    }
  };

  const passeAuSuivant = () => {
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

  // Fonction pour ajouter le Match à la Watchlist principale
  const addToWatchlist = async () => {
    if (!matchedMovie) return;
    try {
      await supabase.from('watchlist').insert([
        {
          tmdb_id: matchedMovie.id.toString(),
          title: matchedMovie.title,
          poster_path: matchedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${matchedMovie.poster_path}` : null,
          media_type: 'movie',
          status: 'to_watch'
        }
      ]);
      setIsAddedToWatchlist(true);
    } catch (err) {
      console.error('Erreur ajout watchlist:', err);
    }
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (showTrailer || showMatchModal) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || showTrailer || showMatchModal) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const onTouchEnd = () => {
    if (!isDragging || showTrailer || showMatchModal) return;
    setIsDragging(false);
    if (touchDeltaX > 90) handleSwipe('right');
    else if (touchDeltaX < -90) handleSwipe('left');
    else setTouchDeltaX(0);
  };

  if (!isMounted) return null;

  const currentMovie = swipeQueue[currentIndex];
  const rotation = touchDeltaX * 0.08;

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden', position: 'relative' }}>
      
      <style jsx global>{`
        @keyframes swipeLeft { to { transform: translateX(-120vw) rotate(-30deg); opacity: 0; } }
        @keyframes swipeRight { to { transform: translateX(120vw) rotate(30deg); opacity: 0; } }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-swipe-left { animation: swipeLeft 0.3s forwards ease-in; }
        .animate-swipe-right { animation: swipeRight 0.3s forwards ease-in; }
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* MODAL DE MATCH MISE À JOUR AVEC BOUTON WATCHLIST */}
      {showMatchModal && matchedMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-pop-in" style={{ backgroundColor: '#18181B', border: '2px solid #EC4899', borderRadius: '24px', padding: '30px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)' }}>
            <span style={{ fontSize: '50px', display: 'block', marginBottom: '10px' }}>🔥</span>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF', margin: '0 0 10px 0', textTransform: 'uppercase', background: 'linear-gradient(to right, #EC4899, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MATCH POTECORN !
            </h2>
            <p style={{ color: '#D4D4D8', marginBottom: '20px' }}>Vous avez tous les deux validé :</p>
            <img src={matchedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${matchedMovie.poster_path}` : ''} alt={matchedMovie.title} style={{ width: '150px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 20px 0' }}>{matchedMovie.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={addToWatchlist} 
                disabled={isAddedToWatchlist}
                style={{ 
                  backgroundColor: isAddedToWatchlist ? '#27272A' : '#9333EA', 
                  color: isAddedToWatchlist ? '#A1A1AA' : '#FFF', 
                  border: isAddedToWatchlist ? '1px solid #3F3F46' : 'none', 
                  padding: '14px 24px', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: '800', 
                  cursor: isAddedToWatchlist ? 'default' : 'pointer', 
                  width: '100%',
                  transition: 'all 0.3s'
                }}
              >
                {isAddedToWatchlist ? '✅ Ajouté à la Watchlist' : '📌 Ajouter à notre Watchlist'}
              </button>
              
              <button onClick={() => { setShowMatchModal(false); passeAuSuivant(); }} style={{ backgroundColor: 'transparent', color: '#EC4899', border: '1px solid #EC4899', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
                Continuer à swiper
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#EC4899', textTransform: 'uppercase' }}>{activeRoom ? `Salon: ${activeRoom}` : 'Mode Interactif'}</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 0 0' }}>🔥 PoteCorn Party</h1>
          </div>
          <a href="/" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>← Accueil</a>
        </div>

        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
            <div onClick={() => setMode('solo')} style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '20px', padding: '24px', cursor: 'pointer' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👤📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Solo</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>Entraîne l'IA en swipant les affiches.</p>
            </div>

            <div onClick={() => setMode('duo_setup')} style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.2))', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '20px', padding: '24px', cursor: 'pointer' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🍿👥</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Duo</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>Trouve le film parfait à deux et matchez !</p>
            </div>
          </div>
        )}

        {mode === 'duo_setup' && (
          <div className="animate-pop-in" style={{ backgroundColor: '#18181B', borderRadius: '24px', padding: '30px', textAlign: 'center', marginTop: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔐</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Rejoindre un Salon</h2>
            <p style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '20px' }}>Inventez un mot secret (ex: FILM2026) et tapez-le tous les deux sur vos téléphones pour vous lier.</p>
            
            <input 
              type="text" 
              placeholder="Code secret..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '16px', textAlign: 'center', marginBottom: '16px', textTransform: 'uppercase' }}
            />
            
            <button onClick={joinRoom} style={{ width: '100%', backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}>
              Lancer la partie
            </button>
            <button onClick={() => setMode('menu')} style={{ width: '100%', backgroundColor: 'transparent', color: '#A1A1AA', border: 'none', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        )}

        {(mode === 'solo' || mode === 'duo') && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => { setMode('menu'); setActiveRoom(null); }} style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                ← Quitter
              </button>
              
              <button onClick={() => setIsFamilyMode(!isFamilyMode)} style={{ backgroundColor: isFamilyMode ? '#4ADE80' : 'rgba(255,255,255,0.1)', color: isFamilyMode ? '#000' : '#FFF', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  {touchDeltaX > 20 && <div style={{ position: 'absolute', top: '30px', left: '20px', zIndex: 20, border: '4px solid #4ADE80', color: '#4ADE80', padding: '8px 16px', borderRadius: '12px', fontSize: '20px', fontWeight: '900', transform: 'rotate(-15deg)', backgroundColor: 'rgba(0,0,0,0.7)', opacity: Math.min(touchDeltaX / 80, 1) }}>✨ JE VALIDE</div>}
                  {touchDeltaX < -20 && <div style={{ position: 'absolute', top: '30px', right: '20px', zIndex: 20, border: '4px solid #EF4444', color: '#EF4444', padding: '8px 16px', borderRadius: '12px', fontSize: '20px', fontWeight: '900', transform: 'rotate(15deg)', backgroundColor: 'rgba(0,0,0,0.7)', opacity: Math.min(Math.abs(touchDeltaX) / 80, 1) }}>❌ RED FLAG</div>}

                  <div style={{ position: 'relative', height: '460px' }}>
                    {showTrailer && trailerKey ? (
                      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=0`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen style={{ pointerEvents: 'auto', backgroundColor: '#000' }} />
                    ) : (
                      <img src={currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : 'https://via.placeholder.com/340x460'} alt={currentMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    )}

                    {!showTrailer && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, rgba(24,24,27,1), rgba(24,24,27,0))', pointerEvents: 'none' }} />}
                    
                    {!showTrailer && (
                      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', pointerEvents: 'none' }}>
                        {providers.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {providers.map((p: any) => <img key={p.provider_id} src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} style={{ width: '24px', height: '24px', borderRadius: '6px' }} />)}
                          </div>
                        )}
                        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{currentMovie.title}</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.9)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>★ {currentMovie.vote_average?.toFixed(1)}</span>
                            <span style={{ color: '#D4D4D8', fontSize: '12px', fontWeight: '600' }}>{currentMovie.release_date?.split('-')[0]}</span>
                          </div>
                          {trailerKey && <button onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', pointerEvents: 'auto' }}>▶ Trailer</button>}
                        </div>
                      </div>
                    )}

                    {showTrailer && <button onClick={(e) => { e.stopPropagation(); setShowTrailer(false); }} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30, pointerEvents: 'auto' }}>✕</button>}
                  </div>
                </div>
              ) : null}
            </div>

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
