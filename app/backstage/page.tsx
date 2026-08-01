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

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      // Optionnel : tu peux vérifier si l'email correspond au tien ou à un rôle admin
      // Pour l'instant, on laisse l'accès si la personne est connectée (à sécuriser plus tard si besoin)
      setIsAdmin(true);

      try {
        // 1. Récupérer le nombre total d'utilisateurs
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

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
          totalUsers: userCount || 0,
          totalSwipes: swipesData ? swipesData.length : 0,
          totalLikes: likes,
          totalDislikes: dislikes,
        });

      } catch (err) {
        console.error('Erreur chargement stats backstage:', err);
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
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
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
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#C084FC', marginBottom: '14px' }}>📊 Statistiques Globales de l'App</h2>
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

            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>✨</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#4ADE80' }}>{stats.totalLikes}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginTop: '4px' }}>Films Validés (Likes)</span>
            </div>

            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>❌</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#EF4444' }}>{stats.totalDislikes}</span>
              <span style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginTop: '4px' }}>Red Flags</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 : LE MÉGAPHONE (ANNONCES) */}
        <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>📢</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#EC4899', margin: 0 }}>Le Mégaphone (Annonce Communautaire)</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '16px' }}>Diffuse un message officiel qui s'affichera pour tous les utilisateurs de PoteCorn.</p>

          <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea 
              rows={3}
              placeholder="Tape ton annonce ici (ex: Nouvelle mise à jour disponible !)..."
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
