// Signature motif for the "Souk Modern" menu redesign: an 8-point
// interlaced star (two overlaid squares). Used at two scales only -- a
// centred divider medallion between page sections, and a small corner tick
// on each dish card. Purely decorative: aria-hidden, no focus target.
import { cn } from "@/lib/utils";

function Star({ size }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      <rect x="5.4" y="5.4" width="9.2" height="9.2" />
      <path d="M10 3.4 16.6 10 10 16.6 3.4 10Z" />
    </svg>
  );
}

export default function MashrabiyaFret({ variant = "band", className }) {
  if (variant === "tick") {
    return (
      <span aria-hidden="true" className={className}>
        <Star size={13} />
      </span>
    );
  }

  // band: a hairline rule broken by a single centred star.
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-3 text-[color:var(--m-brass)]", className)}
    >
      <span className="h-px flex-1 bg-current opacity-35" />
      <Star size={16} />
      <span className="h-px flex-1 bg-current opacity-35" />
    </div>
  );
}
