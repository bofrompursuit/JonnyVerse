"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function MusicLibrarySection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const interacting = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tripled for a seamless infinite illusion — middle copy is the "real" scroll zone.
  const loopedTracks = useMemo(() => [...tracks, ...tracks, ...tracks], [tracks]);

  const selectedTrack = tracks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;

    fetch("/api/library/tracks")
      .then((res) => res.json())
      .then((data: { tracks?: EngineTrack[]; error?: string }) => {
        if (cancelled) return;
        if (data.error || !data.tracks) {
          setStatus("error");
          return;
        }
        setTracks(
          data.tracks.map((t) => ({
            id: t.engine_dj_id,
            title: t.title,
            artist: t.artist,
            genre: t.genre,
            bpm: t.bpm,
            duration: t.duration,
            coverArtUrl: t.cover_art_url,
          })),
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

  // Center the scroll position on the middle copy once tracks load.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || tracks.length === 0) return;
    const setWidth = el.scrollWidth / 3;
    el.scrollLeft = setWidth;
  }, [tracks.length]);

  // Auto-scroll loop, paused while the user is interacting.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;

    const tick = () => {
      if (!interacting.current) {
        const setWidth = el.scrollWidth / 3;
        el.scrollLeft += 1.1;
        if (el.scrollLeft >= setWidth * 2) {
          el.scrollLeft -= setWidth;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += setWidth;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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

  function scrollByCard(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    pause();
    el.scrollBy({ left: direction * 192, behavior: "smooth" });
    resumeSoon();
  }

  // Keep the loop centered — jump silently when drifting into the outer copies.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    if (el.scrollLeft < setWidth * 0.5) {
      el.scrollLeft += setWidth;
    } else if (el.scrollLeft > setWidth * 1.5) {
      el.scrollLeft -= setWidth;
    }
  }

  return (
    <section id="library" className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12 lg:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
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
      </div>

      {/* Rolodex */}
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

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={pause}
          onPointerUp={resumeSoon}
          onPointerLeave={resumeSoon}
          onTouchStart={pause}
          onTouchEnd={resumeSoon}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loopedTracks.map((track, i) => {
            const isSelected = track.id === selectedId;
            return (
              <button
                key={`${track.id}-${i}`}
                type="button"
                onClick={() => setSelectedId(track.id)}
                className={`relative shrink-0 w-44 sm:w-48 aspect-square snap-center overflow-hidden rounded-xl border transition-all duration-300 ${
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
                  <span className="absolute top-3 left-3 text-[11px] font-mono text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {track.bpm} BPM
                  </span>
                )}
                {isSelected && (
                  <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#f97316] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <h3 className="font-display text-base sm:text-lg leading-tight text-white truncate">
                    {track.title}
                  </h3>
                  <p className="text-xs text-white/70 truncate">
                    {[track.artist, track.genre, track.duration].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Arrow controls */}
        <div className="hidden sm:flex items-center gap-2 absolute -top-16 right-6 lg:right-12">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => scrollByCard(1)}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
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
