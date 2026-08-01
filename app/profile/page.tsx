'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'friends'>('stats');
  const [feedback, setFeedback] = useState<string | null>(null);

  // États pour le système d'amis
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setCurrentUser(session.user);
        
        // Récupérer les infos du profil actuel
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setUserProfile(profile || { username: 'Anonyme', xp: 0 });
        
        // Charger les amis et demandes
        loadFriendsData(session.user.id);
      }
    };
    initProfile();
  }, []);

  const loadFriendsData = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Récupérer les demandes en attente (reçues par l'utilisateur)
      const { data: requests } = await supabase
        .from('friendships')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (requests && requests.length > 0) {
        const senderIds = requests.map(req => req.sender_id);
        const { data: senders } = await supabase.from('profiles').select('*').in('id', senderIds);
        
        const formattedRequests = requests.map(req => ({
          ...req,
          senderProfile: senders?.find(s => s.id === req.sender_id)
        }));
        setPendingRequests(formattedRequests);
      } else {
        setPendingRequests([]);
      }

      // 2. Récupérer les amis acceptés
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.sender_id === userId ? f.receiver_id : f.sender_id);
        const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', friendIds);
        setFriends(friendProfiles || []);
      } else {
        setFriends([]);
      }

    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleSearchUsers = async () => {
    if (searchQuery.trim().length < 3 || !currentUser) return;
    setIsLoading(true);
    try {
      // Chercher des utilisateurs (hors soi-même)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentUser.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      // Vérifier si une relation existe déjà
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .single();

      if (existing) {
        showFeedback('Une demande existe déjà avec cet utilisateur.');
        return;
      }

      const { error } = await supabase.from('friendships').insert([
        { sender_id: currentUser.id, receiver_id: receiverId, status: 'pending' }
      ]);

      if (error) throw error;
      showFeedback('Demande d\'ami envoyée ! 📨');
      setSearchResults(searchResults.filter(u => u.id !== receiverId)); // Retire des résultats
    } catch (err) {
      console.error(err);
      showFeedback('Erreur lors de l\'envoi de la demande.');
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      showFeedback(status === 'accepted' ? 'Ami ajouté ! 🎉' : 'Demande refusée.');
      loadFriendsData(currentUser.id); // Recharger les listes
    } catch (err) {
      console.error(err);
      showFeedback('Erreur lors de la réponse.');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Calcul du niveau
  const userLevel = userProfile ? Math.floor(userProfile.xp / 500) + 1 : 1;
  const xpProgress = userProfile ? (userProfile.xp % 500) / 500 * 100 : 0;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF', padding: '16px 16px 90px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* HEADER PROFIL */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', borderRadius: '24px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px', marginTop: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#9333EA', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', border: '3px solid #C084FC' }}>
            👤
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>{userProfile?.username || 'Cinéphile'}</h1>
          <p style={{ color: '#FBBF24', fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0' }}>Niveau {userLevel} ✨</p>
          
          <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '10px', height: '8px', width: '100%', overflow: 'hidden' }}>
            <div style={{ width: `${xpProgress}%`, height: '100%', backgroundColor: '#9333EA', borderRadius: '10px' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '8px' }}>{500 - (userProfile?.xp % 500 || 0)} XP avant le niveau {userLevel + 1}</p>
        </div>

        {/* ONGLETS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setActiveTab('stats')} style={{ flex: 1, backgroundColor: activeTab === 'stats' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)', color: '#FFF', border: activeTab === 'stats' ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            📊 Statistiques
          </button>
          <button onClick={() => setActiveTab('friends')} style={{ flex: 1, backgroundColor: activeTab === 'friends' ? '#EC4899' : 'rgba(255, 255, 255, 0.05)', color: '#FFF', border: activeTab === 'friends' ? '1px solid #F472B6' : '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', position: 'relative' }}>
            👥 Mes Amis
            {pendingRequests.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* CONTENU SOCIAL (AMIS) */}
        {activeTab === 'friends' && (
          <div>
            {/* BARRE DE RECHERCHE D'AMIS */}
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>🔍 Trouver des Potes</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pseudo de ton ami..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: '13px', outline: 'none' }}
                />
                <button onClick={handleSearchUsers} style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '0 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {isLoading ? '...' : 'Chercher'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {searchResults.map(user => (
                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{user.username}</span>
                      <button onClick={() => sendFriendRequest(user.id)} style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#C084FC', border: '1px solid #C084FC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DEMANDES EN ATTENTE */}
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#FBBF24', marginBottom: '12px' }}>🔔 Demandes reçues ({pendingRequests.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '12px 16px', borderRadius: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{req.senderProfile?.username}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => respondToRequest(req.id, 'declined')} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid #EF4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ❌
                        </button>
                        <button onClick={() => respondToRequest(req.id, 'accepted')} style={{ backgroundColor: '#4ADE80', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                          ✅ Accepter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LISTE DES AMIS */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>🫂 Mes Potes ({friends.length})</h3>
              {friends.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#A1A1AA', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                  Tu n'as pas encore d'amis ajoutés. Utilise la recherche au-dessus pour en trouver !
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {friends.map(friend => (
                    <div key={friend.id} style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EC4899', margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                      <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>{friend.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENU STATS (Si actif) */}
        {activeTab === 'stats' && (
          <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🍿</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Ton Panthéon arrive bientôt</h3>
            <p style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: '1.5' }}>
              Cette section regroupera tes statistiques de visionnage, tes genres favoris, et les films que tu as le plus aimés sur PoteCorn.
            </p>
          </div>
        )}

        {feedback && (
          <div style={{ position: 'fixed', bottom: '100px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000 }}>
            {feedback}
          </div>
        )}
      </div>

      {/* BARRE DE NAVIGATION MOBILE */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(24, 24, 27, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-around', padding: '12px 0 24px 0', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
        <a href="/" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', fontSize: '20px' }}>
          🏠<span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>Accueil</span>
        </a>
        <a href="/potecorn-party" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', fontSize: '20px' }}>
          🔥<span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>Party</span>
        </a>
        <a href="/playlists" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', fontSize: '20px' }}>
          🎵<span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>Playlists</span>
        </a>
        <a href="/profile" style={{ color: '#9333EA', textDecoration: 'none', textAlign: 'center', fontSize: '20px' }}>
          👤<span style={{ display: 'block', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>Profil</span>
        </a>
      </nav>
    </main>
  );
}
