'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Auth form
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Profil
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Amis
  const [friends, setFriends] = useState<any[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [friendError, setFriendError] = useState('');

  // Stats & Données
  const [stats, setStats] = useState({
    watchedCount: 0,
    toWatchCount: 0,
    moviesCount: 0,
    tvCount: 0,
    totalXP: 0,
    level: 1,
    xpProgress: 0,
  });
  const [swipes, setSwipes] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          setUser(null);
          setSwipes([]);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    };

    checkUser();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setUsername(profileData.username || '');
        setAvatarUrl(profileData.avatar_url || '');
        setAge(profileData.age ? profileData.age.toString() : '');
        setGender(profileData.gender || '');
        setCountry(profileData.country || '');
        setRegion(profileData.region || '');
        setIsPublic(profileData.is_public ?? true);
      }

      // 2. Watchlist & XP
      const { data: watchlistData } = await supabase.from('watchlist').select('*');
      if (watchlistData) {
        const watched = watchlistData.filter((item) => item.status === 'watched');
        const toWatch = watchlistData.filter((item) => item.status === 'to_watch');

        const moviesWatched = watched.filter((item) => item.media_type === 'movie' || !item.media_type).length;
        const tvWatched = watched.filter((item) => item.media_type === 'tv').length;

        const xpFromWatched = watched.length * 100;
        const xpFromToWatch = toWatch.length * 20;
        const calculatedXP = xpFromWatched + xpFromToWatch;

        const currentLevel = Math.floor(calculatedXP / 500) + 1;
        const progressPercentage = ((calculatedXP % 500) / 500) * 100;

        setStats({
          watchedCount: watched.length,
          toWatchCount: toWatch.length,
          moviesCount: moviesWatched,
          tvCount: tvWatched,
          totalXP: calculatedXP,
          level: currentLevel,
          xpProgress: progressPercentage,
        });
      }

      // 3. Swipes
      const { data: swipesData } = await supabase
        .from('user_swipes')
        .select('*')
        .eq('user_uid', userId)
        .order('created_at', { ascending: false });

      if (swipesData) setSwipes(swipesData);

      // 4. Amis
      const { data: friendshipsData } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendshipsData) {
        setFriends(friendshipsData);
      }

    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Compte créé avec succès !');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSwipes([]);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      const updates = {
        id: user.id,
        username,
        avatar_url: avatarUrl,
        age: age ? parseInt(age) : null,
        gender,
        country,
        region,
        is_public: isPublic,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      alert('Profil mis à jour avec succès ! ✨');
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde.');
    }
    setSavingProfile(false);
  };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError('');
    if (!friendInput.trim() || !user) return;

    if (friendInput.trim() === user.id) {
      setFriendError("Vous ne pouvez pas vous ajouter vous-même !");
      return;
    }

    try {
      const { error } = await supabase.from('friendships').insert([
        {
          user_id: user.id,
          friend_id: friendInput.trim(),
          status: 'accepted'
        }
      ]);

      if (error) throw error;
      alert('Ami ajouté avec succès !');
      setFriendInput('');
      fetchUserData(user.id);
    } catch (err) {
      console.error('Erreur ajout ami:', err);
      setFriendError("Impossible d'ajouter cet utilisateur (Vérifiez l'ID).");
    }
  };

  const likedMovies = swipes.filter(s => s.action === 'liked');
  const dislikedMovies = swipes.filter(s => s.action === 'disliked');

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFF', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #C084FC, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mon Profil Cinéphile
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A1A1AA', padding: '40px 0' }}>Chargement...</p>
        ) : !user ? (
          /* CONNEXION / INSCRIPTION */
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '30px', marginTop: '40px', textAlign: 'center' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔐</span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>{isSignUp ? 'Créer un compte' : 'Connexion'}</h2>
            <p style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '24px' }}>Sauvegardez vos infos, votre pseudo et vos amis.</p>

            {authError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Email</label>
                <input type="email" required placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}>
                {isSignUp ? "S'inscrire" : 'Se connecter'}
              </button>
            </form>
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#C084FC', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}>
              {isSignUp ? 'Déjà un compte ? Connectez-vous' : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        ) : (
          /* PROFIL CONNECTÉ */
          <div>
            {/* COMPTE & ID UNIQUE */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '1px' }}>Mon ID unique (à partager)</span>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#C084FC', margin: '2px 0 0 0', fontFamily: 'monospace' }}>{user.id}</p>
              </div>
              <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Déconnexion
              </button>
            </div>

            {/* GESTION DES AMIS */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#3B82F6', margin: '0 0 12px 0' }}>👥 Mes Amis & Duo</h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '16px' }}>Ajoute l'ID d'un ami pour lancer des sessions Duo directes avec lui.</p>

              {friendError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '8px', borderRadius: '8px', fontSize: '11px', marginBottom: '12px' }}>
                  {friendError}
                </div>
              )}

              <form onSubmit={addFriend} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Coller l'ID de l'ami ici..." 
                  value={friendInput} 
                  onChange={(e) => setFriendInput(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '12px' }} 
                />
                <button type="submit" style={{ backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                  Ajouter
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friends.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#71717A', margin: 0 }}>Aucun ami ajouté pour l'instant.</p>
                ) : (
                  friends.map((f) => {
                    const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
                    return (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#D4D4D8' }}>Ami : {friendId.substring(0, 12)}...</span>
                        <a href={`/potecorn-party?duo_with=${friendId}`} style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
                          Lancer Duo 🚀
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* FORMULAIRE DE PERSONNALISATION DU PROFIL COMPLET */}
            <form onSubmit={handleSaveProfile} style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#C084FC', margin: '0 0 16px 0' }}>✏️ Personnaliser mon Profil</h3>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#27272A', overflow: 'hidden', border: '2px solid #C084FC', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>👤</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>URL de l'Avatar (Image)</label>
                  <input type="url" placeholder="https://exemple.com/image.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Pseudo</label>
                  <input type="text" placeholder="Ton pseudo" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Âge</label>
                  <input type="number" placeholder="Ex: 28" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Sexe</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }}>
                    <option value="">Non spécifié</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Pays</label>
                  <input type="text" placeholder="Ex: France" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Région / Ville</label>
                <input type="text" placeholder="Ex: Hauts-de-France" value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#EC4899' }} />
                <label htmlFor="isPublic" style={{ fontSize: '13px', color: '#D4D4D8', cursor: 'pointer' }}>
                  Rendre mon profil public
                </label>
              </div>

              <button type="submit" disabled={savingProfile} style={{ width: '100%', backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>

            {/* CARTE NIVEAU & XP */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '3px solid #C084FC' }}>
                🎭
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Niveau {stats.level}</h2>
              <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{stats.totalXP} XP Cumulés</span>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
