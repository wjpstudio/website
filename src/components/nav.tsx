"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const protectedLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/studio", label: "Studio" },
  { href: "/brain-dumps", label: "Brain Dumps" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-xl backdrop-saturate-[180%]">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm tracking-wider text-subtle hover:text-foreground transition-colors"
        >
          wjp.studio
        </Link>
        <div className="flex items-center gap-6">
          {authed ? (
            <>
              {protectedLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${
                    pathname === href
                      ? "text-foreground"
                      : "text-muted hover:text-subtle"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${
                  pathname === "/dashboard"
                    ? "text-foreground"
                    : "text-muted hover:text-subtle"
                }`}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm text-muted hover:text-subtle transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
