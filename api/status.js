import { getServerStatus } from '../server/pollinations.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const status = await getServerStatus();
    return res.status(200).json(status);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Status server gagal dibaca.' });
  }
}
