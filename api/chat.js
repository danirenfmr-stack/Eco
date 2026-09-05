// Función serverless (Vercel). Llama a Gemini (Google) con tu clave gratuita.
// Traduce la respuesta al mismo formato que ya usaba el frontend, así que
// App.jsx no necesita ningún cambio.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta GEMINI_API_KEY en las variables de entorno del servidor' });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Falta el array de messages' });
    return;
  }

  try {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json(data);
      return;
    }

    const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.filter((p) => p.text).map((p) => p.text).join('');

    // Mismo formato que antes devolvía Anthropic, para no tocar el frontend
    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar con la API de Gemini' });
  }
}
