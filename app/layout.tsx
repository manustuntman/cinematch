import './globals.css';

export const metadata = {
  title: 'CineMatch',
  description: 'Recommandations de films et séries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
