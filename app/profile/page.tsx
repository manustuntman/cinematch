'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<any>({
    username: '',
    age: '',
    region: '',
    bio: '',
    avatar_url: '',
    xp: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compatibilityList, setCompatibilityList] = useState<any[]>([]);
  const [likedMoviesCount, setLikedMoviesCount] = useState(0);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const getAuthUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let currentId = '';

      if (session) {
        currentId = session.user.id;
      } else {
        currentId = localStorage.getItem('potecorn_uid') || '';
      }
      setUserId(currentId);

      if (currentId) {
        // 1. Charger le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentId)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // 2. Charger les swipes pour le Panthéon & XP
        const { data: swipesData } = await supabase
          .from('user_swipes')
          .select('*')
          .eq('user_uid', currentId);

        if (swipesData) {
          const likes = swipesData.filter(s => s.action === 'liked');
          setLikedMoviesCount(likes.length);

          // Extraire les genres favoris
          const genreCounts: { [key: string]: number } = {};
          likes.forEach(s => {
            if (s.genres) {
              s.genres.split(', ').forEach((g: string) => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
              });
            }
          });
          const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
          setFavoriteGenres(sortedGenres.slice(0, 3));
        }

        calculateCompatibility(currentId);
      }
    };

    getAuthUserAndProfile();
  }, []);

  const calculateCompatibility = async (currentUserId: string) => {
    try {
      const { data: mySwipes } = await supabase
        .from('user_swipes')
        .select('movie_id')
        .eq('user_uid', currentUserId)
        .eq('action', 'liked');

      if (!mySwipes || mySwipes.length === 0) return;
      const myLikedMovies = mySwipes.map(s => s.movie_id);

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, username, region')
        .neq('id', currentUserId);

      const { data: allSwipes } = await supabase
        .from('user_swipes')
        .select('user_uid, movie_id')
        .eq('action', 'liked');

      if (!allProfiles || !allSwipes) return;

      const compatResults = allProfiles.map(otherUser => {
        const otherLikes = allSwipes.filter(s => s.user_uid === otherUser.id).map(s => s.movie_id);
        if (otherLikes.length === 0) return { ...otherUser, score: 0 };

        const commonMovies = myLikedMovies.filter(id => otherLikes.includes(id));
        const score = Math.round((commonMovies.length / Math.max(myLikedMovies.length, otherLikes.length)) * 100);

        return {
          ...otherUser,
          score: score > 100 ? 100 : score
        };
      });

      compatResults.sort((a, b) => b.score - a.score);
      setCompatibilityList(compatResults);
    } catch (err) {
      console.error('Erreur calcul compatibilité:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: userId,
            username: profile.username,
            age: profile.age ? parseInt(profile.age) : null,
            region: profile.region,
            bio: profile.bio,
            updated_at: new Date()
          }
        ]);

      if (error) throw error;
      setIsEditing(false);
      alert('Profil mis à jour avec succès ! ✨');
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  };

  // Calcul du niveau d'XP et des badges
  const userXp = profile.xp || (likedMoviesCount * 50);
  const userLevel = Math.floor(userXp / 500) + 1;

  if (!isMounted) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             Mon Profil Cinéphile
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {/* CARTE D'IDENTITÉ CINÉPHILE */}
        <div style={{ background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95))', border: '2px solid rgba(236, 72, 153, 0.4)', borderRadius: '28px', padding: '24px', marginBottom: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'linear-gradient(135deg, #EC4899, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.4)' }}>
                🍿
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 2px 0', color: '#FFF' }}>{profile.username || 'Cinéphile Anonyme'}</h2>
                <span style={{ fontSize: '11px', color: '#FBBF24', fontWeight: '800' }}>Niveau {userLevel} • {userXp} XP ⚡</span>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ backgroundColor: isEditing ? '#27272A' : 'rgba(236, 72, 153, 0.15)', color: isEditing ? '#FFF' : '#EC4899', border: isEditing ? '1px solid #3F3F46' : '1px solid rgba(236, 72, 153, 0.4)', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
            >
              {isEditing ? '✕ Annuler' : 'Modifier ✏️'}
            </button>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase' }}>Âge</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>{profile.age ? `${profile.age} ans` : 'Non renseigné'}</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase' }}>Région</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>{profile.region || 'Non renseignée'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Bio</span>
                <p style={{ fontSize: '13px', color: '#D4D4D8', margin: 0, fontStyle: profile.bio ? 'normal' : 'italic' }}>{profile.bio || 'Aucune bio renseignée...'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Pseudo</label>
                <input type="text" value={profile.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Âge</label>
                  <input type="number" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Région</label>
                  <input type="text" value={profile.region || ''} onChange={(e) => setProfile({ ...profile, region: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Bio</label>
                <textarea rows={2} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={saving} style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                {saving ? 'Enregistrement...' : 'Enregistrer 💾'}
              </button>
            </form>
          )}

        </div>

        {/* PANTHÉON & STATISTIQUES CINÉPHILES */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: '24px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🏛️</span>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#C084FC', margin: 0 }}>Panthéon Cinéphile</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: '#27272A', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#4ADE80', display: 'block' }}>{likedMoviesCount}</span>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Films Validés (Likes)</span>
            </div>
            <div style={{ backgroundColor: '#27272A', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#FBBF24', display: 'block' }}>{userLevel}</span>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Niveau Actuel</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>Genres Favoris :</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {favoriteGenres.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#71717A' }}>Swipe des films pour découvrir tes genres favoris !</span>
              ) : (
                favoriteGenres.map((genre) => (
                  <span key={genre} style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)', border: '1px solid rgba(147, 51, 234, 0.4)', color: '#D8B4FE', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                    {genre}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MATRICE DE COMPATIBILITÉ */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '22px' }}>💞</span>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#EC4899', margin: 0 }}>Compatibilité Communautaire</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {compatibilityList.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#71717A', textAlign: 'center', padding: '10px 0' }}>Aucun autre utilisateur pour l'instant.</p>
            ) : (
              compatibilityList.map((user) => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272A', padding: '10px 14px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFF', display: 'block' }}>{user.username || 'Anonyme'}</span>
                    <span style={{ fontSize: '10px', color: '#A1A1AA' }}>{user.region || 'Région non renseignée'}</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', padding: '4px 10px', borderRadius: '10px', color: '#EC4899', fontSize: '12px', fontWeight: '900' }}>
                    {user.score}% Match 🎯
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
