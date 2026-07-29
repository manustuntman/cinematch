import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Clé API absente dans Vercel (GEMINI_API_KEY).' 
      }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

    const systemPrompt = `Tu es un expert cinéma et recommandeur ultra-pointu.
    Propose exactement 5 ${typeLabel} qui correspondent au CONCEPT et à l'AMBIANCE de cette demande : "${prompt}".
    Règles :
    1. Ne cherche pas juste les mots dans le titre, trouve de véritables œuvres qui traitent du thème (ex: voyage dans le temps = Predestination, Looper, L'Effet Papillon, Interstellar, etc.).
    2. Réponds STRICTEMENT sous la forme d'un tableau JSON d'objets sans aucun texte autour, ni balises markdown :
    [{"title": "Titre exact en français", "reason": "Explication courte"}]`;

    // Liste des URLs à tester en cas de 404 (de la plus stable à la plus récente)
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    ];

    let geminiRes: Response | null = null;
    let geminiData: any = null;

    // Essaie chaque endpoint jusqu'à ce qu'un fonctionne
    for (const url of endpoints) {
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      geminiData = await geminiRes.json();
      if (geminiRes.ok) break; // Succès ! On sort de la boucle
    }

    if (!geminiRes || !geminiRes.ok) {
      return NextResponse.json({ 
        error: `Erreur Google AI (${geminiRes?.status}): ${geminiData?.error?.message || 'Problème de modèle'}` 
      }, { status: geminiRes?.status || 500 });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const recommendations = JSON.parse(cleanJsonText);

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: `Erreur serveur: ${error?.message || 'Inconnue'}` }, { status: 500 });
  }
}
