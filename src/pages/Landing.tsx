import { useEffect } from "react";
import AnnouncementBar from "@/components/landing/AnnouncementBar";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import PlatformSplit from "@/components/landing/PlatformSplit";
import FeaturePillars from "@/components/landing/FeaturePillars";
import TrackingShowcase from "@/components/landing/TrackingShowcase";
import Destinations from "@/components/landing/Destinations";
import Logistics from "@/components/landing/Logistics";
import AIHighlight from "@/components/landing/AIHighlight";
import Testimonials from "@/components/landing/Testimonials";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingTeaser from "@/components/landing/PricingTeaser";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Trace — Go Anywhere. Send Anything. Know Everything.";

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    if (meta) {
      meta.setAttribute(
        "content",
        "The unified travel and logistics platform for individuals and enterprises. Discover, plan, book, track, and review trips worldwide. Ship anything, anywhere.",
      );
    }
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="font-body bg-white text-trace-midnight overflow-x-hidden">
      <AnnouncementBar />
      <LandingNav />
      <main>
        <Hero />
        <PlatformSplit />
        <FeaturePillars />
        <TrackingShowcase />
        <Destinations />
        <Logistics />
        <AIHighlight />
        <Testimonials />
        <StatsBar />
        <HowItWorks />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
