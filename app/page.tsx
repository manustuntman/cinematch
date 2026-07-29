'use client';

import { useState } from 'react';

export default function HomePage() {
  const [movie] = useState({
    title: 'Edge of Tomorrow',
    year: '2014',
    rating: 7.9,
    poster: 'https://m.media-amazon.com/images/M/MVBMTgwNTcxMzU4MV5BMl5BanBnXkFtZTgwMzE2ODA1MTE@._V1_FMjpg_UX1000_.jpg',
    overview: 'Dans un futur proche, des hordes d extraterrestres ont envahi la Terre. Le commandant William Cage est envoyé au front...',
  });

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
          <img 
            src={movie.poster} 
            alt={movie.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Titre & Info */}
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
          {movie.title} <span style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: '400' }}>({movie.year})</span>
        </h2>

        {/* Synopsis */}
        <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
          {movie.overview}
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button 
            onClick={() => alert('Film marqué comme Vu ! +50 XP')}
            style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '600', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
          >
            👁️ Déjà vu
          </button>
          <button 
            onClick={() => alert('Ajouté à la Watchlist !')}
            style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFFFFF', border: 'none', fontSize: '12px', fontWeight: '700', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
          >
            📌 Watchlist
          </button>
        </div>
      </div>

      {/* Lien Profil */}
      <a href="/profile" style={{ marginTop: '24px', fontSize: '12px', color: '#C084FC', textDecoration: 'none', fontWeight: '600' }}>
        👤 Voir mon Profil Utilisateur & Badges →
      </a>
    </main>
  );
}
