import React, { useState, useMemo, useEffect } from 'react';
import {
  SJ_CINEMAS_INFO,
  HALL_DIMENSIONS,
  SCREEN_SPEC,
  SPEAKERS,
  generateSeats,
  TRAILERS
} from './data/sjCinemasData';
import { Seat, SeatScore, TrailerVideo } from './types/theater';
import { calculateSeatScore } from './utils/cinemaMath';
import { CinemaCanvas3D } from './components/CinemaCanvas3D';
import { SeatMap2D } from './components/SeatMap2D';
import { ControlToolbar } from './components/ControlToolbar';
import { AuditoriumInfoModal } from './components/AuditoriumInfoModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Sparkles, MapPin, Film, ChevronRight, Armchair, DoorOpen, ShieldCheck } from 'lucide-react';
import { CinemaEntryOverlay } from './components/CinemaEntryOverlay';

export const App: React.FC = () => {
  // Generate seats
  const seats = useMemo(() => generateSeats(), []);

  // Trailers catalog state (hydrated from localStorage or default TRAILERS)
  const [trailers, setTrailers] = useState<TrailerVideo[]>(() => {
    try {
      const saved = localStorage.getItem('sjcinemas_custom_trailers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return TRAILERS;
  });

  // Default to the prime sweet spot seat (H11 - Gold Club)
  const [selectedSeatId, setSelectedSeatId] = useState<string>('H11');

  // Active trailer state (hydrated from localStorage)
  const [activeTrailer, setActiveTrailer] = useState<TrailerVideo>(() => {
    try {
      const savedId = localStorage.getItem('sjcinemas_active_trailer_id');
      if (savedId) {
        const found = trailers.find(t => t.id === savedId);
        if (found) return found;
      }
    } catch {}
    return trailers[0];
  });

  // Video URL state (defaulting to the newly added /trailers/leo.mp4)
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sjcinemas_custom_video_url') || '/trailers/leo.mp4';
    } catch {}
    return '/trailers/leo.mp4';
  });

  const [customVideoName, setCustomVideoName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sjcinemas_custom_video_name') || 'Leo (2023) Official 4K Trailer';
    } catch {}
    return 'Leo (2023) Official 4K Trailer';
  });

  const [showEntry, setShowEntry] = useState<boolean>(true); // Grand cinema entry on site load!
  const [isWalkingIn, setIsWalkingIn] = useState<boolean>(false);
  const [lightsUp, setLightsUp] = useState<boolean>(true); // Start in warm walk-in lighting
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // Start with trailer playing
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [viewMode, setViewMode] = useState<'SEAT' | 'OVERVIEW' | 'HEATMAP'>('SEAT');
  const [showSpeakers, setShowSpeakers] = useState<boolean>(false);
  const [isSeatMapOpen, setIsSeatMapOpen] = useState<boolean>(false); // Hidden by default for full immersion!
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false); // Theatre Owner Control Panel
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-detect mobile, tablets, or low-power screens for default Eco mode
  const [isEcoMode, setIsEcoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768 ||
      ('ontouchstart' in window && window.innerWidth <= 1024)
    );
  });

  // Grand Walk-in Entrance Handler
  const handleEnterAuditorium = (seatId?: string) => {
    if (seatId) {
      setSelectedSeatId(seatId);
    }
    setShowEntry(false);
    setIsWalkingIn(true);
    setLightsUp(true); // Keep house lights on during walk-in
    setIsMuted(false); // Unmute Dolby Atmos audio
    setIsPlaying(true); // Start trailer playback
    setViewMode('SEAT');
  };

  const handleWalkInComplete = () => {
    setIsWalkingIn(false);
    setLightsUp(false); // Dim lights for Showtime once seated in the sweet spot!
  };

  // Seat selection handler that ensures view switches to first-person seat POV
  const handleSelectSeat = (seatId: string) => {
    setSelectedSeatId(seatId);
    setViewMode('SEAT');
  };

  // Load custom raw video file from disk or upload
  const handleLoadVideoFile = (file: File) => {
    if (customVideoUrl && customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customVideoUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomVideoUrl(url);
    setCustomVideoName(file.name);
    setIsPlaying(true);
  };

  const handleSelectTrailer = (trailer: TrailerVideo) => {
    setActiveTrailer(trailer);
    setIsPlaying(true);
    if (trailer.videoUrl) {
      setCustomVideoUrl(trailer.videoUrl);
      setCustomVideoName(trailer.title);
    } else {
      setCustomVideoUrl(null);
      setCustomVideoName(null);
    }
    try {
      localStorage.setItem('sjcinemas_active_trailer_id', trailer.id);
      if (trailer.videoUrl) {
        localStorage.setItem('sjcinemas_custom_video_url', trailer.videoUrl);
        localStorage.setItem('sjcinemas_custom_video_name', trailer.title);
      } else {
        localStorage.removeItem('sjcinemas_custom_video_url');
        localStorage.removeItem('sjcinemas_custom_video_name');
      }
    } catch {}
  };

  const handleUpdateTrailers = (newTrailers: TrailerVideo[]) => {
    setTrailers(newTrailers);
    try {
      localStorage.setItem('sjcinemas_custom_trailers', JSON.stringify(newTrailers));
    } catch {}
  };

  const handleSetCustomVideo = (url: string | null, name: string | null) => {
    setCustomVideoUrl(url);
    setCustomVideoName(name);
    setIsPlaying(true);
    try {
      if (url) {
        localStorage.setItem('sjcinemas_custom_video_url', url);
        if (name) localStorage.setItem('sjcinemas_custom_video_name', name);
      } else {
        localStorage.removeItem('sjcinemas_custom_video_url');
        localStorage.removeItem('sjcinemas_custom_video_name');
      }
    } catch {}
  };

  // Compute scores for every seat in the hall
  const scoresMap = useMemo(() => {
    const map = new Map<string, SeatScore>();
    seats.forEach(seat => {
      map.set(seat.id, calculateSeatScore(seat, SCREEN_SPEC, HALL_DIMENSIONS));
    });
    return map;
  }, [seats]);

  // Find the highest-scoring sweet spot seat
  const bestSeatId = useMemo(() => {
    let bestId = 'J11';
    let highestScore = -1;
    scoresMap.forEach((score, id) => {
      if (score.quality > highestScore) {
        highestScore = score.quality;
        bestId = id;
      }
    });
    return bestId;
  }, [scoresMap]);

  // Currently selected seat object and score
  const selectedSeat = useMemo(() => {
    return seats.find(s => s.id === selectedSeatId) || seats[0];
  }, [seats, selectedSeatId]);

  const currentScore = useMemo(() => {
    return scoresMap.get(selectedSeatId) || calculateSeatScore(selectedSeat, SCREEN_SPEC, HALL_DIMENSIONS);
  }, [scoresMap, selectedSeatId, selectedSeat]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040508] select-none text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="absolute top-0 inset-x-0 z-30 h-14 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 sm:px-6 flex items-center justify-between pointer-events-none">
        {/* Logo & Venue Info */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Film className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base text-white tracking-tight">
                SJ CINEMAS <span className="text-red-500">NAGARI</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-400" />
                4K Dolby Atmos Simulator
              </span>
            </div>
            <p className="text-[11px] text-white/50 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-400" />
              Sreenivasa A/C • NH 205 Nagari
            </p>
          </div>
        </div>

        {/* Right Header Badges */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Theatre Owner Admin Panel */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition cursor-pointer backdrop-blur-md shadow-lg shadow-amber-950/40"
            title="Theatre Owner Control Panel: Switch trailer, upload MP4, edit movie banner"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Owner Admin</span>
          </button>

          {/* Replay Cinematic Walk-in Entry */}
          <button
            onClick={() => handleEnterAuditorium(selectedSeatId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-bold text-red-300 transition cursor-pointer backdrop-blur-md shadow-lg shadow-red-950/40"
            title="Experience the walk-in entrance from the rear doors"
          >
            <DoorOpen className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Walk In</span>
          </button>

          {/* Active Seat Pill (Opens Seat Map) */}
          <button
            onClick={() => setIsSeatMapOpen(!isSeatMapOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition cursor-pointer backdrop-blur-md shadow-lg shadow-cyan-950/40"
            title="Click to view and select seats on layout"
          >
            <Armchair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Seat {selectedSeatId}</span>
            <span className="text-[10px] text-white/50 font-normal">Change</span>
          </button>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white/90 transition cursor-pointer backdrop-blur-md"
          >
            <span>Auditorium Specs</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
      </header>

      {/* Main 100% Fullscreen 3D Cinema Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <CinemaCanvas3D
          hall={HALL_DIMENSIONS}
          screenSpec={SCREEN_SPEC}
          seats={seats}
          speakers={SPEAKERS}
          selectedSeatId={selectedSeatId}
          scoresMap={scoresMap}
          onSelectSeat={handleSelectSeat}
          activeTrailer={activeTrailer}
          lightsUp={lightsUp}
          viewMode={viewMode}
          showSpeakers={showSpeakers}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          customVideoUrl={customVideoUrl}
          customVideoName={customVideoName}
          onDropVideoFile={handleLoadVideoFile}
          isWalkingIn={isWalkingIn}
          onWalkInComplete={handleWalkInComplete}
          isEcoMode={isEcoMode}
        />

        {/* Dynamic Seat Information HUD with Direct BookMyShow Action */}
        {viewMode === 'SEAT' && !isWalkingIn && (
          <SeatHUD
            seat={selectedSeat}
            score={currentScore}
            onQuickCompare={handleSelectSeat}
          />
        )}

        {/* Floating Control Toolbar */}
        <ControlToolbar
          lightsUp={lightsUp}
          onToggleLights={() => setLightsUp(!lightsUp)}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          showSpeakers={showSpeakers}
          onToggleSpeakers={() => setShowSpeakers(!showSpeakers)}
          onToggleSeatMap={() => setIsSeatMapOpen(!isSeatMapOpen)}
          onOpenInfo={() => setIsInfoOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isEcoMode={isEcoMode}
          onToggleEcoMode={() => setIsEcoMode(prev => !prev)}
        />

        {/* On-demand Interactive 2D Seat Selection Drawer (Opens only when "Seat Map" is clicked) */}
        {isSeatMapOpen && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setIsSeatMapOpen(false)}
              title="Click outside to close"
            />
            <aside className="w-full sm:w-[480px] md:w-[510px] h-full shadow-2xl relative z-50 pt-14 flex flex-col bg-[#090b14]">
              <SeatMap2D
                seats={seats}
                selectedSeatId={selectedSeatId}
                scoresMap={scoresMap}
                onSelectSeat={(id) => {
                  handleSelectSeat(id);
                }}
                bestSeatId={bestSeatId}
                onClose={() => setIsSeatMapOpen(false)}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Grand Cinema Walk-in Entry Welcome Gate (Opens on first site visit) */}
      {showEntry && (
        <CinemaEntryOverlay
          onEnter={handleEnterAuditorium}
          bestSeatId={bestSeatId}
          trailers={trailers}
          activeTrailer={activeTrailer}
          onSelectTrailer={handleSelectTrailer}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      )}

      {/* Auditorium Technical Info & Photo Comparison Modal */}
      <AuditoriumInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Theatre Owner Admin & Trailer Control Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        trailers={trailers}
        activeTrailer={activeTrailer}
        onSelectTrailer={handleSelectTrailer}
        onUpdateTrailers={handleUpdateTrailers}
        customVideoUrl={customVideoUrl}
        customVideoName={customVideoName}
        onSetCustomVideo={handleSetCustomVideo}
        onLoadVideoFile={handleLoadVideoFile}
      />
    </div>
  );
};

