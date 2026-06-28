export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ragePrompt, comfortPrompt } = req.body;
  const GEMINI_KEY = process.env.Gemini_API_Key;

  if (!GEMINI_KEY) return res.status(500).json({ error: 'API key not configured' });

  const callGemini = async (prompt) => {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1000 }
        })
      }
    );
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  try {
    const [rageText, comfortText] = await Promise.all([
      callGemini(ragePrompt),
      callGemini(comfortPrompt)
    ]);
    res.status(200).json({ rageText, comfortText });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
