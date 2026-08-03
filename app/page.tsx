'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

const STREAMING_PROVIDERS = [
  { id: 8, name: 'Netflix 🔴' },
  { id: 119, name: 'Prime Video 🔵' },
  { id: 337, name: 'Disney+ ✨' },
  { id: 381, name: 'Canal+ 📺' },
  { id: 350, name: 'Apple TV 🍏' },
];

const AVERSIONS_LIST = [
  { id: 10683, keyword: '10683,235336', name: '🚫 Huis clos / Espaces clos' },
  { id: 3047, keyword: '3047,12615', name: '🕷️ Araignées' },
  { id: 1566, keyword: '1566', name: '🤡 Clowns' },
  { id: 9799, keyword: '9799,210046', name: '🩸 Sang / Extreme Gore' },
  { id: 2439, keyword: '2439,183205', name: '🐍 Serpents' },
  { id: 99991, keyword: 'adult,erotic,porn', name: '🔞 Bloquer Contenu Adulte / Érotique' },
];

const MOODS_LIST = [
  { id: 'all', label: '🔥 Tous' },
  { id: 'action', label: '💥 Action non-stop', genreId: 28 },
  { id: 'scifi', label: '🚀 Sci-Fi & Espace', genreId: 878 },
  { id: 'feelgood', label: '🥰 Feel-Good', genreId: 35 },
  { id: 'thriller', label: '🔪 Thriller', genreId: 53 },
];

const AVAILABLE_TAGS = ['Cinema 🍿', 'En solo 🎧', 'En famille 👨‍👩‍👦', 'Coup de cœur ❤️', 'À revoir 🔄'];

function SkeletonCard() {
  return (
    <div className="skeleton-card" style={{ height: '300px', backgroundColor: '#27272A', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <div className="skeleton-anim" style={{ width: '100%', height: '200px', backgroundColor: '#3F3F46' }}></div>
      <div style={{ padding: '12px' }}>
        <div className="skeleton-anim" style={{ width: '80%', height: '14px', backgroundColor: '#3F3F46', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div className="skeleton-anim" style={{ width: '100%', height: '40px', backgroundColor: '#3F3F46', borderRadius: '8px' }}></div>
      </div>
    </div>
  );
}

// 🔮 COMPOSANT DE L'ORACLE POTE-CORN (IA SUR-MESURE)
function AiOracleCard({ userId, onOpenMovie }: { userId: string; onOpenMovie: (movie: any) => void }) {
  const [oracleText, setOracleText] = useState<string>('Analyse de ton profil cinéphile en cours...');
  const [suggestedMovie, setSuggestedMovie] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const generatePersonalizedAdvice = async () => {
      if (!userId) return;

      try {
        const { data: watchData } = await supabase
          .from('watchlist')
          .select('title, status')
          .eq('user_uid', userId)
          .eq('status', 'watched');

        const watchedTitles = watchData ? watchData.map(w => w.title).filter(Boolean) : [];

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();

        const pseudo = profile?.username || 'Cinéphile';
        const currentHour = new Date().getHours();
        
        let timeContext = "en soirée";
        if (currentHour >= 5 && currentHour < 12) timeContext = "ce matin";
        else if (currentHour >= 12 && currentHour < 18) timeContext = "cet après-midi";
        else if (currentHour >= 22 || currentHour < 5) timeContext = "tard dans la nuit";

        const res = await fetch('/api/ai-recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Génère un conseil ciné personnalisé et court pour ${pseudo} qui se connecte ${timeContext}. IMPORTANT : Ne recommandes JAMAIS un film ou une série déjà vu(e) par l'utilisateur. Voici la liste exacte des films qu'il a DÉJÀ VUS (${watchedTitles.length} films) et qu'il ne faut SURTOUT PAS recommander : ${JSON.stringify(watchedTitles)}. Propose-lui une NOUVEAUTÉ qu'il n'a pas encore vue.`,
            mediaType: 'movie' 
          }),
        });

        const data = await res.json();
        
        if (data && data.recommendations && data.recommendations.length > 0) {
          const validRecs = data.recommendations.filter((rec: any) => 
            !watchedTitles.some(watched => watched?.toLowerCase() === rec.title?.toLowerCase())
          );

          const rec = validRecs.length > 0 ? validRecs[0] : data.recommendations[0];
          setOracleText(rec.reason);

          const tmdbRes = await fetch(`/api/tmdb?endpoint=/search/movie&language=fr-FR&include_adult=false&query=${encodeURIComponent(rec.title)}&page=1`);
          const tmdbData = await tmdbRes.json();
          if (tmdbData.results && tmdbData.results.length > 0) {
            setSuggestedMovie(tmdbData.results[0]);
          }
        } else {
          setOracleText(`Salut ${pseudo} ! Continue d'explorer et de marquer tes films vus pour affiner mes suggestions.`);
        }
      } catch (err) {
        console.error("Erreur Oracle IA:", err);
        setOracleText("L'Oracle se repose... Continue d'explorer pour alimenter ton profil !");
      } finally {
        setLoading(false);
      }
    };

    generatePersonalizedAdvice();
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

function MediaCardActions({ item, mediaType, onOpen, currentUserId, userWatchlist, onQuickAction }: { item: any; mediaType: 'movie' | 'tv'; onOpen: (item: any) => void; currentUserId: string; userWatchlist: any[]; onQuickAction: (e: React.MouseEvent, item: any, actionType: 'watched' | 'to_watch' | 'disliked') => void }) {
  const title = item.title || item.name;

  const watchlistEntry = userWatchlist.find(w => w.movie_id === item.id.toString());
  const statusBadge = watchlistEntry ? watchlistEntry.status : null;

  const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450';

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
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div>
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <Image 
            src={posterUrl} 
            alt={title} 
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            style={{ objectFit: 'cover' }} 
          />
          <span style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 5, backgroundColor: 'rgba(0,0,0,0.75)', color: '#FBBF24', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
            ★ {item.vote_average?.toFixed(1)}
          </span>

          {statusBadge === 'watched' && (
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 5, backgroundColor: 'rgba(16, 185, 129, 0.9)', color: '#FFF', fontSize: '9px', fontWeight: '800', padding: '3px 6px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
              👁️ Déjà vu
            </span>
          )}
          {statusBadge === 'to_watch' && (
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 5, backgroundColor: 'rgba(147, 51, 234, 0.9)', color: '#FFF', fontSize: '9px', fontWeight: '800', padding: '3px 6px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
              📌 À voir
            </span>
          )}
        </div>

        <div style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFF' }}>
            {title}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => onQuickAction(e, item, 'watched')}
              title="Marquer comme déjà vu"
              style={{ 
                backgroundColor: statusBadge === 'watched' ? '#10B981' : 'rgba(255,255,255,0.06)', 
                color: '#FFF', 
                border: '1px solid rgba(255,255,255,0.12)', 
                padding: '6px 4px', 
                borderRadius: '10px', 
                fontSize: '10px', 
                fontWeight: '700', 
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              👁️ Déjà vu
            </button>

            <button 
              onClick={(e) => onQuickAction(e, item, 'to_watch')}
              title="J'aimerais voir"
              style={{ 
                backgroundColor: statusBadge === 'to_watch' ? '#9333EA' : 'rgba(255,255,255,0.06)', 
                color: '#FFF', 
                border: '1px solid rgba(255,255,255,0.12)', 
                padding: '6px 4px', 
                borderRadius: '10px', 
                fontSize: '10px', 
                fontWeight: '700', 
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              📌 À voir
            </button>

            <button 
              onClick={(e) => onQuickAction(e, item, 'disliked')}
              title="Je n'aime pas"
              style={{ 
                gridColumn: 'span 2',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: '#F87171', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                padding: '5px 4px', 
                borderRadius: '10px', 
                fontSize: '10px', 
                fontWeight: '700', 
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              👎 J'ai pas aimé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userWatchlist, setUserWatchlist] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'standard' | 'kids' | 'couple'>('standard');
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie'); 
  const [preferences, setPreferences] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [selectedAversions, setSelectedAversions] = useState<number[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');                
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [trendingMediaType, setTrendingMediaType] = useState<'movie' | 'tv'>('movie');
  const [trendingMedia, setTrendingMedia] = useState<any[]>([]);
  const [trendingPage, setTrendingPage] = useState<number>(1);
  const [isLoadingMoreTrending, setIsLoadingMoreTrending] = useState(false);
  const [activeMood, setActiveMood] = useState<string>('all');

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
    director: '', castWithRoles: [], providers: [], freeProviders: [], trailerKey: null, tagline: '', runtime: '',
  });
  const [loadingExt, setLoadingExt] = useState(false);

  const [userNotes, setUserNotes] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    const initUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let uid = '';

      if (session && session.user) {
        setUser(session.user);
        uid = session.user.id;
      } else {
        uid = localStorage.getItem('potecorn_uid') || '';
      }
      
      setCurrentUserId(uid);

      if (uid && uid !== '') {
        const { data: likes } = await supabase.from('user_swipes').select('id').eq('user_uid', uid).eq('action', 'liked');
        const likesCount = likes ? likes.length : 0;
        
        const { data: profileData } = await supabase.from('profiles').select('xp, avatar_url').eq('id', uid).single();
        const xp = (profileData?.xp && profileData.xp > 0) ? profileData.xp : (likesCount * 50);
        setUserLevel(Math.floor(xp / 500) + 1);

        if (profileData?.avatar_url) {
          setUserAvatarUrl(profileData.avatar_url);
        }

        const { data: watchData } = await supabase.from('watchlist').select('movie_id, status').eq('user_uid', uid);
        if (watchData) setUserWatchlist(watchData);
      }
    };

    initUserAndData();
    fetchRandomCarousel();
  }, [mediaType]);

  useEffect(() => {
    fetchTrending(1, true, activeMood, trendingMediaType);
  }, [trendingMediaType, activeMood]);

  const fetchRandomCarousel = async () => {
    try {
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const url = `/api/tmdb?endpoint=/discover/${mediaType}&language=fr-FR&include_adult=false&sort_by=popularity.desc&page=${randomPage}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        const filtered = data.results.filter((item: any) => item.title || item.name);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setCarouselMedia(shuffled.slice(0, 12));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrending = async (pageToFetch = 1, reset = false, mood = activeMood, tType = trendingMediaType) => {
    if (isLoadingMoreTrending) return;
    if (!reset) setIsLoadingMoreTrending(true);

    try {
      let endpoint = `/trending/${tType}/week`;
      let extraParams = '';

      if (mood !== 'all') {
        const selectedMoodObj = MOODS_LIST.find(m => m.id === mood);
        if (selectedMoodObj && selectedMoodObj.genreId) {
          endpoint = `/discover/${tType}`;
          extraParams = `&with_genres=${selectedMoodObj.genreId}&sort_by=popularity.desc`;
        }
      }

      const url = `/api/tmdb?endpoint=${endpoint}&language=fr-FR&include_adult=false${extraParams}&page=${pageToFetch}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        const cleanResults = data.results.filter((item: any) => {
          const t = item.title || item.name || '';
          return t.trim().length > 0;
        });

        if (reset) {
          setTrendingMedia(cleanResults);
          setTrendingPage(1);
        } else {
          setTrendingMedia(prev => [...prev, ...cleanResults]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoadingMoreTrending(false);
  };

  const handleMoodChange = (moodId: string) => {
    setActiveMood(moodId);
    fetchTrending(1, true, moodId, trendingMediaType);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isSetupComplete) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 300;

      if (scrollPosition >= threshold && !isLoadingMoreTrending) {
        const nextPage = trendingPage + 1;
        setTrendingPage(nextPage);
        fetchTrending(nextPage, false, activeMood, trendingMediaType);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trendingPage, isLoadingMoreTrending, isSetupComplete, activeMood, trendingMediaType]);

  const fetchUserPlaylists = async () => {
    if (!currentUserId || currentUserId === '') return;
    try {
      const { data } = await supabase.from('playlists').select('*').eq('user_uid', currentUserId);
      if (data) setUserPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getExcludedKeywordsString = () => {
    return selectedAversions.map(id => AVERSIONS_LIST.find(a => a.id === id)?.keyword).filter(Boolean).join(',');
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const url = `/api/tmdb?endpoint=/search/${mediaType}&language=fr-FR&include_adult=false&query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.slice(0, 10));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async (selectedGenres: number[]) => {
    setIsLoadingRecs(true);
    setRecommendedMedia([]);
    
    try {
      let genreQuery = selectedGenres.join(',');
      let excludeParam = getExcludedKeywordsString();
      let certificationParam = '';

      if (viewMode === 'kids') {
        genreQuery = '16,10751'; 
        excludeParam = '27,53,80,18'; 
        certificationParam = '&certification_country=FR&certification.lte=10'; 
      } else if (viewMode === 'couple') {
        genreQuery = '35,10749,12'; 
      }

      const excludedStr = excludeParam ? `&without_genres=${excludeParam}&without_keywords=${excludeParam}` : '';
      const providersQuery = selectedProviders.length > 0 ? `&with_watch_providers=${selectedProviders.join('|')}&watch_region=FR` : '';
      
      const url = `/api/tmdb?endpoint=/discover/${mediaType}&language=fr-FR&include_adult=false&with_genres=${genreQuery}&sort_by=popularity.desc${excludedStr}${providersQuery}${certificationParam}&page=1`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setTimeout(() => {
          setRecommendedMedia(data.results.slice(0, 20));
          setIsLoadingRecs(false);
        }, 600);
      }
    } catch (err) {
      console.error(err);
      setIsLoadingRecs(false);
    }
  };

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResults([]);

    try {
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
        let tmdbRes = await fetch(`/api/tmdb?endpoint=/search/${mediaType}&language=fr-FR&include_adult=false&query=${encodeURIComponent(rec.title)}&page=1`);
        let tmdbData = await tmdbRes.json();

        if (!tmdbData.results || tmdbData.results.length === 0) {
          const simplifiedTitle = rec.title.split(':')[0].split('-')[0].trim();
          tmdbRes = await fetch(`/api/tmdb?endpoint=/search/${mediaType}&language=fr-FR&include_adult=false&query=${encodeURIComponent(simplifiedTitle)}&page=1`);
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
      let genreQuery = preferences.length > 0 ? `&with_genres=${preferences.join(',')}` : '';
      let excludeParam = getExcludedKeywordsString();
      let certificationParam = '';

      if (viewMode === 'kids') {
        genreQuery = '&with_genres=16,10751';
        excludeParam = '27,53,80,18';
        certificationParam = '&certification_country=FR&certification.lte=10';
      } else if (viewMode === 'couple') {
        genreQuery = '&with_genres=35,10749,12';
      }

      const excludedStr = excludeParam ? `&without_keywords=${excludeParam}&without_genres=${excludeParam}` : '';
      const providersQuery = selectedProviders.length > 0 ? `&with_watch_providers=${selectedProviders.join('|')}&watch_region=FR` : '';
      
      const url = `/api/tmdb?endpoint=/discover/${mediaType}&language=fr-FR&include_adult=false&sort_by=popularity.desc${genreQuery}${excludedStr}${providersQuery}${certificationParam}&page=${Math.floor(Math.random() * 5) + 1}`;
      
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
      const detailRes = await fetch(`/api/tmdb?endpoint=/${trendingMediaType}/${id}&language=fr-FR`);
      const detailData = await detailRes.json();

      const creditsRes = await fetch(`/api/tmdb?endpoint=/${trendingMediaType}/${id}/credits&language=fr-FR`);
      const creditsData = await creditsRes.json();
      
      const directorObj = trendingMediaType === 'movie' 
        ? creditsData.crew?.find((member: any) => member.job === 'Director')
        : detailData.created_by?.[0];

      const directorName = directorObj ? directorObj.name : 'Non renseigné';
      const castWithRoles = creditsData.cast ? creditsData.cast.slice(0, 6).map((c: any) => ({
        name: c.name,
        character: c.character || c.roles?.[0]?.character || 'Rôle principal',
        profile_path: c.profile_path
      })) : [];

      const providersRes = await fetch(`/api/tmdb?endpoint=/${trendingMediaType}/${id}/watch/providers`);
      const providersData = await providersRes.json();
      const frProviders = providersData.results?.FR || {};

      let videoRes = await fetch(`/api/tmdb?endpoint=/${trendingMediaType}/${id}/videos&language=fr-FR`);
      let videoData = await videoRes.json();
      let trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      
      if (!trailer) {
        videoRes = await fetch(`/api/tmdb?endpoint=/${trendingMediaType}/${id}/videos&language=en-US`);
        videoData = await videoRes.json();
        trailer = videoData.results?.find((v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      }

      const runtimeStr = trendingMediaType === 'movie' 
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

  const handleQuickAction = async (e: React.MouseEvent, item: any, actionType: 'watched' | 'to_watch' | 'disliked') => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUserId || currentUserId === '') {
      setFeedback('⚠️ Connectez-vous ou créez un profil pour sauvegarder !');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const title = item.title || item.name;
    const movieIdStr = item.id.toString();

    try {
      if (actionType === 'disliked') {
        await supabase.from('user_swipes').insert([
          {
            user_uid: currentUserId,
            movie_id: movieIdStr,
            title: title,
            action: 'disliked',
            media_type: trendingMediaType
          }
        ]);
        // Ajout instantané dans userWatchlist local sous un statut fictif ou masquage direct
        setUserWatchlist(prev => [...prev, { movie_id: movieIdStr, status: 'disliked' }]);
        setFeedback('👎 Préférence enregistrée pour l’IA !');
      } else {
        const status = actionType;
        const { data: existing, error: checkError } = await supabase
          .from('watchlist')
          .select('id')
          .eq('movie_id', movieIdStr)
          .eq('user_uid', currentUserId);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          await supabase.from('watchlist').update({ status }).eq('movie_id', movieIdStr).eq('user_uid', currentUserId);
        } else {
          await supabase.from('watchlist').insert([
            {
              user_uid: currentUserId,
              movie_id: movieIdStr,
              title: title,
              poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              vote_average: parseFloat(item.vote_average || 0),
              status: status,
              user_notes: '',
              user_rating: 0,
              user_tags: [],
              media_type: trendingMediaType
            },
          ]);
        }
        
        // Met à jour instantanément la liste locale pour masquer la carte des suggestions/tendances
        setUserWatchlist(prev => {
          const filtered = prev.filter(w => w.movie_id !== movieIdStr);
          return [...filtered, { movie_id: movieIdStr, status }];
        });

        setFeedback(status === 'watched' ? '👁️ Marqué comme déjà vu !' : '📌 Ajouté à "À voir" !');
      }
    } catch (err) {
      console.error(err);
      setFeedback('⚠️ Erreur lors de la mise à jour');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const saveToSupabaseWithNotebook = async (status: 'to_watch' | 'watched') => {
    if (!selectedMediaDetail) return;
    if (!currentUserId || currentUserId === '') {
      setFeedback('⚠️ Connectez-vous ou créez un profil pour sauvegarder !');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setFeedback(null);
    const title = selectedMediaDetail.title || selectedMediaDetail.name;
    const movieIdStr = selectedMediaDetail.id.toString();

    try {
      const { data: existing, error: checkError } = await supabase
        .from('watchlist')
        .select('id')
        .eq('movie_id', movieIdStr)
        .eq('user_uid', currentUserId);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        await supabase.from('watchlist').update({ status }).eq('movie_id', movieIdStr).eq('user_uid', currentUserId);
      } else {
        const { error } = await supabase.from('watchlist').insert([
          {
            user_uid: currentUserId,
            movie_id: movieIdStr,
            title: title,
            poster_path: selectedMediaDetail.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMediaDetail.poster_path}` : selectedMediaDetail.poster,
            vote_average: parseFloat(selectedMediaDetail.vote_average || 0),
            status: status,
            user_notes: userNotes,
            user_rating: userRating,
            user_tags: selectedTags,
            media_type: trendingMediaType
          },
        ]);
        if (error) throw error;
      }

      setUserWatchlist(prev => {
        const filtered = prev.filter(w => w.movie_id !== movieIdStr);
        return [...filtered, { movie_id: movieIdStr, status }];
      });

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
        media_type: trendingMediaType
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

  if (!isMounted) {
    return null;
  }

  const currentGenresList = mediaType === 'movie' ? GENRES_LIST_MOVIES : GENRES_LIST_TV;

  const filteredTrendingMedia = trendingMedia.filter((item) => {
    return !userWatchlist.some(w => w.movie_id === item.id.toString());
  });

  const filteredRecommendedMedia = recommendedMedia.filter((item) => {
    return !userWatchlist.some(w => w.movie_id === item.id.toString());
  });

  return (
    <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#000000', color: '#FFFFFF', margin: 0, padding: '0 16px 110px 16px', overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
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
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-anim {
          animation: shimmer 1.5s infinite linear;
          background: linear-gradient(to right, #3F3F46 4%, #52525B 25%, #3F3F46 36%);
          background-size: 800px 100%;
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
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {userAvatarUrl ? (
                <Image src={userAvatarUrl} alt="Avatar" fill sizes="30px" style={{ objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>👤</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>Niv. {userLevel} ✨</span>
          </a>
        </header>

        {/* 🔮 ORACLE POTE-CORN (IA SUR-MESURE) */}
        {currentUserId && (
          <AiOracleCard userId={currentUserId} onOpenMovie={openMediaModal} />
        )}

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
                  <div style={{ position: 'relative', width: '36px', height: '50px', flexShrink: 0 }}>
                    <Image src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'https://via.placeholder.com/40'} alt="" fill sizes="36px" style={{ objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', margin: '0 0 2px 0', color: '#FFF' }}>{item.title || item.name}</h4>
                    <span style={{ fontSize: '10px', color: '#A1A1AA' }}>★ {item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOUTON RESET FILTRES */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' }}>
          {isSetupComplete && (
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
          )}
        </div>

        {feedback && (
          <div style={{ position: 'fixed', bottom: '110px', right: '20px', backgroundColor: '#9333EA', color: '#FFF', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', zIndex: 2000, maxWidth: '350px' }}>
            {feedback}
          </div>
        )}

        {/* CAROUSEL FLUIDE ALÉATOIRE */}
        {!isSetupComplete && carouselMedia.length > 0 && (
          <div style={{ marginBottom: '20px', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(24, 24, 27, 0.4)', padding: '10px 0', position: 'relative' }}>
            <div className="animate-marquee" style={{ display: 'flex', gap: '12px' }}>
              {[...carouselMedia, ...carouselMedia].map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`}
                  onClick={() => openMediaModal(item)}
                  style={{ width: '80px', height: '115px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <Image 
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : 'https://via.placeholder.com/80x115'} 
                    alt="" 
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, background: 'rgba(0,0,0,0.75)', padding: '2px 4px', fontSize: '8px', color: '#FBBF24', textAlign: 'center', fontWeight: '700' }}>
                    ★ {item.vote_average?.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSISTANT IA */}
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
                    <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                      <Image src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/130x180'} alt="" fill sizes="110px" style={{ objectFit: 'cover' }} />
                    </div>
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

        {/* QUESTIONNAIRE PRINCIPAL AVEC NOUVEAUX MODES UX */}
        {!isSetupComplete ? (
          <div>
            <div style={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#C084FC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 1 sur 4</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Que veux-tu regarder aujourd'hui ? 🍿</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <button
                  onClick={() => { setMediaType('movie'); setPreferences([]); setViewMode('standard'); fetchRandomCarousel(); }}
                  style={{
                    backgroundColor: mediaType === 'movie' && viewMode === 'standard' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                    border: mediaType === 'movie' && viewMode === 'standard' ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF', padding: '10px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  🎬 Un Film
                </button>
                <button
                  onClick={() => { setMediaType('tv'); setPreferences([]); setViewMode('standard'); fetchRandomCarousel(); }}
                  style={{
                    backgroundColor: mediaType === 'tv' && viewMode === 'standard' ? '#9333EA' : 'rgba(255, 255, 255, 0.05)',
                    border: mediaType === 'tv' && viewMode === 'standard' ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF', padding: '10px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  📺 Une Série TV
                </button>
              </div>

              {/* NOUVEAUX BOUTONS MODES SPÉCIAUX */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <button
                  onClick={() => { setViewMode('kids'); setPreferences([]); }}
                  style={{
                    backgroundColor: viewMode === 'kids' ? '#10B981' : 'rgba(16, 185, 129, 0.1)',
                    border: viewMode === 'kids' ? '1px solid #34D399' : '1px solid rgba(16, 185, 129, 0.3)',
                    color: viewMode === 'kids' ? '#000' : '#34D399', padding: '10px', borderRadius: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer'
                  }}
                >
                  🧸 Mode Kids
                </button>
                <button
                  onClick={() => { setViewMode('couple'); setPreferences([]); }}
                  style={{
                    backgroundColor: viewMode === 'couple' ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
                    border: viewMode === 'couple' ? '1px solid #F87171' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: viewMode === 'couple' ? '#FFF' : '#F87171', padding: '10px', borderRadius: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer'
                  }}
                >
                  ❤️ Soirée Couple
                </button>
              </div>

              {viewMode === 'standard' && (
                <>
                  <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#C084FC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 2 sur 4</span>
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
                            color: '#FFFFFF', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#60A5FA', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 3 sur 4</span>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: '#93C5FD' }}>Quels abonnements as-tu ?</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px', marginTop: '12px' }}>
                {STREAMING_PROVIDERS.map((prov) => {
                  const selected = selectedProviders.includes(prov.id);
                  return (
                    <button
                      key={prov.id}
                      onClick={() => {
                        if (selected) setSelectedProviders(selectedProviders.filter(id => id !== prov.id));
                        else setSelectedProviders([...selectedProviders, prov.id]);
                      }}
                      style={{
                        backgroundColor: selected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: selected ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: selected ? '#93C5FD' : '#A1A1AA', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      {prov.name}
                    </button>
                  );
                })}
              </div>

              {viewMode === 'standard' && (
                <>
                  <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#EF4444', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Étape 4 sur 4 (Optionnel)</span>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: '#F87171' }}>Écarter ce que tu N'AIMES PAS :</h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px', marginTop: '12px' }}>
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
                            color: selected ? '#F87171' : '#A1A1AA', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          {av.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                disabled={viewMode === 'standard' && preferences.length === 0}
                onClick={() => {
                  setIsSetupComplete(true);
                  fetchRecommendations(preferences);
                }}
                style={{
                  width: '100%',
                  backgroundColor: (viewMode !== 'standard' || preferences.length > 0) ? '#9333EA' : 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', 
                  cursor: (viewMode !== 'standard' || preferences.length > 0) ? 'pointer' : 'not-allowed'
                }}
              >
                Générer ma sélection personnalisée ✨
              </button>
            </div>

            {/* ROULETTE EXPRESS */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.15))', 
              border: '1px solid rgba(192, 132, 252, 0.4)', 
              borderRadius: '24px', padding: '20px', textAlign: 'center', marginBottom: '24px',
              boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.3)'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#FBBF24', textTransform: 'uppercase' }}>
                🎰 Mode Surprise
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 12px 0', color: '#FFF' }}>
                Laisse le hasard choisir pour toi !
              </h3>

              <button
                onClick={fetchRandomMedia}
                disabled={isSpinning}
                style={{
                  backgroundColor: isSpinning ? '#6B21A8' : '#FBBF24', color: '#000', border: 'none', fontWeight: '800', fontSize: '13px', 
                  padding: '12px 24px', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
                }}
              >
                {isSpinning ? '🎰 Tirage en cours...' : `💥 Lancer la Roulette`}
              </button>

              {rouletteMedia && !isSpinning && (
                <div style={{ marginTop: '16px', backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                  <div style={{ position: 'relative', width: '65px', height: '95px', flexShrink: 0 }}>
                    <Image src={`https://image.tmdb.org/t/p/w500${rouletteMedia.poster_path}`} alt="" fill sizes="65px" style={{ objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '9px', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase' }}>🎯 Résultat roulette :</span>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '2px 0 4px 0', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rouletteMedia.title || rouletteMedia.name}</h4>
                    <span style={{ fontSize: '10px', color: '#A1A1AA', display: 'block', marginBottom: '8px' }}>★ {rouletteMedia.vote_average?.toFixed(1)} / 10</span>
                    <span onClick={() => openMediaModal(rouletteMedia)} style={{ fontSize: '11px', color: '#C084FC', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                      Voir la fiche complète →
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION TENDANCES & SYSTÈME DE BASCULE/SWIPE FILMS / SÉRIES */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                  🔥 Tendances & Moods
                </h2>
              </div>

              {/* BASCULE RAPIDE (SWIPE/BOUTON) FILMS / SÉRIES */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', backgroundColor: 'rgba(24, 24, 27, 0.9)', padding: '6px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={() => setTrendingMediaType('movie')}
                  style={{
                    backgroundColor: trendingMediaType === 'movie' ? '#9333EA' : 'transparent',
                    border: 'none',
                    color: '#FFF',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    boxShadow: trendingMediaType === 'movie' ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none'
                  }}
                >
                  🎬 Films Tendance
                </button>
                <button
                  onClick={() => setTrendingMediaType('tv')}
                  style={{
                    backgroundColor: trendingMediaType === 'tv' ? '#9333EA' : 'transparent',
                    border: 'none',
                    color: '#FFF',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    boxShadow: trendingMediaType === 'tv' ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none'
                  }}
                >
                  📺 Séries Tendances
                </button>
              </div>

              {/* FILTRES RAPIDES PAR MOOD */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none' }}>
                {MOODS_LIST.map((mood) => {
                  const isActive = activeMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => handleMoodChange(mood.id)}
                      style={{
                        backgroundColor: isActive ? '#9333EA' : 'rgba(255, 255, 255, 0.06)',
                        border: isActive ? '1px solid #C084FC' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFF',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none'
                      }}
                    >
                      {mood.label}
                    </button>
                  );
                })}
              </div>

              {/* GRILLE DES TENDANCES (FILTRÉE SANS LES DÉJÀ VUS / DISLIKÉS) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {filteredTrendingMedia.map((item, idx) => (
                  <MediaCardActions key={`${item.id}-${idx}`} item={item} mediaType={trendingMediaType} onOpen={openMediaModal} currentUserId={currentUserId} userWatchlist={userWatchlist} onQuickAction={handleQuickAction} />
                ))}
              </div>

              {isLoadingMoreTrending && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#C084FC', fontSize: '12px', fontWeight: 'bold' }}>
                  ⚡ Chargement de plus de contenus...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#C084FC' }}>
                {viewMode === 'kids' ? '🧸 Sélection Kids' : viewMode === 'couple' ? '❤️ Sélection Soirée Duo' : '🎯 Sélection pour toi'}
              </h2>
              <button 
                onClick={() => setIsSetupComplete(false)} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.15)', 
                  padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' 
                }}
              >
                ✏️ Modifier
              </button>
            </div>
            
            {isLoadingRecs ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {filteredRecommendedMedia.map((item) => (
                  <MediaCardActions key={item.id} item={item} mediaType={mediaType} onOpen={openMediaModal} currentUserId={currentUserId} userWatchlist={userWatchlist} onQuickAction={handleQuickAction} />
                ))}
              </div>
            )}
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
                    color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  🎬 Fiche {trendingMediaType === 'movie' ? 'Film' : 'Série'}
                </button>
                <button
                  onClick={() => setActiveTab('xray')}
                  style={{
                    backgroundColor: activeTab === 'xray' ? '#FBBF24' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTab === 'xray' ? '#000' : '#FFF', border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  ⚡ X-Ray
                </button>
              </div>

              {activeTab === 'info' && (
                <div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '140px', flexShrink: 0 }}>
                      <Image src={`https://image.tmdb.org/t/p/w500${selectedMediaDetail.poster_path}`} alt="" fill sizes="100px" style={{ objectFit: 'cover', borderRadius: '12px' }} />
                    </div>
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
                                  <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                                    <Image src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} alt="" fill sizes="20px" style={{ objectFit: 'cover', borderRadius: '4px' }} />
                                  </div>
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
                                  <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                                    <Image src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} alt="" fill sizes="20px" style={{ objectFit: 'cover', borderRadius: '4px' }} />
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '600' }}>{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mediaDetailsExt.freeProviders.length === 0 && mediaDetailsExt.providers.length === 0 && (
                          <div>
                            <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: '700', display: 'block', marginBottom: '8px' }}>🚫 Indisponible en streaming en France</span>
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
                            <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                              <Image src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt="" fill sizes="32px" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                            </div>
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
                            color: '#FFF', fontSize: '10px', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer'
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
                      width: '100%', height: '70px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px', color: '#FFF', padding: '10px', fontSize: '12px', boxSizing: 'border-box', resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('watched')}
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    👁️ Marquer Vu
                  </button>
                  <button 
                    onClick={() => saveToSupabaseWithNotebook('to_watch')}
                    style={{ flex: 1, backgroundColor: '#9333EA', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    📌 Watchlist
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* BARRE DE NAVIGATION FLOTTANTE */}
      <nav style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '90%', 
        maxWidth: '420px', 
        backgroundColor: 'rgba(24, 24, 27, 0.9)', 
        border: '1px solid rgba(255, 255, 255, 0.15)', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        padding: '8px 0', 
        borderRadius: '35px', 
        zIndex: 1000, 
        backdropFilter: 'blur(16px)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8)'
      }}>
        <a href="/" style={{ color: '#9333EA', textDecoration: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '18px' }}>🏠</span>
          <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>Accueil</span>
        </a>

        <a href="/potecorn-party" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ fontSize: '9px', marginTop: '2px' }}>Party</span>
        </a>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <a href="/profile" style={{ 
            position: 'absolute', 
            top: '-22px', 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            backgroundColor: '#9333EA', 
            border: '3px solid #18181B', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(147, 51, 234, 0.6)'
          }}>
            {userAvatarUrl ? (
              <Image src={userAvatarUrl} alt="Avatar" fill sizes="50px" style={{ objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '20px' }}>👤</span>
            )}
          </a>
          <span style={{ fontSize: '9px', color: '#A1A1AA', marginTop: '24px', fontWeight: 'bold' }}>Profil</span>
        </div>

        <a href="/playlists" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '18px' }}>🎵</span>
          <span style={{ fontSize: '9px', marginTop: '2px' }}>Playlists</span>
        </a>

        <a href="/watchlist" style={{ color: '#A1A1AA', textDecoration: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '18px' }}>📌</span>
          <span style={{ fontSize: '9px', marginTop: '2px' }}>Watchlist</span>
        </a>
      </nav>

    </main>
  );
}
