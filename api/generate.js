import { generateImageResponse, readJsonRequest, upstreamError } from '../server/pollinations.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const payload = await readJsonRequest(req);
    const upstream = await generateImageResponse(payload);

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: await upstreamError(upstream) });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Generasi gambar gagal.' });
  }
}
