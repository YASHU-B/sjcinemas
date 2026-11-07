import React from 'react';
import { Film, Sparkles, Volume2, Armchair, ChevronRight, Play, Eye } from 'lucide-react';
import { SJ_CINEMAS_INFO } from '../data/sjCinemasData';

interface CinemaEntryOverlayProps {
  onEnter: (seatId?: string) => void;
  bestSeatId: string;
}

export const CinemaEntryOverlay: React.FC<CinemaEntryOverlayProps> = ({
  onEnter,
  bestSeatId
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-black/85 backdrop-blur-md transition-all duration-700 animate-fadeIn p-4">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-red-950/40 via-black/80 to-black pointer-events-none" />

      {/* Main Glassmorphic Welcome Card */}
      <div className="relative z-10 w-full max-w-xl bg-[#090b14]/95 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(220,38,38,0.25)] flex flex-col items-center text-center">
        {/* Venue Crest / Logo */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 border border-red-400/50 flex items-center justify-center shadow-2xl shadow-red-600/50">
            <Film className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-black"></span>
          </span>
        </div>

        {/* Multiplex Identity */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-[11px] font-bold text-red-300 tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sreenivasa A/C • NH 205 Nagari</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          SJ CINEMAS <span className="text-red-500">NAGARI</span>
        </h1>

        <p className="text-xs sm:text-sm text-white/70 font-medium mt-1 mb-6 max-w-md">
          {SJ_CINEMAS_INFO.screenName} • Barco 4K RGB Laser & 64-Channel Dolby Atmos Spatial Sound Simulator
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">4K LASER</span>
            <span className="text-[10px] text-white/50">Harkness Silver</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">DOLBY ATMOS</span>
            <span className="text-[10px] text-white/50">64-Ch Spatial Audio</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-white">412 SEATS</span>
            <span className="text-[10px] text-white/50">Platinum & Gold</span>
          </div>
        </div>

        {/* Grand Enter Auditorium Button */}
        <button
          onClick={() => onEnter(bestSeatId)}
          className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white font-black text-sm sm:text-base tracking-wide shadow-[0_8px_32px_rgba(220,38,38,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 overflow-hidden mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Play className="w-5 h-5 fill-current" />
          <span>ENTER AUDITORIUM & WALK IN</span>
          <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Quick Entrance Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <button
            onClick={() => onEnter(bestSeatId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sweet Spot ({bestSeatId})</span>
          </button>

          <button
            onClick={() => onEnter('A10')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <Armchair className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Tier (A10)</span>
          </button>

          <button
            onClick={() => onEnter('T11')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Front Row (T11)</span>
          </button>
        </div>

        {/* Audio Note */}
        <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-5">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Clicking Enter begins the walk-in experience with cinema audio enabled</span>
        </p>
      </div>
    </div>
  );
};

