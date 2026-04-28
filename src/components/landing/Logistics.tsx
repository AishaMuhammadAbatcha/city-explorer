import Reveal from "./Reveal";

type SubFeature = {
  label: string;
  headline: string;
  body: string;
  tags: string[];
  img: string;
  alt: string;
  imageLeft: boolean;
};

const SUB_FEATURES: SubFeature[] = [
  {
    label: "For Individuals",
    headline: "Send packages home. Or anywhere that feels like it.",
    body:
      "Book instant courier pickups from your doorstep. Get real-time tracking, insurance options, and delivery confirmation. Cross-border personal shipping made human.",
    tags: ["Door-to-door pickup", "24h tracking", "Package insurance", "Returns handling"],
    img:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=80",
    alt: "Person packing items into a shipping box at home",
    imageLeft: true,
  },
  {
    label: "For Businesses",
    headline: "Air, sea, or land — your cargo moves on your terms.",
    body:
      "From FCL sea freight to express air cargo, Trace Enterprise connects you to a vetted global carrier network. Full customs documentation support included.",
    tags: ["FCL / LCL Sea Freight", "Air Cargo", "Last-Mile Delivery", "Customs Support"],
    img:
      "https://images.unsplash.com/photo-1577416412292-747c6607f055?w=1600&auto=format&fit=crop&q=80",
    alt: "Cargo containers loaded onto a freight ship at golden hour",
    imageLeft: false,
  },
  {
    label: "Receive Smarter",
    headline: "Your Trace address. In every major city.",
    body:
      "Get a local Trace address in 50+ cities worldwide. Have items shipped there, consolidated, then forwarded to you — anywhere. Shop globally, ship smart.",
    tags: ["Virtual Mailbox", "Package Consolidation", "Assisted Purchasing", "50+ Cities"],
    img:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&auto=format&fit=crop&q=80",
    alt: "Modern warehouse interior with packages on conveyor",
    imageLeft: true,
  },
];

export default function Logistics() {
  return (
    <section className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Send & Receive, Reimagined
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              Move what matters,
              <br />
              <span className="italic text-trace-gold">anywhere in the world.</span>
            </h2>
            <p className="mt-6 font-body text-trace-muted text-base sm:text-lg leading-relaxed">
              Trace isn't just for travelers. Whether you're sending a gift to family abroad, returning an
              online order, or shipping commercial goods — Trace handles the entire logistics chain with
              total transparency.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 space-y-24">
          {SUB_FEATURES.map((s) => (
            <Reveal key={s.headline}>
              <article
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  s.imageLeft ? "" : "lg:[&>div:first-child]:order-2"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl group">
                  <img
                    src={s.img}
                    alt={s.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-trace-midnight/30 via-transparent to-transparent" />
                </div>
                <div>
                  <span className="font-mono-trace text-[11px] tracking-[0.25em] uppercase text-trace-gold">
                    {s.label}
                  </span>
                  <h3 className="mt-3 font-display text-trace-midnight text-3xl sm:text-4xl leading-[1.1]">
                    {s.headline}
                  </h3>
                  <p className="mt-5 font-body text-trace-muted text-base leading-relaxed max-w-xl">
                    {s.body}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="font-body text-xs text-trace-midnight/80 bg-trace-ivory border border-trace-midnight/10 rounded-full px-3 py-1.5"
                      >
                        {t}
                      </span>
                    ))}
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
