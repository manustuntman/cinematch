import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Clé API absente. Vérifie GEMINI_API_KEY sur Vercel et fais un Redeploy.' 
      }, { status: 500 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

    const systemPrompt = `Tu es un expert cinéma. Propose exactement 5 ${typeLabel} correspondant au CONCEPT : "${prompt}".
    Réponds STRICTEMENT sous forme d'un tableau JSON d'objets : [{"title": "Titre", "reason": "Raison"}]`;

    // Appel à l'API Gemini 1.5 Flash
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Erreur retournée par Google:', geminiData);
      return NextResponse.json({ 
        error: `Erreur Google AI (${geminiRes.status}): ${geminiData.error?.message || 'Problème de clé ou de quota'}` 
      }, { status: geminiRes.status });
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
