interface TrackCoverPlaceholderProps {
  className?: string;
}

/** Default vinyl-record graphic shown when a track has no usable cover art. */
export function TrackCoverPlaceholder({ className }: TrackCoverPlaceholderProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="No cover art available"
      className={className}
    >
      <circle cx="100" cy="100" r="98" fill="#111114" />
      <circle cx="100" cy="100" r="98" fill="none" stroke="#2a2a30" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#232328" strokeWidth="1" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#232328" strokeWidth="1" />
      <circle cx="100" cy="100" r="44" fill="none" stroke="#232328" strokeWidth="1" />
      <circle cx="100" cy="100" r="28" fill="#f97316" />
      <circle cx="100" cy="100" r="28" fill="none" stroke="#1a1a1e" strokeWidth="1" />
      <circle cx="100" cy="100" r="5" fill="#111114" />
    </svg>
  );
}
