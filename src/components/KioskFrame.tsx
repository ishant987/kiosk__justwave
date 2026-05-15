import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';

interface KioskFrameProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function KioskFrame({ title, eyebrow, children, aside }: KioskFrameProps) {
  return (
    <main className="app-shell">
      <nav className="topbar">
        <Link className="brand" to="/walk-in" aria-label="JustWave walk-in">
          <img src="/icons/icon.svg" alt="" />
          <span>JustWave</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/walk-in">Walk-in</NavLink>
        </div>
      </nav>
      <section className="kiosk-frame">
        <div className="kiosk-content">
          <header className="page-header">
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h1>{title}</h1>
          </header>
          {children}
        </div>
        {aside ? <aside className="kiosk-aside">{aside}</aside> : null}
      </section>
    </main>
  );
}
