import { Link } from "react-router";
import Reveal from "./Reveal";

const CTA_BG =
  "https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=2000&auto=format&fit=crop&q=80";

export default function FinalCTA() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <img
        src={CTA_BG}
        alt="City at twilight viewed from a plane window"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover trace-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/85 to-[#0A0F1E]/55" />

      <Reveal>
        <div className="relative z-10 mx-auto max-w-3xl text-center px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="font-display text-white text-5xl sm:text-6xl md:text-7xl leading-[1.02]">
            Your next journey
            <br />
            <span className="italic text-trace-gold">starts here.</span>
          </h2>
          <p className="mt-6 font-body text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Join over 2.4 million people and 500 companies who trust Trace to move them — and their world —
            forward.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="font-body font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition px-8 py-4 rounded-full shadow-[0_16px_40px_-12px_rgba(201,168,76,0.6)]"
            >
              Start for Free →
            </Link>
            <Link
              to="/signup"
              className="font-body font-medium text-white border border-white/30 hover:border-white hover:bg-white/5 transition px-8 py-4 rounded-full backdrop-blur-sm"
            >
              Book Enterprise Demo
            </Link>
          </div>
          <p className="mt-6 font-body text-xs text-white/50">
            No credit card required. Free forever plan available.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
