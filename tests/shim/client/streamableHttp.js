import { UnauthorizedError } from './auth.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const S = require('../../mocks/state.cjs');
// OAuth like the real SDK: dynamic client registration, PKCE verifier, redirect, code exchange
export class StreamableHTTPClientTransport {
  constructor(url, { authProvider } = {}) { this.url = url; this.p = authProvider; }
  async _ensureAuth() {
    if (this.p.tokens()) return;
    if (!this.p.clientInformation()) await this.p.saveClientInformation({ client_id: 'fake-client' });
    await this.p.saveCodeVerifier('verifier-' + Math.random().toString(36).slice(2));
    const st = typeof this.p.state === 'function' ? await this.p.state() : '';
    await this.p.redirectToAuthorization(new URL(`https://fake-canva.test/authorize?client_id=fake-client&state=${st}`));
    throw new UnauthorizedError();
  }
  async finishAuth(code) {
    S.log('canva', { op: 'finishAuth', code });
    const v = this.p.codeVerifier();                       // PKCE: throws if no verifier
    if (code !== 'good-code') throw new Error('invalid_grant (fake Canva): code rejected');
    await this.p.saveTokens({ access_token: 'fake-at', refresh_token: 'fake-rt', verifier_used: v });
  }
}
