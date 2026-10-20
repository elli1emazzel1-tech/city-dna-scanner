'use client';

import Link from 'next/link';
import { Cookie } from 'next/font/google';
import { ArrowRight, Database, Leaf, MapPin, Waves } from 'lucide-react';

const cookie = Cookie({ weight: '400', subsets: ['latin'] });

function BrandIcon({ label, path }: { label: string; path: string }) {
  return (
    <span className="text-slate-300/70 transition-colors hover:text-teal-200" aria-label={label} role="img">
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </span>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4c.6 2.5 2.4 4.3 5 4.5" />
    </svg>
  );
}

const features = [
  { label: 'Real Data', icon: Database },
  { label: 'Real Places', icon: MapPin },
  { label: 'A Cleaner Tomorrow', icon: Leaf },
];

export default function EnrealysLanding() {
  return (
    <main
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#04090f] text-slate-100"
      aria-label="Enrealys landing page"
    >
      {/* Full-screen reference background — original image, unchanged, covers viewport edge to edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/enrealys-aurora.png')" }}
      />
      {/* Subtle dark overlay for readability only. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/45 to-transparent" />

      {/* Top navigation */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Enrealys home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-teal-300/30 bg-teal-300/10 text-teal-200">
            <Waves size={17} strokeWidth={2} />
          </span>
          <span className={`${cookie.className} text-2xl leading-none text-white`}>Enrealys</span>
        </Link>
        <p className="text-[11px] font-medium tracking-[0.22em] text-slate-300/80 uppercase">
          Environment <span className="mx-1 text-slate-500">/</span> Data{' '}
          <span className="mx-1 text-slate-500">/</span> Decisions
        </p>
      </header>

      {/* Hero — left aligned, ~13-14% from the left edge on desktop */}
      <section className="relative z-10 flex flex-1 items-center px-6 sm:px-10 md:pl-[13%] md:pr-10">
        <div className="max-w-xl">
          <h1 className={`${cookie.className} text-7xl leading-none text-white sm:text-8xl`}>Enrealys</h1>
          <p className="mt-4 text-[13px] font-light tracking-[0.05em] text-slate-200/90 sm:text-base">
            ᴜʀʙᴀɴ ᴇɴᴠɪʀᴏɴᴍᴇɴᴛᴀʟ ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ᴘʟᴀᴛꜰᴏʀᴍ
          </p>
          <p className="mt-6 max-w-md text-sm leading-[1.7] text-slate-200/85 sm:text-base">
            A unified platform for healthier environments
            <br />
            and better decisions.
          </p>

          <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3" aria-label="Platform highlights">
            {features.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-slate-200/85">
                <Icon size={15} strokeWidth={1.8} className="text-teal-300" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/dashboard"
              aria-label="Enter the Enrealys platform dashboard"
              className="group inline-flex items-center gap-2.5 rounded-sm border border-teal-300/60 bg-transparent px-7 py-3 text-sm font-medium tracking-wide text-teal-100 transition-colors hover:border-teal-200 hover:bg-teal-300/10 hover:text-white"
            >
              Enter Platform
              <ArrowRight size={16} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social icons — bottom-left, decorative (no social URLs configured) */}
      <footer className="relative z-10 flex items-center gap-5 px-6 pb-7 sm:px-10 md:pl-[13%]">
        <BrandIcon
          label="Instagram"
          path="M17.5 3h-11A4.5 4.5 0 0 0 2 7.5v9A4.5 4.5 0 0 0 6.5 21h11a4.5 4.5 0 0 0 4.5-4.5v-9A4.5 4.5 0 0 0 17.5 3ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm5.2-9.6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        />
        <span className="text-slate-300/70 transition-colors hover:text-teal-200" aria-label="TikTok" role="img">
          <TikTokIcon size={16} />
        </span>
        <BrandIcon
          label="GitHub"
          path="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1-.5 2V21"
        />
      </footer>
    </main>
  );
}
