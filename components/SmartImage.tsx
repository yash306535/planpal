"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * next/image with a graceful, offline SVG fallback. If the remote image fails
 * (404, blocked, offline), we render a themed placeholder of the same size so
 * the layout never collapses. Decorative when alt is empty.
 */
export function SmartImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`${fill ? "absolute inset-0" : "inline-block"} overflow-hidden bg-paper-deep ${className ?? ""}`}
        style={fill ? undefined : { width, height }}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <rect width="100" height="100" className="fill-paper-deep" />
          <circle cx="50" cy="40" r="24" className="fill-accent/20" />
          <circle cx="50" cy="40" r="10" className="fill-accent/30" />
          <path
            d="M12 82 Q50 56 88 82"
            className="stroke-accent-deep/50"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
