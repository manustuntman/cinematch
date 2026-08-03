'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function AiOracleCard({ userId, onOpenMovie }: { userId: string; onOpenMovie: (movie: any) => void }) {
  const [oracleText, setOracleText] = useState<string>('Analyse de ton profil cinéphile en cours...');
  const [suggestedMovie, setSuggestedMovie] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const generatePersonalizedAdvice = async () => {
      try {
        // 1. Récupérer les likes de l'utilisateur pour comprendre ses goûts
        const { data: swipes } = await supabase
          .from('user_swipes')
          .select('*')
          .eq('user_uid', userId)
          .eq('action', 'liked')
          .limit(10);

        // 2. Récupérer le profil pour avoir son pseudo
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();

        const pseudo = profile?.username || 'Cinéphile';
        const currentHour = new Date().getHours();
        
        // Contexte temporel pour l'IA
        let timeContext = "en soirée";
        if (currentHour >= 5 && currentHour < 12) timeContext = "ce matin";
        else if (currentHour >= 12 && currentHour < 18) timeContext = "cet après-midi";
        else if (currentHour >= 22 || currentHour < 5) timeContext = "tard dans la nuit";

        // 3. Appel de l'API IA (Ton endpoint /api/ai-recommend ou similaire)
        const res = await fetch('/api/ai-recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Génère un conseil ciné personnalisé et court pour ${pseudo} qui se connecte ${timeContext}. Il aime ces films/genres: ${JSON.stringify(swipes?.map(s => s.title))}. Donne-lui l'impression que tu le connais par cœur.`,
            mediaType: 'movie' 
          }),
        });

        const data = await res.json();
        
        if (data && data.recommendations && data.recommendations.length > 0) {
          const rec = data.recommendations[0];
          setOracleText(rec.reason);

          // Chercher le film sur TMDB pour récupérer l'affiche
          const tmdbRes = await fetch(`/api/tmdb?endpoint=/search/movie&language=fr-FR&query=${encodeURIComponent(rec.title)}&page=1`);
          const tmdbData = await tmdbRes.json();
          if (tmdbData.results && tmdbData.results.length > 0) {
            setSuggestedMovie(tmdbData.results[0]);
          }
        } else {
          setOracleText(`Salut ${pseudo} ! Swipe quelques films pour que je puisse cerner tes goûts et te concocter des recommandations sur-mesure.`);
        }
      } catch (err) {
        console.error("Erreur Oracle IA:", err);
        setOracleText("L'Oracle se repose... Continue de swiper pour alimenter ton profil !");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      generatePersonalizedAdvice();
    }
  }, [userId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '24px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#C084FC', margin: 0 }}>🔮 L'Oracle PoteCorn analyse tes goûts...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.15))', 
      border: '1px solid rgba(192, 132, 252, 0.4)', 
      borderRadius: '24px', 
      padding: '20px', 
      marginBottom: '24px',
      boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>🔮</span>
        <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '1px' }}>
          L'Oracle PoteCorn (IA sur-mesure)
        </h3>
      </div>

      <p style={{ fontSize: '13px', color: '#FFF', lineHeight: '1.5', margin: '0 0 16px 0', fontStyle: 'italic' }}>
        "{oracleText}"
      </p>

      {suggestedMovie && (
        <div 
          onClick={() => onOpenMovie(suggestedMovie)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            backgroundColor: 'rgba(24, 24, 27, 0.9)', 
            border: '1px solid rgba(255, 255, 255, 0.15)', 
            padding: '10px', 
            borderRadius: '16px', 
            cursor: 'pointer' 
          }}
        >
          <div style={{ position: 'relative', width: '45px', height: '65px', flexShrink: 0 }}>
            <Image 
              src={suggestedMovie.poster_path ? `https://image.tmdb.org/t/p/w185${suggestedMovie.poster_path}` : 'https://via.placeholder.com/45x65'} 
              alt="" 
              fill 
              sizes="45px" 
              style={{ objectFit: 'cover', borderRadius: '8px' }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase' }}>Coup de cœur du moment :</span>
            <h4 style={{ fontSize: '13px', fontWeight: '800', margin: '2px 0 2px 0', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {suggestedMovie.title}
            </h4>
            <span style={{ fontSize: '10px', color: '#A1A1AA' }}>★ {suggestedMovie.vote_average?.toFixed(1)} / 10 • Voir la fiche →</span>
          </div>
        </div>
      )}
    </div>
  );
}
