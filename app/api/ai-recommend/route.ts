import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, mediaType } = await req.json();

    // On utilise la clé GROQ que tu viens de configurer sur Vercel
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API GROQ manquante sur Vercel' }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const typeLabel = mediaType === 'tv' ? 'séries TV' : 'films';

    // Appel à l'API ultra-rapide de Groq (modèle Llama 3)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: [
          {
            role: 'system',
            content: `Tu es un expert cinéma et recommandeur ultra-pointu.
            Trouve exactement 5 ${typeLabel} pour le concept : "${prompt}".
            Renvoie UNIQUEMENT un tableau JSON valide. Ne dis pas bonjour, ne mets aucune balise markdown. 
            Exemple de format attendu :
            [{"title": "Inception", "reason": "Un voyage mental fascinant dans les rêves"}]`
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
