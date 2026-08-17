"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import { ArrowUpRight, Download, ExternalLink, Home, MapPinned, MessageCircle, Plus, Search, Sparkles, WandSparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PromptInput, type PromptInputMessage, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import type { Listing, ListingNeighborhood, ListingSource, ListingStatus, NewListing } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";

const NeighborhoodMap = dynamic(() => import("./neighborhood-map").then((m) => m.NeighborhoodMap), { ssr: false });

type Source = ListingSource;
type Status = ListingStatus;
type Neighborhood = ListingNeighborhood;
type Draft = NewListing;

const EMPTY_DRAFT: Draft = { address: "", price: "", beds: "", baths: "", backyard: "", source: "Zillow", neighborhood: "Forest Park", url: "", imageUrl: "", notes: "", lat: 41.885, lng: -87.81 };
const STATUSES: Status[] = ["New", "Maybe", "Tour", "Pass"];
const SOURCES: Source[] = ["Zillow", "Redfin", "Realtor.com", "Homes.com", "Trulia", "Other"];

export function AgentChat({ user }: { readonly user: { name: string; email: string } }) {
  const agent = useEveAgent();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [area, setArea] = useState<Neighborhood | "All areas">("All areas");
  const [sourceFilter, setSourceFilter] = useState<Source | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [search, setSearch] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/listings")
      .then((response) => (response.ok ? response.json() : { listings: [] }))
      .then((data: { listings: Listing[] }) => { if (!cancelled) { setListings(data.listings); setIsLoaded(true); } })
      .catch(() => { if (!cancelled) setIsLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const visibleListings = listings.filter((listing) => {
    const query = search.trim().toLowerCase();
    return (!query || `${listing.address} ${listing.notes}`.toLowerCase().includes(query)) && (area === "All areas" || listing.neighborhood === area) && (sourceFilter === "All" || listing.source === sourceFilter) && (statusFilter === "All" || listing.status === statusFilter);
  });

  const kpis = useMemo(() => {
    const prices = listings
      .map((l) => Number(l.price.replace(/[^0-9.]/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    const median = prices.length
      ? prices.length % 2
        ? prices[(prices.length - 1) / 2]
        : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : null;
    const byStatus: Record<Status, number> = { New: 0, Maybe: 0, Tour: 0, Pass: 0 };
    for (const status of STATUSES) byStatus[status] = listings.filter((l) => l.status === status).length;
    return { median, byStatus, tourReady: byStatus.Tour };
  }, [listings]);

  const medianLabel = kpis.median ? `$${Math.round(kpis.median).toLocaleString("en-US")}` : "\u2014";

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isBusy) return;
    if (message.files.length === 0) { await agent.send(text); return; }
    const parts: UserContent = text ? [{ text, type: "text" }] : [];
    for (const file of message.files) parts.push({ data: file.url, filename: file.filename, mediaType: file.mediaType, type: "file" });
    await agent.send(parts);
  };

  const previewListing = async (url: string) => {
    if (!url.trim()) return "";
    setIsPreviewing(true);
    try {
      const response = await fetch("/api/property-preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const result = (await response.json()) as { imageUrl?: string };
      return result.imageUrl ?? "";
    } finally { setIsPreviewing(false); }
  };

  const handleUrlSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!listingUrl.trim()) return;
    const imageUrl = await previewListing(listingUrl);
    setDraft((current) => ({ ...current, url: listingUrl.trim(), imageUrl }));
    setIsAdding(true);
    setListingUrl("");
  };

  const addListing = async () => {
    if (!draft.address.trim()) return;
    const response = await fetch("/api/listings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, address: draft.address.trim() }) });
    if (!response.ok) return;
    const { listing } = (await response.json()) as { listing: Listing };
    setListings((current) => [...current, listing]);
    setDraft(EMPTY_DRAFT); setIsAdding(false);
  };

  const downloadCsv = () => {
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = listings.map((listing) => [listing.address, listing.price, listing.beds, listing.baths, listing.backyard].map(cell).join(","));
    const blob = new Blob([["Address,Price,Beds,Baths,Backyard size", ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "hearth-house-tracker.csv"; link.click(); URL.revokeObjectURL(url);
  };

  const signOut = async () => { await fetch("/api/logout", { method: "POST" }); router.replace("/login"); router.refresh(); };
  const cycleStatus = (id: string) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing) return;
    const status = STATUSES[(STATUSES.indexOf(listing.status) + 1) % STATUSES.length];
    setListings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    void fetch(`/api/listings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
  };

  if (!isLoaded) return <main className="account-gate account-loading"><span className="brand-mark"><Home size={18} /></span><p>Opening your Hearth…</p></main>;

  return (
    <main className="property-app">
      <header className="topbar"><div className="brand"><span className="brand-mark"><Home size={17} strokeWidth={2.5} /></span><span>Hearth</span><span className="version-pill">v0.2</span><span className="brand-note">house tracker</span></div><div className="top-actions"><button className="ask-button" onClick={() => setIsAsking((open) => !open)}><Sparkles size={14} /> Ask Hearth</button><span className="sync-status"><span className="status-dot" /> Agent online</span><button className="avatar" title={`Sign out (${user.email})`} onClick={() => void signOut()}>{user.name.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="tracker-page"><div className="tracker-topline"><div><div className="eyebrow"><Home size={13} /> HOUSE TRACKER</div><h1>Everything worth a look.</h1><p>{listings.length} homes across your search · {area === "All areas" ? "Forest Park + Oak Park" : area}</p></div><div className="tracker-actions"><button className="secondary-button" onClick={downloadCsv}><Download size={15} /> Export CSV</button><button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={15} /> Add home</button></div></div>
        <form className="listing-search" onSubmit={handleUrlSubmit}><div className="listing-search-icon"><Search size={18} /></div><input aria-label="Add a listing URL" value={listingUrl} onChange={(event) => setListingUrl(event.target.value)} placeholder="Paste a Zillow, Redfin, Realtor.com, Homes.com, or Trulia link…" /><button type="submit">{isPreviewing ? "Finding preview…" : "Add listing"} <ArrowUpRight size={15} /></button></form>
        <div className="neighborhood-bar"><div className="neighborhood-label"><MapPinned size={15} /><span>SEARCH AREAS</span></div>{(["All areas", "Forest Park", "Oak Park"] as const).map((item) => <button className={area === item ? "active" : ""} key={item} onClick={() => setArea(item)}>{item}{item === "All areas" ? <span>{listings.length}</span> : <span>{listings.filter((listing) => listing.neighborhood === item).length}</span>}</button>)}<button className="neighborhood-add"><Plus size={14} /> Add neighborhood</button></div>
        <div className="tracker-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Search saved homes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your saved homes" /></label><div className="source-tabs"><button className={sourceFilter === "All" ? "selected" : ""} onClick={() => setSourceFilter("All")}>All <span>{listings.length}</span></button>{SOURCES.slice(0, 3).map((source) => <button className={sourceFilter === source ? "selected" : ""} key={source} onClick={() => setSourceFilter(source)}>{source} <span>{listings.filter((listing) => listing.source === source).length}</span></button>)}</div></div>
        <div className="kpi-strip">
          <div className="kpi-tile">
            <span className="kpi-label">Tracked</span>
            <span className="kpi-value">{listings.length}</span>
            <span className="kpi-sub">homes saved</span>
          </div>
          <div className="kpi-tile">
            <span className="kpi-label">Median price</span>
            <span className="kpi-value">{medianLabel}</span>
            <span className="kpi-sub">across saved homes</span>
          </div>
          <div className="kpi-tile kpi-tile-wide">
            <span className="kpi-label">Status mix</span>
            <div className="kpi-mix">
              <div className="kpi-mix-bar">
                {listings.length === 0 ? (
                  <span className="kpi-mix-empty">No homes yet</span>
                ) : STATUSES.map((s) => (kpis.byStatus[s] > 0 ? (
                  <span key={s} className={`mix-${s.toLowerCase()}`} style={{ flexGrow: kpis.byStatus[s] }} />
                ) : null))}
              </div>
              <div className="kpi-mix-legend">
                {STATUSES.map((s) => (
                  <span key={s}><i className={`mix-${s.toLowerCase()}`} /> {s} <b>{kpis.byStatus[s]}</b></span>
                ))}
              </div>
            </div>
          </div>
          <div className="kpi-tile">
            <span className="kpi-label">Tour-ready</span>
            <span className="kpi-value">{kpis.tourReady}</span>
            <span className="kpi-sub">ready to see</span>
          </div>
        </div>
        <div className="map-container map-breakout"><NeighborhoodMap listings={visibleListings.map((l) => ({ id: l.id, address: l.address, lat: l.lat, lng: l.lng, price: l.price, status: l.status }))} /></div>
        {isAdding ? <AddListingForm draft={draft} setDraft={setDraft} isPreviewing={isPreviewing} onClose={() => setIsAdding(false)} onSave={addListing} onPreview={async () => { const imageUrl = await previewListing(draft.url); setDraft((current) => ({ ...current, imageUrl })); }} /> : null}
        <div className="status-row"><span>SHOWING {visibleListings.length} OF {listings.length}</span><div className="status-filters"><button className={statusFilter === "All" ? "active" : ""} onClick={() => setStatusFilter("All")}>All</button>{STATUSES.map((status) => <button className={statusFilter === status ? "active" : ""} key={status} onClick={() => setStatusFilter(status)}>{status}</button>)}</div></div>
        <div className="tracker-list">{visibleListings.map((listing, index) => <article className="tracker-card" key={listing.id}><div className={cn("tracker-swatch", `image-${listing.tone}`)}>{listing.imageUrl ? <img src={listing.imageUrl} alt="" loading="lazy" /> : null}<span>0{index + 1}</span></div><div className="tracker-card-main"><div className="tracker-card-top"><div><h3>{listing.address}</h3><p>{listing.neighborhood} · {listing.source}</p></div><button className={cn("status-badge", `status-${listing.status.toLowerCase()}`)} onClick={() => cycleStatus(listing.id)}>{listing.status}</button></div><div className="tracker-facts"><strong>{listing.price || "Price unknown"}</strong><span>{listing.beds || "—"} beds</span><span>{listing.baths || "—"} baths</span><span>{listing.backyard || "—"} yard</span></div>{listing.notes ? <p className="tracker-notes">{listing.notes}</p> : null}<div className="tracker-card-footer">{listing.url ? <a href={listing.url} target="_blank" rel="noreferrer">Open listing <ExternalLink size={13} /></a> : <span className="muted-label">No listing link yet</span>}<span className="card-hint">Click status to move it along</span></div></div></article>)}</div>{visibleListings.length === 0 ? <div className="empty-tracker"><Home size={20} /><h3>Nothing here yet.</h3><p>Try another area or add a home from the search bar.</p></div> : null}<button className="add-listing" onClick={() => setIsAdding(true)}><Plus size={16} /> Add another home</button></div>
      {isAsking ? <aside className="assistant-drawer"><div className="drawer-heading"><div><span className="eyebrow"><Sparkles size={13} /> HEARTH AGENT</span><h2>Think it through.</h2></div><button className="close-button" onClick={() => setIsAsking(false)} aria-label="Close Hearth agent"><X size={16} /></button></div><div className="drawer-messages">{agent.data.messages.length === 0 ? <div className="starter-note"><span className="agent-avatar"><WandSparkles size={15} /></span><div><strong>Ask me anything.</strong><p>Compare homes, think through tradeoffs, or plan a tour.</p></div></div> : agent.data.messages.map((message, index) => <AgentMessage canRespond={!isBusy} isStreaming={agent.status === "streaming" && index === agent.data.messages.length - 1} key={message.id} message={message} onInputResponses={agent.respond} />)}</div><PromptInput onSubmit={handleSubmit}><PromptInputTextarea placeholder="Ask about your search…" /><PromptInputSubmit onStop={() => void agent.cancel()} status={agent.status} /></PromptInput><div className="privacy-note"><MessageCircle size={12} /> Your workspace, your shortlist</div></aside> : null}
    </main>
  );
}

function AddListingForm({ draft, setDraft, isPreviewing, onClose, onSave, onPreview }: { draft: Draft; setDraft: (draft: Draft) => void; isPreviewing: boolean; onClose: () => void; onSave: () => void; onPreview: () => Promise<void> }) {
  return <div className="add-form"><div className="add-form-heading"><div><span className="eyebrow">NEW HOME</span><h3>Add something worth remembering</h3></div><button className="close-button" aria-label="Close add form" onClick={onClose}><X size={16} /></button></div><div className="form-grid"><label>Address<input autoFocus value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="123 Main Street" /></label><label>Neighborhood<select value={draft.neighborhood} onChange={(event) => setDraft({ ...draft, neighborhood: event.target.value as Neighborhood })}><option>Forest Park</option><option>Oak Park</option></select></label><label>Source<select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value as Source })}>{SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label><label>Price<input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="$650,000" /></label><label>Beds<input value={draft.beds} onChange={(event) => setDraft({ ...draft, beds: event.target.value })} placeholder="3" /></label><label>Baths<input value={draft.baths} onChange={(event) => setDraft({ ...draft, baths: event.target.value })} placeholder="2" /></label><label>Backyard size<input value={draft.backyard} onChange={(event) => setDraft({ ...draft, backyard: event.target.value })} placeholder="0.2 ac" /></label><label className="wide-field">Listing URL<input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} onBlur={() => void onPreview()} placeholder="https://…" /></label><label className="wide-field">Thumbnail URL<input value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder={isPreviewing ? "Finding a preview…" : "Auto-filled when the source provides one"} /></label><label className="wide-field">Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What caught your eye?" /></label></div><div className="form-footer"><span>Listing photos are optional; the swatch stays as fallback.</span><button className="primary-button" onClick={onSave}>Save home</button></div></div>;
}

