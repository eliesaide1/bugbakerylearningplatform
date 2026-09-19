#!/usr/bin/env python3
"""
Render a scene file as a still diagram for a lesson page.

    python3 scripts/diagram-image.py <slug> [--out server/uploads/diagrams]

Reuses the scene format from diagram-video.py, drawn at its final state — every
element present — so the picture in the lesson matches the one in any video made
from the same scene.
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
dv = import_module("diagram-video".replace("-", "_")) if False else None

# diagram-video.py has a hyphen, so load it by path
import importlib.util
spec = importlib.util.spec_from_file_location("dv", Path(__file__).parent / "diagram-video.py")
dv = importlib.util.module_from_spec(spec); spec.loader.exec_module(dv)

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--out", default="server/uploads/diagrams")
args = ap.parse_args()

scene_path = Path(__file__).parent / "scenes" / f"{args.slug}.json"
if not scene_path.exists():
    sys.exit(f"No scene at {scene_path}")

scene = json.loads(scene_path.read_text())
elements = scene["elements"]
# Draw the end state: everything settled, nothing mid-transition.
for el in elements:
    el["at"], el["in"] = 0, 0.001

out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
target = out / f"{args.slug}.png"
dv.frame(target, scene.get("title", args.slug), elements, 10)
print(f"wrote {target}")
