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
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [compatibilityList, setCompatibilityList] = useState<any[]>([]);

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

        // 2. Calculer la compatibilité avec les autres utilisateurs
        calculateCompatibility(currentId);
      }
    };

    getAuthUserAndProfile();
  }, []);

  const calculateCompatibility = async (currentUserId: string) => {
    try {
      // Récupérer les likes de l'utilisateur actuel
      const { data: mySwipes } = await supabase
        .from('user_swipes')
        .select('movie_id')
        .eq('user_uid', currentUserId)
        .eq('action', 'liked');

      if (!mySwipes || mySwipes.length === 0) return;
      const myLikedMovies = mySwipes.map(s => s.movie_id);

      // Récupérer tous les profils et leurs swipes
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, username, region')
        .neq('id', currentUserId);

      const { data: allSwipes } = await supabase
        .from('user_swipes')
        .select('user_uid, movie_id')
        .eq('action', 'liked');

      if (!allProfiles || !allSwipes) return;

      // Calcul du pourcentage de films en commun
      const compatResults = allProfiles.map(otherUser => {
        const otherLikes = allSwipes.filter(s => s.user_uid === otherUser.id).map(s => s.movie_id);
        if (otherLikes.length === 0) return { ...otherUser, score: 0 };

        const commonMovies = myLikedMovies.filter(id => otherLikes.includes(id));
        // Calcul d'un pourcentage basé sur le max de films aimés
        const score = Math.round((commonMovies.length / Math.max(myLikedMovies.length, otherLikes.length)) * 100);

        return {
          ...otherUser,
          score: score > 100 ? 100 : score
        };
      });

      // Trier du plus compatible au moins compatible
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
      alert('Profil mis à jour avec succès ! ✨');
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde.');
    }
    setSaving(false);
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
             Mon Profil Cinéphile
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {/* FORMULAIRE DE PROFIL */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '24px', marginBottom: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mon Pseudo</label>
              <input 
                type="text" 
                placeholder="Ex: CinephileDuNord" 
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mon Âge</label>
                <input 
                  type="number" 
                  placeholder="Ex: 28" 
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ma Région</label>
                <input 
                  type="text" 
                  placeholder="Ex: Hauts-de-France" 
                  value={profile.region || ''}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ma Bio / Citation favorite</label>
              <textarea 
                rows={2}
                placeholder="Ex: Fan de science-fiction et de grands espaces !" 
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder mon profil 💾'}
            </button>

          </form>
        </div>

        {/* SECTION MATRICE DE COMPATIBILITÉ */}
        <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }}>💞</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#EC4899', margin: 0 }}>Matrice de Compatibilité Communautaire</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '16px' }}>Découvre les utilisateurs qui ont les mêmes goûts cinématographiques que toi !</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {compatibilityList.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#71717A', textAlign: 'center', padding: '20px 0' }}>Aucun autre utilisateur actif pour l'instant. Swipe plus de films !</p>
            ) : (
              compatibilityList.map((user) => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272A', padding: '12px 16px', borderRadius: '14px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF', display: 'block' }}>{user.username || 'Cinéphile Anonyme'}</span>
                    <span style={{ fontSize: '11px', color: '#A1A1AA' }}>{user.region || 'Région non renseignée'}</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', padding: '6px 12px', borderRadius: '12px', color: '#EC4899', fontSize: '13px', fontWeight: '900' }}>
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
