'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire de création
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🎬');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('playlists').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setPlaylists(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const createPlaylist = async () => {
    if (!newTitle.trim()) return;
    try {
      const { error } = await supabase.from('playlists').insert([
        {
          title: newTitle,
          description: newDesc,
          icon: newIcon,
          items: []
        }
      ]);
      if (error) throw error;
      
      setFeedback('🎉 Playlist créée !');
      setNewTitle('');
      setNewDesc('');
      setShowCreateModal(false);
      fetchPlaylists();
    } catch (err) {
      setFeedback('⚠️ Erreur lors de la création');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
      fetchPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const ICONS = ['🎬', '🚀', '🍿', '🔥', '🕵️', '❤️', '🌙', '👨‍👩‍👦'];

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', position: 'relative' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <a 
            href="/" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              color: '#FFF', 
              padding: '6px 14px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: '600', 
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.15)' 
            }}
          >
            ← Accueil
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #C084FC, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mes Playlists 🎵🎬
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            + Créer
          </button>
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000 }}>
            {feedback}
          </div>
        )}

        {/* LISTE DES PLAYLISTS */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Chargement des playlists...</p>
        ) : playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#A1A1AA' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune playlist pour l'instant 📂</p>
            <p style={{ fontSize: '12px', marginBottom: '16px' }}>Crée ta première sélection (ex: "Soirée Sci-Fi", "À voir à deux").</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              ➕ Créer une Playlist
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {playlists.map((pl) => (
              <div 
                key={pl.id}
                style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '14px' }}>{pl.icon}</span>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0', color: '#FFF' }}>{pl.title}</h3>
                      <span style={{ fontSize: '10px', color: '#C084FC', fontWeight: '600' }}>{pl.items?.length || 0} élément(s)</span>
                    </div>
                  </div>
                  {pl.description && <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 12px 0' }}>{pl.description}</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                  <button 
                    onClick={() => deletePlaylist(pl.id)}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODALE CRÉATION PLAYLIST */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '24px', position: 'relative' }}>
              
              <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: '700' }}>✕</button>

              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', color: '#C084FC' }}>
                Créer une nouvelle Playlist
              </h2>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Icône :</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setNewIcon(ic)}
                      style={{ backgroundColor: newIcon === ic ? '#9333EA' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', fontSize: '18px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Titre :</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Marathon Sci-Fi"
                  style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#FFF', padding: '10px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Description (optionnel) :</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Petite note explicative..."
                  style={{ width: '100%', height: '60px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#FFF', padding: '10px', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <button
                onClick={createPlaylist}
                style={{ width: '100%', backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Valider et Créer ✨
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
