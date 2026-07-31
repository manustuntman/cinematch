'use client';

import { useState, useEffect } from 'react';

export default function PoteCornPartyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'menu' | 'solo' | 'duo'>('menu');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

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

        {/* CONTENU SELON LE MODE */}
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
            <p style={{ fontSize: '13px', color: '#A1A1AA', textAlign: 'center', marginBottom: '10px' }}>
              Choisis ton mode de jeu pour affiner tes goûts ou trouver un film à plusieurs sans prise de tête !
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
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>👤📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Mode Solo (Swipe & Entraînement)</h3>
              <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0 }}>
                Swipe à gauche ou à droite sur des affiches pour nourrir l'IA et lui apprendre tes préférences en quelques secondes.
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
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🍿👥</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Mode Duo (PoteCorn Party) <span style={{ fontSize: '10px', backgroundColor: '#3F3F46', padding: '2px 6px', borderRadius: '6px', verticalAlign: 'middle' }}>Bientôt</span></h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>
                Croise tes goûts avec ton partenaire ou un ami pour trouver instantanément le film parfait qui mettra tout le monde d'accord.
              </p>
            </div>
          </div>
        )}

        {mode === 'solo' && (
          <div>
            <button 
              onClick={() => setMode('menu')}
              style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
            >
              ← Retour au menu Party
            </button>
            
            {/* ICI ONMETTRA LE MOTEUR DE SWIPE */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '40px 20px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Moteur de Swipe Solo en construction 🚀</h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>
                C'est ici que les cartes vont défiler pour alimenter l'IA de l'application !
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
