import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API GROQ manquante sur Vercel' }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

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
            
            RÈGLE ABSOLUE : Renvoie STRICTEMENT un tableau JSON valide sous cette forme exacte, sans texte autour, sans markdown :
            [{"title": "Titre exact", "reason": "Explication courte"}]`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Erreur API Groq' }, { status: res.status });
    }

    const rawText = data.choices[0]?.message?.content || '[]';
    
    // Nettoyage agressif pour isoler uniquement le tableau JSON
    let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }

    let recommendations = [];
    try {
      recommendations = JSON.parse(clean);
    } catch (parseError) {
      console.error('Erreur de parsing JSON brut:', clean);
      // Secours ultime : si le JSON est cassé, on renvoie un tableau vide propre pour éviter le crash
      recommendations = [];
    }

    return NextResponse.json({ recommendations });

  } catch (err: any) {
    console.error('Erreur serveur:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
