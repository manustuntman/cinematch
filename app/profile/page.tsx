'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Auth form
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Mode Édition
  const [isEditing, setIsEditing] = useState(false);

  // Profil
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Amis & Compatibilité
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friendCompatibilities, setFriendCompatibilities] = useState<{ [key: string]: number }>({});
  const [friendPseudoInput, setFriendPseudoInput] = useState('');
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

  // Panthéon
  const [pantheon, setPantheon] = useState({
    topGenres: [] as string[],
    topDirectors: [] as string[],
    topActors: [] as string[],
  });

  // Succès Secrets (RPG)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  useEffect(() => {
    // Casse le cache de Next.js pour forcer la page à chercher les dernières infos
    router.refresh();

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
  }, [router]);

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
      let watchedCountVal = 0;
      let moviesWatchedVal = 0;
      let tvWatchedVal = 0;
      let calculatedXP = 0;

      if (watchlistData) {
        const watched = watchlistData.filter((item) => item.status === 'watched');
        const toWatch = watchlistData.filter((item) => item.status === 'to_watch');

        moviesWatchedVal = watched.filter((item) => item.media_type === 'movie' || !item.media_type).length;
        tvWatchedVal = watched.filter((item) => item.media_type === 'tv').length;
        watchedCountVal = watched.length;

        const xpFromWatched = watched.length * 100;
        const xpFromToWatch = toWatch.length * 20;
        calculatedXP = xpFromWatched + xpFromToWatch;
      }

      // 3. Swipes & Panthéon
      const { data: swipesData } = await supabase
        .from('user_swipes')
        .select('*')
        .eq('user_uid', userId)
        .order('created_at', { ascending: false });

      let userLikedIds: string[] = [];
      if (swipesData) {
        setSwipes(swipesData);
        const likedItems = swipesData.filter((s: any) => s.action === 'liked');
        userLikedIds = likedItems.map((item: any) => item.movie_id);

        const genreCounts: { [key: string]: number } = {};
        const actorCounts: { [key: string]: number } = {};
        const directorCounts: { [key: string]: number } = {};

        likedItems.forEach((item: any) => {
          if (item.genres) {
            item.genres.split(',').forEach((g: string) => {
              const genre = g.trim();
              if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
          }
          if (item.cast_crew) {
            item.cast_crew.split(',').forEach((c: string) => {
              const person = c.trim();
              if (person) actorCounts[person] = (actorCounts[person] || 0) + 1;
            });
          }
          if (item.director) {
            item.director.split(',').forEach((d: string) => {
              const dir = d.trim();
              if (dir) directorCounts[dir] = (directorCounts[dir] || 0) + 1;
            });
          }
        });

        const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]).slice(0, 3);
        const sortedActors = Object.keys(actorCounts).sort((a, b) => actorCounts[b] - actorCounts[a]).slice(0, 3);
        const sortedDirectors = Object.keys(directorCounts).sort((a, b) => directorCounts[b] - directorCounts[a]).slice(0, 3);

        // Remplacement des fausses données écrites en dur par de vraies analyses
        setPantheon({
          topGenres: sortedGenres.length > 0 ? sortedGenres : ['Données insuffisantes'],
          topDirectors: sortedDirectors.length > 0 ? sortedDirectors : ['Données insuffisantes'],
          topActors: sortedActors.length > 0 ? sortedActors : ['Données insuffisantes'],
        });
      }

      // Calcul Niveau final
      const currentLevel = Math.floor(calculatedXP / 500) + 1;
      const progressPercentage = ((calculatedXP % 500) / 500) * 100;

      setStats({
        watchedCount: watchedCountVal,
        toWatchCount: watchlistData ? watchlistData.filter((i) => i.status === 'to_watch').length : 0,
        moviesCount: moviesWatchedVal,
        tvCount: tvWatchedVal,
        totalXP: calculatedXP,
        level: currentLevel,
        xpProgress: progressPercentage,
      });

      // 4. Succès Secrets (Vérification et déblocage automatique)
      const currentHour = new Date().getHours();
      const hasSwipes = Boolean(swipesData && swipesData.length > 0);
      const likedCount = swipesData ? swipesData.filter((s: any) => s.action === 'liked').length : 0;

      const achievementsToCheck: { [key: string]: boolean } = {
        'premier_pas': watchedCountVal >= 1 || hasSwipes,
        'noctambule': currentHour >= 2 && currentHour <= 5,
        'cinéphile_assidu': moviesWatchedVal >= 10,
        'explorateur': likedCount >= 5,
      };

      const { data: dbAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_key')
        .eq('user_id', userId);

      let unlockedKeys = dbAchievements ? dbAchievements.map(a => a.achievement_key) : [];

      for (const [key, condition] of Object.entries(achievementsToCheck)) {
        if (condition && !unlockedKeys.includes(key)) {
          await supabase.from('user_achievements').insert([{ user_id: userId, achievement_key: key }]);
          unlockedKeys.push(key);
        }
      }
      setUnlockedAchievements(unlockedKeys);

      // 5. Amis (Acceptés) & Compatibilité
      const { data: friendshipsData } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendshipsData && friendshipsData.length > 0) {
        const friendIds = friendshipsData.map(f => f.user_id === userId ? f.friend_id : f.user_id);
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds);
          
        setFriends(friendProfiles || []);

        const compatMap: { [key: string]: number } = {};
        for (const fId of friendIds) {
          const { data: friendSwipes } = await supabase
            .from('user_swipes')
            .select('movie_id, action')
            .eq('user_uid', fId)
            .eq('action', 'liked');

          if (friendSwipes && friendSwipes.length > 0 && userLikedIds.length > 0) {
            const friendLikedIds = friendSwipes.map(s => s.movie_id);
            const commonMovies = friendLikedIds.filter(id => userLikedIds.includes(id));
            const totalUnique = new Set([...userLikedIds, ...friendLikedIds]).size;
            const score = Math.round((commonMovies.length / totalUnique) * 100);
            compatMap[fId] = Math.max(score, 15);
          } else {
            compatMap[fId] = 50;
          }
        }
        setFriendCompatibilities(compatMap);
      } else {
        setFriends([]);
      }

      // 6. Demandes d'amis en attente
      const { data: pendingData } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (pendingData && pendingData.length > 0) {
        const senderIds = pendingData.map(req => req.user_id);
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', senderIds);

        const formattedRequests = pendingData.map(req => ({
          ...req,
          senderProfile: senderProfiles?.find(p => p.id === req.user_id)
        }));
        setPendingRequests(formattedRequests);
      } else {
        setPendingRequests([]);
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

  const handleImageConversion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setUploadingImage(false);
    }
    reader.onerror = () => {
      alert("Erreur lors de la lecture de l'image.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
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
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde.');
    }
    setSavingProfile(false);
  };

  const addFriendByPseudo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError('');
    if (!friendPseudoInput.trim() || !user) return;

    try {
      const { data: targetProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', friendPseudoInput.trim())
        .single();

      if (searchError || !targetProfile) {
        setFriendError("Aucun utilisateur trouvé avec ce pseudo.");
        return;
      }

      if (targetProfile.id === user.id) {
        setFriendError("Vous ne pouvez pas vous ajouter vous-même !");
        return;
      }

      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        setFriendError("Une demande ou une relation existe déjà avec ce profil.");
        return;
      }

      const { error: insertError } = await supabase.from('friendships').insert([
        {
          user_id: user.id,
          friend_id: targetProfile.id,
          status: 'pending'
        }
      ]);

      if (insertError) throw insertError;
      alert(`Demande d'ami envoyée à ${targetProfile.username} ! 📨`);
      setFriendPseudoInput('');
      fetchUserData(user.id);
    } catch (err) {
      console.error('Erreur ajout ami:', err);
      setFriendError("Erreur lors de l'envoi de la demande.");
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      if (status === 'declined') {
        await supabase.from('friendships').delete().eq('id', requestId);
      } else {
        await supabase.from('friendships').update({ status }).eq('id', requestId);
      }
      fetchUserData(user.id);
    } catch (err) {
      console.error("Erreur lors de la réponse à la demande:", err);
      alert("Une erreur s'est produite.");
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
          <div>
            
            {/* CARTE D'IDENTITÉ DU PROFIL */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#27272A', overflow: 'hidden', border: '3px solid #C084FC', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px' }}>👤</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF' }}>
                    {username || 'Cinéphile Anonyme'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '0 0 8px 0' }}>{user.email}</p>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {age && <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#D4D4D8' }}>🎂 {age} ans</span>}
                    {gender && <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#D4D4D8' }}>{gender === 'male' ? '👨 Homme' : gender === 'female' ? '👩 Femme' : '🧑 Autre'}</span>}
                    {(country || region) && <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#D4D4D8' }}>📍 {region ? `${region}, ` : ''}{country}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button onClick={() => setIsEditing(!isEditing)} style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', color: '#C084FC', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {isEditing ? 'Fermer' : '✏️ Modifier mon profil'}
                </button>
                <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Déconnexion
                </button>
              </div>

              {/* FORMULAIRE DE MODIFICATION */}
              {isEditing && (
                <form onSubmit={handleSaveProfile} style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#C084FC', marginBottom: '12px' }}>Mettre à jour mes informations</h3>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Pseudo</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Choisir une photo de profil</label>
                    <input type="file" accept="image/*" onChange={handleImageConversion} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '12px', boxSizing: 'border-box', cursor: 'pointer' }} />
                    {uploadingImage && <span style={{ fontSize: '11px', color: '#C084FC', marginTop: '4px', display: 'block' }}>Conversion de l'image...</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Âge</label>
                      <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Sexe</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="">Non spécifié</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Pays</label>
                      <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '4px' }}>Région / Ville</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <button type="submit" disabled={savingProfile || uploadingImage} style={{ width: '100%', backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                    {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </form>
              )}
            </div>

            {/* BANDEAU AMIS & DUO */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#3B82F6', margin: '0 0 10px 0' }}>👥 Mes Amis & Duo</h3>

              {friendError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '8px', borderRadius: '8px', fontSize: '11px', marginBottom: '10px' }}>
                  {friendError}
                </div>
              )}

              {/* DEMANDES REÇUES */}
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#FBBF24', margin: '0 0 10px 0' }}>🔔 Demandes reçues ({pendingRequests.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>👤 {req.senderProfile?.username || 'Utilisateur inconnu'}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => respondToRequest(req.id, 'declined')} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid #EF4444', padding: '6px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>❌</button>
                          <button onClick={() => respondToRequest(req.id, 'accepted')} style={{ backgroundColor: '#4ADE80', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>✅ Accepter</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={addFriendByPseudo} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" placeholder="Entrer le pseudo d'un ami..." value={friendPseudoInput} onChange={(e) => setFriendPseudoInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '12px' }} />
                <button type="submit" style={{ backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                  Ajouter
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friends.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#71717A', margin: 0 }}>Aucun ami ajouté pour l'instant.</p>
                ) : (
                  friends.map((friend) => {
                    const compat = friendCompatibilities[friend.id] || 50;
                    return (
                      <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#D4D4D8', display: 'block' }}>👤 {friend.username || 'Ami'}</span>
                          <span style={{ fontSize: '10px', color: compat >= 60 ? '#4ADE80' : compat >= 30 ? '#FBBF24' : '#EF4444', fontWeight: '700' }}>
                            ⚡ Compatibilité : {compat}%
                          </span>
                        </div>
                        <a href={`/potecorn-party?duo_with=${friend.id}`} style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
                          Lancer Duo 🚀
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CARTE NIVEAU & XP */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.2)' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '3px solid #C084FC' }}>
                🎭
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Niveau {stats.level}</h2>
              <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{stats.totalXP} XP Cumulés</span>
              <div style={{ marginTop: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '10px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${stats.xpProgress}%`, height: '100%', backgroundColor: '#9333EA', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '10px', color: '#A1A1AA', marginTop: '6px', display: 'block' }}>Prochain niveau dans {500 - (stats.totalXP % 500)} XP</span>
            </div>

            {/* GRILLE DES STATISTIQUES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>🎬</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.moviesCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Films vus</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📺</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>{stats.tvCount}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Séries vues</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>✨</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#4ADE80' }}>{likedMovies.length}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Films validés</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>❌</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#EF4444' }}>{dislikedMovies.length}</span>
                <span style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginTop: '2px' }}>Red Flags</span>
              </div>
            </div>

            {/* LE PANTHÉON DU CINÉPHILE */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 30px -5px rgba(251, 191, 36, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>🏛️</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FBBF24', margin: 0 }}>Le Panthéon du Cinéphile</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '20px' }}>Tes préférences absolues basées sur tes swipes validés.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#18181B', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>🎭 Genres Favoris</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pantheon.topGenres.map((genre, idx) => (
                      <span key={idx} style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#18181B', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>🎬 Réalisateurs Fétiches</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pantheon.topDirectors.map((director, idx) => (
                      <span key={idx} style={{ backgroundColor: 'rgba(192, 132, 252, 0.15)', color: '#C084FC', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                        {director}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#18181B', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>🌟 Acteurs / Actrices Fétiches</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pantheon.topActors.map((actor, idx) => (
                      <span key={idx} style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QUÊTES & SUCCÈS SECRETS (RPG) */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#C084FC', margin: '0 0 16px 0' }}>🏆 Quêtes & Succès Secrets</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: unlockedAchievements.includes('premier_pas') ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🍿</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0' }}>Premier Pas</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir validé au moins 1 film ou série</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: unlockedAchievements.includes('noctambule') ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🌙</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#60A5FA' }}>Noctambule</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Se connecter et valider des films tard dans la nuit (entre 2h et 5h)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: unlockedAchievements.includes('cinéphile_assidu') ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🎬</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#F472B6' }}>Cinéphile Assidu</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Avoir visionné 10 films</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: unlockedAchievements.includes('explorateur') ? 1 : 0.3 }}>
                  <div style={{ fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>🚀</div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 2px 0', color: '#FBBF24' }}>Explorateur de Pépites</h4>
                    <p style={{ fontSize: '10px', color: '#A1A1AA', margin: 0 }}>Aimer 5 films lors des sessions PoteCorn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HISTORIQUE DES SWIPES */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#EC4899', margin: 0 }}>🔥 Historique PoteCorn Party</h3>
                <a href="/potecorn-party" style={{ fontSize: '11px', color: '#C084FC', textDecoration: 'none', fontWeight: '600' }}>Relancer →</a>
              </div>
              {swipes.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#A1A1AA', textAlign: 'center', margin: '20px 0' }}>Aucun film swipé avec ce compte.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {swipes.map((item) => (
                    <div key={item.id} style={{ backgroundColor: '#18181B', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                      <div style={{ height: '140px', backgroundColor: '#27272A', position: 'relative' }}>
                        {item.poster_path ? (
                          <img src={item.poster_path} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717A', fontSize: '10px' }}>Pas d'affiche</div>
                        )}
                        <span style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: item.action === 'liked' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(239, 68, 68, 0.9)', color: '#000', padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                          {item.action === 'liked' ? '✨' : '❌'}
                        </span>
                      </div>
                      <div style={{ padding: '6px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
