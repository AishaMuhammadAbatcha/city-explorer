import { useInView, useCountUp } from "@/hooks/useInView";

type StatProps = {
  value: number;
  suffix?: string;
  decimal?: boolean;
  label: string;
  detail: string;
  inView: boolean;
};

function Stat({ value, suffix = "", decimal, label, detail, inView }: StatProps) {
  const animated = useCountUp(decimal ? value * 10 : value, 1800, inView);
  let display: string;
  if (decimal) display = (animated / 10).toFixed(1);
  else if (value >= 1_000_000) display = `${(animated / 1_000_000).toFixed(1)}M`;
  else display = animated.toLocaleString();
  return (
    <div className="text-center">
      <div className="font-display text-5xl sm:text-6xl md:text-7xl text-white font-medium leading-none">
        {display}
        <span className="text-trace-gold">{suffix}</span>
      </div>
      <div className="mt-4 font-body text-sm sm:text-base text-white/85 font-semibold">{label}</div>
      <div className="mt-1 font-body text-xs sm:text-sm text-white/45">{detail}</div>
    </div>
  );
}

export default function StatsBar() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  return (
    <section ref={ref} className="relative bg-trace-midnight py-24 overflow-hidden">
      <div className="absolute inset-0 trace-topo opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        <Stat value={190} suffix="+" label="Countries Covered" detail="Worldwide" inView={inView} />
        <Stat value={2_400_000} suffix="+" label="Trips Planned" detail="& Booked" inView={inView} />
        <Stat value={50} suffix="+" label="Cities with" detail="Trace Addresses" inView={inView} />
        <Stat value={99.7} decimal suffix="%" label="On-Time" detail="Delivery Rate" inView={inView} />
      </div>
    </section>
  );
}
