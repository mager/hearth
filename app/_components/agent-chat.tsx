"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import { ArrowUpRight, Download, ExternalLink, FileSpreadsheet, Home, MapPinned, MessageCircle, Plus, Search, Sparkles, Store, TrainFront, WandSparkles, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PromptInput, type PromptInputMessage, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";

type Source = "Zillow" | "Redfin" | "Other";
type Status = "New" | "Maybe" | "Tour" | "Pass";
type Listing = { address: string; price: string; beds: string; baths: string; backyard: string; source: Source; status: Status; url: string; notes: string; tone: string };
type Draft = Pick<Listing, "address" | "price" | "beds" | "baths" | "backyard" | "source" | "url" | "notes">;

const INITIAL_LISTINGS: Listing[] = [
  { address: "7421 Madison St", price: "$589,000", beds: "3", baths: "2", backyard: "—", source: "Zillow", status: "New", url: "https://www.zillow.com/", notes: "Good light. Need to check the yard.", tone: "coral" },
  { address: "815 Elgin Ave", price: "$649,900", beds: "4", baths: "2.5", backyard: "0.18 ac", source: "Redfin", status: "Tour", url: "https://www.redfin.com/", notes: "Strong contender, close to the park.", tone: "sage" },
  { address: "421 Thomas Ave", price: "$725,000", beds: "4", baths: "3", backyard: "—", source: "Zillow", status: "Maybe", url: "https://www.zillow.com/", notes: "Price feels high for the block.", tone: "sand" },
];

const EMPTY_DRAFT: Draft = { address: "", price: "", beds: "", baths: "", backyard: "", source: "Zillow", url: "", notes: "" };
const STATUSES: Status[] = ["New", "Maybe", "Tour", "Pass"];

export function AgentChat() {
  const agent = useEveAgent();
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [profileDraft, setProfileDraft] = useState({ name: "", email: "" });
  const [isHydrated, setIsHydrated] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<Source | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [cancellationError, setCancellationError] = useState<string>();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const visibleListings = listings.filter((listing) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${listing.address} ${listing.notes}`.toLowerCase().includes(query);
    return matchesSearch && (sourceFilter === "All" || listing.source === sourceFilter) && (statusFilter === "All" || listing.status === statusFilter);
  });

  useEffect(() => {
    const storedProfile = window.localStorage.getItem("hearth.profile");
    const storedListings = window.localStorage.getItem("hearth.listings");
    if (storedProfile) setProfile(JSON.parse(storedProfile) as { name: string; email: string });
    if (storedListings) setListings(JSON.parse(storedListings) as Listing[]);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem("hearth.listings", JSON.stringify(listings));
  }, [isHydrated, listings]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isBusy) return;
    setCancellationError(undefined);
    if (message.files.length === 0) { await agent.send(text); return; }
    const parts: UserContent = text ? [{ text, type: "text" }] : [];
    for (const file of message.files) parts.push({ data: file.url, filename: file.filename, mediaType: file.mediaType, type: "file" });
    await agent.send(parts);
  };

  const downloadCsv = () => {
    const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = listings.map((listing) => [listing.address, listing.price, listing.beds, listing.baths, listing.backyard].map(csvCell).join(","));
    const blob = new Blob([["Address,Price,Beds,Baths,Backyard size", ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "hearth-house-tracker.csv"; link.click(); URL.revokeObjectURL(url);
  };

  const addListing = () => {
    if (!draft.address.trim()) return;
    setListings((current) => [...current, { ...draft, address: draft.address.trim(), status: "New", tone: "blue" }]);
    setDraft(EMPTY_DRAFT); setIsAdding(false);
  };

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileDraft.name.trim() || !profileDraft.email.trim()) return;
    const nextProfile = { name: profileDraft.name.trim(), email: profileDraft.email.trim() };
    setProfile(nextProfile);
    window.localStorage.setItem("hearth.profile", JSON.stringify(nextProfile));
  };

  const cycleStatus = (address: string) => setListings((current) => current.map((listing) => listing.address === address ? { ...listing, status: STATUSES[(STATUSES.indexOf(listing.status) + 1) % STATUSES.length] } : listing));

  if (!isHydrated) return <main className="account-gate account-loading"><span className="brand-mark"><Home size={18} /></span><p>Opening your Hearth…</p></main>;

  if (!profile) return (
    <main className="account-gate"><div className="account-card"><div className="account-logo"><span className="brand-mark"><Home size={18} /></span><span>Hearth</span><span className="version-pill">v0.2 preview</span></div><div className="panel-kicker"><Sparkles size={14} /> YOUR HOUSE-HUNTING WORKSPACE</div><h1>Keep your search<br /><em>in one place.</em></h1><p>Sign in to create a private shortlist that stays on this device while Hearth grows into a fully synced workspace.</p><form onSubmit={signIn} className="account-form"><label>Your name<input value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} placeholder="Mager" autoComplete="name" /></label><label>Email address<input type="email" value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} placeholder="you@example.com" autoComplete="email" /></label><button className="primary-button" type="submit">Open my workspace <ArrowUpRight size={15} /></button></form><span className="account-footnote">Local preview · Your data stays in this browser for now</span></div></main>
  );

  return (
    <main className="property-app">
      <header className="topbar"><div className="brand"><span className="brand-mark"><Home size={17} strokeWidth={2.5} /></span><span>Hearth</span><span className="version-pill">v0.2</span><span className="brand-note">house tracker</span></div><div className="top-actions"><span className="sync-status"><span className="status-dot" /> Agent online</span><button className="avatar" title="Sign out" onClick={() => { setProfile(null); window.localStorage.removeItem("hearth.profile"); }}>{profile.name.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="workspace">
        <aside className="conversation-panel"><div className="panel-kicker"><Sparkles size={14} /> HEARTH / 01</div><h1>Find a place.<br /><em>Keep it here.</em></h1><p className="lede">Drop in a listing from anywhere. I&apos;ll help you compare the ones worth your time.</p><div className="prompt-chips"><button onClick={() => void agent.send("Which home is the best value?")}>Best value <ArrowUpRight size={13} /></button><button onClick={() => void agent.send("What should I ask at a tour?")}>Tour questions <ArrowUpRight size={13} /></button></div><div className="chat-stream">{agent.data.messages.length === 0 ? <div className="starter-note"><span className="agent-avatar"><WandSparkles size={15} /></span><div><strong>Ask me anything.</strong><p>Compare homes, think through tradeoffs, or turn a messy listing into a clear note.</p></div></div> : agent.data.messages.map((message, index) => <AgentMessage canRespond={!isBusy} isStreaming={agent.status === "streaming" && index === agent.data.messages.length - 1} key={message.id} message={message} onInputResponses={(inputResponses) => { setCancellationError(undefined); return agent.respond(inputResponses); }} />)}</div>{cancellationError ? <p className="error-copy">{cancellationError}</p> : null}<PromptInput onSubmit={handleSubmit}><PromptInputTextarea placeholder="Ask about your shortlist…" /><PromptInputSubmit onStop={() => void agent.cancel()} status={agent.status} /></PromptInput><div className="privacy-note"><MessageCircle size={12} /> Your workspace, your shortlist</div></aside>
        <section className="tracker-panel"><div className="tracker-heading"><div><div className="eyebrow"><Home size={13} /> HOUSE TRACKER</div><h2>Everything worth a look.</h2><p>{listings.length} homes saved across your search</p></div><div className="tracker-actions"><button className="secondary-button" onClick={downloadCsv}><Download size={15} /> Export CSV</button><button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={15} /> Add home</button></div></div>
          <div className="tracker-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Search homes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search address or notes" /></label><div className="source-tabs"><button className={sourceFilter === "All" ? "selected" : ""} onClick={() => setSourceFilter("All")}>All <span>{listings.length}</span></button>{(["Zillow", "Redfin", "Other"] as Source[]).map((source) => <button className={sourceFilter === source ? "selected" : ""} key={source} onClick={() => setSourceFilter(source)}>{source} <span>{listings.filter((listing) => listing.source === source).length}</span></button>)}</div></div>
          <div className="neighborhood-map"><div className="map-heading"><div><span className="eyebrow"><MapPinned size={13} /> AREA GUIDE</span><h3>Everything within a short walk</h3></div><span className="map-range">Madison → Adams</span></div><svg aria-label="Planning map between Madison Street and Adams Street, bounded by Elgin, Marengo, and Circle Avenues" className="map-drawing" role="img" viewBox="0 0 760 210"><rect width="760" height="210" fill="#e5eee0" /><path d="M0 38H760M0 105H760M0 172H760M94 0V210M248 0V210M405 0V210M568 0V210M685 0V210" className="map-minor-road" /><path d="M0 20H760M0 190H760M72 0V210M636 0V210" className="map-major-road" /><rect x="92" y="40" width="546" height="130" rx="4" className="map-focus" /><path d="M126 72H605M126 137H605M180 47V163M330 47V163M480 47V163" className="map-block" /><circle cx="248" cy="105" r="7" className="map-stop" /><circle cx="405" cy="105" r="7" className="map-stop" /><circle cx="568" cy="105" r="7" className="map-stop" /><rect x="278" y="76" width="67" height="22" rx="11" className="map-shopping" /><rect x="430" y="117" width="96" height="22" rx="11" className="map-shopping" /><text x="107" y="28" className="map-street-label">MADISON STREET</text><text x="107" y="202" className="map-street-label">ADAMS STREET</text><text x="103" y="64" className="map-avenue-label" transform="rotate(-90 103 64)">ELGIN AVE</text><text x="259" y="64" className="map-avenue-label" transform="rotate(-90 259 64)">MARENGO AVE</text><text x="416" y="64" className="map-avenue-label" transform="rotate(-90 416 64)">CIRCLE AVE</text><text x="284" y="91" className="map-shopping-label">Madison shops</text><text x="436" y="132" className="map-shopping-label">Downtown Forest Park</text><text x="238" y="90" className="map-stop-label">CTA</text><text x="395" y="90" className="map-stop-label">Metra</text><text x="558" y="90" className="map-stop-label">CTA</text></svg><div className="map-legend"><span><span className="legend-dot stop" /> CTA / Metra</span><span><span className="legend-dot shop" /> Shopping district</span><span><span className="legend-line" /> Focus area</span><span className="map-note"><Store size={13} /> Planning view, not to scale</span></div></div>
          {isAdding ? <div className="add-form"><div className="add-form-heading"><div><span className="eyebrow">NEW HOME</span><h3>Add something worth remembering</h3></div><button className="close-button" aria-label="Close add form" onClick={() => setIsAdding(false)}><X size={16} /></button></div><div className="form-grid"><label>Address<input autoFocus value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="123 Main Street" /></label><label>Source<select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value as Source })}><option>Zillow</option><option>Redfin</option><option>Other</option></select></label><label>Price<input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="$650,000" /></label><label>Beds<input value={draft.beds} onChange={(event) => setDraft({ ...draft, beds: event.target.value })} placeholder="3" /></label><label>Baths<input value={draft.baths} onChange={(event) => setDraft({ ...draft, baths: event.target.value })} placeholder="2" /></label><label>Backyard size<input value={draft.backyard} onChange={(event) => setDraft({ ...draft, backyard: event.target.value })} placeholder="0.2 ac" /></label><label className="wide-field">Listing URL<input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://…" /></label><label className="wide-field">Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What caught your eye?" /></label></div><div className="form-footer"><span>New homes start in the New column.</span><button className="primary-button" onClick={addListing}>Save home</button></div></div> : null}
          <div className="status-row"><span>SHOWING {visibleListings.length} OF {listings.length}</span><div className="status-filters"><button className={statusFilter === "All" ? "active" : ""} onClick={() => setStatusFilter("All")}>All</button>{STATUSES.map((status) => <button className={statusFilter === status ? "active" : ""} key={status} onClick={() => setStatusFilter(status)}>{status}</button>)}</div></div>
          <div className="tracker-list">{visibleListings.map((listing, index) => <article className="tracker-card" key={`${listing.address}-${index}`}><div className={cn("tracker-swatch", `image-${listing.tone}`)}><span>0{index + 1}</span></div><div className="tracker-card-main"><div className="tracker-card-top"><div><h3>{listing.address}</h3><p>{listing.source} · saved to Hearth</p></div><button className={cn("status-badge", `status-${listing.status.toLowerCase()}`)} onClick={() => cycleStatus(listing.address)}>{listing.status}</button></div><div className="tracker-facts"><strong>{listing.price || "Price unknown"}</strong><span>{listing.beds || "—"} beds</span><span>{listing.baths || "—"} baths</span><span>{listing.backyard || "—"} yard</span></div>{listing.notes ? <p className="tracker-notes">{listing.notes}</p> : null}<div className="tracker-card-footer">{listing.url ? <a href={listing.url} target="_blank" rel="noreferrer">Open listing <ExternalLink size={13} /></a> : <span className="muted-label">No listing link yet</span>}<span className="card-hint">Click status to move it along</span></div></div></article>)}</div>{visibleListings.length === 0 ? <div className="empty-tracker"><Home size={20} /><h3>Nothing here yet.</h3><p>Try another filter or add a home from Zillow, Redfin, or anywhere else.</p></div> : null}<button className="add-listing" onClick={() => setIsAdding(true)}><Plus size={16} /> Add another home</button></section>
      </div>
    </main>
  );
}
