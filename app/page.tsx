'use client';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
          CineMatch 🎬
        </h1>
        <p className="text-sm text-gray-400 mt-2">Bienvenue sur ton application de recommandations</p>
      </div>

      <div className="w-full max-w-sm bg-zinc-900 border border-white/10 p-6 rounded-3xl text-center shadow-2xl">
        <div className="text-5xl mb-4">🎰</div>
        <h2 className="text-xl font-bold mb-2">Edge of Tomorrow</h2>
        <p className="text-xs text-gray-400 mb-6">Sci-Fi • 2014 • ★ 7.9/10</p>
        
        <div className="flex gap-2">
          <button onClick={() => alert('Marqué comme Vu !')} className="flex-1 bg-white/10 py-2 rounded-xl text-xs font-semibold">
            👁️ Déjà vu
          </button>
          <button onClick={() => alert('Ajouté !')} className="flex-1 bg-purple-600 py-2 rounded-xl text-xs font-bold">
            📌 Watchlist
          </button>
        </div>
      </div>

      <a href="/profile" className="mt-6 text-xs text-purple-400 hover:underline">
        👤 Voir mon Profil Utilisateur →
      </a>
    </main>
  );
}
