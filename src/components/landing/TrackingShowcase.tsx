import { Check, Plane, Package } from "lucide-react";
import Reveal from "./Reveal";

const BULLETS = [
  "Real-time GPS position for every shipment",
  "Live flight tracking with gate and delay alerts",
  "Predictive ETA powered by AI",
  "Multi-stop itinerary milestone tracking",
  "Automated customs clearance status",
  "Instant SMS and push notifications",
];

export default function TrackingShowcase() {
  return (
    <section id="tracking" className="relative bg-trace-midnight text-white overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 trace-topo opacity-50" />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-trace-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <Reveal>
          <div>
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-gold">
              Live. Intelligent. Unified.
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              Track your package
              <br />
              and your flight —
              <br />
              <span className="italic text-trace-gold">in the same feed.</span>
            </h2>
            <p className="mt-6 font-body text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
              Trace merges travel tracking and shipment tracking into one real-time intelligence feed.
              Know exactly where your cargo is, where your flight is, and what to expect at every step —
              without switching apps.
            </p>

            <ul className="mt-8 space-y-3">
              {BULLETS.map((b, i) => (
                <Reveal key={b} delay={i * 60}>
                  <li className="flex items-start gap-3 font-body text-white/85">
                    <Check className="h-5 w-5 mt-0.5 text-trace-teal shrink-0" />
                    <span>{b}</span>
                  </li>
                </Reveal>
              ))}
            </ul>

            <a
              href="#how"
              className="mt-10 inline-flex items-center gap-2 font-body font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition px-6 py-3 rounded-full"
            >
              See How Tracking Works <span>→</span>
            </a>
          </div>
        </Reveal>

        {/* Right — animated dashboard mockup */}
        <Reveal delay={150}>
          <div className="relative">
            {/* Map backdrop */}
            <div className="relative aspect-[4/5] rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1530] via-[#0A0F1E] to-[#070A14] overflow-hidden p-6 shadow-2xl">
              {/* Constellation grid */}
              <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 500" aria-hidden>
                <defs>
                  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.7" fill="#C9A84C" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
                {/* Route path: Lagos → London */}
                <path
                  d="M 60 380 Q 200 200 340 90"
                  stroke="#C9A84C"
                  strokeWidth="1.5"
                  fill="none"
                  className="trace-route-line"
                  strokeDasharray="4 6"
                />
                <circle cx="60" cy="380" r="6" fill="#00C2A8" />
                <circle cx="340" cy="90" r="6" fill="#C9A84C" className="trace-pulse" />
              </svg>

              {/* Floating shipment card */}
              <div className="trace-glass relative z-10 rounded-xl p-4 mt-2 trace-drift">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-trace-teal/20 grid place-items-center text-trace-teal">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-mono-trace text-[10px] text-white/50 tracking-[0.18em]">TRC-8821-KAD</div>
                      <div className="font-body text-sm text-white">Lagos → London</div>
                    </div>
                  </div>
                  <span className="font-mono-trace text-[10px] px-2 py-0.5 rounded-full bg-trace-teal/15 text-trace-teal border border-trace-teal/30">
                    IN TRANSIT
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-trace-teal to-trace-gold" />
                </div>
                <div className="mt-2 flex justify-between font-mono-trace text-[10px] text-white/50">
                  <span>LOS · 04:21 GMT</span>
                  <span>ETA LHR · 14:50 GMT</span>
                </div>
              </div>

              {/* Floating flight card */}
              <div className="trace-glass relative z-10 rounded-xl p-4 mt-3 trace-drift" style={{ animationDelay: "1.2s" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-trace-gold/20 grid place-items-center text-trace-gold">
                      <Plane className="h-4 w-4 -rotate-45" />
                    </div>
                    <div>
                      <div className="font-mono-trace text-[10px] text-white/50 tracking-[0.18em]">FLIGHT · BA0074</div>
                      <div className="font-body text-sm text-white">LOS → LHR · 4h 20m to arrival</div>
                    </div>
                  </div>
                  <span className="font-mono-trace text-[10px] px-2 py-0.5 rounded-full bg-trace-gold/15 text-trace-gold border border-trace-gold/30">
                    ON TIME
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono-trace text-[10px] text-white/60">
                  <div className="trace-glass-light rounded-md py-1.5">
                    <div className="text-white/85">38,000ft</div>
                    <div className="text-[8px] mt-0.5 text-white/40">ALTITUDE</div>
                  </div>
                  <div className="trace-glass-light rounded-md py-1.5">
                    <div className="text-white/85">521 mph</div>
                    <div className="text-[8px] mt-0.5 text-white/40">SPEED</div>
                  </div>
                  <div className="trace-glass-light rounded-md py-1.5">
                    <div className="text-white/85">B7</div>
                    <div className="text-[8px] mt-0.5 text-white/40">GATE</div>
                  </div>
                </div>
              </div>

              {/* Countdown card */}
              <div className="trace-glass relative z-10 rounded-xl p-4 mt-3">
                <div className="flex items-center justify-between">
                  <div className="font-body text-xs text-white/60 uppercase tracking-wider">Arrival countdown</div>
                  <span className="h-2 w-2 rounded-full bg-trace-teal trace-pulse" />
                </div>
                <div className="mt-2 font-display text-3xl text-white">
                  04<span className="text-white/30">:</span>20<span className="text-white/30">:</span>14
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
