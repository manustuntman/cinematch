'use client';

export default function ProfilePage() {
  const user = {
    pseudo: 'Alex_Cinematix',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rank: '🍿 Cinéphile Averti',
    level: 12,
    xpActuel: 850,
    xpSuivant: 1000,
    stats: { films: 142, series: 38, notes: 115, top10: 3 },
    badges: [
      { emoji: '🚀', name: 'Expert SF' },
      { emoji: '⛩️', name: 'Otaku Anime' },
      { emoji: '🤠', name: 'Spielbergien' },
      { emoji: '👁️', name: 'Chasseur de Pépites' },
    ],
  };

  const xpPercent = Math.round((user.xpActuel / user.xpSuivant) * 100);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[32px] bg-black/90 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <img src={user.avatar} alt={user.pseudo} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            <span className="absolute bottom-0 right-0 bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-black">
              Niv.{user.level}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{user.pseudo}</h2>
            <span className="inline-block bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-xl text-xs font-bold mt-1">
              {user.rank}
            </span>
          </div>
        </div>

        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-5">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-400">Progression Niveau {user.level + 1}</span>
            <span className="text-purple-400 font-bold">{user.xpActuel} / {user.xpSuivant} XP ({xpPercent}%)</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" style={{ width: `${xpPercent}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white/5 p-3 rounded-2xl mb-5 text-center">
          <div>
            <div className="text-base font-extrabold">{user.stats.films}</div>
            <div className="text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Films</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-purple-400">{user.stats.series}</div>
            <div className="text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Séries</div>
          </div>
          <div>
            <div className="text-base font-extrabold">{user.stats.notes}</div>
            <div className="text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Notés</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-amber-400">{user.stats.top10}</div>
            <div className="text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Top 10</div>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-2.5">Badges & Trophées</span>
          <div className="flex gap-2 flex-wrap">
            {user.badges.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <span className="text-sm">{b.emoji}</span>
                <span className="text-xs text-gray-200 font-semibold">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
