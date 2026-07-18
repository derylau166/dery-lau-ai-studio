import { getModelsResponse, upstreamError } from '../server/pollinations.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const upstream = await getModelsResponse();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: await upstreamError(upstream) });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'private, max-age=120');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Katalog model gagal dimuat.' });
  }
}
