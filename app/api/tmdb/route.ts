import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // On récupère l'URL et les paramètres envoyés par l'interface
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint TMDB manquant' }, { status: 400 });
  }

  // Le serveur lit la clé secrète depuis le .env.local
  const API_KEY = process.env.TMDB_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Clé API manquante côté serveur' }, { status: 500 });
  }

  // On reconstruit les paramètres pour TMDB sans le mot "endpoint"
  const tmdbParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      tmdbParams.append(key, value);
    }
  });
  
  // On attache la clé secrète au tout dernier moment
  tmdbParams.append('api_key', API_KEY);

  const tmdbUrl = `https://api.themoviedb.org/3${endpoint}?${tmdbParams.toString()}`;

  try {
    const response = await fetch(tmdbUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur serveur TMDB:", error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des données TMDB' }, { status: 500 });
  }
}
