"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Search, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestDialog } from "./request-dialog";
import { TrackCover } from "@/components/audio/track-cover";

type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  bpm: number | null;
  duration: string | null;
  coverArtUrl: string | null;
};

interface EngineTrack {
  engine_dj_id: string;
  title: string;
  artist: string;
  genre: string | null;
  bpm: number | null;
  duration: string | null;
  cover_art_url: string | null;
}

const SCROLL_STEP = 160; // card width (144) + gap (16)
const AUTO_SCROLL_SPEED = 1.1;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Drives one infinitely-looping row: centers on mount, auto-scrolls, pauses on interaction. */
function useMarqueeRow(direction: 1 | -1, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    el.scrollLeft = el.scrollWidth / 3;
  }, [active]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(el);

    let raf: number;

    const tick = () => {
      if (visible && !interacting.current) {
        const setWidth = el.scrollWidth / 3;
        el.scrollLeft += direction * AUTO_SCROLL_SPEED;
        if (el.scrollLeft >= setWidth * 2) {
          el.scrollLeft -= setWidth;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += setWidth;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [active, direction]);

  function pause() {
    interacting.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  }

  function resumeSoon() {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      interacting.current = false;
    }, 2000);
  }

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    if (el.scrollLeft < setWidth * 0.5) {
      el.scrollLeft += setWidth;
    } else if (el.scrollLeft > setWidth * 1.5) {
      el.scrollLeft -= setWidth;
    }
  }

  return { ref, pause, resumeSoon, handleScroll };
}

function TrackTile({
  track,
  isSelected,
  onSelect,
}: {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative shrink-0 w-32 sm:w-36 aspect-square overflow-hidden rounded-xl border transition-all duration-300 ${
        isSelected
          ? "border-[#f97316] ring-2 ring-[#f97316]/60"
          : "border-foreground/10 hover:border-foreground/30"
      }`}
    >
      <TrackCover
        src={track.coverArtUrl}
        alt={`${track.title} cover art`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {track.bpm != null && (
        <span className="absolute top-2 left-2 text-[10px] font-mono text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          {track.bpm} BPM
        </span>
      )}
      {isSelected && (
        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#f97316] text-white flex items-center justify-center">
          <Check className="w-3.5 h-3.5" />
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <h3 className="font-display text-sm leading-tight text-white truncate">{track.title}</h3>
        <p className="text-[11px] text-white/70 truncate">
          {[track.artist, track.genre, track.duration].filter(Boolean).join(" · ")}
        </p>
      </div>
    </button>
  );
}

export function MusicLibrarySection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");

  const browsing = query.trim().length === 0;
  const row1 = useMarqueeRow(1, browsing);
  const row2 = useMarqueeRow(-1, browsing);

  const selectedTrack = tracks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;

    fetch("/tracks.json")
      .then((res) => res.json())
      .then((data: { tracks?: EngineTrack[]; error?: string }) => {
        if (cancelled) return;
        if (data.error || !data.tracks) {
          setStatus("error");
          return;
        }
        setTracks(
          shuffle(
            data.tracks.map((t) => ({
              id: t.engine_dj_id,
              title: t.title,
              artist: t.artist,
              genre: t.genre,
              bpm: t.bpm,
              duration: t.duration,
              coverArtUrl: t.cover_art_url,
            })),
          ),
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Two rows, split from the shuffled library, each tripled for the loop illusion.
  const [row1Looped, row2Looped] = useMemo(() => {
    const half = Math.ceil(tracks.length / 2);
    const a = tracks.slice(0, half);
    const b = tracks.slice(half);
    return [
      [...a, ...a, ...a],
      [...b, ...b, ...b],
    ];
  }, [tracks]);

  const searchResults = useMemo(() => {
    if (browsing) return [];
    const q = query.trim().toLowerCase();
    return tracks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [tracks, query, browsing]);

  function scrollBothByCard(direction: 1 | -1) {
    row1.pause();
    row2.pause();
    row1.ref.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });
    row2.ref.current?.scrollBy({ left: -direction * SCROLL_STEP, behavior: "smooth" });
    row1.resumeSoon();
    row2.resumeSoon();
  }

  return (
    <section id="library" className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Music Library
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight">
              Pick a track.
              <br />
              <span className="text-muted-foreground">Request the drop.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xs text-sm sm:text-right">
            Scroll through the library, tap a track to select it, then send the
            request straight to the booth.
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks or artists…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => setTracks((prev) => shuffle(prev))}
              disabled={tracks.length === 0}
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground mb-4">Loading the library from the booth…</p>
        )}
        {status === "error" && (
          <p className="text-sm text-muted-foreground mb-4">
            Couldn&apos;t reach the library right now — try again in a bit.
          </p>
        )}
        {status === "ready" && tracks.length === 0 && (
          <p className="text-sm text-muted-foreground mb-4">No tracks in the library yet.</p>
        )}

        {browsing ? (
          <>
            <div
              ref={row1.ref}
              onScroll={row1.handleScroll}
              onPointerDown={row1.pause}
              onPointerUp={row1.resumeSoon}
              onPointerLeave={row1.resumeSoon}
              onTouchStart={row1.pause}
              onTouchEnd={row1.resumeSoon}
              className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {row1Looped.map((track, i) => (
                <TrackTile
                  key={`r1-${track.id}-${i}`}
                  track={track}
                  isSelected={track.id === selectedId}
                  onSelect={() => setSelectedId(track.id)}
                />
              ))}
            </div>
            <div
              ref={row2.ref}
              onScroll={row2.handleScroll}
              onPointerDown={row2.pause}
              onPointerUp={row2.resumeSoon}
              onPointerLeave={row2.resumeSoon}
              onTouchStart={row2.pause}
              onTouchEnd={row2.resumeSoon}
              className="flex gap-4 overflow-x-auto pb-4 mt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {row2Looped.map((track, i) => (
                <TrackTile
                  key={`r2-${track.id}-${i}`}
                  track={track}
                  isSelected={track.id === selectedId}
                  onSelect={() => setSelectedId(track.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tracks match &quot;{query}&quot;.</p>
            ) : (
              searchResults.map((track) => (
                <TrackTile
                  key={track.id}
                  track={track}
                  isSelected={track.id === selectedId}
                  onSelect={() => setSelectedId(track.id)}
                />
              ))
            )}
          </div>
        )}

        {browsing && (
          <div className="hidden sm:flex items-center gap-2 absolute -top-16 right-6 lg:right-12">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => scrollBothByCard(-1)}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => scrollBothByCard(1)}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <RequestDialog
          kind="track"
          trackTitle={selectedTrack?.title}
          trigger={
            <Button
              disabled={!selectedTrack}
              className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full px-8 h-auto min-h-12 py-3 whitespace-normal text-center disabled:opacity-40"
            >
              {selectedTrack ? `Submit Request — ${selectedTrack.title}` : "Select a track to request it"}
            </Button>
          }
        />
      </div>
    </section>
  );
}
