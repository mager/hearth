import { updateListingStatus, type ListingStatus } from "@/lib/listings";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const STATUSES: readonly ListingStatus[] = ["New", "Maybe", "Tour", "Pass"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (typeof body?.status !== "string" || !STATUSES.includes(body.status as ListingStatus)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }
  await updateListingStatus(user.id, id, body.status as ListingStatus);
  return Response.json({ ok: true });
}
