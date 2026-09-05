"use client";

import { useState } from "react";
import { TrackCoverPlaceholder } from "./track-cover-placeholder";

interface TrackCoverProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * Renders a track's cover art with a graceful fallback to the vinyl
 * placeholder when `src` is missing or the image fails to load (broken URL,
 * expired scrape, offline file path, etc).
 */
export function TrackCover({ src, alt, className }: TrackCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <TrackCoverPlaceholder className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- sources are arbitrary external/local URLs not known at build time
    <img
      src={src}
      alt={alt}
      className={className}
      width={144}
      height={144}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
