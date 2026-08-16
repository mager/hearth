export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return Response.json({ error: "A public listing URL is required." }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 Hearth listing preview" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return Response.json({ imageUrl: null });

    const html = await response.text();
    const imageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return Response.json({ imageUrl: imageMatch?.[1] ?? null });
  } catch {
    return Response.json({ imageUrl: null });
  }
}
