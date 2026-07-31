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
            content: `Tu es un expert mondial et infaillible en cinéma, répliques cultes et citations exactes. 
            Analyse précisément la demande de l'utilisateur : "${prompt}".
            
            INSTRUCTIONS CRITIQUES :
            1. Si la phrase contient une réplique ou une citation, identifie le film exact où elle est prononcée. N'invente jamais et ne te trompe pas de film (par exemple, "Il s'appelle Juste Leblanc" vient obligatoirement du film "Le Dîner de cons").
            2. Ce film exact DOIT IMPÉRATIVEMENT être le PREMIER élément de ton tableau.
            3. Complète ensuite avec 4 autres ${typeLabel} du même réalisateur, du même genre ou avec les mêmes acteurs.
            4. Renvoie STRICTEMENT un tableau JSON valide sous cette forme exacte, sans texte autour, sans markdown :
            [{"title": "Titre exact et officiel du film", "reason": "Explication précise"}]`
          }
        ],
        temperature: 0.1
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Erreur API Groq' }, { status: res.status });
    }

    const rawText = data.choices[0]?.message?.content || '[]';
    
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
      recommendations = [];
    }

    return NextResponse.json({ recommendations });

  } catch (err: any) {
    console.error('Erreur serveur:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
