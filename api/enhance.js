import { enhancePromptResponse, readJsonRequest, upstreamError } from '../server/pollinations.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const payload = await readJsonRequest(req);
    const upstream = await enhancePromptResponse(payload);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: await upstreamError(upstream) });
    }
    return res.status(200).json(await upstream.json());
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Enhance prompt gagal.' });
  }
}
