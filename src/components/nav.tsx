"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const protectedLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/studio", label: "Studio" },
  { href: "/brain-dumps", label: "Dumps" },
];

function useAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    function check() {
      const has = document.cookie
        .split("; ")
        .some((c) => c.startsWith("dashboard_ui="));
      setAuthed(has);
    }

    check();
    window.addEventListener("auth-change", check);
    return () => window.removeEventListener("auth-change", check);
  }, []);

  return authed;
}

export function Nav() {
  const pathname = usePathname();
  const authed = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm tracking-widest text-foreground glitch-text uppercase"
        >
          WJP
        </Link>
        <div className="flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-mono text-xs tracking-wide uppercase transition-colors glitch-text ${
                pathname === href
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
