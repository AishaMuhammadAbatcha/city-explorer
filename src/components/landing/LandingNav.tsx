import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Discover", href: "#discover" },
  { label: "Individual", href: "#individual" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-trace-midnight/85 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="font-display text-2xl tracking-[0.18em] font-bold">
            TR<span className="relative">A<span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-trace-gold" /></span>CE
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8 font-body text-sm text-white/80">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="relative py-2 transition hover:text-white after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:scale-x-0 after:origin-left after:bg-trace-gold after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="font-body text-sm text-white/80 hover:text-white transition px-3 py-2"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="font-body text-sm font-semibold text-trace-midnight bg-trace-gold hover:bg-[#d8b75d] transition px-5 py-2.5 rounded-full shadow-[0_8px_24px_-12px_rgba(201,168,76,0.7)] hover:shadow-[0_12px_32px_-10px_rgba(201,168,76,0.9)]"
          >
            Get Started →
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-trace-midnight transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between h-[72px] px-4">
          <span className="font-display text-2xl tracking-[0.18em] font-bold text-white">TRACE</span>
          <button
            type="button"
            className="text-white p-2"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-8 mt-12 font-body">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-white text-2xl font-display"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col items-center gap-3 mt-6 w-full max-w-xs">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-white/80 border border-white/20 rounded-full py-3"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center text-trace-midnight bg-trace-gold rounded-full py-3 font-semibold"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
