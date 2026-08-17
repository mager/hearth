import type { Metadata } from "next";
import { Home, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Hearth" };

export default function LoginPage() {
  return (
    <main className="account-gate">
      <div className="account-card">
        <div className="account-logo"><span className="brand-mark"><Home size={18} /></span><span>Hearth</span><span className="version-pill">v0.2</span></div>
        <div className="panel-kicker"><Sparkles size={14} /> YOUR HOUSE-HUNTING WORKSPACE</div>
        <h1>Welcome back<br /><em>to the hunt.</em></h1>
        <p>Sign in to open your private workspace and pick up the search where you left off.</p>
        <Suspense><LoginForm /></Suspense>
        <span className="account-footnote">Private beta · Accounts by invitation</span>
      </div>
    </main>
  );
}
