// DUBLURĂ de test pentru @modelcontextprotocol/sdk (Canva simulat); folosită doar de npm test.
export class UnauthorizedError extends Error { constructor(m = 'Unauthorized') { super(m); this.name = 'UnauthorizedError'; } }
