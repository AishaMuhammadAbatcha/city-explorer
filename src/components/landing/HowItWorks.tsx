import { useState } from "react";
import { UserCircle, Search, CheckCircle2, MapPinned, Award, Building2, Users, BadgeCheck, BarChart3, Headphones } from "lucide-react";
import Reveal from "./Reveal";

const INDIVIDUAL_STEPS = [
  { icon: UserCircle, title: "Create Your Account", body: "Sign up in under 2 minutes. Tell Trace your travel style, preferred departure cities, and shipping needs. Your AI profile is instantly ready." },
  { icon: Search, title: "Discover or Request", body: "Search destinations, ask Trace AI a question, or request a shipment pickup. Our agent searches globally in seconds." },
  { icon: CheckCircle2, title: "Book or Schedule", body: "Confirm your booking or schedule your courier pickup in one tap. Payments, confirmations, and documents — handled." },
  { icon: MapPinned, title: "Track Everything Live", body: "Watch your trip and shipments unfold in real time. Notifications keep you ahead of any changes." },
  { icon: Award, title: "Review & Earn", body: "After every trip or delivery, share your experience. Earn Trace Rewards redeemable on future bookings." },
];

const ENTERPRISE_STEPS = [
  { icon: Building2, title: "Set Up Your Organisation", body: "Onboard your company in under 30 minutes. Configure travel policies, approval tiers, cost centres, and employee access levels." },
  { icon: Users, title: "Employees Self-Serve", body: "Staff book their own travel and shipments within your defined limits. No more email chains. Full policy enforcement baked in." },
  { icon: BadgeCheck, title: "Approve & Control", body: "Managers receive smart approval requests with full cost context. Finance gets real-time spend visibility." },
  { icon: BarChart3, title: "Track & Report", body: "Executive-level dashboards show total travel spend, emissions footprint, carrier performance, and compliance metrics." },
  { icon: Headphones, title: "Dedicated Support", body: "Your dedicated Trace account manager is reachable by phone, chat, and email — 24/7. Crisis support included." },
];

export default function HowItWorks() {
  const [tab, setTab] = useState<"individual" | "enterprise">("individual");
  const steps = tab === "individual" ? INDIVIDUAL_STEPS : ENTERPRISE_STEPS;

  return (
    <section id="how" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-trace-muted">
              Simple from Day One
            </span>
            <h2 className="mt-4 font-display text-trace-midnight text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
              Up and running
              <br />
              <span className="italic text-trace-gold">in minutes.</span>
            </h2>
          </div>
        </Reveal>

        {/* Tab toggle */}
        <Reveal>
          <div className="mt-12 flex justify-center">
            <div role="tablist" className="inline-flex bg-trace-ivory rounded-full p-1.5 border border-trace-midnight/5">
              {(["individual", "enterprise"] as const).map((key) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`font-body text-sm font-medium px-6 py-2.5 rounded-full transition-all ${
                    tab === key
                      ? "bg-trace-midnight text-white shadow-md"
                      : "text-trace-midnight/60 hover:text-trace-midnight"
                  }`}
                >
                  {key === "individual" ? "Individual" : "Enterprise"}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connecting vertical line */}
          <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-trace-gold/30 to-transparent" />

          <div className="space-y-12 lg:space-y-20">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isOdd = i % 2 === 1;
              return (
                <Reveal key={`${tab}-${s.title}`} delay={i * 80}>
                  <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isOdd ? "lg:[&>*:first-child]:order-2" : ""}`}>
                    {/* Illustration block */}
                    <div className="relative">
                      <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-trace-ivory via-white to-trace-ivory border border-trace-midnight/5 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,168,76,0.12),transparent_60%)]" />
                        <Icon className="h-24 w-24 text-trace-gold relative z-10 transition-transform duration-700 group-hover:scale-110" strokeWidth={1.2} />
                        <div className="absolute top-4 right-4 font-mono-trace text-[10px] text-trace-midnight/40 tracking-[0.25em]">
                          STEP · 0{i + 1}
                        </div>
                      </div>
                    </div>
                    {/* Copy */}
                    <div>
                      <div className="font-display text-7xl text-trace-gold/25 font-medium leading-none">
                        0{i + 1}
                      </div>
                      <h3 className="mt-2 font-display text-3xl sm:text-4xl text-trace-midnight">{s.title}</h3>
                      <p className="mt-4 font-body text-trace-muted text-base leading-relaxed max-w-lg">{s.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
