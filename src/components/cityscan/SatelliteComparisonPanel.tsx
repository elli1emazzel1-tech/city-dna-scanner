'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FindingSummary } from './cityscan-types';

type LayerId = 'ndvi' | 'ndwi' | 'trueColour';

interface SatelliteComparisonPanelProps {
  finding: FindingSummary | null;
}

export function SatelliteComparisonPanel({
  finding,
}: SatelliteComparisonPanelProps) {
  const [layer, setLayer] = useState<LayerId>('trueColour');
  const [comparisonMode, setComparisonMode] = useState<'sideBySide' | 'overlay'>('sideBySide');
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeDate = useMemo(() => {
    const d = finding?.beforeAcquiredAt ? new Date(finding.beforeAcquiredAt) : null;
    return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Before';
  }, [finding]);

  const afterDate = useMemo(() => {
    const d = finding?.afterAcquiredAt ? new Date(finding.afterAcquiredAt) : null;
    return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'After';
  }, [finding]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (fullscreen) {
      document.exitFullscreen?.();
    } else {
      containerRef.current.requestFullscreen?.().catch(() => {
        /* fullscreen not supported in this environment */ });
    }
  }, [fullscreen]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const hasData = Boolean(finding);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-[#1b3041] bg-[#0a1926] shadow-lg overflow-hidden ${fullscreen ? 'fixed inset-0 z-[2000] bg-black' : ''}`}
    >
      {!hasData && (
        <div className="h-[420px] flex flex-col items-center justify-center text-center p-8">
          <svg width={32} height={32} className="mb-3 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3m0 0c0-1.657-1.343-3-3-3m0 0a9 9 0 019-9m0 0a9 9 0 009 9m0 0M3 12c0-1.657 1.343-3 3-3m0 0c0 1.657-1.343 3 3 3m-3 0c0 1.657-1.343 3-3 3" />
          </svg>
          <h3 className="text-sm font-medium text-[#e8f0fe]">No satellite imagery available</h3>
          <p className="mt-1 text-xs text-slate-500">Select a scan from the history to view before/after imagery.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="absolute inset-0 z-10 flex items-start justify-between px-4 py-3 pointer-events-none">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Before</span>
              <span className="text-xs font-mono text-[#e8f0fe] bg-[#071523]/80 px-2 py-0.5 rounded border border-slate-700/50">{beforeDate}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">After</span>
              <span className="text-xs font-mono text-[#e8f0fe] bg-[#071523]/80 px-2 py-0.5 rounded border border-slate-700/50">{afterDate}</span>
            </div>
          </div>

          <div className="relative h-[420px]">
            {comparisonMode === 'sideBySide' ? (
              <div className="h-full grid grid-cols-2">
                <div className="relative border-r border-slate-700/30 overflow-hidden">
                  <div className="absolute inset-0 bg-[#0a1926] flex items-center justify-center">
                    <svg width={40} height={40} className="text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3m0 0c0-1.657-1.343-3-3-3m0 0a9 9 0 019-9m0 0a9 9 0 009 9m0 0M3 12c0-1.657 1.343-3 3-3m0 0c0 1.657-1.343 3 3 3m-3 0c0 1.657-1.343 3-3 3" />
                    </svg>
                    <span className="ml-2 text-xs text-slate-500">True colour · {beforeDate}</span>
                  </div>
                </div>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#0a1926] flex items-center justify-center">
                    <svg width={40} height={40} className="text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3m0 0c0-1.657-1.343-3-3-3m0 0a9 9 0 019-9m0 0a9 9 0 009 9m0 0M3 12c0-1.657 1.343-3 3-3m0 0c0 1.657-1.343 3 3 3m-3 0c0 1.657-1.343 3-3 3" />
                    </svg>
                    <span className="ml-2 text-xs text-slate-500">True colour · {afterDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0a1926] flex items-center justify-center">
                  <svg width={40} height={40} className="text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3m0 0c0-1.657-1.343-3-3-3m0 0a9 9 0 019-9m0 0a9 9 0 009 9m0 0M3 12c0-1.657 1.343-3 3-3m0 0c0 1.657-1.343 3 3 3m-3 0c0 1.657-1.343 3-3 3" />
                  </svg>
                  <span className="ml-2 text-xs text-slate-500">Overlay · {layer.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-4 z-20 flex gap-1 rounded-lg border border-slate-700 bg-[#071321]/90 backdrop-blur-md p-1 shadow-xl">
            {(['ndvi', 'ndwi', 'trueColour'] as LayerId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayer(id)}
                aria-pressed={layer === id}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  layer === id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
                title={id === 'ndvi' ? 'NDVI (vegetation health)' : id === 'ndwi' ? 'NDWI (water content)' : 'True colour'}
              >
                {id === 'ndvi' ? 'NDVI' : id === 'ndwi' ? 'NDWI' : 'True Colour'}
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 right-4 z-20 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setComparisonMode((m) => (m === 'sideBySide' ? 'overlay' : 'sideBySide'))}
              className="p-2 rounded border border-slate-700 bg-[#071321]/90 text-slate-300 hover:text-teal-300 hover:border-teal-500/50 transition-colors" aria-label="Toggle comparison mode">
              {comparisonMode === 'sideBySide' ? '↔' : '⚲'}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded border border-slate-700 bg-[#071321]/90 text-slate-300 hover:text-teal-300 hover:border-teal-500/50 transition-colors" aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? '⌧' : '⛶'}
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                className="p-1.5 rounded border border-slate-700 bg-[#071321]/90 text-slate-300 hover:text-teal-300" aria-label="Zoom in">
                <span className="text-[10px]">+</span>
              </button>
              <button
                type="button"
                className="p-1.5 rounded border border-slate-700 bg-[#071321]/90 text-slate-300 hover:text-teal-300" aria-label="Zoom out">
                <span className="text-[10px]">−</span>
              </button>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 z-20 text-[9px] text-slate-500">
            Contains modified Copernicus Sentinel data [2026] · Element 84 Earth Search
          </div>
        </>
      )}
    </div>
  );
}
