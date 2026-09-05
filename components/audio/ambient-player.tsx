"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// "Dance Robot ACTIVATE" by Loyalty Freak Music — CC0 (Public Domain
// Dedication), sourced via Wikimedia Commons from the Free Music Archive:
// https://commons.wikimedia.org/wiki/File:Loyalty_Freak_Music_-_02_-_Dance_Robot_ACTIVATE.ogg
// CC0 waives all rights, including attribution — this credit is kept purely
// for provenance, not because it's legally required.
const TRACK_SOURCES = [
  { src: "/audio/dance-robot-activate.m4a", type: "audio/mp4" },
  { src: "/audio/dance-robot-activate.ogg", type: "audio/ogg" },
];

const TARGET_VOLUME = 0.6;
const FADE_MS = 500;

export function AmbientPlayer() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function fadeTo(target: number, onDone?: () => void) {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) clearInterval(fadeRef.current);

    const steps = 20;
    const stepMs = FADE_MS / steps;
    const start = audio.volume;
    let i = 0;

    fadeRef.current = setInterval(() => {
      i += 1;
      audio.volume = start + ((target - start) * i) / steps;
      if (i >= steps) {
        if (fadeRef.current) clearInterval(fadeRef.current);
        audio.volume = target;
        onDone?.();
      }
    }, stepMs);
  }

  function start() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => setPlaying(false));
    fadeTo(TARGET_VOLUME);
    setPlaying(true);
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    fadeTo(0, () => audio.pause());
    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} loop preload="none">
        {TRACK_SOURCES.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </audio>
      <button
        type="button"
        onClick={() => (playing ? stop() : start())}
        aria-label={playing ? "Mute background track" : "Play background track"}
        className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-background/90 backdrop-blur-xl border border-foreground/15 shadow-lg flex items-center justify-center text-foreground/70 hover:border-[#f97316] hover:text-[#f97316] transition-all duration-300"
      >
        {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </>
  );
}
