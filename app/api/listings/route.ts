import { createListing, listListings, type NewListing } from "@/lib/listings";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const listings = await listListings(user.id);
  return Response.json({ listings });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Partial<Record<keyof NewListing, unknown>> | null;
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!address) return Response.json({ error: "Address is required." }, { status: 400 });
  const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value.trim() : fallback);
  const num = (value: unknown, fallback: number): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
  const draft: NewListing = {
    address,
    price: str(body?.price),
    beds: str(body?.beds),
    baths: str(body?.baths),
    backyard: str(body?.backyard),
    source: str(body?.source, "Other") as NewListing["source"],
    neighborhood: str(body?.neighborhood, "Forest Park") as NewListing["neighborhood"],
    url: str(body?.url),
    imageUrl: str(body?.imageUrl),
    notes: str(body?.notes),
    lat: num(body?.lat, 41.885),
    lng: num(body?.lng, -87.81),
  };
  const listing = await createListing(user.id, draft);
  return Response.json({ listing }, { status: 201 });
}
