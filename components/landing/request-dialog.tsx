"use client";

import { useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Headphones, Sliders, Users, Zap } from "lucide-react";

export type RequestKind = "bootcamp" | "booking" | "track";

interface RequestDialogProps {
  kind: RequestKind;
  trigger: ReactNode;
  trackTitle?: string;
}

const CONTACT_EMAIL = "bookings@jonnyverse.com";

const bootcampHighlights = [
  {
    icon: Sliders,
    title: "DJ 101",
    description: "Beat matching, phrasing, and EQ — the fundamentals, taught hands-on.",
  },
  {
    icon: Headphones,
    title: "Hands-On Time",
    description: "Real mixer time every session. Not just theory — you're on the decks.",
  },
  {
    icon: Zap,
    title: "Set Building",
    description: "Learn to read a crowd and build a set that actually moves a room.",
  },
  {
    icon: Users,
    title: "1-on-1 Attention",
    description: "Direct feedback from Jonnypurse, paced to where you're at.",
  },
];

type FormState = {
  name: string;
  email: string;
  date: string;
  venue: string;
  level: string;
  message: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  date: "",
  venue: "",
  level: "",
  message: "",
};

export function RequestDialog({ kind, trigger, trackTitle }: RequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"preview" | "form" | "sent">(
    kind === "bootcamp" ? "preview" : "form"
  );
  const [form, setForm] = useState<FormState>(emptyForm);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep(kind === "bootcamp" ? "preview" : "form");
      setForm(emptyForm);
    }
  }

  function handleChange(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function buildMailto() {
    let subject = "";
    let body = "";

    if (kind === "bootcamp") {
      subject = "DJ Bootcamp — 1-on-1 Lesson Request";
      body = `Name: ${form.name}\nEmail: ${form.email}\nExperience level: ${form.level || "—"}\nPreferred date: ${form.date || "—"}\n\nMessage:\n${form.message}`;
    } else if (kind === "booking") {
      subject = "Event Booking Request";
      body = `Name: ${form.name}\nEmail: ${form.email}\nEvent date: ${form.date || "—"}\nVenue: ${form.venue || "—"}\n\nMessage:\n${form.message}`;
    } else {
      subject = `Track Request${trackTitle ? `: ${trackTitle}` : ""}`;
      body = `Name: ${form.name}\nEmail: ${form.email}\nTrack: ${trackTitle ?? "—"}\n\nNote:\n${form.message}`;
    }

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.href = buildMailto();
    setStep("sent");
  }

  const titles: Record<RequestKind, string> = {
    bootcamp: "DJ Bootcamp",
    booking: "Book an Event",
    track: trackTitle ? `Request "${trackTitle}"` : "Request a Track",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {step === "preview" && kind === "bootcamp" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl sm:text-3xl">
                DJ Bootcamp — Sneak Peek
              </DialogTitle>
              <DialogDescription>
                A hands-on intro before you commit to a lesson.
              </DialogDescription>
            </DialogHeader>

            <div className="grid sm:grid-cols-2 gap-4 py-2">
              {bootcampHighlights.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 p-4 border border-foreground/10 rounded-lg"
                >
                  <item.icon className="w-5 h-5 text-[#f97316]" />
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full"
                onClick={() => setStep("form")}
              >
                Schedule a 1-on-1 Lesson
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl sm:text-3xl">
                {titles[kind]}
              </DialogTitle>
              <DialogDescription>
                {kind === "bootcamp" &&
                  "Tell us a bit about you and we'll set up your 1-on-1 lesson."}
                {kind === "booking" &&
                  "Share your event details and we'll follow up to confirm."}
                {kind === "track" &&
                  "Send this track request straight to the DJ booth."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="rd-name">Name</Label>
                  <Input
                    id="rd-name"
                    required
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="rd-email">Email</Label>
                  <Input
                    id="rd-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {kind === "bootcamp" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="rd-level">Experience level</Label>
                    <select
                      id="rd-level"
                      value={form.level}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, level: e.target.value }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="">Select one</option>
                      <option value="Complete beginner">Complete beginner</option>
                      <option value="Some experience">Some experience</option>
                      <option value="Intermediate">Intermediate</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rd-date">Preferred date</Label>
                    <Input
                      id="rd-date"
                      type="date"
                      value={form.date}
                      onChange={handleChange("date")}
                    />
                  </div>
                </div>
              )}

              {kind === "booking" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="rd-date">Event date</Label>
                    <Input
                      id="rd-date"
                      type="date"
                      value={form.date}
                      onChange={handleChange("date")}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rd-venue">Venue / location</Label>
                    <Input
                      id="rd-venue"
                      value={form.venue}
                      onChange={handleChange("venue")}
                      placeholder="Venue or city"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="rd-message">
                  {kind === "track" ? "Note (optional)" : "Message"}
                </Label>
                <textarea
                  id="rd-message"
                  value={form.message}
                  onChange={handleChange("message")}
                  rows={3}
                  placeholder={
                    kind === "track"
                      ? "Anything specific — a request, a shoutout, an event this is for..."
                      : "Tell us more..."
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full"
                >
                  Send Request
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "sent" && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <CheckCircle2 className="w-12 h-12 text-[#f97316]" />
            <DialogTitle className="font-display text-2xl">Request ready</DialogTitle>
            <DialogDescription className="max-w-sm">
              Your email client should have opened with the request pre-filled.
              If it didn&apos;t, email us directly at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
                {CONTACT_EMAIL}
              </a>
              .
            </DialogDescription>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
