'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [user] = useState({
    username: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    xp: 1250,
    level: 5,
    favoriteGenre: 'Sci-Fi / Intemporel',
    watchlistCount: 14,
    watchedCount: 42,
    badges: [
      { id: 1, name: 'Cinéphile', icon: '🎬', description: 'Plus de 30 films vus' },
      { id: 2, name: 'Explorateur Télépore', icon: '⏳', description: 'Fan de Voyages Temporels' },
      { id: 3, name: 'Pionnier', icon: '🚀', description: 'Membre de la bêta CineMatch' },
    ],
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Bouton Retour */}
      <div style={{ width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#A1A1AA', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Retour à CineMatch
        </a>
      </div>

      {/* Carte Profil */}
      <div style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header Profil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <img 
            src={user.avatar} 
            alt={user.username} 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #C084FC', marginBottom: '12px' }}
          />
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>{user.username}</h1>
          <span style={{ backgroundColor: 'rgba(192, 132, 252, 0.15)', color: '#C084FC', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
            Niveau {user.level} • {user.xp} XP
          </span>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#18181B', borderRadius: '16px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#EC4899' }}>{user.watchedCount}</div>
            <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px' }}>Films vus</div>
          </div>
          <div style={{ backgroundColor: '#18181B', borderRadius: '16px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#FBBF24' }}>{user.watchlistCount}</div>
            <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px' }}>Watchlist</div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#A1A1AA', margin: '0 0 12px 0' }}>
            Badges Débloqués
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.badges.map((badge) => (
              <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#18181B', padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{badge.name}</div>
                  <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
