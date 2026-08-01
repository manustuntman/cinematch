'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<any>({
    username: '',
    age: '',
    sex: '',
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentId)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        const { data: swipesData } = await supabase
          .from('user_swipes')
          .select('*')
          .eq('user_uid', currentId);

        if (swipesData) {
          const likes = swipesData.filter(s => s.action === 'liked');
          setLikedMoviesCount(likes.length);

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
            sex: profile.sex,
            region: profile.region,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
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

  const userXp = profile.xp || (likedMoviesCount * 50);
  const userLevel = Math.floor(userXp / 500) + 1;

  if (!isMounted) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '30px 16px', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             Mon Profil Cinéphile
          </h1>
          <div style={{ width: '70px' }}></div>
        </div>

        {/* CARTE D'IDENTITÉ CINÉPHILE (STYLE CARTE OFFICIELLE) */}
        <div style={{ background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.98), rgba(39, 39, 42, 0.95))', border: '2px solid rgba(236, 72, 153, 0.5)', borderRadius: '32px', padding: '28px', marginBottom: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '68px', height: '68px', borderRadius: '22px', objectFit: 'cover', border: '2px solid #EC4899', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.4)' }} />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: 'linear-gradient(135deg, #EC4899, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.4)' }}>
                  🍿
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0', color: '#FFF' }}>{profile.username || 'Cinéphile Anonyme'}</h2>
                <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '800' }}>Niveau {userLevel} • {userXp} XP ⚡</span>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ backgroundColor: isEditing ? '#27272A' : 'rgba(236, 72, 153, 0.2)', color: isEditing ? '#FFF' : '#EC4899', border: isEditing ? '1px solid #3F3F46' : '1px solid rgba(236, 72, 153, 0.5)', padding: '10px 16px', borderRadius: '14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              {isEditing ? '✕ Annuler' : 'Modifier ✏️'}
            </button>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Âge</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFF' }}>{profile.age ? `${profile.age} ans` : '-'}</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Sexe</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFF' }}>{profile.sex || '-'}</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Région</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{profile.region || '-'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '16px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#A1A1AA', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Bio / Citation favorite</span>
                <p style={{ fontSize: '14px', color: '#D4D4D8', margin: 0, fontStyle: profile.bio ? 'normal' : 'italic', lineHeight: '1.4' }}>{profile.bio || 'Aucune bio renseignée pour le moment...'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Pseudo</label>
                <input type="text" value={profile.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Âge</label>
                  <input type="number" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: e.target.value })} style={{ width: '100%', padding: '12px 10px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Sexe</label>
                  <input type="text" placeholder="Ex: M / F" value={profile.sex || ''} onChange={(e) => setProfile({ ...profile, sex: e.target.value })} style={{ width: '100%', padding: '12px 10px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Région</label>
                  <input type="text" value={profile.region || ''} onChange={(e) => setProfile({ ...profile, region: e.target.value })} style={{ width: '100%', padding: '12px 10px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>URL de la photo de profil (Avatar)</label>
                <input type="text" placeholder="https://..." value={profile.avatar_url || ''} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Bio</label>
                <textarea rows={2} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#18181B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={saving} style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications 💾'}
              </button>
            </form>
          )}

        </div>

        {/* PANTHÉON & STATISTIQUES CINÉPHILES */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(147, 51, 234, 0.4)', borderRadius: '28px', padding: '24px', marginBottom: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🏛️</span>
            <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#C084FC', margin: 0 }}>Panthéon Cinéphile</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#27272A', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#4ADE80', display: 'block', marginBottom: '4px' }}>{likedMoviesCount}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: '600' }}>Films Validés (Likes)</span>
            </div>
            <div style={{ backgroundColor: '#27272A', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#FBBF24', display: 'block', marginBottom: '4px' }}>{userLevel}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: '600' }}>Niveau Actuel</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#A1A1AA', display: 'block', marginBottom: '10px' }}>Genres Favoris :</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {favoriteGenres.length === 0 ? (
                <span style={{ fontSize: '13px', color: '#71717A' }}>Swipe des films pour découvrir tes genres favoris !</span>
              ) : (
                favoriteGenres.map((genre) => (
                  <span key={genre} style={{ backgroundColor: 'rgba(147, 51, 234, 0.25)', border: '1px solid rgba(147, 51, 234, 0.5)', color: '#D8B4FE', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                    {genre}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MATRICE DE COMPATIBILITÉ */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '28px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }}>💞</span>
            <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#EC4899', margin: 0 }}>Compatibilité Communautaire</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {compatibilityList.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#71717A', textAlign: 'center', padding: '16px 0' }}>Aucun autre utilisateur pour l'instant.</p>
            ) : (
              compatibilityList.map((user) => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272A', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF', display: 'block', marginBottom: '2px' }}>{user.username || 'Anonyme'}</span>
                    <span style={{ fontSize: '11px', color: '#A1A1AA' }}>{user.region || 'Région non renseignée'}</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', border: '1px solid rgba(236, 72, 153, 0.5)', padding: '6px 12px', borderRadius: '12px', color: '#EC4899', fontSize: '13px', fontWeight: '900' }}>
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
