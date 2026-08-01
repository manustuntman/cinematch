'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BackstagePage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Statistiques Globales
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSwipes: 0,
    totalLikes: 0,
    totalDislikes: 0,
  });

  // Mégaphone (Annonces)
  const [announcementInput, setAnnouncementInput] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // Radar à Membres (Utilisateurs)
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      try {
        // 1. Récupérer les profils utilisateurs
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('username', { ascending: true });

        if (profilesData) {
          setUsersList(profilesData);
        }

        // 2. Récupérer les statistiques des swipes
        const { data: swipesData } = await supabase
          .from('user_swipes')
          .select('action');

        let likes = 0;
        let dislikes = 0;
        if (swipesData) {
          likes = swipesData.filter(s => s.action === 'liked').length;
          dislikes = swipesData.filter(s => s.action === 'disliked').length;
        }

        setStats({
          totalUsers: profilesData ? profilesData.length : 0,
          totalSwipes: swipesData ? swipesData.length : 0,
          totalLikes: likes,
          totalDislikes: dislikes,
        });

      } catch (err) {
        console.error('Erreur chargement backstage:', err);
      }

      setLoading(false);
    };

    checkAdminAndFetchData();
  }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    setSendingAnnouncement(true);

    try {
      const { error } = await supabase.from('announcements').insert([
        { message: announcementInput.trim() }
      ]);

      if (error) throw error;
      alert('Annonce diffusée avec succès à toute la communauté ! 📢');
      setAnnouncementInput('');
    } catch (err) {
      console.error('Erreur envoi annonce:', err);
      alert("Erreur lors de l'envoi de l'annonce.");
    }
    setSendingAnnouncement(false);
  };

  const toggleBanUser = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsersList(usersList.map(u => u.id === userId ? { ...u, is_banned: newStatus } : u));
    } catch (err) {
      console.error('Erreur modification statut ban:', err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const addBonusXP = async (userId: string, currentXp: number) => {
    try {
      const bonus = 500;
      const updatedXp = (currentXp || 0) + bonus;
      const { error } = await supabase
        .from('profiles')
        .update({ xp: updatedXp })
        .eq('id', userId);

      if (error) throw error;

      setUsersList(usersList.map(u => u.id === userId ? { ...u, xp: updatedXp } : u));
      alert('Bonus de 500 XP attribué avec succès ! 🎉');
    } catch (err) {
      console.error('Erreur ajout XP:', err);
      alert("Erreur lors de l'ajout d'XP.");
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Vérification des accès Backstage...</p>
      </main>
    );
  }

  if (unauthorized || !isAdmin) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <span style={{ fontSize: '50px', marginBottom: '16px' }}>🚨</span>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Accès Interdit</h1>
        <p style={{ color: '#A1A1AA', marginBottom: '20px' }}>Vous devez être connecté pour accéder au Backstage.</p>
        <a href="/" style={{ backgroundColor: '#EC4899', color: '#FFF', padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700' }}>Retour à l'accueil</a>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <a href="/" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFF', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            ← Accueil
          </a>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #EC4899, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🛠️ PoteCorn Backstage
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {/* SECTION 1 : STATISTIQUES GLOBALES */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#C084FC', marginBottom: '14px' }}>📊 Statistiques Globales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>👥</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#FFF' }}>{stats.totalUsers}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginTop: '4px' }}>Utilisateurs Inscrits</span>
            </div>

            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>🎬</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#FFF' }}>{stats.totalSwipes}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginTop: '4px' }}>Swipes Totaux</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 : RADAR À MEMBRES */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '20px', padding: '24px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>🛰️</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#3B82F6', margin: 0 }}>Radar à Membres (Gestion Utilisateurs)</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '16px' }}>Liste de tous les cinéphiles inscrits sur l'application.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            {usersList.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#71717A' }}>Aucun utilisateur trouvé.</p>
            ) : (
              usersList.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF', display: 'block' }}>
                      {u.username || 'Anonyme'} {u.is_banned && <span style={{ color: '#EF4444', fontSize: '11px' }}>(Banni 🚫)</span>}
                    </span>
                    <span style={{ fontSize: '11px', color: '#A1A1AA' }}>
                      {u.region ? `${u.region} - ` : ''} {u.age ? `${u.age} ans` : ''} • XP : {u.xp || 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => addBonusXP(u.id, u.xp)}
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      +500 XP ⚡
                    </button>
                    <button 
                      onClick={() => toggleBanUser(u.id, u.is_banned)}
                      style={{ backgroundColor: u.is_banned ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: u.is_banned ? '#4ADE80' : '#EF4444', border: u.is_banned ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {u.is_banned ? 'Débannir' : 'Bannir'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3 : LE MÉGAPHONE (ANNONCES) */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>📢</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#EC4899', margin: 0 }}>Le Mégaphone (Annonce Communautaire)</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '16px' }}>Diffuse un message officiel qui s'affichera pour tous les utilisateurs.</p>

          <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea 
              rows={3}
              placeholder="Tape ton annonce ici..."
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3F3F46', backgroundColor: '#27272A', color: '#FFF', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <button 
              type="submit" 
              disabled={sendingAnnouncement}
              style={{ backgroundColor: '#EC4899', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
            >
              {sendingAnnouncement ? 'Diffusion en cours...' : 'Diffuser l’annonce 🚀'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
