import React, { useState } from 'react';
import { Seat, SeatScore } from '../types/theater';
import { getTierBadgeInfo } from '../utils/cinemaMath';
import { Sparkles, Eye, Volume2, Compass, ChevronDown, ChevronUp, Award } from 'lucide-react';

interface SeatHUDProps {
  seat: Seat;
  score: SeatScore;
  onQuickCompare: (seatId: string) => void;
}

export const SeatHUD: React.FC<SeatHUDProps> = ({
  seat,
  score,
  onQuickCompare
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const badgeInfo = getTierBadgeInfo(score.tierName);

  return (
    <div className="absolute top-16 left-4 sm:left-6 z-20 max-w-xs sm:max-w-sm w-full transition-all duration-300 pointer-events-auto">
      <div className="bg-[#0b0e1a]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 border border-red-400/50 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-600/40">
              {seat.label}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs text-white">Seat {seat.label}</h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
                  {seat.tier} Class
                </span>
              </div>
              <p className="text-[10px] text-white/50">{seat.rowLabel} Row • SJ Cinemas Nagari</p>
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title={collapsed ? "Expand Details" : "Collapse HUD"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Quality Score Bar */}
        <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] text-black shadow-lg shrink-0"
              style={{ backgroundColor: score.color }}
            >
              {Math.round(score.quality)}%
            </div>
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                {badgeInfo.label}
              </span>
              <span className="text-[9px] text-white/50 block line-clamp-1">{badgeInfo.desc}</span>
            </div>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Metrics 4-Grid */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[9px] text-white/50 flex items-center gap-1 mb-0.5">
                  <Eye className="w-3 h-3 text-cyan-400" />
                  Viewing Angle
                </span>
                <span className="font-extrabold text-xs text-white">{score.metrics.horizontalFovDeg}°</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5 font-semibold">
                  {score.metrics.horizontalFovDeg >= 36 && score.metrics.horizontalFovDeg <= 52 ? '★ THX Sweet Spot' : 'Standard'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[9px] text-white/50 flex items-center gap-1 mb-0.5">
                  <Volume2 className="w-3 h-3 text-violet-400" />
                  Dolby Atmos
                </span>
                <span className="font-extrabold text-xs text-white">{Math.round(score.audio)}%</span>
                <span className="text-[9px] text-violet-300 block mt-0.5 font-semibold">64-Ch Spatial Audio</span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[9px] text-white/50 flex items-center gap-1 mb-0.5">
                  <Compass className="w-3 h-3 text-amber-400" />
                  Screen Distance
                </span>
                <span className="font-extrabold text-xs text-white">{score.metrics.distance} m</span>
                <span className="text-[9px] text-white/40 block mt-0.5">48ft Curved Screen</span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[9px] text-white/50 flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3 text-red-400" />
                  Screen Coverage
                </span>
                <span className="font-extrabold text-xs text-white">{Math.round(score.immersion)}%</span>
                <span className="text-[9px] text-white/40 block mt-0.5">Peripheral Immersion</span>
              </div>
            </div>

            {/* Quick Compare Shortcuts */}
            <div className="mt-2.5 flex items-center gap-1 pt-2 border-t border-white/10">
              <span className="text-[9px] text-white/40">Teleport:</span>
              <button
                onClick={() => onQuickCompare('T11')}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white/80 transition cursor-pointer"
              >
                Front (T11)
              </button>
              <button
                onClick={() => onQuickCompare('H11')}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[9px] font-bold text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
              >
                Sweet Spot (H11)
              </button>
              <button
                onClick={() => onQuickCompare('A10')}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white/80 transition cursor-pointer"
              >
                Rear (A10)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
