#!/usr/bin/env bash
#
# Turn a lecture recording into an adaptive HLS ladder.
#
#   ./scripts/encode-hls.sh input.mp4                 one file
#   ./scripts/encode-hls.sh ~/recordings              a whole folder
#   OUT=/mnt/video ./scripts/encode-hls.sh ~/recordings
#
# Produces, per video:
#
#   <out>/<name>/master.m3u8      the playlist the player loads
#   <out>/<name>/{360,540,720}/   segments for each rung
#   <out>/<name>/poster.jpg       a frame for the player
#
# Two settings do most of the work:
#
#   4-second segments — seeking fetches only the segment holding that moment,
#   so a jump lands in about a third of a megabyte rather than re-reading the
#   file. This is what makes ±10s feel instant.
#
#   CRF with a bitrate ceiling — screencasts are mostly a still screen, so
#   constant-quality encoding makes them far smaller than fixed-bitrate would,
#   while maxrate keeps a busy moment from spiking past what a viewer can pull.
#
set -euo pipefail

IN="${1:?usage: encode-hls.sh <file-or-folder>}"
OUT="${OUT:-server/uploads/video}"
SEG="${SEG:-4}"                       # segment length, seconds

command -v ffmpeg >/dev/null || { echo "ffmpeg not found — brew install ffmpeg"; exit 1; }

# rung: height  crf  maxrate  bufsize  audio
RUNGS=(
  "360 26 500k 1000k 96k"
  "540 24 1000k 2000k 128k"
  "720 23 2000k 4000k 128k"
)

human () { awk -v b="$1" 'BEGIN{ s="B KB MB GB"; split(s,u," ");
           for(i=1;b>=1024&&i<4;i++) b/=1024; printf "%.1f %s", b, u[i] }'; }

encode_one () {
  local src="$1"
  local name; name="$(basename "${src%.*}" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9._-')"
  local dir="$OUT/$name"
  local before; before=$(stat -f%z "$src" 2>/dev/null || stat -c%s "$src")

  echo "──  $name"
  mkdir -p "$dir"

  # One pass per rung. Slower than a single filter_complex, but far easier to
  # read, and a failed rung does not cost you the others.
  local master="#EXTM3U\n#EXT-X-VERSION:3\n"
  for rung in "${RUNGS[@]}"; do
    read -r h crf maxrate bufsize arate <<<"$rung"
    mkdir -p "$dir/$h"
    ffmpeg -nostdin -loglevel error -y -i "$src" \
      -vf "scale=-2:$h,format=yuv420p" \
      -c:v libx264 -preset veryfast -profile:v main -crf "$crf" \
      -maxrate "$maxrate" -bufsize "$bufsize" \
      -g $((SEG * 30)) -keyint_min $((SEG * 30)) -sc_threshold 0 \
      -c:a aac -b:a "$arate" -ac 2 \
      -hls_time "$SEG" -hls_playlist_type vod -hls_flags independent_segments \
      -hls_segment_filename "$dir/$h/%04d.ts" \
      "$dir/$h/index.m3u8"
    local bw=$(( ${maxrate%k} * 1000 ))
    master+="#EXT-X-STREAM-INF:BANDWIDTH=$bw,RESOLUTION=$(( h * 16 / 9 ))x$h\n$h/index.m3u8\n"
  done
  printf "%b" "$master" > "$dir/master.m3u8"

  # A frame from 10% in — further than the title card, before the content moves on.
  local dur; dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" | cut -d. -f1)
  ffmpeg -nostdin -loglevel error -y -ss $(( dur / 10 )) -i "$src" -frames:v 1 -vf "scale=-2:720,format=yuv420p" "$dir/poster.jpg"

  local after; after=$(du -sk "$dir" | cut -f1); after=$(( after * 1024 ))
  printf "    %s  →  %s   (%d%% of the original)   %s\n" \
    "$(human "$before")" "$(human "$after")" $(( after * 100 / before )) \
    "$(printf '%dm%02ds' $(( dur / 60 )) $(( dur % 60 )))"
}

if [[ -d "$IN" ]]; then
  shopt -s nullglob nocaseglob
  files=("$IN"/*.{mp4,mov,mkv,m4v,webm})
  echo "${#files[@]} video(s) in $IN  →  $OUT"
  for f in "${files[@]}"; do encode_one "$f"; done
else
  encode_one "$IN"
fi

echo
echo "done.  Point a lesson's video url at:  /video/<name>/master.m3u8"
