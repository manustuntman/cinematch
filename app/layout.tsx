import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoteCorn",
  description: "Votre compagnon cinéphile intelligent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
