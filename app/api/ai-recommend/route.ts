import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante sur Vercel' }, { status: 500 });
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Erreur API' }, { status: res.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return NextResponse.json({ recommendations: JSON.parse(clean) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
