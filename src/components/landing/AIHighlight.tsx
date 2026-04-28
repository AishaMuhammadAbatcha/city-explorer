import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import Reveal from "./Reveal";

const PROMPTS = [
  "Book me the cheapest business class flight to London next month",
  "What documents do I need to ship electronics to Canada?",
  "Plan a 5-day honeymoon in Zanzibar under $3,000",
  "Track my package — ID TRC-8821-KAD",
  "Find hotels near Murtala Muhammed Airport with airport shuttles",
  "What's the cheapest way to ship 20kg from Kano to the UK?",
];

export default function AIHighlight() {
  return (
    <section className="relative bg-trace-midnight text-white py-24 overflow-hidden">
      {/* Radial gold glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-trace-gold/15 blur-[120px]" />
      {/* Constellation overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <defs>
          <pattern id="constellation" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.6" fill="#C9A84C" opacity="0.5" />
            <circle cx="22" cy="18" r="0.4" fill="#fff" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#constellation)" />
      </svg>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.3em] text-trace-gold">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Trace AI
          </span>
          <h2 className="mt-5 font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02]">
            Just tell Trace
            <br />
            <span className="italic text-trace-gold">what you need.</span>
          </h2>
          <p className="mt-6 font-body text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Our agentic AI searches across flights, hotels, logistics networks, and destination databases
            in real time — then presents you with a plan, not just results. Ask anything. Trace handles the
            research.
          </p>
        </Reveal>

        {/* AI conversation mockup */}
        <Reveal delay={150}>
          <div className="mt-14 mx-auto max-w-2xl text-left">
            <div className="trace-glass rounded-2xl p-5 sm:p-6 space-y-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-white/10 rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] font-body text-sm text-white/90">
                  Find me a 10-day trip to East Africa under $2,000 including flights from Abuja
                </div>
              </div>

              {/* Trace AI typing/response */}
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-trace-gold to-[#a98735] grid place-items-center">
                  <Sparkles className="h-4 w-4 text-trace-midnight" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="font-mono-trace text-[10px] tracking-[0.18em] text-trace-gold">
                    TRACE AI · THINKING
                  </div>
                  <div className="trace-glass-light rounded-xl p-4 border border-trace-gold/20">
                    <div className="font-body text-sm font-semibold text-white">
                      10-day East Africa Loop · ABV → NBO → ZNZ → ABV
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 font-mono-trace text-[10px]">
                      <div className="trace-glass-light rounded-md p-2">
                        <div className="text-white/45">FLIGHTS</div>
                        <div className="text-white mt-1">$840</div>
                      </div>
                      <div className="trace-glass-light rounded-md p-2">
                        <div className="text-white/45">STAYS</div>
                        <div className="text-white mt-1">$620</div>
                      </div>
                      <div className="trace-glass-light rounded-md p-2">
                        <div className="text-white/45">EXPERIENCES</div>
                        <div className="text-white mt-1">$420</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between font-body text-xs">
                      <span className="text-white/60">Total · 10 days · 2 countries</span>
                      <span className="text-trace-gold font-semibold">$1,880</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="font-body text-xs font-semibold text-trace-midnight bg-trace-gold rounded-full px-4 py-2"
                    >
                      Book this plan →
                    </button>
                    <button
                      type="button"
                      className="font-body text-xs text-white/80 border border-white/20 rounded-full px-4 py-2"
                    >
                      Adjust budget
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Cycling prompt chips marquee */}
        <Reveal delay={300}>
          <div className="mt-12 relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-trace-midnight to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-trace-midnight to-transparent z-10" />
            <div className="flex gap-3 trace-marquee w-max">
              {[...PROMPTS, ...PROMPTS].map((p, i) => (
                <span
                  key={`${p}-${i}`}
                  className="trace-glass rounded-full px-5 py-2.5 font-body text-sm text-white/85 whitespace-nowrap"
                >
                  "{p}"
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <Link
            to="/search"
            className="mt-12 inline-flex items-center gap-2 font-body font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition px-8 py-4 rounded-full shadow-[0_16px_40px_-12px_rgba(201,168,76,0.6)]"
          >
            Try Trace AI Free →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
