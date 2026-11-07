import React from 'react';
import { Seat, SeatScore } from '../types/theater';
import { EXACT_SEAT_PLAN } from '../data/sjCinemasData';
import { Sparkles, Armchair, Check, X } from 'lucide-react';

interface SeatMap2DProps {
  seats: Seat[];
  selectedSeatId: string;
  scoresMap: Map<string, SeatScore>;
  onSelectSeat: (seatId: string) => void;
  bestSeatId: string;
  onClose?: () => void;
}

export const SeatMap2D: React.FC<SeatMap2DProps> = ({
  seats,
  selectedSeatId,
  scoresMap,
  onSelectSeat,
  bestSeatId,
  onClose
}) => {
  // Index seats by id for instantaneous lookup
  const seatLookup = new Map<string, Seat>();
  seats.forEach(s => seatLookup.set(s.id, s));

  // Rows ordered from top (Row A at back) to bottom (Row T near screen)
  const displayRows = [...EXACT_SEAT_PLAN].reverse();

  return (
    <div className="flex flex-col h-full bg-[#0a0c16]/98 border-l border-white/10 select-none overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 shrink-0 bg-black/40">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            <Armchair className="w-4 h-4 text-red-500" />
            Auditorium Seating Layout
          </h3>
          <p className="text-[10px] text-white/50">SJ Cinemas Nagari • {seats.length} Seats</p>
        </div>

        <div className="flex items-center gap-2">
          {bestSeatId && (
            <button
              onClick={() => onSelectSeat(bestSeatId)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Sweet Spot ({bestSeatId})
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
              title="Close Seat Map"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Seating Grid Container (Rows A down to T) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 flex flex-col items-center">
        {/* Category Header (Platinum) */}
        <div className="text-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-0.5">
            Auditorium 1 • ₹150 Platinum ({seats.length} Seats)
          </span>
        </div>

        {/* Rows Grid */}
        <div className="flex flex-col gap-1 items-center w-full">
          {displayRows.map(rowPlan => {
            const isSweetSpotRow = rowPlan.rowLabel === 'G' || rowPlan.rowLabel === 'H' || rowPlan.rowLabel === 'J';
            const isAisleBreak = rowPlan.rowLabel === 'L'; // Cross-aisle gap above Row L

            return (
              <React.Fragment key={rowPlan.rowLabel}>
                {/* Cross Aisle / Walkway Break between Row K and Row L */}
                {isAisleBreak && (
                  <div className="w-full my-2 flex items-center justify-center gap-2">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-white/30">
                      Cross Aisle Walkway
                    </span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 w-full justify-center">
                  {/* Row Label Left */}
                  <span
                    className={`w-3.5 text-center text-[10px] font-black shrink-0 ${
                      isSweetSpotRow ? 'text-emerald-400' : 'text-white/40'
                    }`}
                  >
                    {rowPlan.rowLabel}
                  </span>

                  {/* Left Block (6 Columns: slots 0 to 5) */}
                  <div className="flex items-center gap-[2.5px] sm:gap-[3px]">
                    {[0, 1, 2, 3, 4, 5].map(colSlot => {
                      const slotItem = rowPlan.leftSlots.find(s => s.slot === colSlot);
                      if (!slotItem) {
                        return (
                          <div
                            key={`empty-l-${colSlot}`}
                            className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] shrink-0 pointer-events-none opacity-0"
                          />
                        );
                      }
                      const num = slotItem.seatNum;
                      const seatId = `${rowPlan.rowLabel}${num}`;
                      const seat = seatLookup.get(seatId);
                      if (!seat) return null;

                      const isSelected = seat.id === selectedSeatId;
                      const isBest = seat.id === bestSeatId;
                      const score = scoresMap.get(seat.id);

                      let btnClass = 'bg-white/10 hover:bg-white/20 border-white/15 text-white/70';
                      if (isSelected) {
                        btnClass = 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.9)] scale-110 z-10 font-black';
                      } else if (isBest) {
                        btnClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400';
                      } else if (score && score.quality >= 85) {
                        btnClass = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => onSelectSeat(seat.id)}
                          className={`w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] rounded-[3px] text-[8px] font-bold border transition-all cursor-pointer flex items-center justify-center shrink-0 ${btnClass}`}
                          title={seat.label}
                        >
                          {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Left Aisle Gap */}
                  <div className="w-2.5 sm:w-3.5 shrink-0"></div>

                  {/* Center Block (10 Columns: slots 0 to 9) */}
                  <div className="flex items-center gap-[2.5px] sm:gap-[3px]">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(colSlot => {
                      const slotItem = rowPlan.centerSlots.find(s => s.slot === colSlot);
                      if (!slotItem) {
                        return (
                          <div
                            key={`empty-c-${colSlot}`}
                            className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] shrink-0 pointer-events-none opacity-0"
                          />
                        );
                      }
                      const num = slotItem.seatNum;
                      const seatId = `${rowPlan.rowLabel}${num}`;
                      const seat = seatLookup.get(seatId);
                      if (!seat) return null;

                      const isSelected = seat.id === selectedSeatId;
                      const isBest = seat.id === bestSeatId;
                      const score = scoresMap.get(seat.id);

                      let btnClass = 'bg-white/10 hover:bg-white/20 border-white/15 text-white/70';
                      if (isSelected) {
                        btnClass = 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.9)] scale-110 z-10 font-black';
                      } else if (isBest) {
                        btnClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400';
                      } else if (score && score.quality >= 85) {
                        btnClass = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => onSelectSeat(seat.id)}
                          className={`w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] rounded-[3px] text-[8px] font-bold border transition-all cursor-pointer flex items-center justify-center shrink-0 ${btnClass}`}
                          title={seat.label}
                        >
                          {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Aisle Gap */}
                  <div className="w-2.5 sm:w-3.5 shrink-0"></div>

                  {/* Right Block (6 Columns: slots 0 to 5) */}
                  <div className="flex items-center gap-[2.5px] sm:gap-[3px]">
                    {[0, 1, 2, 3, 4, 5].map(colSlot => {
                      const slotItem = rowPlan.rightSlots.find(s => s.slot === colSlot);
                      if (!slotItem) {
                        return (
                          <div
                            key={`empty-r-${colSlot}`}
                            className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] shrink-0 pointer-events-none opacity-0"
                          />
                        );
                      }
                      const num = slotItem.seatNum;
                      const seatId = `${rowPlan.rowLabel}${num}`;
                      const seat = seatLookup.get(seatId);
                      if (!seat) return null;

                      const isSelected = seat.id === selectedSeatId;
                      const isBest = seat.id === bestSeatId;
                      const score = scoresMap.get(seat.id);

                      let btnClass = 'bg-white/10 hover:bg-white/20 border-white/15 text-white/70';
                      if (isSelected) {
                        btnClass = 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.9)] scale-110 z-10 font-black';
                      } else if (isBest) {
                        btnClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400';
                      } else if (score && score.quality >= 85) {
                        btnClass = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => onSelectSeat(seat.id)}
                          className={`w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] rounded-[3px] text-[8px] font-bold border transition-all cursor-pointer flex items-center justify-center shrink-0 ${btnClass}`}
                          title={seat.label}
                        >
                          {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Label Right */}
                  <span
                    className={`w-3.5 text-center text-[10px] font-black shrink-0 ${
                      isSweetSpotRow ? 'text-emerald-400' : 'text-white/40'
                    }`}
                  >
                    {rowPlan.rowLabel}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Screen at Bottom (Matching BookMyShow: "All eyes this way please") */}
        <div className="mt-5 mb-2 flex flex-col items-center w-full">
          <div className="w-[85%] max-w-[340px] h-3 bg-gradient-to-r from-red-600/30 via-red-500/90 to-red-600/30 rounded-b-xl border-b-2 border-red-400 shadow-[0_4px_16px_rgba(225,29,46,0.5)]"></div>
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/60 mt-1.5">
            All eyes this way please (4K Silver Screen)
          </span>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400"></span>
            <span>Sweet Spot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-white/15 border border-white/20"></span>
            <span>Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};