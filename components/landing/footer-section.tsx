"use client";

import { AnimatedWave } from "./animated-wave";
import { RequestDialog, type RequestKind } from "./request-dialog";

type LinkItem =
  | { name: string; type: "link"; href: string }
  | { name: string; type: "dialog"; kind: RequestKind };

const linkColumns: Record<string, LinkItem[]> = {
  Music: [
    { name: "Music Library", type: "link", href: "#library" },
    { name: "DJ Bootcamp", type: "dialog", kind: "bootcamp" },
  ],
  Community: [
    { name: "Join Discord Community", type: "link", href: "#cta" },
  ],
  Contact: [
    { name: "Book an Event", type: "dialog", kind: "booking" },
    { name: "Tip Your DJ", type: "link", href: "https://venmo.com/u/jonnypurse" },
  ],
  Legal: [
    { name: "Privacy", type: "link", href: "#" },
    { name: "Terms", type: "link", href: "#" },
  ],
};

const linkClass =
  "text-sm text-background/60 hover:text-background transition-colors inline-flex items-center gap-2";

export function FooterSection() {
  return (
    <footer className="relative border-t border-background/10 bg-foreground text-background">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <a href="#" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">JonnyVerse</span>
              </a>

              <p className="text-background/60 leading-relaxed mb-8 max-w-xs">
                DJ Jonnypurse — mixes, bootcamp, and live experience. Your music, your universe.
              </p>

              {/* Tip Your DJ */}
              <a
                href="https://venmo.com/u/jonnypurse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-background/15 rounded-lg text-[10px] tracking-[0.12em] uppercase text-background/60 hover:border-[#f97316] hover:text-[#f97316] transition-all duration-200"
              >
                <span className="text-[#f97316] font-bold text-xs">$</span>
                Tip Your DJ
              </a>
            </div>

            {/* Link Columns */}
            {Object.entries(linkColumns).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      {link.type === "dialog" ? (
                        <RequestDialog
                          kind={link.kind}
                          trigger={
                            <button type="button" className={linkClass}>
                              {link.name}
                            </button>
                          }
                        />
                      ) : (
                        <a href={link.href} className={linkClass}>
                          {link.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/60">
            2026 JonnyVerse. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-background/60">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              System Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
