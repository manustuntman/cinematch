'use client';

import { useState } from 'react';

export default function HomePage() {
  const [movie] = useState({
    title: 'Edge of Tomorrow',
    year: '2014',
    rating: 7.9,
    poster: 'https://m.media-amazon.com/images/M/MVBMTgwNTcxMzU4MV5BMl5BanBnXkFtZTgwMzE2ODA1MTE@._V1_FMjpg_UX1000_.jpg',
    overview: 'Dans un futur proche, des hordes d extraterrestres ont envahi la Terre. Le commandant William Cage est envoyé au front...',
  });

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Header CineMatch */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
          CineMatch
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-medium">IA & Recommandations Séries / Films</p>
      </div>

      {/* Carte Apple Glassmorphism */}
      <div className="w-full max-w-sm rounded-[28px] bg-black/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            🎰 Mode Roulette
          </span>
          <span className="bg-amber-400/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ★ {movie.rating} / 10
          </span>
        </div>

        {/* Poster */}
        <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-4 shadow-lg bg-zinc-900">
          <img 
            src={movie.poster} 
            alt={movie.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex flex-col justify-end">
            <h2 className="text-xl font-bold">{movie.title} <span className="text-sm font-normal text-gray-400">({movie.year})</span></h2>
          </div>
        </div>

        {/* Synopsis */}
        <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">
          {movie.overview}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button 
            onClick={() => alert('Film marqué comme Vu ! +50 XP')}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition"
          >
            👁️ Déjà vu
          </button>
          <button 
            onClick={() => alert('Ajouté à la Watchlist !')}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition"
          >
            📌 Watchlist
          </button>
        </div>
      </div>

      {/* Navigation rapide vers le Profil */}
      <a href="/profile" className="mt-6 text-xs text-purple-400 font-semibold hover:underline">
        👤 Voir mon Profil Utilisateur & Badges →
      </a>
    </main>
  );
}
