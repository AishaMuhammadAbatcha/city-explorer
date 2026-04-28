import { Link } from "react-router";
import Reveal from "./Reveal";

type Destination = {
  city: string;
  country: string;
  flag: string;
  category: string;
  from: string;
  img: string;
};

const DESTINATIONS: Destination[] = [
  {
    city: "Marrakech",
    country: "Morocco",
    flag: "🇲🇦",
    category: "Culture",
    from: "$420",
    img: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Bali",
    country: "Indonesia",
    flag: "🇮🇩",
    category: "Beach · Wellness",
    from: "$680",
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Istanbul",
    country: "Turkey",
    flag: "🇹🇷",
    category: "Culture · City Break",
    from: "$510",
    img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Nairobi",
    country: "Kenya",
    flag: "🇰🇪",
    category: "Adventure",
    from: "$590",
    img: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    category: "City Break · Culture",
    from: "$890",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    category: "Luxury · Business",
    from: "$750",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Lisbon",
    country: "Portugal",
    flag: "🇵🇹",
    category: "City Break",
    from: "$380",
    img: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1400&auto=format&fit=crop&q=80",
  },
  {
    city: "Cape Town",
    country: "South Africa",
    flag: "🇿🇦",
    category: "Adventure · Beach",
    from: "$520",
    img: "https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?w=1400&auto=format&fit=crop&q=80",
  },
];

export default function Destinations() {
  return (
    <section className="relative bg-gradient-to-b from-trace-ivory to-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Trending This Season
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              The world is waiting.
              <br />
              <span className="italic text-trace-gold">Where will Trace take you?</span>
            </h2>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 relative">
        {/* Edge fade */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="scrollbar-hide snap-x flex gap-6 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-6">
          {DESTINATIONS.map((d, i) => (
            <Reveal key={d.city} delay={i * 50}>
              <article className="snap-start shrink-0 w-[300px] sm:w-[360px] aspect-[3/4] relative overflow-hidden rounded-2xl group cursor-pointer shadow-lg hover:shadow-2xl transition-shadow">
                <img
                  src={d.img}
                  alt={`${d.city}, ${d.country}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/95 via-[#0A0F1E]/30 to-transparent" />

                <div className="relative h-full p-5 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <span className="trace-glass rounded-full px-3 py-1.5 font-body text-[11px] inline-flex items-center gap-1.5">
                      <span aria-hidden>{d.flag}</span> {d.country}
                    </span>
                    <span className="font-mono-trace text-[10px] uppercase tracking-[0.2em] text-trace-gold">
                      {d.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl sm:text-4xl leading-tight">{d.city}</h3>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="font-body text-xs text-white/70">From</span>
                      <span className="font-display text-2xl text-trace-gold">{d.from}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 flex flex-wrap justify-center gap-4">
        <Link
          to="/signup"
          className="font-body font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition px-7 py-3 rounded-full"
        >
          Explore All Destinations →
        </Link>
        <Link
          to="/signup"
          className="font-body font-medium text-trace-midnight border border-trace-midnight/20 hover:border-trace-midnight transition px-7 py-3 rounded-full"
        >
          Get AI Destination Recommendations
        </Link>
      </div>
    </section>
  );
}
