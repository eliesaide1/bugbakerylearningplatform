import { useEffect, useRef } from "react";
import { useTrack } from "../state/TrackContext";
import { Button, Chip } from "@shared/ui";
import type { SiteSettings, TechGroup, Technology } from "@shared/types";

const GROUP_LABELS: Record<TechGroup, string> = {
  front: "Front end",
  back: "Back end",
  data: "Database",
  mobile: "Mobile",
  ai: "AI",
  ops: "DevOps & cloud",
};

const GROUP_ORDER: TechGroup[] = ["front", "back", "data", "mobile", "ai", "ops"];

interface TrackBuilderProps {
  technologies: Technology[];
  settings?: SiteSettings;
  className?: string;
}

export function TrackBuilder({ technologies, settings, className = "" }: TrackBuilderProps) {
  const { selected, ids, toggle, names, weeks, trackName } = useTrack();
  const outputRef = useRef<HTMLDivElement>(null);

  // Re-trigger the swap animation whenever the summary changes.
  useEffect(() => {
    const node = outputRef.current;
    if (!node) return;
    node.classList.remove("animate-swap-in");
    void node.offsetWidth;
    node.classList.add("animate-swap-in");
  }, [trackName, weeks, names.length]);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: technologies.filter((t) => t.group === group),
  })).filter((g) => g.items.length > 0);

  const requestTrack = () => {
    document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.getElementById("lead-name")?.focus(), 600);
  };

  return (
    <div className={`border border-line-strong border-t-[4px] border-t-primary bg-panel p-5 pb-4 ${className}`}>
      <h2 className="mb-1 text-[1.3rem] leading-tight font-extrabold font-display">{settings?.builderTitle || "Build your own track"}</h2>
      <p className="text-[0.88rem] leading-snug text-muted">{settings?.builderNote}</p>

      {grouped.map(({ group, label, items }) => (
        <div key={group} className="mt-3.5">
          <h3 className="mb-1.5 font-mono text-[0.7rem] tracking-wide text-muted uppercase">{label}</h3>
          <div className="flex flex-wrap gap-1.5">
            {items.map((tech) => (
              <Chip
                key={tech.id}
                label={tech.name}
                selected={ids.has(tech.id)}
                onToggle={() => toggle(tech)}
              />
            ))}
          </div>
        </div>
      ))}

      <div ref={outputRef} className="mt-4 border-t border-dashed border-line-strong pt-3.5">
        <p className="font-display text-[1.1rem] leading-[1.2] font-extrabold">{trackName}</p>
        <p className="mt-1 text-[0.88rem] leading-snug text-muted">
          {selected.length
            ? `${names.join(", ")} · about ${weeks} weeks · one live session a week`
            : "Choose at least one technology to see a suggested plan."}
        </p>
        <Button onClick={requestTrack} disabled={!selected.length} fullWidth className="mt-3">
          Request this track
        </Button>
      </div>
    </div>
  );
}
