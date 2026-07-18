const POLLINATIONS_API_BASE = 'https://gen.pollinations.ai';

export function getPollinationsKey() {
  return String(
    process.env.POLLINATIONS_API_KEY ||
    process.env.POLLINATIONS_KEY ||
    '',
  ).trim();
}

export function createHttpError(status, message, details = '') {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function requireServerKey() {
  const key = getPollinationsKey();
  if (!key) {
    throw createHttpError(
      503,
      'POLLINATIONS_API_KEY belum dipasang pada environment server.',
    );
  }
  return key;
}

function requestHeaders(extra = {}, authenticate = true) {
  return {
    ...(authenticate ? { Authorization: `Bearer ${requireServerKey()}` } : {}),
    'User-Agent': 'DERY-LAU-AI-STUDIO/1.6',
    ...extra,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 15000);
  }
  return Math.min(1500 * (attempt + 1), 6000);
}

async function fetchPollinations(path, options = {}) {
  const {
    timeoutMs = 180000,
    retries = 0,
    retryStatuses = [429, 502, 503, 504],
    retryOnTimeout = false,
    authenticate = true,
    headers,
    ...fetchOptions
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${POLLINATIONS_API_BASE}${path}`, {
        ...fetchOptions,
        headers: requestHeaders(headers, authenticate),
        signal: controller.signal,
        cache: 'no-store',
      });

      if (attempt < retries && retryStatuses.includes(response.status)) {
        try { await response.body?.cancel(); } catch { /* ignore */ }
        await sleep(retryDelay(response, attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (error?.name === 'AbortError') {
        if (retryOnTimeout && attempt < retries) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        throw createHttpError(
          504,
          `Pollinations belum menyelesaikan proses dalam ${Math.round(timeoutMs / 1000)} detik. Coba mode Cepat, model Z-Image, atau ulangi beberapa saat lagi.`,
        );
      }

      if (attempt < retries) {
        await sleep(1200 * (attempt + 1));
        continue;
      }

      throw createHttpError(
        502,
        'Server tidak dapat terhubung ke Pollinations.',
        error?.message || '',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw createHttpError(502, 'Permintaan Pollinations gagal.', lastError?.message || '');
}

export async function getModelsResponse() {
  // Katalog model bersifat publik, jadi tidak perlu menunggu validasi key.
  return fetchPollinations('/image/models', {
    method: 'GET',
    timeoutMs: 12000,
    retries: 1,
    authenticate: false,
    retryOnTimeout: true,
  });
}

export async function getServerStatus() {
  const key = getPollinationsKey();
  if (!key) {
    return {
      configured: false,
      valid: false,
      type: null,
      balance: null,
      message: 'POLLINATIONS_API_KEY belum dipasang.',
    };
  }

  const [keyResult, balanceResult] = await Promise.allSettled([
    fetchPollinations('/account/key', { method: 'GET', timeoutMs: 15000 }),
    fetchPollinations('/account/balance', { method: 'GET', timeoutMs: 15000 }),
  ]);

  let valid = false;
  let type = key.startsWith('sk_') ? 'secret' : key.startsWith('pk_') ? 'publishable' : 'unknown';
  let balance = null;
  let message = 'Environment server terpasang.';

  if (keyResult.status === 'fulfilled') {
    if (keyResult.value.ok) {
      const data = await keyResult.value.json().catch(() => ({}));
      valid = data.valid !== false;
      type = data.type || type;

      const possibleBudget =
        data.balance ??
        data.remainingBudget ??
        data.budgetRemaining ??
        data.pollenBudgetRemaining ??
        data.pollenBudget;
      if (Number.isFinite(Number(possibleBudget))) balance = Number(possibleBudget);
    } else {
      message = `Validasi key gagal (${keyResult.value.status}).`;
    }
  } else {
    message = 'Key terpasang, tetapi status Pollinations belum dapat diperiksa.';
  }

  if (balanceResult.status === 'fulfilled' && balanceResult.value.ok) {
    const data = await balanceResult.value.json().catch(() => ({}));
    if (Number.isFinite(Number(data.balance))) balance = Number(data.balance);
  }

  return {
    configured: true,
    valid,
    type,
    balance,
    message,
  };
}

export async function enhancePromptResponse(payload = {}) {
  const prompt = String(payload.prompt || '').trim();
  if (!prompt) throw createHttpError(400, 'Prompt tidak boleh kosong.');

  return fetchPollinations('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeoutMs: 120000,
    body: JSON.stringify({
      model: 'openai',
      temperature: 0.72,
      messages: [
        {
          role: 'system',
          content: "You are a strict professional text-to-image prompt engineer. Translate the user's idea into polished English when needed. Preserve every concrete requirement: subject count, identity description, action, pose, named location, environment, props, wardrobe, camera framing, and mood. Put the subject, action, and location in the first sentence. Never replace an environmental scene with a generic portrait, passport photo, corporate headshot, or plain studio background unless explicitly requested. Add precise visual details, camera language, lighting, palette, composition, and quality without changing the requested scene. Do not add headings, explanations, quotes, or negative prompts. Keep it under 160 words.",
        },
        {
          role: 'user',
          content: [
            `Core idea: ${prompt}`,
            `Prompt fidelity: ${String(payload.fidelity || 'balanced')}`,
            `Style: ${String(payload.style || 'none')}`,
            `Lighting: ${String(payload.lighting || 'auto')}`,
            `Palette: ${String(payload.palette || 'auto')}`,
            `Composition: ${String(payload.composition || 'auto')}`,
          ].join('\n'),
        },
      ],
    }),
  });
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export async function generateImageResponse(payload = {}) {
  const prompt = String(payload.prompt || '').trim();
  if (!prompt) throw createHttpError(400, 'Prompt tidak boleh kosong.');
  if (prompt.length > 12000) throw createHttpError(400, 'Prompt terlalu panjang. Maksimal 12.000 karakter.');

  const model = String(payload.model || 'zimage').trim();
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(model)) {
    throw createHttpError(400, 'Nama model tidak valid.');
  }

  const width = clampInteger(payload.width, 256, 2048, 1024);
  const height = clampInteger(payload.height, 256, 2048, 1024);
  const seed = clampInteger(payload.seed, -1, 2147483647, -1);
  const safe = payload.safe === false ? 'false' : String(payload.safe ?? true);
  const quality = String(payload.quality || '').trim();
  const negativePrompt = String(payload.negativePrompt || '').trim().slice(0, 4000);
  const enhance = payload.enhance === true ? 'true' : 'false';
  const timeoutMs = clampInteger(payload.timeoutMs, 90000, 420000, 210000);

  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    seed: String(seed),
    safe,
    enhance,
  });

  if (negativePrompt && ['flux', 'zimage'].includes(model)) {
    params.set('negative_prompt', negativePrompt);
  }

  if (quality && ['standard', 'hd', 'low', 'medium', 'high'].includes(quality)) {
    params.set('quality', quality);
  }

  // Jangan retry otomatis agar prompt tidak diproses dua kali dan saldo tidak terpakai ganda.
  return fetchPollinations(`/image/${encodeURIComponent(prompt)}?${params.toString()}`, {
    method: 'GET',
    timeoutMs,
    retries: 0,
  });
}

export async function readJsonRequest(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw createHttpError(400, 'Body JSON tidak valid.');
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8'));
    } catch {
      throw createHttpError(400, 'Body JSON tidak valid.');
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};

  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw createHttpError(400, 'Body JSON tidak valid.');
  }
}

export async function upstreamError(upstream) {
  const text = await upstream.text().catch(() => '');
  return String(text || `Pollinations mengembalikan status ${upstream.status}.`).slice(0, 1600);
}
