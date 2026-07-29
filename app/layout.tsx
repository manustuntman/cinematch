import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CineMatch 🎬 - Films & Séries Sur-Mesure',
  description: 'Trouve instantanément ton prochain film ou ta prochaine série sans perdre de temps.',
  manifest: '/manifest.json',
  themeColor: '#9333EA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineMatch',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, backgroundColor: '#0A0A0A', color: '#FFFFFF' }}>
        {children}
      </body>
    </html>
  );
}
