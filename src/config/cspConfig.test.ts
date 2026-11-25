import { describe, expect, it } from 'vitest';
import rawConfig from '../../staticwebapp.config.json?raw';

describe('staticwebapp.config.json CSP', () => {
  it('allows direct browser uploads to Azure Blob Storage via connect-src', () => {
    const config = JSON.parse(rawConfig) as { globalHeaders: Record<string, string> };
    const csp = config.globalHeaders['Content-Security-Policy'];
    const connectSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src'));
    expect(connectSrc).toContain('blob.core.windows.net');
  });
});
