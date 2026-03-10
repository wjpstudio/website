"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("dashboard_auth="));
    if (token) {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);

    const res = await fetch("/api/dashboard-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError(true);
      setPassword("");
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted font-mono text-sm">...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
          <p className="font-mono text-xs tracking-widest text-muted uppercase text-center">
            Dashboard
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-surface border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-subtle/50 transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400 text-center">Wrong password</p>
          )}
          <button
            type="submit"
            className="w-full bg-foreground text-bg rounded-lg py-3 text-sm font-medium hover:bg-subtle transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="pt-32 pb-16">
        <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          Dashboard
        </p>
        <h1 className="text-3xl font-light tracking-tight mb-4">
          Mission Control
        </h1>
      </section>

      <section className="pb-24 grid sm:grid-cols-2 gap-6">
        {/* Agent Status */}
        <div className="border border-border/50 rounded-lg p-6 bg-surface">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
            Agent Status
          </h2>
          <div className="space-y-3">
            {[
              { name: "Kikai", status: "active", role: "Operator" },
              { name: "Yama", status: "active", role: "Grower" },
              { name: "Kodo", status: "active", role: "Builder" },
              { name: "Claud", status: "active", role: "Builder" },
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-sm">{agent.name}</span>
                </div>
                <span className="text-xs text-muted font-mono">
                  {agent.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue */}
        <div className="border border-border/50 rounded-lg p-6 bg-surface">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
            Revenue
          </h2>
          <p className="text-2xl font-light text-foreground mb-1">$0</p>
          <p className="text-xs text-muted font-mono">Pre-launch</p>
        </div>

        {/* Launch Countdown */}
        <div className="border border-border/50 rounded-lg p-6 bg-surface">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
            For Crypto Launch
          </h2>
          <p className="text-2xl font-light text-amber-400 mb-1">
            March 16, 2026
          </p>
          <p className="text-xs text-muted font-mono">Monday</p>
        </div>

        {/* Audit Score */}
        <div className="border border-border/50 rounded-lg p-6 bg-surface">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
            FC Audit Score
          </h2>
          <p className="text-2xl font-light text-foreground mb-1">91/100</p>
          <p className="text-xs text-muted font-mono">
            Ceiling ~90 until smart contract audit
          </p>
        </div>
      </section>

      {/* Mission Control Embed placeholder */}
      <section className="pb-24">
        <div className="border border-border/50 rounded-lg p-6 bg-surface">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
            Mission Control
          </h2>
          <div className="py-12 text-center">
            <p className="text-muted font-mono text-sm">
              Embed: kikaionchain.github.io/mission-control
            </p>
            <p className="text-xs text-muted mt-2">
              Connect live data feeds here
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
