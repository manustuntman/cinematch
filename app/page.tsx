'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const GENRES_LIST_MOVIES = [
  { id: 878, name: 'Science-Fiction 🚀' },
  { id: 28, name: 'Action 💥' },
  { id: 53, name: 'Thriller 🔪' },
  { id: 12, name: 'Aventure 🗺️' },
  { id: 35, name: 'Comédie 😂' },
  { id: 18, name: 'Drame 🎭' },
  { id: 14, name: 'Fantastique 🧙' },
  { id: 9648, name: 'Mystère 🕵️' },
];

const GENRES_LIST_TV = [
  { id: 10765, name: 'Sci-Fi & Fantastique 🚀' },
  { id: 10759, name: 'Action & Aventure 💥' },
  { id: 80, name: 'Crime / Thriller 🔪' },
  { id: 35, name: 'Comédie 😂' },
  { id: 18, name: 'Drame 🎭' },
  { id: 9648, name: 'Mystère 🕵️' },
];

const AVERSIONS_LIST = [
  { id: 10683, keyword: '10683,235336', name: '🚫 Huis clos / Espaces clos' },
  { id: 3047, keyword: '3047,12615', name: '🕷️ Araignées' },
  { id: 1566, keyword: '1566', name: '🤡 Clowns' },
  { id: 9799, keyword: '9799,210046', name: '🩸 Sang / Extreme Gore' },
  { id: 2439, keyword: '2439,183205', name: '🐍 Serpents' },
];

const AVAILABLE_TAGS = ['Cinema 🍿', 'En solo 🎧', 'En famille 👨‍👩‍👦', 'Coup de cœur ❤️', 'À revoir 🔄'];

function MediaCardXRay({ item, mediaType, onOpen }: { item: any; mediaType: 'movie' | 'tv'; onOpen: (item: any) => void }) {
  const [cast, setCast] = useState<any[]>([]);
  const title = item.title || item.name;

  useEffect(() => {
    let isMounted = true;
    const fetchCast = async () => {
      try {
        const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
        const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${item.id}/credits?api_key=${API_KEY}&language=fr-FR`);
        const data = await res.json();
        if (isMounted && data.cast) {
          setCast(data.cast.slice(0, 2));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCast();
    return () => { isMounted = false; };
  }, [item.id, mediaType]);

  return (
    <div 
      onClick={() => onOpen(item)}
      style={{ 
        backgroundColor: 'rgba(24, 24, 27, 0.9)', 
        border: '1px solid rgba(255, 255, 255, 0.12)', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
        cursor: 'pointer'
      }}
    >
      <div>
        <div style={{ position: 'relative' }}>
          <img 
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450'} 
            alt={title} 
            style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
          />
          <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#FBBF24', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
            ★ {item.vote_average?.toFixed(1)}
          </span>
        </div>

        <div style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFF' }}>
            {title}
          </h3>

          <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '12px', padding: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              ⚡ X-Ray Casting :
            </span>
            {cast.length > 0 ? (
              cast.map((actor, idx) => (
                <div key={idx} style={{ fontSize: '10px', color: '#D4D4D8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                  <strong style={{ color: '#FFF' }}>{actor.name}</strong> <span style={{ color: '#A1A1AA' }}>({actor.character || 'Rôle'})</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '10px', color: '#71717A' }}>Chargement X-Ray...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie'); 
  const [preferences, setPreferences] = useState<number[]>([]);
  const [selectedAversions, setSelectedAversions] = useState<number[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');                 
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [trendingMedia, setTrendingMedia] = useState<any[]>([]);
  const [recommendedMedia, setRecommendedMedia] = useState<any[]>([]);
  const [carouselMedia, setCarouselMedia] = useState<any[]>([]);
  const [rouletteMedia, setRouletteMedia] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMediaDetail, setSelectedMediaDetail] = useState<any>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'info' | 'xray'>('info');
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');

  const [mediaDetailsExt, setMediaDetailsExt] = useState<{ 
    director: string; 
    castWithRoles: { name: string; character: string; profile_path: string | null }[]; 
    providers: any[]; 
    freeProviders: any[]; 
    trailerKey: string | null;
    tagline: string;
    runtime: string;
  }>({
    director: '',
    castWithRoles: [],
    providers: [],
    freeProviders: [],
    trailerKey: null,
    tagline: '',
    runtime: '',
  });
  const [loadingExt, setLoadingExt] = useState(false);

  const [userNotes, setUserNotes] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchUserPlaylists = async () => {
    try {
      const { data } = await supabase.from('playlists').select('*');
      if (data) setUserPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getExcludedKeywordsString = () => {
    return selectedAversions
      .map(id => AVERSIONS_LIST.find(a => a.id === id)?.keyword)
      .filter(Boolean)
      .join(',');
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.slice(0, 10));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrending = async () => {
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const url = `https://api.themoviedb.org/3/trending/${mediaType}/week?api_key=${API_KEY}&language=fr-FR`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setTrendingMedia(data.results.slice(0, 20));
        setCarouselMedia(data.results.slice(0, 12));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async (selectedGenres: number[]) => {
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const genreQuery = selectedGenres.join(',');
      const excluded = getExcludedKeywordsString();
      const excludeParam = excluded ? `&without_keywords=${excluded}` : '';
      
      const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=fr-FR&with_genres=${genreQuery}&sort_by=popularity.desc${excludeParam}&page=1`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setRecommendedMedia(data.results.slice(0, 20));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResults([]);

    try {
      const API_KEY_TMDB = '93388a6035cae903edcb4051e1eb6e7b';

      const aiRes = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, mediaType }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok || !aiData.recommendations) {
        setFeedback(`🤖 ${aiData.error || 'Erreur lors de l\'appel IA'}`);
        setTimeout(() => setFeedback(null), 6000);
        setAiLoading(false);
        return;
      }

      const fetchedResults: any[] = [];

      for (const rec of aiData.recommendations) {
        let tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/${mediaType}?api_key=${API_KEY_TMDB}&language=fr-FR&query=${encodeURIComponent(rec.title)}&page=1`
        );
        let tmdbData = await tmdbRes.json();

        if (!tmdbData.results || tmdbData.results.length === 0) {
          const simplifiedTitle = rec.title.split(':')[0].split('-')[0].trim();
          tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/${mediaType}?api_key=${API_KEY_TMDB}&language=fr-FR&query=${encodeURIComponent(simplifiedTitle)}&page=1`
          );
          tmdbData = await tmdbRes.json();
        }

        if (tmdbData.results && tmdbData.results.length > 0) {
          fetchedResults.push({
            ...tmdbData.results[0],
            aiReason: rec.reason,
          });
        }
      }

      if (fetchedResults.length > 0) {
        setAiResults(fetchedResults);
      } else {
        setFeedback('🤖 Aucun résultat trouvé sur TMDB pour les titres suggérés.');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback('⚠️ Erreur de connexion avec le serveur');
      setTimeout(() => setFeedback(null), 4000);
    }
    setAiLoading(false);
  };

  const fetchRandomMedia = async () => {
    setIsSpinning(true);
    setRouletteMedia(null);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      const genreParam = preferences.length > 0 ? `&with_genres=${preferences.join(',')}` : '';
      const excluded = getExcludedKeywordsString();
      const excludeParam = excluded ? `&without_keywords=${excluded}` : '';
      
      const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc${genreParam}${excludeParam}&page=${Math.floor(Math.random() * 5) + 1}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      setTimeout(() => {
        if (data.results && data.results.length > 0) {
          const random = data.results[Math.floor(Math.random() * data.results.length)];
          setRouletteMedia(random);
        }
        setIsSpinning(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
    }
  };

  const fetchExtraDetails = async (id: string | number) => {
    setLoadingExt(true);
    try {
      const API_KEY = '93388a6035cae903edcb4051e1eb6e7b';
      
      const detailRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=fr-FR`);
      const detailData = await detailRes.json();

      const creditsRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${API_KEY}&language=fr-FR`);
      const creditsData = await creditsRes.json();
      
      const directorObj = mediaType === 'movie' 
        ? creditsData.crew?.find((member: any) => member.job === 'Director')
        : detailData.created_by?.[0];

      const directorName = directorObj ? directorObj.name : 'Non renseigné';
      const castWithRoles = creditsData.cast ? creditsData.cast.slice(0, 6).map((c: any) => ({
        name: c.name,
        character: c.character || c.roles?.[0]?.character || 'Rôle principal',
        profile_path: c.profile_path
      })) : [];

      const providersRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${API_KEY}`);
      const providersData = await providersRes.json();
      const frProviders = providersData.results?.FR || {};

      let videoRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${API_KEY}&language=fr-FR`);
      let videoData = await videoRes.json();
      let trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      
      if (!trailer) {
        videoRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${API_KEY}&language=en-US`);
        videoData = await videoRes.json();
        trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      }

      const runtimeStr = mediaType === 'movie' 
        ? detailData.runtime ? `${Math.floor(detailData.runtime / 60)}h ${detailData.runtime % 60}m` : 'N/A'
        : detailData.number_of_seasons ? `${detailData.number_of_seasons} saison(s)` : 'N/A';

      setMediaDetailsExt({
        director: directorName,
        castWithRoles,
        providers: frProviders.flatrate || [],
        freeProviders: frProviders.free || [],
        trailerKey: trailer ? trailer.key : null,
        tagline: detailData.tagline || '',
        runtime: runtimeStr,
      });
    } catch (err) {
      console.error(err);
    }
    setLoadingExt(false);
  };

  const openMediaModal = (item: any) => {
    setSelectedMediaDetail(item);
    setActiveTab('info');
    setUserNotes('');
    setUserRating(0);
    setSelectedTags([]);
    fetchExtraDetails(item.id);
    fetchUserPlaylists();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const shareCard = () => {
    if (!selectedMediaDetail) return;
    const title = selectedMediaDetail.title || selectedMediaDetail.name;
    const textToShare = `🎬 Mon avis sur "${title}" sur PoteCorn :\nNote: ${'⭐'.repeat(userRating || 5)}\nAmbiance: ${selectedTags.join(', ')}\nRemarques: "${userNotes || 'À ne pas manquer !'}"`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setFeedback('📋 Fiche copiée ! Prête à être partagée.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const saveToSupabaseWithNotebook = async (status: 'to_watch' | 'watched') => {
    if (!selectedMediaDetail) return;
    setFeedback(null);
    const title = selectedMediaDetail.title || selectedMediaDetail.name;
    const movieIdStr = selectedMediaDetail.id.toString();

    try {
      const { data: existing, error: checkError } = await supabase
        .from('watchlist')
        .select('id')
        .eq('movie_id', movieIdStr);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        setFeedback('⚠️ Ce média est déjà dans votre liste !');
        setTimeout(() => setFeedback(null), 3000);
        setSelectedMediaDetail(null);
        return;
      }

      const { error } = await supabase.from('watchlist').insert([
        {
          movie_id: movieIdStr,
          title: title,
          poster_path: selectedMediaDetail.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMediaDetail.poster_path}` : selectedMediaDetail.poster,
          vote_average: parseFloat(selectedMediaDetail.vote_average || 0),
          status: status,
          user_notes: userNotes,
          user_rating: userRating,
          user_tags: selectedTags,
          media_type: mediaType
        },
      ]);

      if (error) throw error;
      setFeedback(status === 'to_watch' ? '📌 Ajouté à la Watchlist !' : '👁️ Marqué comme vu !');
      setSelectedMediaDetail(null);
    } catch (err) {
      setFeedback(`⚠️ Erreur lors de la sauvegarde`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const addToPlaylist = async () => {
    if (!selectedPlaylistId || !selectedMediaDetail) return;
    try {
      const targetPl = userPlaylists.find(p => p.id === selectedPlaylistId);
      if (!targetPl) return;

      const updatedItems = [...(targetPl.items || []), {
        id: selectedMediaDetail.id,
        title: selectedMediaDetail.title || selectedMediaDetail.name,
        poster_path: selectedMediaDetail.poster_path,
        media_type: mediaType
      }];

      const { error } = await supabase.from('playlists').update({ items: updatedItems }).eq('id', selectedPlaylistId);
      if (error) throw error;

      setFeedback(`🎵 Ajouté à la playlist "${targetPl.title}" !`);
      setSelectedPlaylistId('');
    } catch (err) {
      setFeedback('⚠️ Erreur ajout playlist');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    if (isMounted) {
      fetchTrending();
    }
  }, [mediaType, isMounted]);

  if (!isMounted) {
    return null;
  }

  const currentGenresList = mediaType === 'movie' ? GENRES_LIST_MOVIES : GENRES_LIST_TV;

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', margin: 0, padding: '0 16px 24px 16px', overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ANIMATION CSS POUR LE CAROUSEL FLUIDE */}
      <style jsx global>{`
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: scrollMarquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{ maxWidth: '650px', margin: '0 auto', position: 'relative' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginBottom: '16px' }}>
          <div>
            <img 
              src="/logo.png" 
              alt="Logo PoteCorn" 
              style={{ height: '45px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <a 
            href="/profile" 
            title="Mon Profil & XP"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: 'rgba(24, 24, 27, 0.8)', 
              border: '1px solid rgba(255, 255, 255, 0.15)', 
              padding: '6px 12px 6px 6px', 
              borderRadius: '30px', 
              textDecoration: 'none'
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>👤</div>
            <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>Profil / XP</span>
          </a>
        </header>

        {/* BARRE DE RECHERCHE RAPIDE */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`🔍 Rechercher un ${mediaType === 'movie' ? 'film' : 'série'}...`}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: 'rgba(24, 24, 27, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '50px', left: 0, width: '100%', backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px', zIndex: 500, maxHeight: '280px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { openMediaModal(item); setSearchResults([]); setSearchQuery(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                >
                  <img src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'https://via.placeholder.com/40'} alt="" style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', margin: '0 0 2px 0', color: '#FFF' }}>{item.title || item.name}</h4>
                    <span style={{ fontSize: '10px', color: '#A1A1AA' }}>★ {item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NAVIGATION SECONDAIRE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          {isSetupComplete ? (
            <button
              onClick={() => setIsSetupComplete(false)}
              style={{
                color: '#FFF',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer'
              }}
            >
              ← 🏠 Modifier les filtres
            </button>
          ) : (
            <div></div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/playlists" style={{ color: '#FBBF24', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
              🎵 Playlists
            </a>
            <a href="/watchlist" style={{ color: '#C084FC', fontSize: '12px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(192, 132, 252, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
              📌 Watchlist
            </a>
          </div>
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000, maxWidth: '350px' }}>
            {feedback}
          </div>
        )}

        {/* CAROUSEL FLUIDE EN MOUVEMENT */}
        {!isSetupComplete && carouselMedia.length > 0 && (
          <div style={{ marginBottom: '20px', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(24, 24, 27, 0.4)', padding: '10px 0', position: 'relative' }}>
            <div className="animate-marquee" style={{ display: 'flex', gap: '12px' }}>
              {[...carouselMedia, ...carouselMedia].map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`}
                  onClick={() => openMediaModal(item)}
                  style={{ width: '80px', height: '115px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <img 
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : 'https://via.placeholder.com/80x115'} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', padding: '2px 4px', fontSize: '8px', color: '#FBBF24', textAlign: 'center', fontWeight: '700' }}>
                    ★ {item.vote_average?.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSISTANT IA (PROMPT INTELLIGENT) */}
        {!isSetupComplete && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25), rgba(59, 130, 246, 0.2))', 
            border: '1px solid rgba(192, 132, 252, 0.4)', 
            borderRadius: '24px', 
            padding: '20px', 
            marginBottom: '24px',
            boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <img 
                src="/icon-512.png" 
                alt="PoteCorn Mascotte" 
                style={{ height: '40px', width: '40px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#FFF' }}>
                  Une réplique sur le bout de la langue ? 🎬
                </h3>
                <p style={{ fontSize: '10px', color: '#C084FC', margin: 0, fontWeight: '600' }}>
                  Balance une citation ou décris une scène, PoteCorn trouve le film !
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: 'Il s'appelle Juste Leblanc' ou voyage dans le temps..."
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFF',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAiSearch}
                disabled={aiLoading}
                style={{
                  backgroundColor: '#9333EA',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {aiLoading ? '🤖 Recherche...' : '✨ Trouver'}
              </button>
            </div>

            {/* RÉSULTATS DE L'ASSISTANT IA */}
            {aiResults.length > 0 && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                {aiResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openMediaModal(item)}
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(192, 132, 252, 0.4)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/130x180'} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                    <div style={{ padding: '8px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFF' }}>{item.title || item.name}</h4>
                      <span style={{ fontSize: '9px', color: '#C084FC', fontWeight: '700', display: 'block' }}>★ {item.vote_average?.toFixed(1)} / 10</span>
                      {item.aiReason && (
                        <p style={{ fontSize: '9px', color: '#A1A1AA', margin: '4px 0 0 0', lineHeight: '1.2' }}>{item.aiReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUESTIONNAIRE PRINCIPAL */}
        {!isSetupComplete ? (
          <div>
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#C084FC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 1 sur 3</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Que veux-tu regarder aujourd'hui ? 🍿</h2>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                <button
                  onClick={() => { setMediaType('movie'); setPreferences([]); }}
                  style={{
                    flex: 1,
                    backgroundColor: mediaType === 'movie' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                    border: mediaType === 'movie' ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    padding: '10px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🎬 Un Film
                </button>
                <button
                  onClick={() => { setMediaType('tv'); setPreferences([]); }}
                  style={{
                    flex: 1,
                    backgroundColor: mediaType === 'tv' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                    border: mediaType === 'tv' ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    padding: '10px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📺 Une Série TV
                </button>
              </div>

              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#C084FC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 2 sur 3</span>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Tes genres préférés :</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                {currentGenresList.map((g) => {
                  const selected = preferences.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        if (selected) setPreferences(preferences.filter(id => id !== g.id));
                        else setPreferences([...preferences, g.id]);
                      }}
                      style={{
                        backgroundColor: selected ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                        border: selected ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>

              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#EF4444', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 3 sur 3 (Optionnel)</span>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: '#F87171' }}>Écarter ce que tu N'AIMES PAS :</h3>
              <p style={{ fontSize: '11px', color: '#A1A1AA', marginBottom: '12px' }}>Sélectionne tes phobies ou éléments à exclure.</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                {AVERSIONS_LIST.map((av) => {
                  const selected = selectedAversions.includes(av.id);
                  return (
                    <button
                      key={av.id}
                      onClick={() => {
                        if (selected) setSelectedAversions(selectedAversions.filter(id => id !== av.id));
                        else setSelectedAversions([...selectedAversions, av.id]);
                      }}
                      style={{
                        backgroundColor: selected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: selected ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: selected ? '#F87171' : '#A1A1AA',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {av.name}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={preferences.length === 0}
                onClick={() => {
                  setIsSetupComplete(true);
                  fetchRecommendations(preferences);
                }}
                style={{
                  width: '100%',
                  backgroundColor: preferences.length > 0 ? '#9333EA' : 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: preferences.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Générer ma sélection personnalisée ✨
              </button>
            </div>

            {/* ROULETTE EXPRESS */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.15))', 
              border: '1px solid rgba(192, 132, 252, 0.4)', 
              borderRadius: '24px', 
              padding: '20px', 
              textAlign: 'center', 
              marginBottom: '32px',
              boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.3)'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#FBBF24', textTransform: 'uppercase' }}>
                🎰 Mode Surprise ({mediaType === 'movie' ? 'Film' : 'Série'})
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 12px 0', color: '#FFF' }}>
                Laisse le hasard choisir pour toi !
              </h3>

              <button
                onClick={fetchRandomMedia}
                disabled={isSpinning}
                style={{
                  backgroundColor: isSpinning ? '#6B21A8' : '#FBBF24',
                  color: '#000',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '13px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
                }}
              >
                {isSpinning ? '🎰 Tirage en cours...' : `💥 Lancer la Roulette (${mediaType === 'movie' ? 'Films' : 'Séries'})`}
              </button>

              {rouletteMedia && !isSpinning && (
                <div style={{ marginTop: '16px', backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                  <img src={`https://image.tmdb.org/t/p/w500${rouletteMedia.poster_path}`} alt="" style={{ width: '65px', height: '95px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '9px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase' }}>🎯 Résultat roulette :</span>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '2px 0 4px 0', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rouletteMedia.title || rouletteMedia.name}</h4>
                    <span style={{ fontSize: '10px', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>★ {rouletteMedia.vote_average?.toFixed(1)} / 10</span>
                    <span onClick={() => openMediaModal(rouletteMedia)} style={{ fontSize: '11px', color: '#C084FC', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir la fiche complète →
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => {
                        setSelectedMediaDetail(rouletteMedia);
                        setTimeout(() => saveToSupabaseWithNotebook('watched'), 50);
                      }}
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      👁️ Vu
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedMediaDetail(rouletteMedia);
                        setTimeout(() => saveToSupabaseWithNotebook('to_watch'), 50);
                      }}
                      style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      📌 Watchlist
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TENDANCES */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                🔥 Tendances {mediaType === 'movie' ? 'Films' : 'Séries'} ({trendingMedia.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {trendingMedia.map((item) => (
                  <MediaCardXRay key={item.id} item={item} mediaType={mediaType} onOpen={openMediaModal} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* RECOMMANDATIONS SUR-MESURE */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#C084FC' }}>
                🎯 Sélection pour toi
              </h2>
              <button 
                onClick={() => setIsSetupComplete(false)} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.08)', 
                  color: '#FFF', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  padding: '6px 12px', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: '600',
                  cursor: 'pointer' 
                }}
              >
                ✏️ Réinitialiser / Modifier
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {recommendedMedia.map((item) => (
                <MediaCardXRay key={item.id} item={item} mediaType={mediaType} onOpen={openMediaModal} />
              ))}
            </div>
          </div>
        )}

        {/* MODALE FICHE MEDIA */}
        {selectedMediaDetail && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#18181B', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '24px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
              
              <button onClick={() => setSelectedMediaDetail(null)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: '700', zIndex: 10 }}>✕</button>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                <button
                  onClick={() => setActiveTab('info')}
                  style={{
                    backgroundColor: activeTab === 'info' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                    color: '#FFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🎬 Fiche {mediaType === 'movie' ? 'Film' : 'Série'}
                </button>
                <button
                  onClick={() => setActiveTab('xray')}
                  style={{
                    backgroundColor: activeTab === 'xray' ? '#FBBF24' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTab === 'xray' ? '#000' : '#FFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚡ X-Ray
                </button>
              </div>

              {activeTab === 'info' && (
                <div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <img src={`https://image.tmdb.org/t/p/w500${selectedMediaDetail.poster_path}`} alt="" style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{selectedMediaDetail.title || selectedMediaDetail.name}</h2>
                      <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                        ★ {selectedMediaDetail.vote_average?.toFixed(1)} / 10
                      </span>
                      
                      <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 4px 0' }}>
                        <strong style={{ color: '#FFF' }}>Créateur/Réal :</strong> {loadingExt ? 'Chargement...' : mediaDetailsExt.director || 'N/A'}
                      </p>

                      <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
                        <strong style={{ color: '#FFF' }}>Format :</strong> {mediaDetailsExt.runtime || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                    {selectedMediaDetail.overview}
                  </p>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>
                      📺 Où le regarder :
                    </span>
                    {loadingExt ? (
                      <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Recherche des disponibilités...</span>
                    ) : (
                      <div>
                        {mediaDetailsExt.freeProviders.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#4ADE80', fontWeight: '700', display: 'block', marginBottom: '4px' }}>🎁 Gratuit / Replay :</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {mediaDetailsExt.freeProviders.map((provider: any) => (
                                <div key={provider.provider_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '4px 8px', borderRadius: '8px' }}>
                                  <img src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                                  <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mediaDetailsExt.providers.length > 0 && (
                          <div>
                            <span style={{ fontSize: '10px', color: '#C084FC', fontWeight: '700', display: 'block', marginBottom: '4px' }}>✨ Abonnement :</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {mediaDetailsExt.providers.map((provider: any) => (
                                <div key={provider.provider_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                                  <img src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                                  <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mediaDetailsExt.freeProviders.length === 0 && mediaDetailsExt.providers.length === 0 && (
                          <div>
                            <span style={{ fontSize: '11px', color: '#FBBF24', fontWeight: '700', display: 'block', marginBottom: '8px' }}>🍿 Au cinéma ou en diffusion TV !</span>
                            <a href={`https://www.google.com/search?q=seance+${encodeURIComponent(selectedMediaDetail.title || selectedMediaDetail.name)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#9333EA', color: '#FFF', textDecoration: 'none', fontSize: '11px', fontWeight: '700', padding: '8px 12px', borderRadius: '10px' }}>
                              📍 Chercher les séances près de chez moi →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>🎬 Bande-annonce :</span>
                    {mediaDetailsExt.trailerKey ? (
                      <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <iframe src={`https://www.youtube.com/embed/${mediaDetailsExt.trailerKey}`} title="Trailer" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Aucune vidéo disponible.</span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'xray' && (
                <div>
                  <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px', padding: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '1px' }}>⚡ Mode X-Ray Actif</span>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '4px 0 2px 0' }}>{selectedMediaDetail.title || selectedMediaDetail.name}</h3>
                    {mediaDetailsExt.tagline && <p style={{ fontSize: '11px', color: '#A1A1AA', fontStyle: 'italic', margin: 0 }}>« {mediaDetailsExt.tagline} »</p>}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '12px', color: '#C084FC', fontWeight: '700', margin: '0 0 10px 0', textTransform: 'uppercase' }}>🎭 Acteurs & Rôles</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {mediaDetailsExt.castWithRoles.map((actor, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px', borderRadius: '10px' }}>
                          {actor.profile_path ? (
                            <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3F3F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</div>
                          )}
                          <div style={{ overflow: 'hidden' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#FFF', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</span>
                            <span style={{ fontSize: '10px', color: '#A1A1AA', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.character}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', margin: '0 0 6px 0' }}>🎵 Bande Originale & Musique</h4>
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent((selectedMediaDetail.title || selectedMediaDetail.name) + ' soundtrack')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#1DB954', color: '#000', textDecoration: 'none', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px' }}
                    >
                      🎧 Écouter la B.O. sur Spotify →
                    </a>
                  </div>
                </div>
              )}

              {/* SECTEUR AJOUT PLAYLIST */}
              {userPlaylists.length > 0 && (
                <div style={{ marginBottom: '16px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#FBBF24', fontWeight: '700', display: 'block', marginBottom: '6px' }}>🎵 Ajouter à une Playlist :</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      style={{ flex: 1, backgroundColor: '#18181B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px', fontSize: '11px' }}
                    >
                      <option value="">-- Choisir une playlist --</option>
                      {userPlaylists.map(pl => (
                        <option key={pl.id} value={pl.id}>{pl.icon} {pl.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={addToPlaylist}
                      disabled={!selectedPlaylistId}
                      style={{ backgroundColor: selectedPlaylistId ? '#FBBF24' : '#3F3F46', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: selectedPlaylistId ? 'pointer' : 'not-allowed' }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}

              {/* CARNET DE BORD & ACTIONS */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#C084FC', margin: 0 }}>📓 Mon Carnet de Bord</h3>
                  <button onClick={shareCard} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>
                    📤 Partager
                  </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ma Note :</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: star <= userRating ? 1 : 0.3 }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Ambiance :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {AVAILABLE_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          style={{
                            backgroundColor: active ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                            border: active ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFF',
                            fontSize: '10px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Mes remarques :</label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Écris ce que tu as pensé..."
                    style={{
                      width: '100%',
                      height: '70px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#FFF',
                      padding: '10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('watched')}
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    👁️ Marquer comme Vu
                  </button>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('to_watch')}
                    style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    📌 Ajouter Watchlist
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
