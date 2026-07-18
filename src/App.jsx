import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const API_ROUTE = '/api';
const STORAGE = {
  history: 'dery-lau-ai-history',
  preferences: 'dery-lau-ai-preferences',
  sceneFirstMigration: 'dery-lau-ai-v16-scene-first',
};

const FALLBACK_MODELS = [
  { name: 'zimage', title: 'Z-Image Turbo', brand: 'Alibaba', description: 'Fast text-to-image with 2x SPAN upscaling.' },
  { name: 'flux', title: 'Flux Schnell', brand: 'Black Forest Labs', description: 'Fast, efficient high-quality image generation.' },
  { name: 'kontext', title: 'FLUX.1 Kontext', brand: 'Black Forest Labs', description: 'In-context generation and image editing.' },
  { name: 'gpt-image-2', title: 'GPT Image 2', brand: 'OpenAI', description: 'Premium high-resolution generation and editing.' },
  { name: 'gptimage-large', title: 'GPT Image 1.5', brand: 'OpenAI', description: 'High-fidelity generation and editing.' },
  { name: 'gptimage', title: 'GPT Image 1 Mini', brand: 'OpenAI', description: 'Fast and affordable image generation.' },
  { name: 'nanobanana-pro', title: 'NanoBanana Pro', brand: 'Google', description: 'Gemini Pro image generation with high detail.', paid_only: true },
  { name: 'nanobanana-2', title: 'NanoBanana 2', brand: 'Google', description: 'Sharper generation and editing.', paid_only: true },
  { name: 'nanobanana', title: 'NanoBanana', brand: 'Google', description: 'Fast generation and editing.', paid_only: true },
  { name: 'seedream5-pro', title: 'Seedream 5.0 Pro', brand: 'ByteDance', description: 'Premium multimodal image generation.', paid_only: true },
  { name: 'seedream5', title: 'Seedream 5.0 Lite', brand: 'ByteDance', description: 'Image generation with reasoning.', paid_only: true },
  { name: 'seedream-pro', title: 'Seedream 4.5 Pro', brand: 'ByteDance', description: 'Premium photorealistic generation.', paid_only: true },
  { name: 'seedream', title: 'Seedream 4.0', brand: 'ByteDance', description: 'Photorealistic image generation.', paid_only: true },
  { name: 'grok-imagine-pro', title: 'Grok Imagine Pro', brand: 'xAI', description: 'Official pro image generation.', paid_only: true },
  { name: 'grok-imagine', title: 'Grok Imagine', brand: 'xAI', description: 'Photorealistic image generation.', paid_only: true },
  { name: 'ideogram-v4-quality', title: 'Ideogram 4.0 Quality', brand: 'Ideogram', description: 'High-fidelity image typography.', paid_only: true },
  { name: 'ideogram-v4-balanced', title: 'Ideogram 4.0 Balanced', brand: 'Ideogram', description: 'Balanced quality and typography.', paid_only: true },
  { name: 'ideogram-v4-turbo', title: 'Ideogram 4.0 Turbo', brand: 'Ideogram', description: 'Fast generation with accurate typography.', paid_only: true },
  { name: 'wan-image-pro', title: 'Wan 2.7 Image Pro', brand: 'Alibaba', description: '4K generation and editing with thinking mode.', paid_only: true },
  { name: 'wan-image', title: 'Wan 2.7 Image', brand: 'Alibaba', description: 'Generation and editing up to 2K.', paid_only: true },
  { name: 'qwen-image', title: 'Qwen Image Plus', brand: 'Qwen', description: 'Text-to-image and image editing.', paid_only: true },
  { name: 'klein', title: 'FLUX.2 Klein 4B', brand: 'Black Forest Labs', description: 'Fast generation and editing.' },
  { name: 'p-image', title: 'Pruna p-image', brand: 'Pruna', description: 'Fast text-to-image generation.', paid_only: true },
  { name: 'nova-canvas', title: 'Nova Canvas', brand: 'Amazon', description: 'Generation, editing and inpainting.' },
  { name: 'sana', title: 'Sana', brand: 'NVIDIA', description: 'Efficient image generation.' },
];

const FEATURED_MODEL_ORDER = [
  'gpt-image-2', 'nanobanana-pro', 'seedream5-pro', 'seedream5', 'grok-imagine-pro',
  'grok-imagine', 'zimage', 'flux', 'kontext', 'gptimage-large', 'ideogram-v4-quality',
  'wan-image-pro', 'qwen-image', 'klein',
];

const STYLES = [
  ['none', 'None', ''],
  ['psychedelic', 'Psychedelic', 'psychedelic visionary art, kaleidoscopic energy, vivid spectral colors, intricate fractal patterns, luminous surreal atmosphere'],
  ['macabre', 'Macabre', 'macabre elegance, haunting visual poetry, gothic symbolism, dramatic shadows, unsettling yet beautiful atmosphere'],
  ['sanctuary', 'Sanctuary', 'serene sacred sanctuary, tranquil atmosphere, ethereal light, harmonious natural architecture, spiritual calm'],
  ['chaotic', 'Chaotic', 'controlled visual chaos, explosive layered details, dynamic disorder, energetic composition, bold unexpected juxtapositions'],
  ['surrealism', 'Surrealisme', 'surrealism, dream logic, impossible architecture, poetic visual metaphors, uncanny realism'],
  ['dark-fantasy', 'Dark Fantasy', 'dark fantasy, ancient cursed realm, mystical fog, gothic grandeur, ominous cinematic atmosphere'],
  ['anime', 'Anime', 'premium anime illustration, expressive character design, crisp linework, cinematic anime lighting, highly detailed background'],
  ['chibi-3d', 'Chibi 3D Hyper Realistis', 'ultra-cute chibi proportions, hyper-realistic 3D collectible designer toy, detailed skin and materials, cinematic studio render'],
  ['hypermaximalism', 'Hypermaximalism', 'hypermaximalism, edge-to-edge visual density, infinite micro-details, ornamental layering, no empty space'],
  ['photorealistic', 'Photorealistic', 'photorealistic non-CGI photography, natural skin texture, physically accurate materials, cinematic depth of field'],
  ['cinematic', 'Cinematic', 'cinematic storytelling, dramatic production design, film still, atmospheric depth, premium color grading'],
  ['editorial', 'Fashion Editorial', 'luxury fashion editorial photography, sophisticated styling, magazine-grade art direction, refined pose'],
  ['cyberpunk', 'Cyberpunk', 'futuristic cyberpunk city, neon reflections, holographic interfaces, wet streets, high-tech atmosphere'],
  ['steampunk', 'Steampunk', 'intricate steampunk machinery, brass and copper details, Victorian industrial fantasy, cinematic steam'],
  ['sumi-e', 'Dark Sumi-e', 'Japanese sumi-e ink wash, expressive black brush strokes, elegant negative space, dark fantasy ink atmosphere'],
  ['watercolor', 'Watercolor', 'masterful watercolor painting, transparent pigments, textured paper, expressive washes, delicate edges'],
  ['oil-painting', 'Oil Painting', 'museum-quality oil painting, rich impasto texture, classical brushwork, dramatic chiaroscuro'],
  ['pixel-art', 'Pixel Art', 'high-detail pixel art, crisp pixel clusters, intentional limited palette, atmospheric game-art composition'],
  ['comic', 'Graphic Comic', 'bold graphic novel illustration, dynamic ink lines, halftone texture, dramatic panel-like composition'],
  ['clay', 'Claymation', 'handcrafted claymation aesthetic, tactile clay texture, miniature set, soft stop-motion lighting'],
  ['low-poly', 'Low Poly', 'stylized low-poly 3D art, geometric facets, clean silhouettes, modern game-art lighting'],
  ['vaporwave', 'Vaporwave', 'vaporwave dreamscape, retro-futuristic gradients, chrome statues, nostalgic digital atmosphere'],
  ['baroque', 'Baroque', 'ornate baroque grandeur, dramatic movement, gold filigree, theatrical chiaroscuro, lavish detail'],
  ['minimalist', 'Minimalist', 'elegant minimalism, disciplined negative space, clean geometry, refined visual hierarchy'],
  ['wet-plastic', 'Wet Plastic Atmosphere', 'wet plastic texture, glossy surface, transparent vinyl, acrylic reflections, water droplets, liquid shine, cinematic rain, surreal glossy atmosphere'],
];


const PROMPT_FIDELITY = [
  ['strict', 'Strict Scene Lock', 'the requested subject, action, setting, props, wardrobe, and camera framing are all clearly visible together in one coherent environmental scene'],
  ['balanced', 'Balanced', 'clear subject, action, setting, and environmental context with tasteful creative interpretation'],
  ['creative', 'Creative', ''],
];

const LIGHTING = [
  ['auto', 'Auto', ''],
  ['cinematic', 'Cinematic', 'cinematic key light, subtle fill light, dramatic rim light, volumetric atmosphere'],
  ['golden-hour', 'Golden Hour', 'warm golden-hour sunlight, soft long shadows, glowing atmosphere'],
  ['neon', 'Neon', 'vibrant neon illumination, cyan and magenta reflections, luminous atmospheric haze'],
  ['studio', 'Studio Softbox', 'professional studio softbox lighting, clean highlights, controlled shadows'],
  ['rembrandt', 'Rembrandt', 'Rembrandt lighting, sculpted face, triangular cheek highlight, deep elegant shadows'],
  ['low-key', 'Low Key', 'low-key lighting, deep blacks, focused highlights, dramatic contrast'],
  ['high-key', 'High Key', 'high-key lighting, bright airy exposure, soft clean shadows'],
  ['god-rays', 'God Rays', 'volumetric god rays, radiant shafts of light, atmospheric particles'],
  ['moonlight', 'Moonlight', 'cool moonlight, silver-blue highlights, nocturnal atmospheric depth'],
  ['bioluminescent', 'Bioluminescent', 'bioluminescent glow, organic luminous accents, enchanted darkness'],
  ['backlight', 'Strong Backlight', 'powerful cinematic backlight, glowing silhouette edges, atmospheric flare'],
];

const PALETTES = [
  ['auto', 'Auto', ''],
  ['vibrant', 'Vibrant Bold', 'vibrant bold colors, high saturation, rich contrast'],
  ['cyan-magenta', 'Cyan Magenta', 'electric cyan, vivid magenta, deep violet and black color palette'],
  ['emerald-gold', 'Emerald Gold', 'emerald green, molten gold, deep black and warm amber palette'],
  ['blue-yellow', 'Blue Yellow', 'royal blue, navy, bright yellow and subtle white accents'],
  ['monochrome-red', 'Monochrome + Red', 'charcoal monochrome palette with selective crimson accents'],
  ['pastel', 'Pastel Dream', 'soft pastel palette, powder blue, blush pink, lavender and cream'],
  ['earthy', 'Earthy Natural', 'earthy ochre, olive, terracotta, warm brown and natural cream'],
  ['teal-orange', 'Teal Orange', 'cinematic teal shadows and warm orange highlights'],
  ['black-gold', 'Black Gold', 'luxurious black and gold palette, subtle ivory highlights'],
  ['rainbow', 'Spectral Rainbow', 'full spectral rainbow palette, iridescent transitions, prismatic highlights'],
  ['retro', 'Retro 70s', 'burnt orange, mustard yellow, avocado green, warm brown retro palette'],
  ['cold', 'Cold Steel', 'steel blue, icy cyan, graphite gray and silver palette'],
];

const COMPOSITIONS = [
  ['auto', 'Auto', ''],
  ['centered', 'Centered Hero', 'centered hero composition, strong symmetry, commanding focal point'],
  ['rule-thirds', 'Rule of Thirds', 'rule-of-thirds composition, balanced visual flow, clear focal hierarchy'],
  ['low-angle', 'Low Angle Heroic', 'dramatic low-angle viewpoint, heroic scale, strong perspective'],
  ['close-up', 'Close-up Portrait', 'intimate close-up portrait, face-dominant framing, shallow depth of field'],
  ['medium', 'Medium Shot', 'medium shot, expressive body language, environmental context'],
  ['full-body', 'Full Body', 'full-body composition, complete outfit visible, grounded feet, dynamic pose'],
  ['wide', 'Wide Establishing', 'wide establishing shot, epic environment, cinematic scale'],
  ['dutch', 'Dutch Angle', 'dynamic Dutch angle, energetic tension, diagonal visual movement'],
  ['overhead', 'Overhead', 'top-down overhead composition, graphic spatial arrangement'],
  ['leading-lines', 'Leading Lines', 'strong leading lines guiding the eye toward the subject'],
  ['layered', 'Layered Depth', 'deep layered composition, foreground framing, midground subject, detailed background'],
  ['edge-to-edge', 'Edge-to-edge', 'edge-to-edge composition, dense detail, no empty space'],
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 · Square', width: 1536, height: 1536 },
  { id: '4:5', label: '4:5 · Portrait', width: 1229, height: 1536 },
  { id: '5:4', label: '5:4 · Landscape', width: 1536, height: 1229 },
  { id: '2:3', label: '2:3 · Portrait', width: 1024, height: 1536 },
  { id: '3:2', label: '3:2 · Landscape', width: 1536, height: 1024 },
  { id: '3:4', label: '3:4 · Portrait', width: 1152, height: 1536 },
  { id: '4:3', label: '4:3 · Landscape', width: 1536, height: 1152 },
  { id: '5:7', label: '5:7 · Portrait', width: 1097, height: 1536 },
  { id: '7:5', label: '7:5 · Landscape', width: 1536, height: 1097 },
  { id: '9:16', label: '9:16 · Story / Reels', width: 864, height: 1536 },
  { id: '16:9', label: '16:9 · Widescreen', width: 1536, height: 864 },
  { id: '9:21', label: '9:21 · Tall Mobile', width: 658, height: 1536 },
  { id: '21:9', label: '21:9 · Ultrawide', width: 1536, height: 658 },
  { id: '1:2', label: '1:2 · Tall Poster', width: 768, height: 1536 },
  { id: '2:1', label: '2:1 · Banner', width: 1536, height: 768 },
  { id: '4:1', label: '4:1 · Super Banner', width: 1536, height: 384 },
  { id: '1:4', label: '1:4 · Super Tall', width: 384, height: 1536 },
];

const RESOLUTION_PRESETS = {
  fast: { label: 'Cepat · maks. 1024px', maxSide: 1024, timeoutMs: 120000 },
  hd: { label: 'HD · maks. 1536px', maxSide: 1536, timeoutMs: 240000 },
};

function getOutputDimensions(ratioItem, resolutionId = 'fast') {
  const preset = RESOLUTION_PRESETS[resolutionId] || RESOLUTION_PRESETS.fast;
  const scale = preset.maxSide / Math.max(ratioItem.width, ratioItem.height);
  const roundTo8 = (value) => Math.max(256, Math.round((value * scale) / 8) * 8);
  return { width: roundTo8(ratioItem.width), height: roundTo8(ratioItem.height) };
}

const FONT_OPTIONS = [
  ['Orbitron', 'Orbitron'],
  ['Bebas Neue', 'Bebas Neue'],
  ['Cinzel', 'Cinzel'],
  ['Montserrat', 'Montserrat'],
  ['Poppins', 'Poppins'],
  ['Playfair Display', 'Playfair Display'],
  ['Space Grotesk', 'Space Grotesk'],
];

const POSITION_OPTIONS = [
  ['top-left', '↖'], ['top-center', '↑'], ['top-right', '↗'],
  ['center-left', '←'], ['center', '•'], ['center-right', '→'],
  ['bottom-left', '↙'], ['bottom-center', '↓'], ['bottom-right', '↘'],
];

const ICONS = {
  sparkles: '<path d="m12 3-1.9 4.3L6 9l4.1 1.7L12 15l1.9-4.3L18 9l-4.1-1.7L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  key: '<circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8-8 2 2-1.5 1.5L20 10l-2 2-1.5-1.5L12 15"/>',
  wand: '<path d="m15 4 5 5L8 21H3v-5L15 4Z"/><path d="m13.5 5.5 5 5M6 4V2M5 3H3M20 17v4M18 19h4"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  refresh: '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r=".8"/><circle cx="15.5" cy="8.5" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="8.5" cy="15.5" r=".8"/><circle cx="15.5" cy="15.5" r=".8"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2 3.2M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10 10 0 0 0 4.1-.9"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/>',
};

function Icon({ name, size = 18, strokeWidth = 1.9 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.sparkles }}
    />
  );
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function randomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

function selectValue(items, id) {
  return items.find(([value]) => value === id)?.[2] || '';
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

function readableError(response, text) {
  let upstreamMessage = String(text || '').trim();
  try {
    const parsed = JSON.parse(upstreamMessage);
    upstreamMessage = parsed.error || parsed.message || upstreamMessage;
  } catch {
    // Upstream may return plain text.
  }

  if (response.status === 401) return 'API key server tidak valid atau tidak memiliki izin untuk model ini.';
  if (response.status === 402) return 'Saldo Pollen atau batas anggaran API key telah habis. Periksa balance akun Pollinations.';
  if (response.status === 429) return 'Permintaan terlalu cepat. Coba ulang beberapa saat lagi.';
  if (response.status === 503 && upstreamMessage) return upstreamMessage;
  if (response.status === 503 || response.status === 502) return 'Model sedang sibuk atau penyedia upstream sedang bermasalah.';
  return upstreamMessage || `Permintaan gagal dengan status ${response.status}.`;
}

function getWatermarkCoordinates(position, canvasWidth, canvasHeight, textWidth, fontSize) {
  const padding = Math.max(24, Math.round(Math.min(canvasWidth, canvasHeight) * 0.035));
  const positions = {
    'top-left': [padding, padding + fontSize],
    'top-center': [(canvasWidth - textWidth) / 2, padding + fontSize],
    'top-right': [canvasWidth - textWidth - padding, padding + fontSize],
    'center-left': [padding, (canvasHeight + fontSize) / 2],
    center: [(canvasWidth - textWidth) / 2, (canvasHeight + fontSize) / 2],
    'center-right': [canvasWidth - textWidth - padding, (canvasHeight + fontSize) / 2],
    'bottom-left': [padding, canvasHeight - padding],
    'bottom-center': [(canvasWidth - textWidth) / 2, canvasHeight - padding],
    'bottom-right': [canvasWidth - textWidth - padding, canvasHeight - padding],
  };
  return positions[position] || positions['bottom-right'];
}

function App() {
  const preferences = useMemo(() => loadJSON(STORAGE.preferences, {}), []);
  const [serverStatus, setServerStatus] = useState({ configured: null, valid: null, type: null, balance: null, message: 'Memeriksa environment server…' });
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [modelStatus, setModelStatus] = useState('Memuat katalog model…');
  const [model, setModel] = useState(preferences.model || 'flux');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, deformed anatomy, duplicate subject, cropped body, extreme close-up, plain empty background, card layout, badge layout, poster layout, interface overlay, random text, gibberish typography, logo');
  const [style, setStyle] = useState(preferences.style || 'none');
  const [promptFidelity, setPromptFidelity] = useState(preferences.promptFidelity || 'strict');
  const [apiEnhance, setApiEnhance] = useState(preferences.apiEnhance ?? false);
  const [lighting, setLighting] = useState(preferences.lighting || 'cinematic');
  const [palette, setPalette] = useState(preferences.palette || 'vibrant');
  const [composition, setComposition] = useState(preferences.composition || 'medium');
  const [ratio, setRatio] = useState(preferences.ratio || '9:16');
  const [seed, setSeed] = useState(preferences.seed ?? randomSeed());
  const [quality, setQuality] = useState(preferences.quality || 'high');
  const [resolution, setResolution] = useState(preferences.resolution || 'fast');
  const [safeMode, setSafeMode] = useState(preferences.safeMode ?? true);
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Siap menenun piksel.');
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [generatedMeta, setGeneratedMeta] = useState(null);
  const [history, setHistory] = useState(() => loadJSON(STORAGE.history, []));
  const [toast, setToast] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [watermark, setWatermark] = useState({
    enabled: true,
    text: 'DERY LAU AI',
    font: 'Orbitron',
    position: 'bottom-right',
    size: 4.2,
    color: '#ffffff',
    opacity: 76,
    shadow: true,
    stroke: true,
  });
  const activeObjectUrl = useRef('');
  const generationController = useRef(null);

  const activeRatio = ASPECT_RATIOS.find((item) => item.id === ratio) || ASPECT_RATIOS[9];
  const activeDimensions = getOutputDimensions(activeRatio, resolution);
  const activeModel = models.find((item) => item.name === model) || FALLBACK_MODELS[0];
  const supportsQuality = ['gptimage', 'gptimage-large', 'gpt-image-2'].includes(model);

  const finalPrompt = useMemo(() => {
    const parts = [
      prompt.trim(),
      selectValue(PROMPT_FIDELITY, promptFidelity),
      selectValue(COMPOSITIONS, composition),
      selectValue(LIGHTING, lighting),
      selectValue(PALETTES, palette),
      selectValue(STYLES, style),
      'coherent environmental storytelling, accurate subject placement, premium image quality',
    ].filter(Boolean);
    return parts.join(', ');
  }, [prompt, promptFidelity, style, lighting, palette, composition]);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  }, []);

  const loadServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_ROUTE}/status`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Status server tidak dapat diperiksa.');
      setServerStatus(data);
      return data;
    } catch (err) {
      const next = {
        configured: false,
        valid: false,
        type: null,
        balance: null,
        message: err.message || 'Server API tidak tersedia.',
      };
      setServerStatus(next);
      return next;
    }
  }, []);

  const loadModels = useCallback(async () => {
    setModelStatus('Menyambungkan katalog model melalui server…');
    try {
      const response = await fetch(`${API_ROUTE}/models`, { cache: 'no-store' });
      const raw = await response.text();
      if (!response.ok) throw new Error(readableError(response, raw));
      const data = JSON.parse(raw);
      const imageModels = data
        .filter((item) => {
          const outputs = item.output_modalities || item.outputModalities || [];
          return item.category === 'image' || outputs.includes('image');
        })
        .filter((item) => {
          const outputs = item.output_modalities || item.outputModalities || [];
          return !outputs.includes('video');
        })
        .sort((a, b) => {
          const ai = FEATURED_MODEL_ORDER.indexOf(a.name);
          const bi = FEATURED_MODEL_ORDER.indexOf(b.name);
          if (ai !== -1 || bi !== -1) {
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          }
          return (a.title || a.name).localeCompare(b.title || b.name);
        });
      if (imageModels.length) {
        setModels(imageModels);
        setModelStatus(`${imageModels.length} model gambar aktif dari Pollinations.`);
        if (!imageModels.some((item) => item.name === model)) setModel(imageModels[0].name);
      } else {
        throw new Error('Katalog tidak berisi model gambar.');
      }
    } catch (err) {
      setModels(FALLBACK_MODELS);
      setModelStatus(`Mode cadangan aktif. ${err.message || 'Katalog API belum tersedia.'}`);
    }
  }, [model]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE.sceneFirstMigration) !== '1') {
      setApiEnhance(false);
      setModel('flux');
      setComposition('medium');
      setStyle('none');
      localStorage.setItem(STORAGE.sceneFirstMigration, '1');
    }
  }, []);

  useEffect(() => {
    loadServerStatus();
    loadModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const nextPreferences = { model, style, promptFidelity, apiEnhance, lighting, palette, composition, ratio, seed, quality, resolution, safeMode };
    localStorage.setItem(STORAGE.preferences, JSON.stringify(nextPreferences));
  }, [model, style, promptFidelity, apiEnhance, lighting, palette, composition, ratio, seed, quality, resolution, safeMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE.history, JSON.stringify(history.slice(0, 30).map(({ previewUrl, ...item }) => item)));
  }, [history]);

  useEffect(() => {
    if (!generating) {
      setElapsedSeconds(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => () => {
    generationController.current?.abort();
    if (activeObjectUrl.current) URL.revokeObjectURL(activeObjectUrl.current);
  }, []);

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      setError('Tulis ide utama terlebih dahulu sebelum memperkaya prompt.');
      return;
    }
    setEnhancing(true);
    setError('');
    setStatusText('Meracik prompt yang lebih tajam…');

    const localEnhanced = [
      prompt.trim(),
      selectValue(PROMPT_FIDELITY, promptFidelity),
      selectValue(COMPOSITIONS, composition),
      selectValue(LIGHTING, lighting),
      selectValue(PALETTES, palette),
      selectValue(STYLES, style),
      'precise subject placement, coherent environment, realistic material response, refined depth, premium finish',
    ].filter(Boolean).join(', ');

    try {
      const response = await fetch(`${API_ROUTE}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectValue(STYLES, style) || 'none',
          fidelity: selectValue(PROMPT_FIDELITY, promptFidelity) || 'balanced',
          lighting: selectValue(LIGHTING, lighting) || 'auto',
          palette: selectValue(PALETTES, palette) || 'auto',
          composition: selectValue(COMPOSITIONS, composition) || 'auto',
        }),
      });
      const raw = await response.text();
      if (!response.ok) throw new Error(readableError(response, raw));
      const data = JSON.parse(raw);
      const improved = data?.choices?.[0]?.message?.content?.trim();
      setPrompt(improved || localEnhanced);
      setStatusText('Prompt diperkaya oleh AI.');
      notify('Prompt AI siap dipakai.');
    } catch (err) {
      setPrompt(localEnhanced);
      setStatusText('AI enhancer tidak tersedia, versi lokal digunakan.');
      notify('Versi lokal digunakan.');
    } finally {
      setEnhancing(false);
    }
  };

  const cancelGeneration = () => {
    generationController.current?.abort();
    generationController.current = null;
    setGenerating(false);
    setStatusText('Generasi dibatalkan.');
    setError('Proses dibatalkan. Gunakan mode Cepat atau pilih model lain sebelum mencoba kembali.');
  };

  const generateImage = async (override = null) => {
    const requestPrompt = override?.finalPrompt || finalPrompt;
    const requestModel = override?.model || model;
    const requestRatio = ASPECT_RATIOS.find((item) => item.id === (override?.ratio || ratio)) || activeRatio;
    const requestResolution = override?.resolution || resolution;
    const requestDimensions = getOutputDimensions(requestRatio, requestResolution);
    const requestSeed = override?.seed ?? seed;

    if (!prompt.trim() && !override?.prompt) {
      setError('Prompt masih kosong. Beri mesin ini sesuatu untuk diimpikan.');
      return;
    }
    if (serverStatus.configured === false) {
      setError('Environment server belum siap. Pastikan POLLINATIONS_API_KEY tersedia lalu restart npm run dev.');
      return;
    }

    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;

    setGenerating(true);
    setError('');
    setStatusText('Mengirim prompt melalui server aman…');

    try {
      setStatusText(`Membangun ${requestDimensions.width} × ${requestDimensions.height} dengan ${requestModel}…`);
      const response = await fetch(`${API_ROUTE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: requestPrompt,
          negativePrompt: negativePrompt.trim(),
          enhance: apiEnhance,
          model: requestModel,
          width: requestDimensions.width,
          height: requestDimensions.height,
          seed: requestSeed,
          safe: safeMode,
          timeoutMs: RESOLUTION_PRESETS[requestResolution]?.timeoutMs || 180000,
          quality: ['gptimage', 'gptimage-large', 'gpt-image-2'].includes(requestModel) ? quality : undefined,
        }),
      });
      if (!response.ok) {
        const raw = await response.text();
        throw new Error(readableError(response, raw));
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Respons API bukan file gambar.');

      if (activeObjectUrl.current) URL.revokeObjectURL(activeObjectUrl.current);
      const nextUrl = URL.createObjectURL(blob);
      activeObjectUrl.current = nextUrl;
      setImageBlob(blob);
      setImageUrl(nextUrl);

      const meta = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        prompt: override?.prompt || prompt.trim(),
        finalPrompt: requestPrompt,
        model: requestModel,
        ratio: requestRatio.id,
        resolution: requestResolution,
        width: requestDimensions.width,
        height: requestDimensions.height,
        seed: requestSeed,
        style: override?.style || style,
      };
      setGeneratedMeta(meta);
      setHistory((items) => [{ ...meta, previewUrl: nextUrl }, ...items.filter((item) => item.id !== meta.id)].slice(0, 30));
      setStatusText('Gambar selesai. Pikselnya sudah turun gunung.');
      notify('Gambar berhasil dibuat.');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError('Proses dibatalkan atau koneksi terputus. Coba mode Cepat dan model Z-Image.');
      } else {
        setError(err.message || 'Terjadi kesalahan saat membuat gambar.');
      }
      setStatusText('Generasi terhenti.');
    } finally {
      if (generationController.current === controller) generationController.current = null;
      setGenerating(false);
    }
  };

  const canvasBlob = async () => {
    if (!imageBlob) throw new Error('Belum ada gambar untuk diunduh.');
    const image = new Image();
    const sourceUrl = URL.createObjectURL(imageBlob);
    image.src = sourceUrl;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    if (watermark.enabled && watermark.text.trim()) {
      const baseFontSize = Math.max(18, Math.round(Math.min(canvas.width, canvas.height) * (watermark.size / 100)));
      let fontSize = baseFontSize;
      const fontWeight = 700;
      try {
        await document.fonts.load(`${fontWeight} ${fontSize}px "${watermark.font}"`);
      } catch {
        // Canvas falls back gracefully when a remote font is unavailable.
      }
      ctx.font = `${fontWeight} ${fontSize}px "${watermark.font}", sans-serif`;
      let textWidth = ctx.measureText(watermark.text.trim()).width;
      const maxWidth = canvas.width * 0.88;
      while (textWidth > maxWidth && fontSize > 12) {
        fontSize -= 2;
        ctx.font = `${fontWeight} ${fontSize}px "${watermark.font}", sans-serif`;
        textWidth = ctx.measureText(watermark.text.trim()).width;
      }

      const [x, y] = getWatermarkCoordinates(
        watermark.position,
        canvas.width,
        canvas.height,
        textWidth,
        fontSize,
      );
      ctx.save();
      ctx.globalAlpha = watermark.opacity / 100;
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      if (watermark.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,.72)';
        ctx.shadowBlur = Math.max(4, fontSize * 0.22);
        ctx.shadowOffsetX = Math.max(1, fontSize * 0.05);
        ctx.shadowOffsetY = Math.max(1, fontSize * 0.07);
      }
      if (watermark.stroke) {
        ctx.lineWidth = Math.max(2, fontSize * 0.075);
        ctx.strokeStyle = 'rgba(0,0,0,.72)';
        ctx.strokeText(watermark.text.trim(), x, y);
      }
      ctx.fillStyle = watermark.color;
      ctx.fillText(watermark.text.trim(), x, y);
      ctx.restore();
    }

    URL.revokeObjectURL(sourceUrl);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Konversi PNG gagal.')), 'image/png', 1);
    });
  };

  const downloadPNG = async () => {
    try {
      setStatusText('Menyiapkan PNG resolusi penuh…');
      const blob = await canvasBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeModel = (generatedMeta?.model || model).replace(/[^a-z0-9-]/gi, '');
      const fileSeed = generatedMeta?.seed ?? seed;
      anchor.href = url;
      anchor.download = `DERY-LAU-AI_${safeModel}_${fileSeed}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatusText('PNG resolusi penuh berhasil diunduh.');
      notify('PNG berhasil diunduh.');
    } catch (err) {
      setError(err.message || 'Gagal menyiapkan PNG.');
    }
  };

  const copyText = async (text, message = 'Teks disalin.') => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      setError('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const useHistoryItem = (item, regenerate = false) => {
    setPrompt(item.prompt || '');
    setModel(item.model || 'zimage');
    setRatio(item.ratio || '9:16');
    setSeed(item.seed ?? randomSeed());
    setStyle(item.style || 'none');
    setHistoryOpen(false);
    notify('Prompt history dimuat.');
    if (regenerate) {
      window.setTimeout(() => generateImage(item), 30);
    }
  };

  const clearHistory = () => {
    if (!window.confirm('Hapus seluruh history prompt?')) return;
    setHistory([]);
    localStorage.removeItem(STORAGE.history);
    notify('History dibersihkan.');
  };

  const previewWatermarkStyle = useMemo(() => {
    const map = {
      'top-left': { top: '4%', left: '4%' },
      'top-center': { top: '4%', left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: '4%', right: '4%' },
      'center-left': { top: '50%', left: '4%', transform: 'translateY(-50%)' },
      center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'center-right': { top: '50%', right: '4%', transform: 'translateY(-50%)' },
      'bottom-left': { bottom: '4%', left: '4%' },
      'bottom-center': { bottom: '4%', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '4%', right: '4%' },
    };
    return {
      ...map[watermark.position],
      fontFamily: `"${watermark.font}", sans-serif`,
      color: watermark.color,
      opacity: watermark.opacity / 100,
      fontSize: `clamp(12px, ${watermark.size * 0.22}vw + 8px, 34px)`,
      textShadow: watermark.shadow ? '0 3px 12px rgba(0,0,0,.9)' : 'none',
      WebkitTextStroke: watermark.stroke ? '1px rgba(0,0,0,.68)' : '0',
    };
  }, [watermark]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar soft-panel">
        <div className="brand-wrap">
          <div className="brand-mark"><Icon name="sparkles" size={25} /></div>
          <div>
            <p className="eyebrow">NEUMORPHIC IMAGE LAB</p>
            <h1>DERY LAU <span>AI</span></h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="soft-button compact" onClick={() => setHistoryOpen(true)}>
            <Icon name="history" />
            <span>History</span>
            {history.length > 0 && <b className="count-badge">{history.length}</b>}
          </button>
          <a className="soft-button compact" href="https://enter.pollinations.ai" target="_blank" rel="noreferrer">
            <Icon name="external" />
            <span>API Key</span>
          </a>
        </div>
      </header>

      <main className="workspace">
        <section className="controls-column">
          <article className="soft-panel control-card api-card">
            <div className="section-heading">
              <span className="section-icon"><Icon name="key" /></span>
              <div>
                <h2>Server Environment</h2>
                <p>Secret key bekerja di backend dan tidak dikirim ke browser.</p>
              </div>
            </div>
            <div className="server-env-row inset-field">
              <span className={`server-env-icon ${serverStatus.configured && serverStatus.valid ? 'ready' : ''}`}>
                <Icon name={serverStatus.configured ? 'shield' : 'alert'} />
              </span>
              <div>
                <b>{serverStatus.configured ? 'POLLINATIONS_API_KEY terpasang' : 'Environment belum tersedia'}</b>
                <small>{serverStatus.message}</small>
              </div>
              <code>{serverStatus.configured ? `${serverStatus.type || 'secret'} key` : 'server only'}</code>
            </div>
            <div className="status-line">
              <span className={`status-dot ${serverStatus.configured && serverStatus.valid ? 'online' : ''}`} />
              <span>
                {modelStatus}
                {serverStatus.balance !== null && serverStatus.balance !== undefined
                  ? ` · Balance ${Number(serverStatus.balance).toLocaleString('id-ID', { maximumFractionDigits: 4 })} Pollen`
                  : ''}
              </span>
              <button className="text-button" onClick={() => { loadServerStatus(); loadModels(); }}>
                <Icon name="refresh" size={15} /> Segarkan
              </button>
            </div>
          </article>

          <article className="soft-panel control-card">
            <div className="section-heading">
              <span className="section-icon"><Icon name="wand" /></span>
              <div>
                <h2>Prompt Studio</h2>
                <p>Mulai dari ide kasar, lalu poles hingga mengilap.</p>
              </div>
            </div>

            <label className="field-label" htmlFor="prompt">Deskripsi gambar</label>
            <div className="textarea-wrap inset-field">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Contoh: Mang Jajang duduk di singgasana kerajaan kopi, kocak tetapi megah…"
                maxLength={6000}
              />
              <span className="char-count">{prompt.length}/6000</span>
            </div>
            <div className="inline-actions">
              <button className="soft-button accent small" onClick={handleEnhance} disabled={enhancing || generating}>
                <Icon name="sparkles" />
                {enhancing ? 'Enhancing…' : 'Enhance Prompt'}
              </button>
              <button className="soft-button small" onClick={() => copyText(finalPrompt, 'Final prompt disalin.')} disabled={!finalPrompt}>
                <Icon name="copy" /> Copy Final
              </button>
            </div>

            <details className="advanced-block">
              <summary>Negative prompt & keamanan</summary>
              <label className="field-label" htmlFor="negative">Hindari elemen</label>
              <div className="inset-field">
                <textarea
                  id="negative"
                  className="small-textarea"
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="blurry, low quality, duplicated limbs…"
                />
              </div>
              <small>Negative prompt dikirim sebagai parameter khusus untuk Flux dan Z-Image, bukan dicampur ke prompt utama.</small>
              <label className="toggle-row">
                <span><Icon name="shield" /> Safe mode API</span>
                <input type="checkbox" checked={safeMode} onChange={(event) => setSafeMode(event.target.checked)} />
                <i />
              </label>
            </details>
          </article>

          <article className="soft-panel control-card">
            <div className="section-heading">
              <span className="section-icon"><Icon name="layers" /></span>
              <div>
                <h2>Creative Controls</h2>
                <p>Model, gaya, cahaya, warna, dan sudut kamera.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="field-group">
                <span>Kepatuhan Prompt</span>
                <select value={promptFidelity} onChange={(event) => setPromptFidelity(event.target.value)}>
                  {PROMPT_FIDELITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Rewrite Prompt oleh API</span>
                <select value={apiEnhance ? 'on' : 'off'} onChange={(event) => setApiEnhance(event.target.value === 'on')}>
                  <option value="off">Mati · direkomendasikan</option>
                  <option value="on">Aktif · boleh menafsir ulang</option>
                </select>
              </label>

              <div className="model-note full">
                <div>
                  <b>Scene-first prompt aktif</b>
                  <span>Subjek, aksi, dan lokasi dikirim paling depan</span>
                </div>
                <p>Mode Strict sekarang memakai penguat positif tanpa menyebut konsep yang tidak diinginkan di prompt utama.</p>
              </div>

              <label className="field-group full">
                <span>Model AI</span>
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  {models.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.title || item.name} · {item.brand || 'AI'}{item.paid_only ? ' · Paid' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="model-note full">
                <div>
                  <b>{activeModel?.title || activeModel?.name}</b>
                  <span>{activeModel?.brand || 'Pollinations'}</span>
                </div>
                {activeModel?.paid_only && <em>PAID</em>}
                <p>{activeModel?.description || 'Model gambar Pollinations.'}</p>
              </div>

              <label className="field-group">
                <span>Style</span>
                <select value={style} onChange={(event) => setStyle(event.target.value)}>
                  {STYLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Pencahayaan</span>
                <select value={lighting} onChange={(event) => setLighting(event.target.value)}>
                  {LIGHTING.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Color Palette</span>
                <select value={palette} onChange={(event) => setPalette(event.target.value)}>
                  {PALETTES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Komposisi</span>
                <select value={composition} onChange={(event) => setComposition(event.target.value)}>
                  {COMPOSITIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Aspek Rasio</span>
                <select value={ratio} onChange={(event) => setRatio(event.target.value)}>
                  {ASPECT_RATIOS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>

              <label className="field-group">
                <span>Resolusi Proses</span>
                <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
                  {Object.entries(RESOLUTION_PRESETS).map(([value, item]) => (
                    <option key={value} value={value}>{item.label}</option>
                  ))}
                </select>
                <small>Gunakan Cepat untuk Flux/Z-Image. Pilih HD setelah koneksi stabil.</small>
              </label>

              <label className="field-group">
                <span>Quality</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)} disabled={!supportsQuality}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="hd">HD</option>
                </select>
                {!supportsQuality && <small>Quality API khusus GPT Image; resolusi tetap maksimal.</small>}
              </label>

              <label className="field-group full">
                <span>Seed Number</span>
                <div className="seed-row">
                  <input
                    type="number"
                    min="-1"
                    max="2147483647"
                    value={seed}
                    onChange={(event) => setSeed(Number(event.target.value))}
                  />
                  <button className="soft-button small" onClick={() => setSeed(randomSeed())} type="button">
                    <Icon name="dice" /> Random
                  </button>
                </div>
                <small>Gunakan seed yang sama untuk mencoba hasil yang lebih konsisten pada model pendukung.</small>
              </label>
            </div>
          </article>

          <article className="soft-panel control-card">
            <div className="section-heading">
              <span className="section-icon"><Icon name="type" /></span>
              <div>
                <h2>Watermark Lab</h2>
                <p>Watermark diterapkan ke PNG saat diunduh.</p>
              </div>
            </div>

            <label className="toggle-row main-toggle">
              <span>Aktifkan watermark</span>
              <input
                type="checkbox"
                checked={watermark.enabled}
                onChange={(event) => setWatermark((item) => ({ ...item, enabled: event.target.checked }))}
              />
              <i />
            </label>

            <div className={`watermark-settings ${watermark.enabled ? '' : 'disabled-section'}`}>
              <label className="field-group full">
                <span>Teks</span>
                <input
                  value={watermark.text}
                  onChange={(event) => setWatermark((item) => ({ ...item, text: event.target.value }))}
                  maxLength={80}
                />
              </label>

              <div className="form-grid">
                <label className="field-group">
                  <span>Font</span>
                  <select value={watermark.font} onChange={(event) => setWatermark((item) => ({ ...item, font: event.target.value }))}>
                    {FONT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="field-group color-group">
                  <span>Warna</span>
                  <div className="color-input-wrap">
                    <input type="color" value={watermark.color} onChange={(event) => setWatermark((item) => ({ ...item, color: event.target.value }))} />
                    <code>{watermark.color.toUpperCase()}</code>
                  </div>
                </label>
              </div>

              <label className="range-group">
                <span>Ukuran <b>{watermark.size.toFixed(1)}%</b></span>
                <input type="range" min="1.5" max="12" step="0.1" value={watermark.size} onChange={(event) => setWatermark((item) => ({ ...item, size: Number(event.target.value) }))} />
              </label>
              <label className="range-group">
                <span>Opacity <b>{watermark.opacity}%</b></span>
                <input type="range" min="10" max="100" value={watermark.opacity} onChange={(event) => setWatermark((item) => ({ ...item, opacity: Number(event.target.value) }))} />
              </label>

              <div className="position-wrap">
                <span className="field-label">Tata letak</span>
                <div className="position-grid">
                  {POSITION_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      className={watermark.position === value ? 'active' : ''}
                      onClick={() => setWatermark((item) => ({ ...item, position: value }))}
                      aria-label={value}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div className="check-pills">
                <label><input type="checkbox" checked={watermark.shadow} onChange={(event) => setWatermark((item) => ({ ...item, shadow: event.target.checked }))} /> Shadow</label>
                <label><input type="checkbox" checked={watermark.stroke} onChange={(event) => setWatermark((item) => ({ ...item, stroke: event.target.checked }))} /> Outline</label>
              </div>
            </div>
          </article>

          <button className="generate-button" onClick={() => generateImage()} disabled={generating || enhancing}>
            <span className="generate-icon"><Icon name="sparkles" size={22} /></span>
            <span>
              <b>{generating ? `GENERATING · ${elapsedSeconds}s` : 'GENERATE IMAGE'}</b>
              <small>{activeDimensions.width} × {activeDimensions.height} · PNG Ready</small>
            </span>
          </button>
          {generating && (
            <button className="soft-button cancel-generation" type="button" onClick={cancelGeneration}>
              <Icon name="x" /> Batalkan Generasi
            </button>
          )}
        </section>

        <section className="result-column">
          <article className="soft-panel result-card">
            <div className="result-header">
              <div>
                <p className="eyebrow">CREATION CANVAS</p>
                <h2>Hasil Gambar</h2>
              </div>
              <div className="result-actions">
                <button className="soft-button compact" onClick={() => generateImage()} disabled={!prompt || generating}>
                  <Icon name="refresh" /> Regenerate
                </button>
                <button className="soft-button compact accent" onClick={downloadPNG} disabled={!imageBlob || generating}>
                  <Icon name="download" /> Download PNG
                </button>
              </div>
            </div>

            <div className="canvas-stage inset-field">
              {imageUrl ? (
                <div className="image-frame" style={{ aspectRatio: `${generatedMeta?.width || activeDimensions.width} / ${generatedMeta?.height || activeDimensions.height}` }}>
                  <img src={imageUrl} alt={generatedMeta?.prompt || 'Generated artwork'} />
                  {watermark.enabled && watermark.text.trim() && (
                    <span className="watermark-preview" style={previewWatermarkStyle}>{watermark.text}</span>
                  )}
                </div>
              ) : (
                <div className={`empty-canvas ${generating ? 'is-loading' : ''}`} style={{ aspectRatio: `${activeDimensions.width} / ${activeDimensions.height}` }}>
                  <div className="orbital-loader">
                    <i /><i /><i />
                    <span><Icon name="image" size={34} /></span>
                  </div>
                  <h3>{generating ? 'Sedang menyusun dunia baru…' : 'Kanvas menunggu imajinasi'}</h3>
                  <p>{generating ? `${statusText} · ${elapsedSeconds} detik` : 'Tulis prompt, pilih model, lalu tekan Generate Image.'}</p>
                  {generating && elapsedSeconds >= 45 && (
                    <small className="slow-generation-note">Model sedang padat. Boleh tunggu atau batalkan lalu gunakan Z-Image + mode Cepat.</small>
                  )}
                </div>
              )}
            </div>

            <div className={`generation-status ${error ? 'has-error' : ''}`}>
              <Icon name={error ? 'alert' : imageUrl ? 'check' : 'info'} />
              <span>{error || statusText}</span>
              {error && <button onClick={() => setError('')}><Icon name="x" size={15} /></button>}
            </div>

            {generatedMeta && (
              <div className="metadata-grid">
                <div><span>Model</span><b>{generatedMeta.model}</b></div>
                <div><span>Ratio</span><b>{generatedMeta.ratio}</b></div>
                <div><span>Seed</span><b>{generatedMeta.seed}</b></div>
                <div><span>Resolusi</span><b>{generatedMeta.width} × {generatedMeta.height}</b></div>
              </div>
            )}

            <details className="prompt-preview" open={Boolean(imageUrl)}>
              <summary>Final prompt yang dikirim</summary>
              <p>{generatedMeta?.finalPrompt || finalPrompt || 'Belum ada prompt.'}</p>
              <button className="text-button" onClick={() => copyText(generatedMeta?.finalPrompt || finalPrompt, 'Final prompt disalin.')}>
                <Icon name="copy" size={15} /> Salin prompt
              </button>
            </details>
          </article>

          <article className="soft-panel tips-card">
            <div className="tip-icon"><Icon name="shield" /></div>
            <div>
              <b>Secret key terlindungi server</b>
              <p>Aplikasi memakai route <code>/api</code>. Nilai <code>POLLINATIONS_API_KEY</code> tidak dibundel ke JavaScript browser.</p>
            </div>
          </article>
        </section>
      </main>

      <footer className="footer soft-panel">
        <p>Copyright @2026 <b>DERY LAU AI</b> Powered by. Pollinations API,</p>
        <p>Developed by. Dery Lau, Thanks to Github &amp; Vercel &amp; ChatGPT.</p>
      </footer>

      {historyOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setHistoryOpen(false)}>
          <aside className="history-drawer soft-panel">
            <div className="drawer-header">
              <div>
                <p className="eyebrow">LOCAL PROMPT VAULT</p>
                <h2>History Prompt</h2>
              </div>
              <button className="icon-button" onClick={() => setHistoryOpen(false)}><Icon name="x" /></button>
            </div>

            <div className="drawer-toolbar">
              <span>{history.length} item tersimpan di browser</span>
              <button className="text-button danger" onClick={clearHistory} disabled={!history.length}><Icon name="trash" size={15} /> Clear History</button>
            </div>

            <div className="history-list">
              {history.length ? history.map((item) => (
                <article className="history-item" key={item.id}>
                  <div className="history-thumb">
                    {item.previewUrl ? <img src={item.previewUrl} alt="" /> : <Icon name="image" />}
                  </div>
                  <div className="history-content">
                    <div className="history-meta"><b>{item.model}</b><span>{item.ratio} · Seed {item.seed}</span></div>
                    <p>{item.prompt}</p>
                    <small>{formatDate(item.timestamp)}</small>
                    <div className="history-actions">
                      <button onClick={() => useHistoryItem(item)}><Icon name="wand" size={14} /> Gunakan</button>
                      <button onClick={() => copyText(item.finalPrompt, 'Prompt history disalin.')}><Icon name="copy" size={14} /> Copy</button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="empty-history">
                  <Icon name="history" size={38} />
                  <h3>Belum ada jejak piksel</h3>
                  <p>Setiap prompt yang berhasil digenerate akan muncul di sini.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

export default App;
