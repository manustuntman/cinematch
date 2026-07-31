'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BackstageDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const savedAuth = sessionStorage.getItem('potecorn_backstage_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'PoteCornSecureAdmin2026!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('potecorn_backstage_auth', 'true');
      fetchAdminData();
    } else {
      alert('Code secret incorrect !');
      setPasswordInput('');
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setWatchlistItems(data);
    } catch (err) {
      console.error('Erreur chargement backstage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '380px', width: '100%', backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <img src="/icon-512.png" alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover', margin: '0 auto 12px auto' }} />
          <h1 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>Backstage PoteCorn 🎬</h1>
          <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 20px 0' }}>Entre ton code secret pour accéder aux coulisses.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Code secret..."
              autoFocus
              style={{ width: '100%', padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
            />
            <button
              type="submit"
              style={{ width: '100%', backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Entrer dans les coulisses 🚀
            </button>
          </form>
          <div style={{ marginTop: '16px' }}>
            <a href="/" style={{ fontSize: '11px', color: '#A1A1AA', textDecoration: 'none' }}>← Retour à l'application</a>
          </div>
        </div>
      </main>
    );
  }

  const totalActions = watchlistItems.length;
  const watchedCount = watchlistItems.filter(i => i.status === 'watched').length;
  const toWatchCount = watchlistItems.filter(i => i.status === 'to_watch').length;
  const moviesCount = watchlistItems.filter(i => i.media_type === 'movie').length;
  const tvCount = watchlistItems.filter(i => i.media_type === 'tv').length;

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* EN-TÊTE BACKSTAGE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#C084FC', textTransform: 'uppercase' }}>Administration</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0 0 0' }}>🎥 Backstage PoteCorn</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { sessionStorage.removeItem('potecorn_backstage_auth'); setIsAuthenticated(false); }} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              Verrouiller
            </button>
            <a href="/" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              ← App
            </a>
          </div>
        </div>

        {/* BLOCS DE STATS AMÉLIORÉS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#A1A1AA', fontWeight: '700', textTransform: 'uppercase' }}>🍿 Popcorns (Vus)</span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#4ADE80', margin: '6px 0 0 0' }}>{watchedCount}</h3>
          </div>
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#A1A1AA', fontWeight: '700', textTransform: 'uppercase' }}>📌 Watchlist</span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FBBF24', margin: '6px 0 0 0' }}>{toWatchCount}</h3>
          </div>
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#A1A1AA', fontWeight: '700', textTransform: 'uppercase' }}>🎬 Films vs Séries</span>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#C084FC', margin: '8px 0 0 0' }}>{moviesCount} 🎬 / {tvCount} 📺</h3>
          </div>
        </div>

        {/* LISTE DE L'ACTIVITÉ RÉCENTE */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>🕒 Activité récente sur l'app</h2>
            <button onClick={fetchAdminData} style={{ background: 'none', border: 'none', color: '#C084FC', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Actualiser
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: '12px', color: '#A1A1AA', textAlign: 'center', padding: '20px 0' }}>Chargement des données...</p>
          ) : watchlistItems.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#A1A1AA', textAlign: 'center', padding: '20px 0' }}>Aucune interaction enregistrée pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {watchlistItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.poster_path ? (
                      <img src={item.poster_path} alt="" style={{ width: '30px', height: '42px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '30px', height: '42px', backgroundColor: '#3F3F46', borderRadius: '6px' }} />
                    )}
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#FFF' }}>{item.title}</h4>
                      <span style={{ fontSize: '10px', color: '#A1A1AA' }}>
                        {item.status === 'watched' ? '👁️ Marqué comme vu' : '📌 Ajouté à la watchlist'} {item.user_rating ? `• ⭐ ${item.user_rating}/5` : ''}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '8px', backgroundColor: item.status === 'watched' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: item.status === 'watched' ? '#4ADE80' : '#FBBF24', fontWeight: '700' }}>
                    {item.media_type === 'tv' ? 'Série' : 'Film'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
