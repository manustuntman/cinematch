import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    // On utilise la clé GROQ configurée sur Vercel
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API GROQ manquante sur Vercel' }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

    // Appel à l'API de Groq avec gestion des citations et répliques cultes
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert cinéma et recommandeur ultra-pointu. 
            L'utilisateur peut te donner soit une description d'une envie, soit une réplique, une citation culte ou un extrait de dialogue dont il recherche le titre.
            - Si l'utilisateur tape une réplique ou citation, identifie en premier le film ou la série correspondant, mets-le en premier dans ta liste, et propose 4 autres ${typeLabel} similaires ou de la même ambiance.
            - Trouve exactement 5 ${typeLabel} au total pour le concept ou la réplique : "${prompt}".
            Renvoie UNIQUEMENT un tableau JSON valide. Ne dis pas bonjour, ne mets aucune balise markdown. 
            Exemple de format attendu :
            [{"title": "Inception", "reason": "Correspond à la citation exacte et propose un voyage mental fascinant"}]`
          }
        ],
        temperature: 0.5
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Erreur API Groq' }, { status: res.status });
    }

    // Extraction et nettoyage de la réponse pour obtenir le tableau JSON
    const rawText = data.choices[0].message.content || '[]';
    const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return NextResponse.json({ recommendations: JSON.parse(clean) });

} catch (err: any) {
    console.error('Erreur serveur:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
