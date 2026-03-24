import { describe, expect, it } from 'vitest';
import { scoreSession as directScoreSession } from '../engine.js';
import { scoreSession as publicScoreSession } from '../index.js';

describe('public package entrypoint', () => {
  it('re-exports scoreSession from the stable index contract', () => {
    expect(publicScoreSession).toBe(directScoreSession);
  });
});
