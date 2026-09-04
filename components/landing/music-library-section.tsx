"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestDialog } from "./request-dialog";

type Track = {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  duration: string;
};

const tracks: Track[] = [
  { id: "t1", title: "Neon Skyline", genre: "Melodic House", bpm: 122, duration: "5:14" },
  { id: "t2", title: "Warehouse Riot", genre: "Techno", bpm: 132, duration: "6:02" },
  { id: "t3", title: "Late Night Static", genre: "Deep House", bpm: 120, duration: "4:48" },
  { id: "t4", title: "Afterglow", genre: "Melodic Techno", bpm: 124, duration: "5:37" },
  { id: "t5", title: "Midnight Drive", genre: "Progressive House", bpm: 126, duration: "6:15" },
  { id: "t6", title: "Basement Frequency", genre: "Bass House", bpm: 128, duration: "4:52" },
  { id: "t7", title: "Solar Flare", genre: "Trance", bpm: 136, duration: "6:40" },
  { id: "t8", title: "Glass City", genre: "Techno", bpm: 130, duration: "5:28" },
  { id: "t9", title: "Analog Dreams", genre: "Melodic House", bpm: 121, duration: "5:05" },
  { id: "t10", title: "Velvet Circuit", genre: "Deep House", bpm: 119, duration: "4:33" },
  { id: "t11", title: "Chrome Horizon", genre: "Melodic Techno", bpm: 125, duration: "5:51" },
  { id: "t12", title: "Electric Bloom", genre: "Progressive House", bpm: 123, duration: "6:08" },
];

// Tripled for a seamless infinite illusion — middle copy is the "real" scroll zone.
const loopedTracks = [...tracks, ...tracks, ...tracks];

export function MusicLibrarySection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const interacting = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTrack = tracks.find((t) => t.id === selectedId) ?? null;

  // Center the scroll position on the middle copy after mount.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    el.scrollLeft = setWidth;
  }, []);

  // Auto-scroll loop, paused while the user is interacting.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;

    const tick = () => {
      if (!interacting.current) {
        const setWidth = el.scrollWidth / 3;
        el.scrollLeft += 0.6;
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
    el.scrollBy({ left: direction * 240, behavior: "smooth" });
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
                className={`shrink-0 w-52 sm:w-56 snap-center text-left p-5 border rounded-xl transition-all duration-300 ${
                  isSelected
                    ? "border-[#f97316] bg-[#f97316]/5"
                    : "border-foreground/10 hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? "border-[#f97316] text-[#f97316]"
                        : "border-foreground/20 text-foreground/50"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {track.bpm} BPM
                  </span>
                </div>
                <h3 className="font-display text-xl mb-1 leading-tight">
                  {track.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {track.genre} · {track.duration}
                </p>
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
