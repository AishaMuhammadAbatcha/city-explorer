import { type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "header" | "footer";
};

export default function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={`trace-reveal ${inView ? "trace-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
