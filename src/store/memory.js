// In-memory storage: data is lost on restart. Phase 3 replaces this with
// PostgreSQL behind the same async interface, so the routes never change.
export function createMemoryStore() {
  const links = new Map();

  return {
    async create(code, url) {
      const link = { code, url, clicks: 0, createdAt: new Date().toISOString() };
      links.set(code, link);
      return link;
    },
    async get(code) {
      return links.get(code) ?? null;
    },
    async incrementClicks(code) {
      const link = links.get(code);
      if (link) link.clicks += 1;
    },
    async ping() {
      return true; // A database store will check its connection here
    },
  };
}
