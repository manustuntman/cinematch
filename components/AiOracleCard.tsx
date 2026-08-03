'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function AiOracleCard({ userId, userWatchlist, onOpenMovie }: { userId: string; userWatchlist: any[]; onOpenMovie: (movie: any) => void }) {
  const [oracleText, setOracleText] = useState<string>('Analyse de ton profil cinéphile en cours...');
  const [suggestedMovie, setSuggestedMovie] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const generatePersonalizedAdvice = async () => {
      try {
        // 1. Récupérer le profil pour avoir son pseudo
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

        // Récupérer la liste des titres déjà vus pour les interdire formellement à l'IA
        const watchedTitles = userWatchlist
          .filter(w => w.status === 'watched')
          .map(w => w.title)
          .filter(Boolean);

        // 2. Appel de l'API IA avec la liste des films déjà vus interdits
        const res = await fetch('/api/ai-recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Génère un conseil ciné personnalisé et court pour ${pseudo} qui se connecte ${timeContext}. IMPORTANT : Ne recommandes JAMAIS un film ou une série déjà vu(e) par l'utilisateur. Voici la liste exacte des films qu'il a DÉJÀ VUS et qu'il ne faut SURTOUT PAS recommander : ${JSON.stringify(watchedTitles)}. Propose-lui une NOUVEAUTÉ qu'il n'a pas encore vue.`,
            mediaType: 'movie' 
          }),
        });

        const data = await res.json();
        
        if (data && data.recommendations && data.recommendations.length > 0) {
          // Filtrage de sécurité au cas où l'IA passe outre la consigne
          const validRecs = data.recommendations.filter((rec: any) => 
            !watchedTitles.some(watched => watched?.toLowerCase() === rec.title?.toLowerCase())
          );

          const rec = validRecs.length > 0 ? validRecs[0] : data.recommendations[0];
          setOracleText(rec.reason);

          // Chercher le film sur TMDB pour récupérer l'affiche (avec exclusion du contenu adulte)
          const tmdbRes = await fetch(`/api/tmdb?endpoint=/search/movie&language=fr-FR&include_adult=false&query=${encodeURIComponent(rec.title)}&page=1`);
          const tmdbData = await tmdbRes.json();
          if (tmdbData.results && tmdbData.results.length > 0) {
            setSuggestedMovie(tmdbData.results[0]);
          }
        } else {
          setOracleText(`Salut ${pseudo} ! Marque tes films vus pour que je puisse te proposer de vraies découvertes.`);
        }
      } catch (err) {
        console.error("Erreur Oracle IA:", err);
        setOracleText("L'Oracle se repose... Continue d'explorer pour alimenter ton profil !");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      generatePersonalizedAdvice();
    }
  }, [userId, userWatchlist]);

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
        &quot;{oracleText}&quot;
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
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase' }}>Découverte suggérée :</span>
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
