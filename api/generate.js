export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }
  const KEY = process.env.OPENROUTER_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'Server not configured' });

  const models = [
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-4o-mini'
  ];

  let lastErr = '';
  for (const model of models) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + KEY,
          'HTTP-Referer': 'https://daeriyok.vercel.app',
          'X-Title': 'Daeriyok'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500
        })
      });
      const d = await r.json();
      console.log('Model:', model, 'Status:', r.status, 'Resp:', JSON.stringify(d).slice(0, 400));
      if (!r.ok) { lastErr = JSON.stringify(d).slice(0, 200); continue; }
      const text = d.choices?.[0]?.message?.content || '';
      if (text) return res.status(200).json({ text });
      lastErr = 'empty content';
    } catch (e) {
      lastErr = e.message;
      continue;
    }
  }
  return res.status(502).json({ error: 'All models failed', detail: lastErr });
}
