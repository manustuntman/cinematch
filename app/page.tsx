'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour aller chercher un film au hasard sur TMDB
  const fetchRandomMovie = async () => {
    setLoading(true);
    try {
      // Clé API TMDB intégrée
      const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '52a5ec6696ef2c6e6df66914edbfb732'; 
      
      // On demande à TMDB les films populaires en français
      const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=fr-FR&page=1`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // On choisit un film au hasard parmi les résultats
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomData = data.results[randomIndex];

        // On met à jour notre affichage avec les vraies infos
        setMovie({
          title: randomData.title,
          year: randomData.release_date ? randomData.release_date.substring(0, 4) : 'N/A',
          rating: randomData.vote_average ? randomData.vote_average.toFixed(1) : 'N/A',
          poster: randomData.poster_path ? `https://image.tmdb.org/t/p/w500${randomData.poster_path}` : '',
          overview: randomData.overview || "Aucun synopsis disponible en français pour ce film.",
        });
      }
    } catch (error) {
      console.error("Erreur avec l'API TMDB :", error);
    }
    setLoading(false);
  };

  // Se lance tout seul au démarrage de la page
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A1A1AA' }}>Affiche non disponible</div>
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

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                onClick={() => fetchRandomMovie()}
                style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '600', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
              >
                🔄 Relancer
              </button>
              <button 
                onClick={() => alert('Ajouté à la Watchlist !')}
                style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '700', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
              >
                📌 Watchlist
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
