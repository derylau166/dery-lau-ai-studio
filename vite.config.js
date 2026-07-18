import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  enhancePromptResponse,
  generateImageResponse,
  getModelsResponse,
  getServerStatus,
  readJsonRequest,
  upstreamError,
} from './server/pollinations.js';

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function createApiMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();

    try {
      if (url.pathname === '/api/status' && req.method === 'GET') {
        return sendJson(res, 200, await getServerStatus());
      }

      if (url.pathname === '/api/models' && req.method === 'GET') {
        const upstream = await getModelsResponse();
        if (!upstream.ok) return sendJson(res, upstream.status, { error: await upstreamError(upstream) });
        return sendJson(res, 200, await upstream.json());
      }

      if (url.pathname === '/api/enhance' && req.method === 'POST') {
        const body = await readJsonRequest(req);
        const upstream = await enhancePromptResponse(body);
        if (!upstream.ok) return sendJson(res, upstream.status, { error: await upstreamError(upstream) });
        return sendJson(res, 200, await upstream.json());
      }

      if (url.pathname === '/api/generate' && req.method === 'POST') {
        const body = await readJsonRequest(req);
        const upstream = await generateImageResponse(body);
        if (!upstream.ok) return sendJson(res, upstream.status, { error: await upstreamError(upstream) });

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.statusCode = 200;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'no-store');
        return res.end(buffer);
      }

      return sendJson(res, 404, { error: 'API route tidak ditemukan.' });
    } catch (error) {
      return sendJson(res, error.status || 500, {
        error: error.message || 'Server lokal mengalami kesalahan.',
      });
    }
  };
}

function localPollinationsApi() {
  const attach = (server) => {
    server.middlewares.use(createApiMiddleware());
  };

  return {
    name: 'dery-lau-local-pollinations-api',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.POLLINATIONS_API_KEY = env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_KEY || '';

  return {
    plugins: [react(), localPollinationsApi()],
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    build: {
      sourcemap: true,
    },
  };
});
