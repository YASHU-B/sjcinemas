import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lightbulb,
  LightbulbOff,
  Layers,
  Radio,
  Maximize2,
  Minimize2,
  Info,
  Armchair
} from 'lucide-react';

interface ControlToolbarProps {
  lightsUp: boolean;
  onToggleLights: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  viewMode: 'SEAT' | 'OVERVIEW' | 'HEATMAP';
  onChangeViewMode: (mode: 'SEAT' | 'OVERVIEW' | 'HEATMAP') => void;
  showSpeakers: boolean;
  onToggleSpeakers: () => void;
  onToggleSeatMap: () => void;
  onOpenInfo: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  lightsUp,
  onToggleLights,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
  viewMode,
  onChangeViewMode,
  showSpeakers,
  onToggleSpeakers,
  onToggleSeatMap,
  onOpenInfo,
  isFullscreen,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[92%] bg-[#080a12]/92 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-2xl flex items-center justify-between gap-2 text-white select-none">
      {/* Left: Playback & Lights */}
      <div className="flex items-center gap-1.5">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            isPlaying
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isPlaying ? "Pause Screen" : "Play Trailer"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden sm:inline">{isPlaying ? 'Playing' : 'Play'}</span>
        </button>

        {/* Lights Dimmer (Showtime vs House Lights) */}
        <button
          onClick={onToggleLights}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            lightsUp
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40 font-black'
              : 'bg-white/10 hover:bg-white/20 text-white/80'
          }`}
          title={lightsUp ? "House Lights are ON (Click to turn OFF for Showtime)" : "Showtime Mode (Click to turn ON House Lights)"}
        >
          {lightsUp ? <Lightbulb className="w-3.5 h-3.5 fill-black text-black" /> : <LightbulbOff className="w-3.5 h-3.5 text-white/60" />}
          <span className="hidden sm:inline">{lightsUp ? 'Lights: ON' : 'Lights: OFF'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title={isMuted ? "Unmute Dolby Atmos" : "Mute Sound"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Center: Camera POV Modes & Seat Map Toggle */}
      <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10 gap-0.5">
        <button
          onClick={() => onChangeViewMode('SEAT')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            viewMode === 'SEAT'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-white/60 hover:text-white'
          }`}
          title="First-Person Seat View"
        >
          Seat POV
        </button>
        <button
          onClick={() => onChangeViewMode('OVERVIEW')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            viewMode === 'OVERVIEW'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-white/60 hover:text-white'
          }`}
          title="Auditorium Walkthrough"
        >
          Walkthrough
        </button>
        <button
          onClick={() => onChangeViewMode('HEATMAP')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            viewMode === 'HEATMAP'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-white/60 hover:text-white'
          }`}
          title="Sightline Heatmap"
        >
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          Heatmap
        </button>

        <div className="w-px h-4 bg-white/20 mx-1"></div>

        {/* On-demand Seat Map Button */}
        <button
          onClick={onToggleSeatMap}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-300 hover:text-white bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 transition cursor-pointer"
          title="Open BookMyShow 2D seat map to select any seat"
        >
          <Armchair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Seat Map</span>
        </button>
      </div>

      {/* Right: Audio Arrays, Info, Fullscreen */}
      <div className="flex items-center gap-1.5">
        {/* Dolby Atmos Speakers Toggle */}
        <button
          onClick={onToggleSpeakers}
          className={`p-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            showSpeakers
              ? 'bg-violet-600/30 border border-violet-500/50 text-violet-300'
              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
          }`}
          title="Toggle 64-Channel Dolby Atmos Speakers"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Theater Specs & Info Modal */}
        <button
          onClick={onOpenInfo}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title="SJ Cinemas Nagari Specs & Photo Comparison"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};