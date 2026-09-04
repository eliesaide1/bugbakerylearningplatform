import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Badge, ButtonAnchor, Button } from "@shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { SITE_URL } from "../api/client";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/sections", label: "Page sections" },
  { to: "/programs", label: "Programs" },
  { to: "/lessons", label: "Video lessons" },
  { to: "/media", label: "Media library" },
  { to: "/faqs", label: "Questions" },
  { to: "/technologies", label: "Track options" },
  { to: "/theme", label: "Colours & type" },
  { to: "/settings", label: "Site details" },
  { to: "/availability", label: "1:1 availability" },
  { to: "/bookings", label: "1:1 sessions" },
  { to: "/leads", label: "Requests" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { connected, editors } = useRealtime();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const others = editors.filter((e) => e.id !== user?.id);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-ink text-on-dark lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="size-9 flex-none" />
            <div>
              <p className="font-display text-[1.15rem] font-extrabold text-white">Bug Bakery</p>
              <p className="font-mono text-[0.72rem] text-on-dark-muted">content manager</p>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer border border-border-dark px-3 py-2 text-sm lg:hidden"
          >
            Menu
          </button>
        </div>

        <nav className={`px-3 pb-4 ${open ? "block" : "hidden"} lg:block`}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-card px-3 py-2.5 text-[0.95rem] no-underline transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-on-dark-muted hover:bg-surface-dark hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-5 border-t border-border-dark px-3 pt-4">
            <p className="flex items-center gap-2 text-[0.85rem] text-on-dark-muted">
              <span
                title={connected ? "Live — changes publish instantly" : "Reconnecting…"}
                className={`size-2 rounded-full ${connected ? "bg-secondary" : "bg-muted"}`}
              />
              {connected ? "Live" : "Offline"}
            </p>

            {others.length ? (
              <p className="mt-2 text-[0.8rem] text-on-dark-muted">
                Also editing: {others.map((e) => e.name).join(", ")}
              </p>
            ) : null}

            <p className="mt-3 text-[0.85rem] text-white">{user?.name}</p>
            <p className="text-[0.78rem] text-on-dark-muted">{user?.email}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonAnchor
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="quiet"
                size="sm"
                className="border-border-dark text-on-dark-muted hover:border-white hover:text-white"
              >
                View site ↗
              </ButtonAnchor>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="border-border-dark text-on-dark-muted hover:border-white hover:text-white"
              >
                Sign out
              </Button>
            </div>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}

/** Title, description and actions above every admin screen. */
export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: string;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-step-3">{title}</h1>
          {badge ? <Badge>{badge}</Badge> : null}
        </div>
        {description ? <p className="mt-2 max-w-[68ch] text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
