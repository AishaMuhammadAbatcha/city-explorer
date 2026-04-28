import { Star, Quote } from "lucide-react";
import Reveal from "./Reveal";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I planned my entire 3-week Nigeria to Europe trip through Trace. The AI suggested routes I never considered, and the visa checklist alone saved me hours of research. Booked everything in one afternoon.",
    name: "Amina K.",
    role: "Freelance Consultant, Abuja",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "We moved our corporate travel program to Trace Enterprise and cut booking time by 60%. The dashboard gives our finance team full visibility on spend, and the support is actually responsive.",
    name: "James O.",
    role: "Operations Director, Lagos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "I use Trace to ship products from Turkey and China to my store in Kaduna. Real-time tracking means I know exactly when to expect stock, and the customs support team is invaluable.",
    name: "Fatima B.",
    role: "E-commerce Entrepreneur, Kaduna",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "Trace found me a flight + hotel combo to Dubai 30% cheaper than what I'd found on my own. And when my flight got delayed, they rebooked me automatically.",
    name: "Chidi M.",
    role: "Marketing Executive, Port Harcourt",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "The package consolidation service is brilliant. I shop from 6 different international stores and Trace holds everything at their UK warehouse then ships it all together. I save a fortune on shipping.",
    name: "Zara A.",
    role: "Digital Creator, Kano",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "Managing 50+ staff travel requests used to be a nightmare. Trace Enterprise's approval workflow and policy enforcement has made our HR team's life infinitely easier.",
    name: "Emeka N.",
    role: "Head of HR, Multinational Corp",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
  },
];

export default function Testimonials() {
  return (
    <section id="about" className="relative bg-trace-ivory py-24">
      <div className="absolute inset-0 trace-topo opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Loved by Travelers & Logistics Teams
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              People who move,
              <br />
              <span className="italic text-trace-gold">swear by Trace.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 100}>
              <article className="group h-full bg-white rounded-2xl p-7 border border-trace-midnight/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative">
                <Quote className="absolute top-5 right-5 h-7 w-7 text-trace-gold/20 group-hover:text-trace-gold/40 transition" />
                <div className="flex items-center gap-1 text-trace-gold">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 font-body text-trace-midnight/90 leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3 pt-5 border-t border-trace-midnight/5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-body font-semibold text-sm text-trace-midnight">{t.name}</div>
                    <div className="font-body text-xs text-trace-muted">{t.role}</div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
