import { useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";

export default function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="bg-trace-gold text-trace-midnight font-body text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex-1 text-center sm:text-left">
          <span aria-hidden>🌍</span>{" "}
          <span className="font-medium">Now available in 190+ countries — Start your journey today.</span>{" "}
          <Link to="/signup" className="ml-2 underline underline-offset-2 hover:text-trace-midnight/80">
            Get Started →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss announcement"
          className="rounded-full p-1 hover:bg-black/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
