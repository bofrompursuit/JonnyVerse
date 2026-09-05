"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
const AUTO_SCROLL_PX_PER_SEC = 66; // ~1.1px/frame @60fps, but frame-rate independent
const CARD_GAP = 16;
const CARD_WIDTH_MOBILE = 128; // w-32
const CARD_WIDTH_DESKTOP = 144; // sm:w-36

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Tracks the sm breakpoint so the virtualizer's step size matches the card's actual rendered width. */
function useCardStep() {
  const [isSmUp, setIsSmUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsSmUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (isSmUp ? CARD_WIDTH_DESKTOP : CARD_WIDTH_MOBILE) + CARD_GAP;
}

interface MarqueeRowControls {
  ref: React.RefObject<HTMLDivElement | null>;
  pause: () => void;
  resumeSoon: () => void;
  handleScroll: () => void;
}

function makeRowControls(
  ref: React.RefObject<HTMLDivElement | null>,
  interacting: React.RefObject<boolean>,
  resumeTimeout: React.RefObject<ReturnType<typeof setTimeout> | null>,
): MarqueeRowControls {
  return {
    ref,
    pause() {
      interacting.current = true;
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    },
    resumeSoon() {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      resumeTimeout.current = setTimeout(() => {
        interacting.current = false;
      }, 2000);
    },
    handleScroll() {
      const el = ref.current;
      if (!el) return;
      const setWidth = el.scrollWidth / 3;
      if (el.scrollLeft < setWidth * 0.5) {
        el.scrollLeft += setWidth;
      } else if (el.scrollLeft > setWidth * 1.5) {
        el.scrollLeft -= setWidth;
      }
    },
  };
}

/**
 * Drives both infinitely-looping rows from a single rAF chain (half the
 * scheduling overhead of two independent loops) using delta-time-based
 * movement, so the two rows are guaranteed the exact same pixel velocity
 * regardless of frame rate — they just apply it with opposite sign.
 */
function useTwinMarquee(active: boolean) {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const interacting1 = useRef(false);
  const interacting2 = useRef(false);
  const resumeTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    const el1 = row1Ref.current;
    const el2 = row2Ref.current;
    if (el1) el1.scrollLeft = el1.scrollWidth / 3;
    if (el2) el2.scrollLeft = el2.scrollWidth / 3;
  }, [active]);

  useEffect(() => {
    const el1 = row1Ref.current;
    const el2 = row2Ref.current;
    if (!active || !el1 || !el2) return;

    let visible1 = true;
    let visible2 = true;
    const observer1 = new IntersectionObserver(([entry]) => {
      visible1 = entry.isIntersecting;
    }, { threshold: 0 });
    const observer2 = new IntersectionObserver(([entry]) => {
      visible2 = entry.isIntersecting;
    }, { threshold: 0 });
    observer1.observe(el1);
    observer2.observe(el2);

    let raf: number;
    let lastTime = 0;

    const tick = (time: number) => {
      // Clamp so a dropped/backgrounded frame doesn't cause a visible jump.
      const delta = lastTime === 0 ? 0 : Math.min(time - lastTime, 100) / 1000;
      lastTime = time;
      const distance = AUTO_SCROLL_PX_PER_SEC * delta;

      if (visible1 && !interacting1.current) {
        const setWidth = el1.scrollWidth / 3;
        el1.scrollLeft += distance;
        if (el1.scrollLeft >= setWidth * 2) el1.scrollLeft -= setWidth;
        else if (el1.scrollLeft <= 0) el1.scrollLeft += setWidth;
      }
      if (visible2 && !interacting2.current) {
        const setWidth = el2.scrollWidth / 3;
        el2.scrollLeft -= distance;
        if (el2.scrollLeft >= setWidth * 2) el2.scrollLeft -= setWidth;
        else if (el2.scrollLeft <= 0) el2.scrollLeft += setWidth;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      observer1.disconnect();
      observer2.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [active]);

  return {
    row1: makeRowControls(row1Ref, interacting1, resumeTimeout1),
    row2: makeRowControls(row2Ref, interacting2, resumeTimeout2),
  };
}

/** Measures an element's content-box width, updating on resize. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

const TrackTile = memo(function TrackTile({
  track,
  isSelected,
  onSelect,
}: {
  track: Track;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(track.id)}
      className={`track-tile relative shrink-0 w-32 sm:w-36 aspect-square overflow-hidden rounded-xl border transition-all duration-300 ${
        isSelected
          ? "border-2 border-[#f97316] desktop-fx:ring-2 desktop-fx:ring-[#f97316]/60"
          : "border-foreground/10 hover-safe:border-foreground/30"
      }`}
    >
      <TrackCover
        src={track.coverArtUrl}
        alt={`${track.title} cover art`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {track.bpm != null && (
        <span className="track-tile-badge absolute top-2 left-2 text-[10px] font-mono text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
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
        <p className="text-[11px] text-white/70 truncate">{track.artist}</p>
        {(track.genre || track.duration) && (
          <p className="track-tile-secondary text-[11px] text-white/50 truncate">
            {[track.genre, track.duration].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
});

/** One auto-scrolling, virtualized row of (tripled, looping) tracks. */
function MarqueeRow({
  items,
  scrollRef,
  onScroll,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onTouchStart,
  onTouchEnd,
  cardStep,
  selectedId,
  onSelect,
  rowLabel,
  className = "",
}: {
  items: Track[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  cardStep: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  rowLabel: string;
  className?: string;
}) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => cardStep,
    horizontal: true,
    overscan: 6,
  });

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`track-scroll-container relative overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div className="relative h-32 sm:h-36" style={{ width: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const track = items[virtualItem.index];
          return (
            <div
              key={`${rowLabel}-${track.id}-${virtualItem.index}`}
              className="track-tile-wrapper absolute top-0 left-0"
              style={{ transform: `translateX(${virtualItem.start}px)` }}
            >
              <TrackTile track={track} isSelected={track.id === selectedId} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Virtualized, row-chunked grid for search results (no natural fixed-size scroller otherwise). */
function SearchGrid({
  results,
  query,
  selectedId,
  onSelect,
  cardStep,
}: {
  results: Track[];
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  cardStep: number;
}) {
  const [scrollRef, width] = useElementWidth<HTMLDivElement>();
  const columns = Math.max(1, Math.floor(width / cardStep));
  const rowCount = Math.ceil(results.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => cardStep,
    overscan: 4,
  });

  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No tracks match &quot;{query}&quot;.</p>;
  }

  return (
    <div ref={scrollRef} className="track-scroll-container relative max-h-[70vh] overflow-y-auto">
      <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowItems = results.slice(start, start + columns);
          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 flex gap-4 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {rowItems.map((track) => (
                <TrackTile key={track.id} track={track} isSelected={track.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MusicLibrarySection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const cardStep = useCardStep();

  const browsing = query.trim().length === 0;
  const { row1, row2 } = useTwinMarquee(browsing);

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

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
            <MarqueeRow
              items={row1Looped}
              scrollRef={row1.ref}
              onScroll={row1.handleScroll}
              onPointerDown={row1.pause}
              onPointerUp={row1.resumeSoon}
              onPointerLeave={row1.resumeSoon}
              onTouchStart={row1.pause}
              onTouchEnd={row1.resumeSoon}
              cardStep={cardStep}
              selectedId={selectedId}
              onSelect={handleSelect}
              rowLabel="r1"
            />
            <MarqueeRow
              items={row2Looped}
              scrollRef={row2.ref}
              onScroll={row2.handleScroll}
              onPointerDown={row2.pause}
              onPointerUp={row2.resumeSoon}
              onPointerLeave={row2.resumeSoon}
              onTouchStart={row2.pause}
              onTouchEnd={row2.resumeSoon}
              cardStep={cardStep}
              selectedId={selectedId}
              onSelect={handleSelect}
              rowLabel="r2"
              className="mt-4"
            />
          </>
        ) : (
          <SearchGrid
            results={searchResults}
            query={query}
            selectedId={selectedId}
            onSelect={handleSelect}
            cardStep={cardStep}
          />
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
