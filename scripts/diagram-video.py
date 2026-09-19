#!/usr/bin/env python3
"""
Render a lesson as an animated diagram, narrated.

    python3 scripts/diagram-video.py <lesson-slug> [--dest ~/Desktop/Videos]

Conceptual lessons are not screencasts — there is no code to watch being typed.
What they want is a picture being built a piece at a time while it is explained,
which is what a good tutorial does with a whiteboard.

A scene file in scripts/scenes/<slug>.json says what appears and when. Elements
fade and rise into place at their cue, so the picture assembles in step with the
narration rather than arriving all at once.

Needs `say` (macOS) and ffmpeg.
"""
import argparse, hashlib, json, math, re, shutil, subprocess, sys, tempfile, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

API = "http://localhost:5050/api"
W, H, FPS = 1280, 720, 20
SCENES = Path(__file__).parent / "scenes"

INK     = (20, 24, 31)
PANEL   = (32, 38, 48)
LINE    = (62, 71, 86)
WHITE   = (255, 255, 255)
MUTED   = (168, 178, 192)
ACCENT  = (233, 161, 59)
BLUE    = (86, 128, 233)
GREEN   = (104, 186, 140)
PURPLE  = (168, 130, 226)

PALETTE = {"accent": ACCENT, "blue": BLUE, "green": GREEN, "purple": PURPLE, "muted": MUTED}

FONT_DIRS = [Path("/System/Library/Fonts/Supplemental"), Path("/System/Library/Fonts")]
def font(names, size):
    for n in names:
        for d in FONT_DIRS:
            if (d / n).exists():
                return ImageFont.truetype(str(d / n), size)
    return ImageFont.load_default()

H1    = font(["Arial Bold.ttf"], 44)
LABEL = font(["Arial Bold.ttf"], 26)
SUB   = font(["Arial.ttf"], 19)
CAP   = font(["Arial.ttf"], 24)
TAG   = font(["Arial Bold.ttf"], 15)


def ease(t):
    """Ease-out cubic: quick to arrive, gentle to settle."""
    return 1 - pow(1 - max(0.0, min(1.0, t)), 3)


def blend(bg, fg, alpha):
    return tuple(int(b + (f - b) * alpha) for b, f in zip(bg, fg))


def centred(d, text, fnt, cx, y, fill):
    d.text((cx - d.textlength(text, font=fnt) / 2, y), text, font=fnt, fill=fill)


def draw_box(d, el, alpha):
    x, y, w, h = el["x"], el["y"], el["w"], el["h"]
    lift = int((1 - alpha) * 18)                     # rises as it fades in
    y += lift
    colour = PALETTE.get(el.get("colour", "blue"), BLUE)

    d.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=blend(INK, PANEL, alpha))
    d.rounded_rectangle([x, y, x + w, y + h], radius=12, outline=blend(INK, colour, alpha), width=2)

    cx = x + w // 2
    ty = y + (h // 2) - (30 if el.get("sub") else 16)
    if el.get("tag"):
        centred(d, el["tag"].upper(), TAG, cx, y + 14, blend(INK, colour, alpha))
        ty += 10
    centred(d, el["label"], LABEL, cx, ty, blend(INK, WHITE, alpha))
    if el.get("sub"):
        centred(d, el["sub"], SUB, cx, ty + 36, blend(INK, MUTED, alpha))


def draw_arrow(d, el, alpha, progress):
    """Draws from its start toward its end as `progress` runs 0 → 1."""
    x1, y1, x2, y2 = el["from"][0], el["from"][1], el["to"][0], el["to"][1]
    x2 = x1 + (x2 - x1) * progress
    y2 = y1 + (y2 - y1) * progress
    colour = blend(INK, PALETTE.get(el.get("colour", "muted"), MUTED), alpha)
    d.line([x1, y1, x2, y2], fill=colour, width=3)

    angle = math.atan2(y2 - y1, x2 - x1)
    for side in (2.6, -2.6):
        d.line([x2, y2, x2 - 15 * math.cos(angle - side / 2.6 * 0.5),
                y2 - 15 * math.sin(angle - side / 2.6 * 0.5)], fill=colour, width=3)
    if el.get("label") and progress > 0.6:
        centred(d, el["label"], SUB, (x1 + x2) / 2, min(y1, y2) - 30, colour)


def frame(path, title, elements, t):
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 10, W, H], fill=ACCENT)
    d.text((64, 48), title, font=H1, fill=WHITE)

    caption = ""
    for el in elements:
        at, dur = el.get("at", 0), el.get("in", 0.5)
        if t < at:
            continue
        alpha = ease((t - at) / dur) if dur else 1.0
        if el["type"] == "box":
            draw_box(d, el, alpha)
        elif el["type"] == "arrow":
            draw_arrow(d, el, alpha, ease((t - at) / max(dur, 0.01)))
        elif el["type"] == "caption":
            caption = el["text"]

    if caption:
        d.text((64, H - 86), caption, font=CAP, fill=MUTED)
    img.save(path)


def speak(text, path):
    subprocess.run(["say", "-v", "Samantha", "-r", "168", "-o", str(path),
                    re.sub(r"[*`]", "", text)], check=True)
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def build(lesson, scene, destination):
    work = Path(tempfile.mkdtemp(prefix="diagram-"))
    voice = work / "voice.aiff"
    # The scene's own narration if it has one, else the lesson's prose.
    script = scene.get("narration") or " ".join(
        p.strip() for p in (lesson.get("description") or "").split("\n\n") if p.strip())
    seconds = speak(script, voice)

    elements = scene["elements"]
    # Scenes are authored against a nominal length; stretch them to the voice.
    nominal = max([e.get("at", 0) + e.get("in", 0.5) for e in elements] + [1])
    scale = (seconds - 1.0) / nominal if nominal else 1
    for el in elements:
        el["at"] = el.get("at", 0) * scale
        el["in"] = el.get("in", 0.5) * max(scale, 0.6)

    frames_dir = work / "f"; frames_dir.mkdir()
    listing, last, current = [], None, None
    for n in range(int(seconds * FPS)):
        t = n / FPS
        state = [(e.get("type"), round(min(1.0, max(0.0, (t - e["at"]) / max(e["in"], .01))), 2))
                 for e in elements]
        digest = hashlib.md5(str(state).encode()).hexdigest()
        if digest != last:
            png = frames_dir / f"{n:06d}.png"
            frame(png, scene.get("title") or lesson["title"], elements, t)
            last, current = digest, png
        listing.append(current)

    concat = work / "list.txt"
    concat.write_text("".join(f"file '{p}'\nduration {1/FPS}\n" for p in listing) + f"file '{listing[-1]}'\n")

    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-nostdin", "-loglevel", "error", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(voice),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
        "-r", str(FPS), "-c:a", "aac", "-b:a", "128k", "-shortest",
        "-movflags", "+faststart", str(destination)], check=True)
    shutil.rmtree(work, ignore_errors=True)
    return seconds


SAFE = re.compile(r'[<>:"/\\|?*]')
def safe_name(text, limit=70):
    return SAFE.sub("", re.sub(r"[*`]", "", text)).strip().rstrip(".")[:limit].strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--all", action="store_true", help="every lesson with a scene file")
    ap.add_argument("--program", default="mern-full-stack")
    ap.add_argument("--dest", default=str(Path.home() / "Desktop" / "Videos"))
    args = ap.parse_args()

    if not shutil.which("say"):
        sys.exit("`say` not found — this needs macOS.")

    with urllib.request.urlopen(f"{API}/public/programs/{args.program}", timeout=20) as r:
        program = json.load(r)
    sections, lessons = program.get("modules") or [], program.get("lessons") or []

    wanted = [l for l in lessons if (SCENES / f"{l['slug']}.json").exists()]
    if not args.all:
        if not args.slug:
            sys.exit("Give a lesson slug, or --all.")
        wanted = [l for l in wanted if l["slug"] == args.slug]
        if not wanted:
            sys.exit(f"No scene file at scripts/scenes/{args.slug}.json")

    root = Path(args.dest).expanduser()
    print(f"{program['title']}\n{len(wanted)} diagram lesson(s)\n")

    total = 0.0
    for lesson in wanted:
        scene = json.loads((SCENES / f"{lesson['slug']}.json").read_text())
        module = lesson.get("module") or 0
        section = sections[module]["title"] if module < len(sections) else "Unsorted"
        folder = root / f"{module + 1:02d}. {safe_name(section)}"
        position = [l for l in lessons if l.get("module") == module].index(lesson) + 1
        target = folder / f"{position:02d}. {safe_name(lesson['title'])}.mp4"

        length = build(lesson, scene, target)
        total += length
        print(f"  {target.relative_to(root)}   {int(length//60)}m{int(length%60):02d}s")

    print(f"\nin {root} — total {int(total//60)}m{int(total%60):02d}s")


if __name__ == "__main__":
    main()
