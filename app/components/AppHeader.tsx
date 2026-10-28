import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="app-head">
      <Link className="wordmark" href="/" aria-label="Kasav Packtech, Today list">
        KASAV<span>Packtech</span>
      </Link>
      {children && <nav className="head-actions" aria-label="Today list controls">{children}</nav>}
    </header>
  );
}
