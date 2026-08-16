import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "http://localhost:3131/mcp",
  description:
    "gbrain: Mager's personal knowledge brain. Get, put, and search pages; query hybrid semantic search; read memory/index and memory/YYYY-MM-DD* entries; store new memories.",
  auth: {
    getToken: async () => {
      const res = await fetch("http://localhost:3131/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.GBRAIN_CLIENT_ID!,
          client_secret: process.env.GBRAIN_CLIENT_SECRET!,
          scope: "read write",
        }),
      });
      if (!res.ok) {
        throw new Error(`gbrain token request failed: ${res.status}`);
      }
      const data = (await res.json()) as { access_token: string; expires_in: number };
      return {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };
    },
  },
});
