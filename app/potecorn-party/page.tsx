'use client';

import { useState, useEffect } from 'react';

export default function PoteCornPartyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'menu' | 'solo' | 'duo'>('menu');
  const [userId, setUserId] = useState<string>('');

  // States pour le Swipe (Mode Solo)
  const [swipeQueue, setSwipeQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'like' | 'dislike' } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Génération ou récupération de l'ID utilisateur (Option A : Sans friction)
    let storedId = localStorage.getItem('potecorn_uid');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('potecorn_uid', storedId);
    }
    setUserId(storedId);

  }, []);

  // Fonction pour charger des films aléatoires
  const fetchRandomMoviesForSwipe = async () => {
    setLoadingMovies(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      // On tire une page au hasard pour avoir toujours de nouveaux films
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${randomPage}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results) {
        // On mélange un peu les résultats
        const shuffled = data.results.sort(() => 0.5 - Math.random());
        setSwipeQueue(shuffled);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Erreur chargement swipe:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  // Lancement du chargement quand on rentre dans le mode Solo
  useEffect(() => {
    if (mode === 'solo' && swipeQueue.length === 0) {
      fetchRandomMoviesForSwipe();
    }
  }, [mode]);

  // Fonction pour gérer le Swipe
  const handleSwipe = (direction: 'left' | 'right') => {
    const currentMovie = swipeQueue[currentIndex];
    
    // Affichage d'un petit retour visuel
    if (direction === 'right') {
      setFeedback({ text: '❤️ Ajouté aux favoris', type: 'like' });
      // Plus tard : Sauvegarde dans Supabase avec le userId
      console.log(`L'utilisateur ${userId} a AIMÉ :`, currentMovie.title);
    } else {
      setFeedback({ text: '❌ Pas pour moi', type: 'dislike' });
      // Plus tard : Sauvegarde dans Supabase avec le userId
      console.log(`L'utilisateur ${userId} a REJETÉ :`, currentMovie.title);
    }

    // Effacer le feedback après 800ms
    setTimeout(() => setFeedback(null), 800);

    // Passer au film suivant
    if (currentIndex < swipeQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // S'il n'y a plus de films, on en recharge de nouveaux
      fetchRandomMoviesForSwipe();
    }
  };

  if (!isMounted) return null;

  const currentMovie = swipeQueue[currentIndex];

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
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

        {/* MENU PRINCIPAL DE LA PARTY */}
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
            <p style={{ fontSize: '13px', color: '#A1A1AA', textAlign: 'center', marginBottom: '10px' }}>
              Choisis ton mode pour affiner tes goûts ou trouver le film parfait à plusieurs.
            </p>

            {/* BOUTON MODE SOLO (SWIPE) */}
            <div 
              onClick={() => setMode('solo')}
              style={{ 
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))', 
                border: '1px solid rgba(236, 72, 153, 0.4)', 
                borderRadius: '20px', 
                padding: '24px', 
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(236, 72, 153, 0.2)',
                transition: 'transform 0.2s'
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👤📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Swipe en Solo</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>
                Entraîne l'IA en quelques secondes. Dis-lui ce que tu aimes ou détestes pour des recommandations chirurgicales.
              </p>
            </div>

            {/* BOUTON MODE DUO (BIENTÔT) */}
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
                Croise tes goûts avec ton partenaire pour trouver instantanément le film qui mettra tout le monde d'accord.
              </p>
            </div>
            
            <p style={{ fontSize: '10px', color: '#71717A', textAlign: 'center', marginTop: '20px' }}>
              Identifiant local : {userId}
            </p>
          </div>
        )}

        {/* MOTEUR DE SWIPE (MODE SOLO) */}
        {mode === 'solo' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setMode('menu')}
                style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                ← Quitter
              </button>
              <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: '600' }}>
                Entraînement de l'IA... 🧠
              </span>
            </div>

            {/* LA CARTE À SWIPER */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Message de feedback superposé (Glow effect) */}
              {feedback && (
                <div style={{ 
                  position: 'absolute', 
                  top: '40%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 100, 
                  backgroundColor: feedback.type === 'like' ? 'rgba(236, 72, 153, 0.9)' : 'rgba(39, 39, 42, 0.9)', 
                  color: '#FFF', 
                  padding: '12px 24px', 
                  borderRadius: '30px', 
                  fontSize: '16px', 
                  fontWeight: '800',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}>
                  {feedback.text}
                </div>
              )}

              {loadingMovies ? (
                <div style={{ textAlign: 'center', color: '#A1A1AA' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>🍿</span>
                  <p>Recherche de pépites...</p>
                </div>
              ) : currentMovie ? (
                <div style={{ 
                  width: '100%', 
                  maxWidth: '350px', 
                  backgroundColor: '#18181B', 
                  borderRadius: '24px', 
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ position: 'relative', height: '450px' }}>
                    <img 
                      src={currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : 'https://via.placeholder.com/350x500'} 
                      alt={currentMovie.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Dégradé bas de l'affiche */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, rgba(24,24,27,1), rgba(24,24,27,0))' }} />
                    
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {currentMovie.title}
                      </h2>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.9)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
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
                <p>Aucun film trouvé.</p>
              )}
            </div>

            {/* BOUTONS D'ACTION (SWIPE) */}
            {!loadingMovies && currentMovie && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingBottom: '30px', marginTop: '20px' }}>
                
                {/* Bouton Gauche (NON) */}
                <button 
                  onClick={() => handleSwipe('left')}
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    border: '2px solid rgba(255,255,255,0.1)', 
                    color: '#FFF', 
                    fontSize: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ❌
                </button>

                {/* Bouton Droite (OUI) */}
                <button 
                  onClick={() => handleSwipe('right')}
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(236, 72, 153, 0.1)', 
                    border: '2px solid #EC4899', 
                    color: '#EC4899', 
                    fontSize: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
