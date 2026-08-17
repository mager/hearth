"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Sign-in failed. Try again.");
        return;
      }
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/workspace");
      router.refresh();
    } catch {
      setError("Sign-in is unavailable right now. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="account-form">
      <label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
      <label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete="current-password" /></label>
      {error ? <p className="account-error" role="alert">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"} <ArrowUpRight size={15} /></button>
    </form>
  );
}
