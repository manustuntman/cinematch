'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#000000', 
      color: '#FFFFFF', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      
      <div style={{
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        border: '1px solid rgba(147, 51, 234, 0.3)',
        borderRadius: '24px',
        padding: '40px 24px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(147, 51, 234, 0.15)'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>
          📡❌
        </div>
        
        <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: '#FFF' }}>
          Oups, plus de réseau !
        </h1>
        
        <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: '1.5', marginBottom: '24px' }}>
          Il semble que tu sois hors-ligne. PoteCorn ne peut pas charger de nouveaux films pour le moment.
        </p>
        
        <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: '#FBBF24', margin: 0, fontWeight: '600' }}>
            💡 Astuce : Ta Watchlist et tes Playlists déjà visitées restent accessibles !
          </p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#9333EA',
            color: '#FFF',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)'
          }}
        >
          🔄 Réessayer
        </button>
      </div>

    </main>
  );
}
