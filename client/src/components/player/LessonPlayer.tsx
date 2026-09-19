import { useCallback, useEffect, useRef, useState } from "react";
import { useHlsSource } from "./useHlsSource";

const SKIP = 10;
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

/** Where each lesson was left off, so it resumes instead of restarting. */
const resumeKey = (id: string) => `bugbakery.pos.${id}`;

interface LessonPlayerProps {
  /** An .m3u8 ladder, or any file the browser can play. */
  src: string;
  poster?: string;
  title?: string;
  /** Stable id used to remember the playback position. */
  lessonId?: string;
  className?: string;
}

/**
 * The lesson player.
 *
 * Native controls are close, but they have no skip buttons and no speed
 * control, and both are the things people reach for constantly in a lecture —
 * so the chrome here is ours. Playback itself is still a plain <video>.
 */
export function LessonPlayer({ src, poster, title, lessonId, className = "" }: LessonPlayerProps) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const { levels, level, setLevel, error } = useHlsSource(video, src);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [full, setFull] = useState(false);
  const [menu, setMenu] = useState<"speed" | "quality" | null>(null);
  /** A nudge shown briefly when you skip, so the jump is legible. */
  const [nudge, setNudge] = useState<"back" | "forward" | null>(null);

  /* ---------------------------- element wiring --------------------------- */

  useEffect(() => {
    if (!video) return undefined;
    const on = {
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      waiting: () => setWaiting(true),
      playing: () => setWaiting(false),
      timeupdate: () => {
        setTime(video.currentTime);
        const ranges = video.buffered;
        setBuffered(ranges.length ? ranges.end(ranges.length - 1) : 0);
      },
      loadedmetadata: () => {
        setDuration(video.duration || 0);
        // Pick up where they stopped, unless they were basically finished.
        if (!lessonId) return;
        const saved = Number(localStorage.getItem(resumeKey(lessonId)) || 0);
        if (saved > 5 && saved < (video.duration || 0) - 15) video.currentTime = saved;
      },
      volumechange: () => setMuted(video.muted),
      ratechange: () => setRate(video.playbackRate),
    };
    Object.entries(on).forEach(([e, fn]) => video.addEventListener(e, fn as EventListener));
    return () => Object.entries(on).forEach(([e, fn]) => video.removeEventListener(e, fn as EventListener));
  }, [video, lessonId]);

  // Remember the position, but not on every frame.
  useEffect(() => {
    if (!lessonId || !time) return;
    const id = window.setTimeout(() => localStorage.setItem(resumeKey(lessonId), String(time)), 1000);
    return () => window.clearTimeout(id);
  }, [lessonId, time]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ------------------------------- actions ------------------------------- */

  const toggle = useCallback(() => {
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }, [video]);

  const skip = useCallback(
    (seconds: number) => {
      if (!video) return;
      video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration || 0);
      setNudge(seconds < 0 ? "back" : "forward");
      window.setTimeout(() => setNudge(null), 420);
    },
    [video]
  );

  const seekTo = (fraction: number) => {
    if (!video || !video.duration) return;
    video.currentTime = fraction * video.duration;
  };

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrap.current?.requestFullscreen();
  };

  /* ------------------------------ shortcuts ------------------------------ */

  useEffect(() => {
    const node = wrap.current;
    if (!node || !video) return undefined;

    const onKey = (event: KeyboardEvent) => {
      // Never steal keys from a field someone is typing in.
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;

      const handlers: Record<string, () => void> = {
        " ": toggle,
        k: toggle,
        ArrowLeft: () => skip(-SKIP),
        ArrowRight: () => skip(SKIP),
        j: () => skip(-SKIP),
        l: () => skip(SKIP),
        f: fullscreen,
        m: () => {
          video.muted = !video.muted;
        },
      };
      const fn = handlers[event.key] ?? handlers[event.key.toLowerCase()];
      if (!fn) return;
      event.preventDefault();
      fn();
    };

    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [video, toggle, skip]);

  /* -------------------------------- render ------------------------------- */

  const progress = duration ? (time / duration) * 100 : 0;
  const ahead = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrap}
      tabIndex={0}
      aria-label={title ? `${title} — video player` : "Video player"}
      className={`group relative aspect-video w-full overflow-hidden rounded-panel bg-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${className}`}
    >
      <video
        ref={setVideo}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={toggle}
        onDoubleClick={fullscreen}
        className="size-full cursor-pointer bg-ink"
      />

      {/* Buffering, and the skip nudge, both sit over the picture. */}
      {waiting ? (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </span>
      ) : null}

      {nudge ? (
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-ink/70 px-4 py-2 font-mono text-[0.8rem] text-white ${
            nudge === "back" ? "left-8" : "right-8"
          }`}
        >
          {nudge === "back" ? `− ${SKIP}s` : `+ ${SKIP}s`}
        </span>
      ) : null}

      {error ? (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-on-dark-muted">
          {error}
        </p>
      ) : null}

      {/* Controls: always up when paused, on hover or focus once playing. */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-3 pt-10 pb-2.5 transition-opacity duration-200 ${
          playing ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "opacity-100"
        }`}
      >
        <Scrubber progress={progress} ahead={ahead} duration={duration} onSeek={seekTo} />

        <div className="mt-1.5 flex items-center gap-1 text-white">
          <Control onClick={toggle} label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Control>

          <Control onClick={() => skip(-SKIP)} label={`Back ${SKIP} seconds`}>
            <SkipIcon back />
          </Control>
          <Control onClick={() => skip(SKIP)} label={`Forward ${SKIP} seconds`}>
            <SkipIcon />
          </Control>

          <Control
            onClick={() => video && (video.muted = !video.muted)}
            label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MutedIcon /> : <SoundIcon />}
          </Control>

          <span className="ml-1.5 font-mono text-[0.76rem] tabular-nums text-white/85">
            {clock(time)} <span className="text-white/45">/ {clock(duration)}</span>
          </span>

          <span className="ml-auto flex items-center gap-1">
            <Menu
              open={menu === "speed"}
              onToggle={() => setMenu(menu === "speed" ? null : "speed")}
              label="Playback speed"
              trigger={rate === 1 ? "1×" : `${rate}×`}
              options={SPEEDS.map((s) => ({
                key: String(s),
                label: s === 1 ? "Normal" : `${s}×`,
                active: rate === s,
                onSelect: () => video && (video.playbackRate = s),
              }))}
            />

            {levels.length > 1 ? (
              <Menu
                open={menu === "quality"}
                onToggle={() => setMenu(menu === "quality" ? null : "quality")}
                label="Quality"
                trigger={level === -1 ? "Auto" : (levels.find((l) => l.index === level)?.label ?? "Auto")}
                options={[
                  { key: "auto", label: "Auto", active: level === -1, onSelect: () => setLevel(-1) },
                  ...[...levels].reverse().map((l) => ({
                    key: String(l.index),
                    label: l.label,
                    active: level === l.index,
                    onSelect: () => setLevel(l.index),
                  })),
                ]}
              />
            ) : null}

            <Control onClick={fullscreen} label={full ? "Exit full screen" : "Full screen"}>
              <FullscreenIcon exit={full} />
            </Control>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- pieces -------------------------------- */

function Scrubber({
  progress,
  ahead,
  duration,
  onSeek,
}: {
  progress: number;
  ahead: number;
  duration: number;
  onSeek: (fraction: number) => void;
}) {
  return (
    <div className="group/bar relative flex h-4 cursor-pointer items-center">
      {/* The real control, kept invisible so keyboard and assistive tech get a
          proper slider while everyone else sees the bar below. */}
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(progress * 10)}
        aria-label="Seek"
        aria-valuetext={clock((progress / 100) * duration)}
        onChange={(e) => onSeek(Number(e.target.value) / 1000)}
        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
      />
      <span className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/bar:h-1.5">
        {/* What has been downloaded, so a stall is visibly a stall. */}
        <span className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${ahead}%` }} />
        <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}

function Control({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-9 cursor-pointer place-items-center rounded-card text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function Menu({
  open,
  onToggle,
  label,
  trigger,
  options,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  trigger: string;
  options: Array<{ key: string; label: string; active: boolean; onSelect: () => void }>;
}) {
  return (
    <span className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        className="cursor-pointer rounded-card px-2.5 py-1.5 font-mono text-[0.76rem] text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {trigger}
      </button>
      {open ? (
        <span className="absolute right-0 bottom-full mb-2 min-w-[7rem] overflow-hidden rounded-card border border-white/15 bg-ink/95 py-1 backdrop-blur">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                o.onSelect();
                onToggle();
              }}
              className={`block w-full cursor-pointer px-3 py-1.5 text-left font-mono text-[0.76rem] transition-colors hover:bg-white/15 ${
                o.active ? "text-primary" : "text-white/85"
              }`}
            >
              {o.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/** 4210 -> "1:10:10"; 610 -> "10:10". */
function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/* -------------------------------- icons -------------------------------- */

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
    <path d="M6.5 4.3v11.4a.6.6 0 0 0 .92.5l9-5.7a.6.6 0 0 0 0-1l-9-5.7a.6.6 0 0 0-.92.5Z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
    <rect x="5" y="4" width="3.6" height="12" rx="1" />
    <rect x="11.4" y="4" width="3.6" height="12" rx="1" />
  </svg>
);

const SkipIcon = ({ back = false }: { back?: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    className={`size-5 ${back ? "-scale-x-100" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 4.5a5.5 5.5 0 1 0 5.5 5.5" />
    <path d="M12.6 2.2 15.8 4.6l-3.2 2.4" />
    <text x="10" y="13" textAnchor="middle" fontSize="6.5" fill="currentColor" stroke="none">
      10
    </text>
  </svg>
);

const SoundIcon = () => (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" strokeLinejoin="round" />
    <path d="M12.8 7.4a3.5 3.5 0 0 1 0 5.2M15 5.4a6.5 6.5 0 0 1 0 9.2" strokeLinecap="round" />
  </svg>
);

const MutedIcon = () => (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" strokeLinejoin="round" />
    <path d="M13 8l4 4M17 8l-4 4" strokeLinecap="round" />
  </svg>
);

const FullscreenIcon = ({ exit }: { exit: boolean }) => (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {exit ? (
      <path d="M8 3v5H3M12 17v-5h5" />
    ) : (
      <path d="M3 7.5V3h4.5M16.5 12.5V17H12" />
    )}
  </svg>
);
