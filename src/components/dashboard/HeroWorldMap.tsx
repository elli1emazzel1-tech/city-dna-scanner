'use client';

import Image from 'next/image';
import type { Coordinates } from '../../lib/data/types';

/**
 * Compact equirectangular world map rendered from a locally served SVG
 * (public/world-land.svg, generated once from Natural Earth 1:110m land
 * polygons — public domain — via the world-atlas TopoJSON distribution).
 * No runtime map library or network request is involved.
 */
export default function HeroWorldMap({ coordinates, label }: { coordinates: Coordinates; label: string }) {
  const left = ((coordinates.longitude + 180) / 360) * 100;
  const top = ((90 - coordinates.latitude) / 180) * 100;
  return (
    <div
      className="relative aspect-[2/1] w-full overflow-hidden rounded border border-[#1b3041]/80 bg-[#060f18]/80"
      role="img"
      aria-label={`World map showing the approximate position of ${label}`}
    >
      <Image src="/world-land.svg" alt="" aria-hidden="true" unoptimized width={360} height={180} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(148,163,184,0.07) 0 1px, transparent 1px 12.5%), repeating-linear-gradient(to bottom, rgba(148,163,184,0.07) 0 1px, transparent 1px 25%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_58%,rgba(6,15,24,0.5))]" />
      <span className="absolute block h-0 w-0" style={{ left: `${left}%`, top: `${top}%` }} title={`${label} · ${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`}>
        <span className="absolute -left-2 -top-2 block h-4 w-4 animate-ping rounded-full bg-teal-300/40" />
        <span className="absolute -left-[3px] -top-[3px] block h-1.5 w-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_rgba(94,234,212,0.9)]" />
      </span>
    </div>
  );
}