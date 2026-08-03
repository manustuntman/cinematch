import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  // Le dossier où sera généré le système hors-ligne
  dest: "public",
  
  // Désactivé quand tu codes en local pour éviter les bugs
  disable: process.env.NODE_ENV === "development",
  
  // Met en cache automatiquement les pages que tu visites
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  
  // Recharge la page automatiquement quand la 4G ou le Wifi revient
  reloadOnOnline: true,
  
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // On autorise les images de TMDB et de Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ],
  },
};

export default withPWA(nextConfig);
