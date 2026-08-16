"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import {
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";

type Listing = {
  address: string;
  price: string;
  beds: string;
  baths: string;
  backyard: string;
  tone: string;
};

const ZILLOW_URL = "https://www.zillow.com/forest-park-il/?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22isMapVisible%22%3Atrue%2C%22mapBounds%22%3A%7B%22west%22%3A-87.8664632807617%2C%22east%22%3A-87.77651271923827%2C%22south%22%3A41.83204204050914%2C%22north%22%3A41.904906612073795%7D%2C%22mapZoom%22%3A13%2C%22regionSelection%22%3A%5B%7B%22regionId%22%3A11475%2C%22regionType%22%3A6%7D%5D%2C%22filterState%22%3A%7B%22sort%22%3A%7B%22value%22%3A%22globalrelevanceex%22%7D%2C%22price%22%3A%7B%22max%22%3A800000%2C%22min%22%3A500000%7D%7D%2C%22isListVisible%22%3Atrue%2C%22usersSearchTerm%22%3A%22Forest%20Park%20IL%22%7D";

const INITIAL_LISTINGS: Listing[] = [
  { address: "7421 Madison St", price: "$589,000", beds: "3", baths: "2", backyard: "—", tone: "coral" },
  { address: "815 Elgin Ave", price: "$649,900", beds: "4", baths: "2.5", backyard: "0.18 ac", tone: "sage" },
  { address: "421 Thomas Ave", price: "$725,000", beds: "4", baths: "3", backyard: "—", tone: "sand" },
];

export function AgentChat() {
  const agent = useEveAgent();
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [saved, setSaved] = useState<string[]>(["815 Elgin Ave"]);
  const [cancellationError, setCancellationError] = useState<string>();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isBusy) return;
    setCancellationError(undefined);
    if (message.files.length === 0) {
      await agent.send(text);
      return;
    }
    const parts: UserContent = text ? [{ text, type: "text" }] : [];
    for (const file of message.files) {
      parts.push({ data: file.url, filename: file.filename, mediaType: file.mediaType, type: "file" });
    }
    await agent.send(parts);
  };

  const downloadCsv = () => {
    const header = "Address,Price,Beds,Baths,Backyard size";
    const rows = listings.map((listing) => [listing.address, listing.price, listing.beds, listing.baths, listing.backyard].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forest-park-homes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const addListing = () => setListings((current) => [...current, { address: "New address", price: "$0", beds: "—", baths: "—", backyard: "—", tone: "blue" }]);

  return (
    <main className="property-app">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Home size={17} strokeWidth={2.5} /></span><span>Hearth</span><span className="version-pill">v0.1</span><span className="brand-note">a house-hunting workspace</span></div>
        <div className="top-actions"><span className="sync-status"><span className="status-dot" /> Agent online</span><button className="avatar">M</button></div>
      </header>

      <div className="workspace">
        <aside className="conversation-panel">
          <div className="panel-kicker"><Sparkles size={14} /> HOUSE HUNT / 01</div>
          <h1>Let&apos;s find the<br /><em>right place.</em></h1>
          <p className="lede">Tell me what matters. I&apos;ll keep the shortlist tidy while we look.</p>
          <div className="prompt-chips"><button onClick={() => void agent.send("Show me the best value in this shortlist")}>Best value <ArrowUpRight size={13} /></button><button onClick={() => void agent.send("What should I look for in the backyards?")}>Backyard notes <ArrowUpRight size={13} /></button></div>
          <div className="chat-stream">
            {agent.data.messages.length === 0 ? (
              <div className="starter-note"><span className="agent-avatar"><WandSparkles size={15} /></span><div><strong>Hi, I&apos;m ready.</strong><p>Ask me to compare homes, spot tradeoffs, or add a listing to your tracker.</p></div></div>
            ) : agent.data.messages.map((message, index) => <AgentMessage canRespond={!isBusy} isStreaming={agent.status === "streaming" && index === agent.data.messages.length - 1} key={message.id} message={message} onInputResponses={(inputResponses) => { setCancellationError(undefined); return agent.respond(inputResponses); }} />)}
          </div>
          {cancellationError ? <p className="error-copy">{cancellationError}</p> : null}
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea placeholder="Ask about these homes…" />
            <PromptInputSubmit onStop={() => void agent.cancel()} status={agent.status} />
          </PromptInput>
          <div className="privacy-note"><MessageCircle size={12} /> Conversations stay in this workspace</div>
        </aside>

        <section className="results-panel">
          <div className="results-heading"><div><div className="eyebrow"><MapPin size={13} /> SEARCH AREA</div><h2>Forest Park, IL</h2><p>Homes between <strong>$500k</strong> and <strong>$800k</strong></p></div><a className="source-link" href={ZILLOW_URL} target="_blank" rel="noreferrer">Open Zillow <ArrowUpRight size={14} /></a></div>
          <div className="filter-row"><button className="filter active"><span className="filter-dot" /> 3 homes in your range</button><button className="filter">4+ beds</button><button className="filter">Backyard</button><button className="filter muted">Add filter <Plus size={14} /></button></div>
          <div className="map-card"><div className="map-label"><MapPin size={13} /> Forest Park</div><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><div className="map-water" /><span className="map-place place-one">Madison St</span><span className="map-place place-two">Desplaines Ave</span>{listings.map((listing, index) => <button aria-label={`View ${listing.address}`} className={cn("map-pin", `pin-${index + 1}`, saved.includes(listing.address) && "is-saved")} key={listing.address} onClick={() => setSaved((current) => current.includes(listing.address) ? current : [...current, listing.address])}><span>{index + 1}</span></button>)}</div>
          <div className="list-header"><div><span className="eyebrow">SHORTLIST</span><h3>{listings.length} homes to look at</h3></div><div className="list-actions"><button className="icon-button" aria-label="Download CSV" onClick={downloadCsv}><Download size={16} /></button><button className="csv-button" onClick={downloadCsv}><FileSpreadsheet size={15} /> Download CSV</button></div></div>
          <div className="listing-list">{listings.map((listing, index) => <article className="listing-card" key={`${listing.address}-${index}`}><div className={cn("listing-image", `image-${listing.tone}`)}><div className="image-lines" /><span className="listing-number">0{index + 1}</span><button className={cn("heart-button", saved.includes(listing.address) && "saved")} aria-label={`Save ${listing.address}`} onClick={() => setSaved((current) => current.includes(listing.address) ? current.filter((address) => address !== listing.address) : [...current, listing.address])}><Heart size={16} fill={saved.includes(listing.address) ? "currentColor" : "none"} /></button></div><div className="listing-info"><div className="listing-main"><h4>{listing.address}</h4><p>Forest Park, IL</p></div><strong className="listing-price">{listing.price}</strong><div className="listing-meta"><span><b>{listing.beds}</b> beds</span><span><b>{listing.baths}</b> baths</span><span><b>{listing.backyard}</b> yard</span></div><button className="details-button">View details <ArrowUpRight size={14} /></button></div></article>)}</div>
          <button className="add-listing" onClick={addListing}><Plus size={16} /> Add a home manually</button>
        </section>
      </div>
    </main>
  );
}
