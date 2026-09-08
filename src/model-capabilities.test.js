import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supportsImageQuality } from './model-capabilities.js';

for (const model of ['gptimage', 'gptimage-large', 'gpt-image-2', 'openai/gpt-image-1-mini', 'openai/gpt-image-1.5', 'openai/gpt-image-2']) {
  test(`quality remains available for ${model}`, () => {
    assert.equal(supportsImageQuality(model), true);
  });
}

for (const model of ['flux', 'tongyi-mai/z-image-turbo', 'black-forest-labs/flux.2-klein-4b']) {
  test(`quality stays unavailable for ${model}`, () => {
    assert.equal(supportsImageQuality(model), false);
  });
}
