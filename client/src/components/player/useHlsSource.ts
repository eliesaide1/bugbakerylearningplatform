import { useEffect, useState } from "react";
import type Hls from "hls.js";

export interface Level {
  /** hls.js level index, or -1 for automatic. */
  index: number;
  height: number;
  label: string;
}

/**
 * Attaches a source to the <video>, choosing how based on what it is.
 *
 * An .m3u8 is a playlist of short segments at several bitrates. Safari plays
 * those itself; everywhere else hls.js has to do it, fetching segments over
 * XHR and feeding them to Media Source Extensions. Anything else is handed
 * straight to the element as a plain file.
 */
export function useHlsSource(video: HTMLVideoElement | null, src?: string | null) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevelState] = useState(-1);
  const [hls, setHls] = useState<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!video || !src) return undefined;
    setError(null);
    setLevels([]);

    const isHls = /\.m3u8(\?|$)/i.test(src);

    // Safari understands HLS natively, and its own implementation handles
    // battery and hardware decoding better than ours would.
    if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    let instance: Hls | null = null;
    let cancelled = false;

    // Loaded on demand: it is ~200KB, and most pages never play a video.
    import("hls.js").then(({ default: HlsCtor }) => {
      if (cancelled || !HlsCtor.isSupported()) {
        if (!cancelled) setError("This browser cannot play the lesson video.");
        return;
      }
      instance = new HlsCtor({
        // Enough ahead to ride out a dip, not so much that seeking throws work
        // away. Screencast segments are small, so this is cheap.
        maxBufferLength: 30,
        maxMaxBufferLength: 120,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      instance.loadSource(src);
      instance.attachMedia(video);

      instance.on(HlsCtor.Events.MANIFEST_PARSED, () => {
        if (cancelled || !instance) return;
        setLevels(
          instance.levels.map((l, i) => ({
            index: i,
            height: l.height,
            label: `${l.height}p`,
          }))
        );
      });

      instance.on(HlsCtor.Events.LEVEL_SWITCHED, (_e, data) => {
        if (!cancelled) setLevelState(instance?.autoLevelEnabled ? -1 : data.level);
      });

      instance.on(HlsCtor.Events.ERROR, (_e, data) => {
        if (cancelled || !data.fatal || !instance) return;
        // Network and media errors are usually survivable — a segment timed
        // out, or the decoder hiccuped — so recover rather than give up.
        if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) instance.startLoad();
        else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) instance.recoverMediaError();
        else setError("The lesson video could not be loaded.");
      });

      setHls(instance);
    });

    return () => {
      cancelled = true;
      instance?.destroy();
      setHls(null);
    };
  }, [video, src]);

  /** -1 puts it back on automatic — hls.js reads that from currentLevel. */
  const setLevel = (index: number) => {
    if (!hls) return;
    hls.currentLevel = index;
    setLevelState(index);
  };

  return { levels, level, setLevel, error };
}
