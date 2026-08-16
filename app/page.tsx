import { ArrowRight, GitBranch, Home, MapPinned, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link className="brand landing-brand" href="/"><span className="brand-mark"><Home size={17} strokeWidth={2.5} /></span><span>Hearth</span><span className="version-pill">v0.1</span></Link>
        <div className="landing-nav-links"><a href="https://github.com/mager/hearth" target="_blank" rel="noreferrer">GitHub <GitBranch size={14} /></a><Link className="nav-cta" href="/workspace">Open workspace <ArrowRight size={14} /></Link></div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy"><div className="landing-kicker"><Sparkles size={14} /> AN OPEN HOUSE-HUNTING WORKSPACE</div><h1>Find a place.<br /><em>Make it yours.</em></h1><p>Hearth gives your house hunt a second brain: a conversation for the messy thinking, and a shortlist that stays beautifully organized.</p><div className="hero-actions"><Link className="hero-cta" href="/workspace">Open the workspace <ArrowRight size={16} /></Link><a className="text-link" href="https://github.com/mager/hearth" target="_blank" rel="noreferrer">Clone it on GitHub <GitBranch size={15} /></a></div></div>
        <div className="hero-visual"><div className="visual-note note-top">your next chapter <span>↗</span></div><div className="visual-house"><div className="house-sky" /><div className="house-roof" /><div className="house-body"><div className="house-window window-left" /><div className="house-window window-right" /><div className="house-door" /></div><div className="house-tree tree-left" /><div className="house-tree tree-right" /><div className="house-ground" /></div><div className="visual-note note-bottom"><MapPinned size={15} /> Forest Park, IL <span className="note-rule" /> <b>$500k–$800k</b></div></div>
      </section>
      <section className="landing-features"><div><span className="feature-index">01</span><h2>Talk it out</h2><p>Describe the feeling, the budget, the dealbreakers. Your agent keeps the thread.</p></div><div><span className="feature-index">02</span><h2>Keep the shortlist</h2><p>Save the homes worth a second look, with the details you actually care about.</p></div><div><span className="feature-index">03</span><h2>Take it with you</h2><p>Export a simple CSV now. Connect your own sources and spreadsheet next.</p></div></section>
      <footer className="landing-footer"><span>Hearth is open source and yours to shape.</span><Link href="/workspace">Start a workspace <ArrowRight size={14} /></Link></footer>
    </main>
  );
}
