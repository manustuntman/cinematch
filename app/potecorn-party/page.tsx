'use client';

import { useState, useEffect, useRef } from 'react';

export default function PoteCornPartyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'menu' | 'solo' | 'duo'>('menu');
  const [userId, setUserId] = useState<string>('');

  const [swipeQueue, setSwipeQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [animatingDir, setAnimatingDir] = useState<'left' | 'right' | null>(null);

  // Variables pour le suivi du doigt
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${randomPage}`;
      
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
    if (mode === 'solo' && swipeQueue.length === 0) {
      fetchRandomMoviesForSwipe();
    }
  }, [mode]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (animatingDir) return;
    setAnimatingDir(direction);
    setIsDragging(false);

    const currentMovie = swipeQueue[currentIndex];
    if (currentMovie) {
      if (direction === 'right') {
        console.log(`[PoteCorn Party] Utilisateur ${userId} a AIMÉ :`, currentMovie.title);
      } else {
        console.log(`[PoteCorn Party] Utilisateur ${userId} a REJETÉ :`, currentMovie.title);
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

  // Gestion tactile fluide
  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Seuil de validation (si on glisse de plus de 100px)
    if (touchDeltaX > 100) {
      handleSwipe('right');
    } else if (touchDeltaX < -100) {
      handleSwipe('left');
    } else {
      // Retour à la position initiale en douceur
      setTouchDeltaX(0);
    }
  };

  if (!isMounted) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontSize: '14px', color: '#A1A1AA' }}>Chargement de PoteCorn Party...</p>
      </main>
    );
  }

  const currentMovie = swipeQueue[currentIndex];
  const rotation = touchDeltaX * 0.08;

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      <style jsx global>{`
        @keyframes swipeLeft {
          to { transform: translateX(-120vw) rotate(-30deg); opacity: 0; }
        }
        @keyframes swipeRight {
          to { transform: translateX(120vw) rotate(30deg); opacity: 0; }
        }
        .animate-swipe-left {
          animation: swipeLeft 0.3s forwards ease-in;
        }
        .animate-swipe-right {
          animation: swipeRight 0.3s forwards ease-in;
        }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#EC4899', textTransform: 'uppercase' }}>Mode Interactif</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 0 0' }}>🔥 PoteCorn Party</h1>
          </div>
          <a href="/" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            ← Accueil
          </a>
        </div>

        {/* MENU PRINCIPAL */}
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
            <p style={{ fontSize: '13px', color: '#A1A1AA', textAlign: 'center', marginBottom: '10px' }}>
              Choisis ton mode pour affiner tes goûts ou trouver le film parfait à plusieurs.
            </p>

            <div 
              onClick={() => setMode('solo')}
              style={{ 
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))', 
                border: '1px solid rgba(236, 72, 153, 0.4)', 
                borderRadius: '20px', 
                padding: '24px', 
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(236, 72, 153, 0.2)',
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👤📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Solo</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>
                Entraîne l'IA en swipant les affiches de gauche à droite pour des recommandations sur-mesure.
              </p>
            </div>

            <div 
              style={{ 
                backgroundColor: 'rgba(24, 24, 27, 0.6)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '20px', 
                padding: '24px', 
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🍿👥</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Duo <span style={{ fontSize: '10px', backgroundColor: '#3F3F46', padding: '2px 6px', borderRadius: '6px', verticalAlign: 'middle', marginLeft: '6px' }}>Bientôt</span></h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>
                Croise tes goûts avec ton partenaire pour trouver le film de la soirée.
              </p>
            </div>
          </div>
        )}

        {/* MOTEUR DE SWIPE */}
        {mode === 'solo' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setMode('menu')}
                style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                ← Quitter
              </button>
              <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: '600' }}>
                Glisse ou utilise les boutons 👇
              </span>
            </div>

            {/* ZONE DE LA CARTE TACTILE */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '440px', overflow: 'hidden' }}>
              
              {loadingMovies ? (
                <div style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🍿</span>
                  <p>Recherche de pépites...</p>
                </div>
              ) : currentMovie ? (
                <div
                  key={currentMovie.id}
                  className={animatingDir === 'left' ? 'animate-swipe-left' : animatingDir === 'right' ? 'animate-swipe-right' : ''}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onMouseDown={onTouchStart}
                  onMouseMove={onTouchMove}
                  onMouseUp={onTouchEnd}
                  onMouseLeave={onTouchEnd}
                  style={{ 
                    width: '100%', 
                    maxWidth: '340px', 
                    backgroundColor: '#18181B', 
                    borderRadius: '24px', 
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                    position: 'absolute',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    transform: animatingDir ? undefined : `translateX(${touchDeltaX}px) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease'
                  }}
                >
                  <div style={{ position: 'relative', height: '440px', pointerEvents: 'none' }}>
                    <img 
                      src={currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : 'https://via.placeholder.com/340x440'} 
                      alt={currentMovie.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, rgba(24,24,27,1), rgba(24,24,27,0))' }} />
                    
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {currentMovie.title}
                      </h2>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.9)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                          ★ {currentMovie.vote_average?.toFixed(1)}
                        </span>
                        <span style={{ color: '#D4D4D8', fontSize: '12px', fontWeight: '600' }}>
                          {currentMovie.release_date ? currentMovie.release_date.split('-')[0] : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#A1A1AA' }}>Chargement des films...</p>
              )}
            </div>

            {/* BOUTONS D'ACTION */}
            {!loadingMovies && currentMovie && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', paddingBottom: '20px', marginTop: '20px' }}>
                
                <button 
                  onClick={() => handleSwipe('left')}
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    border: '2px solid rgba(255,255,255,0.15)', 
                    color: '#FFF', 
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  ❌
                </button>

                <button 
                  onClick={() => handleSwipe('right')}
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(236, 72, 153, 0.1)', 
                    border: '2px solid #EC4899', 
                    color: '#EC4899', 
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  ❤️
                </button>

              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
