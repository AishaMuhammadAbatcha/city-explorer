import { Compass, MapPin, Ticket, Radar, Star } from "lucide-react";
import Reveal from "./Reveal";

const PILLARS = [
  {
    icon: Compass,
    title: "Discover",
    body:
      "Explore curated destinations, travel guides, hidden gems, and real traveler insights from 190+ countries. AI-powered recommendations tailored to your interests and budget.",
  },
  {
    icon: MapPin,
    title: "Plan",
    body:
      "Build detailed itineraries with smart scheduling, weather-aware suggestions, visa checklists, and cost estimators. Every trip planned to the last detail.",
  },
  {
    icon: Ticket,
    title: "Book",
    body:
      "Flights, accommodations, ground transport, experiences, and cargo pickups — booked from one interface, with best-price guarantees and instant confirmation.",
  },
  {
    icon: Radar,
    title: "Track",
    body:
      "Real-time GPS tracking for your shipments and travel itinerary milestones. Live flight status, last-mile delivery updates, and delay notifications — all in one feed.",
  },
  {
    icon: Star,
    title: "Review",
    body:
      "Rate destinations, airlines, hotels, and couriers. Earn Trace rewards points for verified reviews. Authentic community insight, never paid placements.",
  },
];

export default function FeaturePillars() {
  return (
    <section className="relative bg-trace-ivory py-24">
      <div className="trace-divider absolute top-0 inset-x-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Everything in One Platform
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              Five pillars.
              <br />
              <span className="italic text-trace-gold">Zero compromises.</span>
            </h2>
            <p className="mt-6 font-body text-trace-muted text-base sm:text-lg leading-relaxed">
              Every pain point around travel and logistics — handled. Trace combines five powerful
              capabilities so you never need another tool.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 80}>
                <article className="group h-full relative rounded-2xl bg-white p-7 border border-trace-midnight/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-trace-gold/30 transition-all duration-500">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-trace-gold/0 to-transparent group-hover:via-trace-gold/60 transition-all duration-500" />
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-trace-midnight/5 text-trace-midnight group-hover:bg-trace-gold group-hover:text-trace-midnight transition-colors duration-500">
                    <Icon className="h-6 w-6" strokeWidth={1.4} />
                  </div>
                  <h3 className="mt-6 font-display text-2xl text-trace-midnight">{p.title}</h3>
                  <p className="mt-3 font-body text-sm text-trace-muted leading-relaxed">{p.body}</p>
                  <div className="mt-6 font-mono-trace text-[10px] tracking-[0.2em] text-trace-gold/0 group-hover:text-trace-gold transition-colors duration-500">
                    PILLAR · 0{i + 1}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
