import { getSql } from "./db";

export type ListingSource = "Zillow" | "Redfin" | "Realtor.com" | "Homes.com" | "Trulia" | "Other";
export type ListingStatus = "New" | "Maybe" | "Tour" | "Pass";
export type ListingNeighborhood = "Forest Park" | "Oak Park";

export type Listing = {
  id: string;
  address: string;
  price: string;
  beds: string;
  baths: string;
  backyard: string;
  source: ListingSource;
  status: ListingStatus;
  neighborhood: ListingNeighborhood;
  url: string;
  imageUrl: string;
  notes: string;
  tone: string;
  lat: number;
  lng: number;
};

export type NewListing = Omit<Listing, "id" | "status" | "tone">;

export async function listListings(userId: number): Promise<Listing[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text AS id, address, price, beds, baths, backyard, source, status, neighborhood, url, image_url AS "imageUrl", notes, tone, lat, lng
    FROM listings
    WHERE user_id = ${userId}
    ORDER BY created_at ASC`) as Listing[];
  return rows;
}

export async function createListing(userId: number, draft: NewListing): Promise<Listing> {
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO listings (user_id, address, price, beds, baths, backyard, source, neighborhood, url, image_url, notes, lat, lng)
    VALUES (${userId}, ${draft.address}, ${draft.price}, ${draft.beds}, ${draft.baths}, ${draft.backyard}, ${draft.source}, ${draft.neighborhood}, ${draft.url}, ${draft.imageUrl}, ${draft.notes}, ${draft.lat}, ${draft.lng})
    RETURNING id::text AS id, address, price, beds, baths, backyard, source, status, neighborhood, url, image_url AS "imageUrl", notes, tone, lat, lng`) as Listing[];
  return rows[0];
}

export async function updateListingStatus(userId: number, id: string, status: ListingStatus): Promise<void> {
  const sql = getSql();
  await sql`UPDATE listings SET status = ${status} WHERE id = ${id} AND user_id = ${userId}`;
}
