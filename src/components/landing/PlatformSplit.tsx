import { Link } from "react-router";
import Reveal from "./Reveal";

const INDIVIDUAL_IMG =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&auto=format&fit=crop&q=80";
const ENTERPRISE_IMG =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&auto=format&fit=crop&q=80";

export default function PlatformSplit() {
  return (
    <section id="discover" className="relative bg-trace-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <Reveal>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
            Built for Every Traveler
          </span>
          <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl">
            One platform. <span className="italic text-trace-gold">Two worlds.</span>
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Individual */}
        <Reveal>
          <Link
            to="/signup"
            id="individual"
            className="group relative block h-[560px] overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src={INDIVIDUAL_IMG}
              alt="Solo traveler at a scenic viewpoint"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00C2A8]/95 via-[#0A0F1E]/55 to-transparent" />
            <div className="relative h-full flex flex-col justify-between p-8 sm:p-10 text-white">
              <div>
                <span className="inline-block font-body text-[11px] tracking-[0.3em] uppercase text-white/90 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                  For Individuals
                </span>
              </div>
              <div>
                <h3 className="font-display text-4xl sm:text-5xl leading-[1.05]">
                  Your World,
                  <br />
                  <span className="italic">Your Journey</span>
                </h3>
                <p className="mt-4 font-body text-white/85 max-w-md leading-relaxed">
                  Discover destinations, plan every detail, book flights and stays, ship personal packages
                  anywhere in the world — all in one beautifully simple experience.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 font-body font-semibold transition-transform group-hover:translate-x-2">
                  Explore Individual <span>→</span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* Enterprise */}
        <Reveal delay={120}>
          <Link
            to="/signup"
            id="enterprise"
            className="group relative block h-[560px] overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src={ENTERPRISE_IMG}
              alt="Executive on tarmac with private plane"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E5EFF]/95 via-[#0A0F1E]/60 to-transparent" />
            <div className="relative h-full flex flex-col justify-between p-8 sm:p-10 text-white">
              <div>
                <span className="inline-block font-body text-[11px] tracking-[0.3em] uppercase text-white/90 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                  For Enterprise
                </span>
              </div>
              <div>
                <h3 className="font-display text-4xl sm:text-5xl leading-[1.05]">
                  Your Business,
                  <br />
                  <span className="italic">Moving Smarter</span>
                </h3>
                <p className="mt-4 font-body text-white/85 max-w-md leading-relaxed">
                  Manage corporate travel programs, freight, and logistics at scale. Centralised dashboards,
                  compliance tools, real-time fleet tracking, and dedicated account management.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 font-body font-semibold transition-transform group-hover:translate-x-2">
                  Explore Enterprise <span>→</span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
