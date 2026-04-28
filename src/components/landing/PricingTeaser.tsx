import { Link } from "react-router";
import { Check, Sparkles } from "lucide-react";
import Reveal from "./Reveal";

type Tier = {
  badge: string;
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    badge: "FREE",
    name: "Individual Free",
    price: "₦0",
    period: "/ month",
    features: [
      "AI-powered trip discovery",
      "Up to 3 bookings/month",
      "Basic shipment tracking",
      "Trace community reviews",
      "Standard support",
    ],
    cta: "Get Started Free",
    href: "/signup",
  },
  {
    badge: "MOST POPULAR ✦",
    name: "Individual Pro",
    price: "₦4,900",
    period: "/ month",
    features: [
      "Unlimited bookings",
      "Trace AI (full access)",
      "Real-time multi-shipment tracking",
      "Virtual mailbox in 3 cities",
      "Trip insurance integration",
      "Priority support",
      "Trace Rewards (2x points)",
    ],
    cta: "Start 14-Day Free Trial",
    href: "/signup",
    featured: true,
  },
  {
    badge: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited seats",
      "Corporate travel policy engine",
      "Freight & cargo management",
      "Custom approval workflows",
      "ERP/HRMS integrations",
      "Dedicated account manager",
      "SLA-backed support",
      "Custom reporting & analytics",
    ],
    cta: "Book a Demo",
    href: "/signup",
  },
];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="relative bg-trace-ivory py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Simple Pricing
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              Plans that grow
              <br />
              <span className="italic text-trace-gold">with you.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <article
                className={`relative h-full rounded-3xl p-8 transition-all duration-500 hover:-translate-y-1 ${
                  t.featured
                    ? "bg-gradient-to-br from-[#0A0F1E] to-[#1a2240] text-white shadow-2xl scale-[1.02] border border-trace-gold/40"
                    : "bg-white text-trace-midnight border border-trace-midnight/5 shadow-md hover:shadow-xl"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-trace-gold to-transparent" />
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono-trace text-[10px] tracking-[0.25em] inline-flex items-center gap-1 ${
                      t.featured ? "text-trace-gold" : "text-trace-muted"
                    }`}
                  >
                    {t.featured && <Sparkles className="h-3 w-3" />} {t.badge}
                  </span>
                </div>
                <div className="mt-3 font-display text-2xl">{t.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-medium">{t.price}</span>
                  {t.period && (
                    <span className={`font-body text-sm ${t.featured ? "text-white/60" : "text-trace-muted"}`}>
                      {t.period}
                    </span>
                  )}
                </div>

                <ul className="mt-7 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 font-body text-sm">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          t.featured ? "text-trace-gold" : "text-trace-teal"
                        }`}
                      />
                      <span className={t.featured ? "text-white/85" : "text-trace-midnight/80"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={t.href}
                  className={`mt-8 block w-full text-center font-body font-semibold py-3.5 rounded-full transition-all ${
                    t.featured
                      ? "bg-trace-gold text-trace-midnight hover:bg-[#d8b75d]"
                      : "bg-trace-midnight text-white hover:bg-trace-midnight/90"
                  }`}
                >
                  {t.cta}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 text-center">
            <Link
              to="/signup"
              className="font-body text-trace-midnight underline underline-offset-4 hover:text-trace-gold transition"
            >
              See Full Pricing & Feature Comparison →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
