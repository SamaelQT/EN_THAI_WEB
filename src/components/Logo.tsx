/**
 * LinguaPath mark — an ascending route between two milestones.
 * The path reads as "lộ trình", which is what the product actually is:
 * a personalised roadmap, not a flashcard drill.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lp-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lp-mark)" />
      <path
        d="M9 24C9 18.5 16 18.5 16 13C16 9 19.5 8 23 8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <circle cx="9" cy="24" r="3" fill="white" />
      <circle cx="23" cy="8" r="3" fill="white" />
    </svg>
  );
}

export function Logo({
  className = "",
  markClass = "h-8 w-8",
  textClass = "text-xl font-bold",
}: {
  className?: string;
  markClass?: string;
  textClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClass} />
      <span className={`${textClass} bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent`}>
        LinguaPath
      </span>
    </span>
  );
}
