import React from 'react';
import { X, Sparkles, MapPin, Film, Volume2, Monitor, CheckCircle, ExternalLink } from 'lucide-react';
import { SJ_CINEMAS_INFO } from '../data/sjCinemasData';

interface AuditoriumInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditoriumInfoModal: React.FC<AuditoriumInfoModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0c0e18] border border-white/20 rounded-3xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs uppercase font-extrabold tracking-widest text-red-400">
            Venue Technical Profile
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">{SJ_CINEMAS_INFO.name}</h2>
        <p className="text-xs text-white/60 flex items-center gap-1.5 mt-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          {SJ_CINEMAS_INFO.address}
        </p>

        {/* Real Reference Photo from User */}
        <div className="mt-5 rounded-2xl overflow-hidden border border-white/15 bg-black/50 relative">
          <img
            src="/sj_cinemas_auditorium.jpg"
            alt="SJ Cinemas Nagari Auditorium Real Photo"
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                Reference Auditorium Photo
              </span>
              <p className="text-xs text-white/90 font-medium mt-1">
                SJ Cinemas Nagari interior: Starry ceiling, longitudinal red neon lines & plush crimson stadium seating.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Highlights Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
            <Monitor className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">4K RGB Laser Curved Screen</strong>
              <p className="text-white/60 mt-0.5">
                48-foot wide Harkness Perlux silver screen with 32m radial curvature for uniform edge-to-edge brightness.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">Dolby Atmos 64-Channel Sound</strong>
              <p className="text-white/60 mt-0.5">
                Overhead ceiling height arrays and surround wall clusters powered by QSC digital cinema amplifiers.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">Starry Acoustic Ceiling</strong>
              <p className="text-white/60 mt-0.5">
                Hundreds of fiber-optic starry pin lights with longitudinal red neon lighting strips across the hall.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
            <Film className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">Stepped Stadium Sightlines</strong>
              <p className="text-white/60 mt-0.5">
                38cm riser elevation per tier ensures unobstructed heads-free viewing from every row (Rows A to N).
              </p>
            </div>
          </div>
        </div>

        {/* Best Seat Guide */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
          <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Acoustic & Visual Sweet Spot Guide
          </h4>
          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
            For SJ Cinemas Nagari, the scientifically calibrated sweet spot is located in <strong>Rows H and J (Seats 9 to 14)</strong>. Sitting here delivers a 46° horizontal field of view (ideal THX immersion) and perfectly aligns you with the Dolby Atmos acoustic delay matrix.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white transition cursor-pointer"
        >
          Close Specs
        </button>
      </div>
    </div>
  );
};

