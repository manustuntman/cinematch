'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AddToPlaylistButton({ movie }: { movie: { id: string | number; title: string; poster_path: string | null } }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data } = await supabase.from('playlists').select('*');
      if (data) setPlaylists(data);
    };
    fetchPlaylists();
  }, []);

  const handleAdd = async (e: React.MouseEvent, playlistId: number) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const { error } = await supabase.from('playlist_movies').insert([
        {
          playlist_id: playlistId,
          tmdb_id: movie.id.toString(),
          title: movie.title,
          poster_path: movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`) : null
        }
      ]);

      if (error) throw error;
      alert('Film ajouté à la playlist ! ✨');
      setShowDropdown(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Ce film est déjà dans cette playlist.');
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDropdown(!showDropdown); }}
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        📂 +
      </button>

      {showDropdown && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '10px', minWidth: '160px', zIndex: 999, boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Ajouter à :</p>
          {playlists.length === 0 ? (
            <p style={{ fontSize: '11px', color: '#71717A', margin: 0 }}>Aucune playlist</p>
          ) : (
            playlists.map((pl) => (
              <div 
                key={pl.id} 
                onClick={(e) => handleAdd(e, pl.id)}
                style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', background: '#27272A' }}
              >
                <span>{pl.icon || '🎬'}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.title}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
