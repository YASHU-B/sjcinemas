import React from 'react';
import { Film, Sparkles, Volume2, Armchair, ChevronRight, Play, Eye, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SJ_CINEMAS_INFO } from '../data/sjCinemasData';
import { TrailerVideo } from '../types/theater';

interface CinemaEntryOverlayProps {
  onEnter: (seatId?: string) => void;
  bestSeatId: string;
  trailers: TrailerVideo[];
  activeTrailer: TrailerVideo;
  onSelectTrailer: (trailer: TrailerVideo) => void;
  onOpenAdmin: () => void;
}

export const CinemaEntryOverlay: React.FC<CinemaEntryOverlayProps> = ({
  onEnter,
  bestSeatId,
  trailers,
  activeTrailer,
  onSelectTrailer,
  onOpenAdmin
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-black/85 backdrop-blur-md transition-all duration-700 animate-fadeIn p-3 sm:p-5 overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-red-950/40 via-black/80 to-black pointer-events-none" />

      {/* Main Glassmorphic Welcome Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#090b14]/95 border border-red-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(220,38,38,0.25)] flex flex-col items-center text-center my-auto">
        {/* Top Bar with Admin Link */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-[11px] font-bold text-red-300 tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sreenivasa A/C • NH 205 Nagari</span>
          </div>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-[10px] font-bold transition cursor-pointer"
            title="Theatre Owner / Admin Panel - Change Trailer & Movies"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Owner Admin</span>
          </button>
        </div>

        {/* Venue Crest / Logo */}
        <div className="relative mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 border border-red-400/50 flex items-center justify-center shadow-2xl shadow-red-600/50">
            <Film className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-black"></span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          SJ CINEMAS <span className="text-red-500">NAGARI</span>
        </h1>

        <p className="text-xs text-white/70 font-medium mt-0.5 mb-4 max-w-md">
          {SJ_CINEMAS_INFO.screenName} • Barco 4K RGB Laser & 64-Channel Dolby Atmos Spatial Sound
        </p>

        {/* NOW SHOWING MOVIES BANNER / CAROUSEL */}
        <div className="w-full mb-5 text-left bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-black text-white uppercase tracking-wider">
                NOW SHOWING AT SJ CINEMAS
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">
              Tap movie to preview on 4K screen
            </span>
          </div>

          {/* Horizontal Scrollable Movie Cards */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
            {trailers.map(trailer => {
              const isSelected = activeTrailer.id === trailer.id;

              return (
                <div
                  key={trailer.id}
                  onClick={() => onSelectTrailer(trailer)}
                  className={`snap-start shrink-0 w-44 sm:w-48 p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-600/20 border-red-500 shadow-md shadow-red-950/50 ring-1 ring-red-400'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{trailer.thumbnail || '🎬'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                        trailer.status === 'COMING_SOON'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {trailer.status === 'COMING_SOON' ? 'Coming Soon' : 'Now Showing'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-white line-clamp-1">
                      {trailer.title.split('(')[0]}
                    </h4>
                    <p className="text-[10px] text-white/50 line-clamp-1">{trailer.genre}</p>

                    {trailer.showtimes && (
                      <p className="text-[8px] text-amber-300/90 mt-1 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{trailer.showtimes}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px]">
                    <span className="text-white/40">{trailer.language || 'Tamil'}</span>
                    {isSelected ? (
                      <span className="font-extrabold text-red-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ON SCREEN</span>
                      </span>
                    ) : (
                      <span className="text-white/60 hover:text-white font-bold">Select</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">4K LASER</span>
            <span className="text-[10px] text-white/50">Harkness Silver</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">DOLBY ATMOS</span>
            <span className="text-[10px] text-white/50">64-Ch Spatial Audio</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">412 SEATS</span>
            <span className="text-[10px] text-white/50">Platinum & Gold</span>
          </div>
        </div>

        {/* Grand Enter Auditorium Button */}
        <button
          onClick={() => onEnter(bestSeatId)}
          className="group relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white font-black text-sm sm:text-base tracking-wide shadow-[0_8px_32px_rgba(220,38,38,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-3 overflow-hidden mb-3"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Play className="w-5 h-5 fill-current" />
          <span>ENTER AUDITORIUM & WATCH {activeTrailer.title.split('(')[0].toUpperCase()}</span>
          <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Quick Entrance Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <button
            onClick={() => onEnter(bestSeatId)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sweet Spot ({bestSeatId})</span>
          </button>

          <button
            onClick={() => onEnter('A10')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <Armchair className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Tier (A10)</span>
          </button>

          <button
            onClick={() => onEnter('T11')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Front Row (T11)</span>
          </button>
        </div>

        {/* Audio Note */}
        <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-3">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Clicking Enter begins the walk-in experience with cinema audio enabled</span>
        </p>
      </div>
    </div>
  );
};

