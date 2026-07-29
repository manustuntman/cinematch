import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

    const systemPrompt = `Tu es un expert cinéma et recommandeur ultra-pointu.
    Propose exactement 5 ${typeLabel} qui correspondent au CONCEPT et à l'AMBIANCE de cette demande : "${prompt}".
    Règles :
    1. Ne cherche pas juste les mots dans le titre, trouve de véritables œuvres qui traitent du thème (ex: voyage dans le temps = Predestination, Looper, L'Effet Papillon, etc.).
    2. Réponds STRICTEMENT sous la forme d'un tableau JSON d'objets sans aucun texte autour :
    [{"title": "Titre exact en français", "reason": "Explication courte"}]`;

    // Appel direct à l'API Gemini de Google
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const recommendations = JSON.parse(cleanJsonText);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Erreur API Gemini:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération IA' }, { status: 500 });
  }
}
