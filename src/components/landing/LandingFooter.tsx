import { Link } from "react-router";
import { Twitter, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";

const COLUMNS = [
  {
    heading: "Platform",
    links: [
      "Discover Destinations",
      "Plan a Trip",
      "Book Flights & Hotels",
      "Track a Shipment",
      "Trace AI",
      "Trace Rewards",
    ],
  },
  {
    heading: "Solutions",
    links: [
      "Individual Plan",
      "Individual Pro",
      "Enterprise Travel",
      "Enterprise Logistics",
      "Virtual Mailbox",
      "International Freight",
    ],
  },
  {
    heading: "Company",
    links: [
      "About Trace",
      "Careers",
      "Press & Media",
      "Blog & Insights",
      "Partnerships",
      "Investor Relations",
    ],
  },
  {
    heading: "Support",
    links: [
      "Help Centre",
      "Contact Us",
      "Track a Package",
      "Report an Issue",
      "API Documentation",
      "System Status",
    ],
  },
];

const SOCIALS = [
  { Icon: Twitter, label: "Twitter / X" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Youtube, label: "YouTube" },
];

export default function LandingFooter() {
  return (
    <footer className="relative bg-trace-midnight text-white">
      <div className="trace-divider absolute top-0 inset-x-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="font-display text-2xl tracking-[0.18em] font-bold">
              TR<span className="relative">A<span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-trace-gold" /></span>CE
            </div>
            <p className="mt-4 font-body text-sm text-white/60 leading-relaxed">
              Go Anywhere. Send Anything. Know Everything.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="h-9 w-9 rounded-full border border-white/15 grid place-items-center text-white/70 hover:text-trace-gold hover:border-trace-gold transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 trace-glass rounded-md px-3 py-2 font-body text-xs hover:bg-white/15 transition w-fit"
              >
                <span className="font-mono-trace text-[10px] text-white/50">DOWNLOAD ON</span>
                <span className="font-display text-sm">App Store</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 trace-glass rounded-md px-3 py-2 font-body text-xs hover:bg-white/15 transition w-fit"
              >
                <span className="font-mono-trace text-[10px] text-white/50">GET IT ON</span>
                <span className="font-display text-sm">Google Play</span>
              </a>
            </div>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.heading}>
              <h4 className="font-body text-xs uppercase tracking-[0.25em] text-trace-gold">{c.heading}</h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="font-body text-sm text-white/70 hover:text-white transition">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-body text-xs text-white/45">
          <div>© 2025 Trace Technologies Ltd. All rights reserved.</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition">Terms of Service</Link>
            <Link to="#" className="hover:text-white transition">Cookie Policy</Link>
            <Link to="#" className="hover:text-white transition">NDPR Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
