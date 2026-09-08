export function supportsImageQuality(model) {
  return ['gptimage', 'gptimage-large', 'gpt-image-2'].includes(model) || model.startsWith('openai/gpt-image-');
}
