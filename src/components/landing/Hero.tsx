import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useInView, useCountUp } from "@/hooks/useInView";

const HERO_SCENES = [
  // Airport runway at night
  "https://images.unsplash.com/photo-1540339832862-474599807836?w=2000&auto=format&fit=crop&q=80",
  // Coastal city timelapse (Istanbul rooftops)
  "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=2000&auto=format&fit=crop&q=80",
  // Doorstep delivery
  "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=2000&auto=format&fit=crop&q=80",
  // Glass terminal traveler
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=2000&auto=format&fit=crop&q=80",
  // Cargo containers / port
  "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=2000&auto=format&fit=crop&q=80",
];

function HeroStat({
  value,
  suffix,
  label,
  decimal,
  inView,
}: { value: number; suffix: string; label: string; decimal?: boolean; inView: boolean }) {
  const animated = useCountUp(decimal ? value * 10 : value, 1800, inView);
  let display: string;
  if (decimal) display = (animated / 10).toFixed(1);
  else if (value >= 1_000_000) display = `${(animated / 1_000_000).toFixed(1)}M`;
  else display = animated.toLocaleString();
  return (
    <div className="text-center">
      <div className="font-display text-3xl sm:text-4xl text-white font-medium">
        {display}
        <span className="text-trace-gold">{suffix}</span>
      </div>
      <div className="font-body text-xs sm:text-sm text-white/60 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Hero() {
  const [scene, setScene] = useState(0);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  useEffect(() => {
    const t = setInterval(() => setScene((s) => (s + 1) % HERO_SCENES.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-trace-midnight">
      {/* Cinematic image stack — cross-fades between hero scenes */}
      <div className="absolute inset-0">
        {HERO_SCENES.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${
              i === scene ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== scene}
          >
            <img
              src={src}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover trace-ken-burns"
            />
          </div>
        ))}
      </div>

      {/* Deep midnight gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/70 to-[#0A0F1E]/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1E]/60 via-transparent to-transparent" />

      {/* Decorative dashed route line */}
      <svg
        className="pointer-events-none absolute bottom-32 left-0 w-full h-48 opacity-[0.18]"
        viewBox="0 0 1200 200"
        fill="none"
        aria-hidden
      >
        <path
          d="M -50 180 C 200 80, 500 220, 800 60 S 1100 180, 1300 40"
          stroke="#C9A84C"
          strokeWidth="1.5"
          className="trace-route-line"
          fill="none"
        />
        <circle cx="180" cy="135" r="3" fill="#C9A84C" className="trace-pulse" />
        <circle cx="640" cy="120" r="3" fill="#C9A84C" className="trace-pulse" />
        <circle cx="1020" cy="100" r="3" fill="#C9A84C" className="trace-pulse" />
      </svg>

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pt-32 pb-40">
        <div className="trace-rise trace-rise-1">
          <span className="inline-flex items-center gap-2 font-body text-trace-gold text-xs sm:text-sm uppercase tracking-[0.28em]">
            <span aria-hidden>✦</span> The Future of Travel & Logistics
          </span>
        </div>

        <h1 className="mt-6 font-display text-white font-medium leading-[0.95] text-[14vw] sm:text-7xl md:text-8xl lg:text-[96px]">
          <span className="block trace-rise trace-rise-2">Go Anywhere.</span>
          <span className="block trace-rise trace-rise-3 text-trace-gold/95">Send Anything.</span>
          <span className="block trace-rise trace-rise-4">Know Everything.</span>
        </h1>

        <p className="trace-rise trace-rise-5 mt-8 max-w-[640px] font-body text-base sm:text-xl text-white/65 leading-relaxed">
          Trace is the unified intelligence platform that handles your travel from inspiration to arrival —
          and your shipments from origin to doorstep. For individuals. For enterprises. For everyone on the move.
        </p>

        <div className="trace-rise trace-rise-5 mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 font-body font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition-all px-7 py-4 rounded-full shadow-[0_16px_40px_-12px_rgba(201,168,76,0.55)]"
          >
            Plan a Trip
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="#tracking"
            className="inline-flex items-center gap-2 font-body font-medium text-white border border-white/30 hover:border-white hover:bg-white/5 transition-all px-7 py-4 rounded-full backdrop-blur-sm"
          >
            Track a Shipment
          </a>
        </div>

        {/* Hero stats strip — glassmorphism bar */}
        <div ref={ref} className="trace-rise trace-rise-5 mt-auto pt-16">
          <div className="trace-glass rounded-2xl px-6 py-6 sm:px-10 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <HeroStat value={190} suffix="+" label="Countries Covered" inView={inView} />
            <HeroStat value={2_400_000} suffix="+" label="Trips Planned" inView={inView} />
            <HeroStat value={99.7} decimal suffix="%" label="On-Time Rate" inView={inView} />
            <HeroStat value={500} suffix="+" label="Enterprise Clients" inView={inView} />
          </div>
        </div>
      </div>

      {/* Scene indicator dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_SCENES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show scene ${i + 1}`}
            onClick={() => setScene(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === scene ? "w-8 bg-trace-gold" : "w-4 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
