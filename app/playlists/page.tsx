'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PlaylistsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Vue détaillée d'une playlist sélectionnée
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistMovies, setPlaylistMovies] = useState<any[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  // État de la modale de création de playlist
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎬');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // État de la modale d'ajout de film
  const [showAddMovieDrawer, setShowAddMovieDrawer] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  const availableIcons = ['🎬', '🚀', '🍿', '🔥', '🕵️‍♂️', '❤️', '🌙', '🧸'];

  useEffect(() => {
    setIsMounted(true);
    const getAuthUserAndPlaylists = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let currentId = '';

      if (session) {
        currentId = session.user.id;
      } else {
        currentId = localStorage.getItem('potecorn_uid') || 'user_anonymous';
      }
      setUserId(currentId);

      await fetchPlaylists();
      await fetchWatchlist(currentId);
    };

    getAuthUserAndPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPlaylists(data);
    } catch (err) {
      console.error('Erreur chargement playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async (currentId: string) => {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*');
      if (error) throw error;
      if (data) setWatchlist(data);
    } catch (err) {
      console.error('Erreur chargement watchlist:', err);
    }
  };

  const fetchPlaylistMovies = async (playlistId: number) => {
    setLoadingMovies(true);
    try {
      const { data, error } = await supabase
        .from('playlist_movies')
        .select('*')
        .eq('playlist_id', playlistId);

      if (error) throw error;
      if (data) setPlaylistMovies(data);
    } catch (err) {
      console.error('Erreur chargement films de la playlist:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([
          {
            user_uid: userId,
            title: title.trim(),
            description: description.trim(),
            icon: icon
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setPlaylists([data[0], ...playlists]);
      }

      setTitle('');
      setDescription('');
      setIcon('🎬');
      setShowModal(false);
    } catch (err: any) {
      console.error('Erreur création playlist:', err);
      setErrorMessage(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const addMovieToPlaylist = async (movie: any) => {
    if (!selectedPlaylist) return;

    try {
      const { error } = await supabase
        .from('playlist_movies')
        .insert([
          {
            playlist_id: selectedPlaylist.id,
            tmdb_id: movie.tmdb_id || movie.id,
            title: movie.title,
            poster_path: movie.poster_path
          }
        ]);

      if (error) throw error;
      alert('Film ajouté à la playlist avec succès ! ✨');
      setShowAddMovieDrawer(false);
      fetchPlaylistMovies(selectedPlaylist.id);
    } catch (err: any) {
      console.error('Erreur ajout film:', err);
      alert("Ce film est peut-être déjà dans la playlist.");
    }
  };

  if (!isMounted) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {selectedPlaylist ? selectedPlaylist.title : '📂 Mes Playlists'}
          </h1>
          {!selectedPlaylist ? (
            <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
              + Créer
            </button>
          ) : (
            <button onClick={() => setSelectedPlaylist(null)} style={{ backgroundColor: '#27272A', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Retour
            </button>
          )}
        </div>

        {/* VUE DÉTAILLÉE D'UNE PLAYLIST */}
        {selectedPlaylist ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#18181B', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 4px 0' }}>{selectedPlaylist.description || 'Aucune description'}</p>
              </div>
              <button onClick={() => setShowAddMovieDrawer(true)} style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                + Ajouter un film 🎬
              </button>
            </div>

            {loadingMovies ? (
              <p style={{ textAlign: 'center', color: '#A1A1AA', marginTop: '40px' }}>Chargement des films...</p>
            ) : playlistMovies.length === 0 ? (
              <div style={{ textAlign: 'center', backgroundColor: '#18181B', borderRadius: '24px', padding: '40px 20px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🍿</span>
                <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>Cette playlist est vide</p>
                <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '20px' }}>Ajoutez vos films favoris depuis votre Watchlist.</p>
                <button onClick={() => setShowAddMovieDrawer(true)} style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  Ajouter un film ✨
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {playlistMovies.map((m) => (
                  <div key={m.id} style={{ backgroundColor: '#18181B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={m.poster_path || 'https://via.placeholder.com/300x450'} alt={m.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* LISTE DES PLAYLISTS */
          loading ? (
            <p style={{ textAlign: 'center', color: '#A1A1AA', marginTop: '40px' }}>Chargement de vos playlists...</p>
          ) : playlists.length === 0 ? (
            <div style={{ textAlign: 'center', backgroundColor: '#18181B', borderRadius: '24px', padding: '40px 20px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🍿</span>
              <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>Aucune playlist pour l'instant</p>
              <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '20px' }}>Créez votre premier dossier pour trier vos films favoris.</p>
              <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                Créer une playlist ✨
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  onClick={() => { setSelectedPlaylist(playlist); fetchPlaylistMovies(playlist.id); }}
                  style={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '32px', backgroundColor: '#27272A', padding: '12px', borderRadius: '16px' }}>{playlist.icon || '🎬'}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>{playlist.title}</h3>
                    <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0 }}>{playlist.description || 'Aucune description'}</p>
                  </div>
                  <span style={{ color: '#A1A1AA', fontSize: '18px' }}>→</span>
                </div>
              ))}
            </div>
          )
        )}

        {/* MODALE DE SÉLECTION DE FILM (DEPUIS WATCHLIST) */}
        {showAddMovieDrawer && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '24px', maxWidth: '450px', width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
              
              <button onClick={() => setShowAddMovieDrawer(false)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#27272A', color: '#FFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>
                ✕
              </button>

              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 16px 0', color: '#FFF' }}>Ajouter un film de la Watchlist</h2>

              {watchlist.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#A1A1AA', textAlign: 'center', padding: '20px 0' }}>Votre Watchlist est vide. Ajoutez des films en swipant d'abord !</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {watchlist.map((movie) => (
                    <div key={movie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272A', padding: '10px 14px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={movie.poster_path || ''} alt={movie.title} style={{ width: '35px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{movie.title}</span>
                      </div>
                      <button onClick={() => addMovieToPlaylist(movie)} style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                        Ajouter +
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* MODALE DE CRÉATION DE PLAYLIST */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative' }}>
              
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#27272A', color: '#FFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>
                ✕
              </button>

              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 16px 0', color: '#FFF' }}>Créer une nouvelle Playlist</h2>

              <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>Icône :</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {availableIcons.map((ic) => (
                      <button type="button" key={ic} onClick={() => setIcon(ic)} style={{ fontSize: '18px', padding: '8px', borderRadius: '10px', backgroundColor: icon === ic ? '#EC4899' : '#27272A', border: 'none', cursor: 'pointer' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Titre :</label>
                  <input type="text" placeholder="Ex: Soirée Frissons..." value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Description (optionnel) :</label>
                  <textarea rows={2} placeholder="Petite note explicative..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {errorMessage && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#EF4444', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <button type="submit" disabled={submitting} style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
                  {submitting ? 'Création en cours...' : 'Valider et Créer ✨'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
