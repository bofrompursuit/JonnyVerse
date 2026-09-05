"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// A generative, royalty-free disco/Latin groove — synthesized live in the
// browser with the Web Audio API. No audio file, nothing to license.
const BPM = 100;
const STEP_SECONDS = 60 / BPM / 4; // 16th notes
const STEPS_PER_BAR = 16;

const KICK_STEPS = new Set([0, 4, 8, 12]); // disco's four-on-the-floor
const CLOSED_HAT_STEPS = new Set([2, 6, 10, 14]);
const OPEN_HAT_STEPS = new Set([15]);
const BASS_STEPS = new Set([0, 3, 8, 11]);
const STAB_STEPS = new Set([2, 6, 10, 14]); // chic-style upbeat guitar chop
const COWBELL_STEPS = new Set([3, 6, 10, 13]); // clave-ish Latin/disco cowbell accent

// A bright major stab chord and a major-pentatonic lead scale for a warmer,
// more Latin/disco feel than a minor house lead.
const STAB_CHORD = [220, 277.18, 329.63]; // A3, C#4, E4 (A major)
const LEAD_SCALE = [220, 246.94, 277.18, 329.63, 369.99, 440]; // A major pentatonic

export function AmbientPlayer() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const schedulerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextStepTimeRef = useRef(0);
  const stepRef = useRef(0);

  function ensureContext() {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      ctxRef.current = ctx;
      masterGainRef.current = master;
      noiseBufferRef.current = noiseBuffer;
    }
    return ctxRef.current;
  }

  function playKick(ctx: AudioContext, time: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(masterGainRef.current!);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  function playHat(ctx: AudioContext, time: number, open: boolean) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBufferRef.current;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7500;
    const gain = ctx.createGain();
    const decay = open ? 0.18 : 0.045;
    gain.gain.setValueAtTime(open ? 0.18 : 0.14, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current!);
    noise.start(time);
    noise.stop(time + decay + 0.02);
  }

  function playBass(ctx: AudioContext, time: number) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.value = 55; // A1

    filter.type = "lowpass";
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.22);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current!);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  function playStab(ctx: AudioContext, time: number) {
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    filter.connect(gain);
    gain.connect(masterGainRef.current!);

    STAB_CHORD.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  function playLead(ctx: AudioContext, time: number) {
    const freq = LEAD_SCALE[Math.floor(Math.random() * LEAD_SCALE.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 3000;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current!);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  function scheduler() {
    const ctx = ctxRef.current;
    if (!ctx) return;

    while (nextStepTimeRef.current < ctx.currentTime + 0.15) {
      const step = stepRef.current % STEPS_PER_BAR;
      const time = nextStepTimeRef.current;

      if (KICK_STEPS.has(step)) playKick(ctx, time);
      if (CLOSED_HAT_STEPS.has(step)) playHat(ctx, time, false);
      if (OPEN_HAT_STEPS.has(step)) playHat(ctx, time, true);
      if (BASS_STEPS.has(step)) playBass(ctx, time);
      if (STAB_STEPS.has(step)) playStab(ctx, time);
      if (step % 2 === 0 && Math.random() < 0.35) playLead(ctx, time);

      stepRef.current += 1;
      nextStepTimeRef.current += STEP_SECONDS;
    }
    schedulerRef.current = setTimeout(scheduler, 30);
  }

  function start() {
    const ctx = ensureContext();
    if (ctx.state === "suspended") ctx.resume();
    nextStepTimeRef.current = ctx.currentTime + 0.1;
    stepRef.current = 0;

    const gain = masterGainRef.current!;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1);

    scheduler();
    setPlaying(true);
  }

  function stop() {
    const ctx = ctxRef.current;
    if (ctx && masterGainRef.current) {
      const gain = masterGainRef.current;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    }
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => (playing ? stop() : start())}
      aria-label={playing ? "Mute club loop" : "Play club loop"}
      className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-background/90 backdrop-blur-xl border border-foreground/15 shadow-lg flex items-center justify-center text-foreground/70 hover:border-[#f97316] hover:text-[#f97316] transition-all duration-300"
    >
      {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
}
