import React, { useState } from 'react';
import { TrailerVideo } from '../types/theater';
import {
  Film,
  Plus,
  Trash2,
  CheckCircle2,
  Play,
  Upload,
  X,
  Sparkles,
  Save,
  RotateCcw,
  Video,
  Clapperboard,
  Clock,
  ExternalLink
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailers: TrailerVideo[];
  activeTrailer: TrailerVideo;
  onSelectTrailer: (trailer: TrailerVideo) => void;
  onUpdateTrailers: (trailers: TrailerVideo[]) => void;
  customVideoUrl?: string | null;
  customVideoName?: string | null;
  onSetCustomVideo: (url: string | null, name: string | null) => void;
  onLoadVideoFile: (file: File) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  trailers,
  activeTrailer,
  onSelectTrailer,
  onUpdateTrailers,
  customVideoUrl,
  customVideoName,
  onSetCustomVideo,
  onLoadVideoFile
}) => {
  const [activeTab, setActiveTab] = useState<'SELECT' | 'ADD_NEW' | 'CUSTOM_URL'>('SELECT');

  // Form state for adding a new movie
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newLanguage, setNewLanguage] = useState('Telugu / Tamil');
  const [newVideoUrl, setNewVideoUrl] = useState('/trailers/ramayana.mp4');
  const [newShowtimes, setNewShowtimes] = useState('11:00 AM • 2:30 PM • 6:30 PM • 10:00 PM');
  const [newStatus, setNewStatus] = useState<'NOW_SHOWING' | 'COMING_SOON'>('NOW_SHOWING');
  const [newColor, setNewColor] = useState('#f59e0b');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Video Path state
  const [customPathInput, setCustomPathInput] = useState(
    customVideoUrl || activeTrailer?.videoUrl || '/trailers/ramayana.mp4'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen) return null;

  const currentActiveTrailer = activeTrailer || trailers[0];

  const handleApplyCustomPath = () => {
    if (!customPathInput.trim()) return;
    onSetCustomVideo(customPathInput.trim(), customPathInput.split('/').pop() || 'Custom Trailer');
    showToast(`Applied custom video: ${customPathInput}`);
  };

  const handleCreateMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const id = newTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16) || `movie_${Date.now()}`;
    const created: TrailerVideo = {
      id,
      title: newTitle.trim(),
      genre: newGenre.trim() || 'Action Drama',
      duration: '2:30',
      aspectRatio: 2.39,
      thumbnail: '🎬',
      language: newLanguage,
      videoUrl: newVideoUrl.trim() || undefined,
      audioTone: '64-Channel Dolby Atmos Spatial Sound',
      colorPalette: [newColor, '#b91c1c', '#450a0a'],
      showtimes: newShowtimes.trim() || 'Daily 4 Shows',
      status: newStatus
    };

    const updated = [created, ...trailers];
    onUpdateTrailers(updated);
    onSelectTrailer(created);
    showToast(`Added and selected "${newTitle}" as Active Trailer!`);

    // Reset form
    setNewTitle('');
    setNewGenre('');
    setActiveTab('SELECT');
  };

  const handleDeleteTrailer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trailers.length <= 1) {
      alert("At least one trailer must remain in the catalog.");
      return;
    }
    const updated = trailers.filter(t => t.id !== id);
    onUpdateTrailers(updated);
    if (currentActiveTrailer?.id === id) {
      onSelectTrailer(updated[0]);
    }
    showToast("Trailer removed from catalog.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#0a0c16] border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-black to-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/30">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  SJ CINEMAS • THEATRE OWNER ADMIN
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-black">
                  Control Panel
                </span>
              </div>
              <p className="text-[11px] text-white/50">Change active 4K trailer, video files & Now Showing banner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
            title="Close Admin Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/40 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('SELECT')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SELECT'
                ? 'border-amber-400 text-amber-300 font-extrabold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Select Active Trailer ({trailers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM_URL')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CUSTOM_URL'
                ? 'border-amber-400 text-amber-300 font-extrabold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video File / URL</span>
          </button>

          <button
            onClick={() => setActiveTab('ADD_NEW')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ADD_NEW'
                ? 'border-amber-400 text-amber-300 font-extrabold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Movie</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: SELECT ACTIVE TRAILER */}
          {activeTab === 'SELECT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Select the movie currently playing in Auditorium 1:</span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  Active: {(currentActiveTrailer?.title || 'Trailer').split('(')[0]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {trailers.map(trailer => {
                  const isCurrent = currentActiveTrailer?.id === trailer.id && !customVideoUrl;
                  const hasLocalFile = trailer.videoUrl === '/trailers/ramayana.mp4' || trailer.id === 'ramayana';

                  return (
                    <div
                      key={trailer.id}
                      onClick={() => {
                        onSetCustomVideo(null, null);
                        onSelectTrailer(trailer);
                        showToast(`Active trailer switched to "${trailer.title.split('(')[0]}"`);
                      }}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                      }`}
                    >
                      <div>
                        {trailer.posterUrl && (
                          <div className="w-full h-32 rounded-xl overflow-hidden mb-2 bg-black/50 border border-white/10 shadow-md">
                            <img src={trailer.posterUrl} alt={trailer.title} className="w-full h-full object-cover object-top" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl">{trailer.thumbnail || '🎬'}</span>
                          <div className="flex items-center gap-1">
                            {hasLocalFile && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                MP4 Ready
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              trailer.status === 'COMING_SOON'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {trailer.status === 'COMING_SOON' ? 'Coming Soon' : 'Now Showing'}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-amber-300 transition">
                          {trailer.title}
                        </h4>
                        <p className="text-[10px] text-white/50 line-clamp-1">{trailer.genre}</p>
                        {trailer.showtimes && (
                          <p className="text-[9px] text-amber-300/80 mt-1 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{trailer.showtimes}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[9px] text-white/40">
                          {trailer.language || 'Tamil'} • 4K Atmos
                        </span>

                        <div className="flex items-center gap-1">
                          {isCurrent ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>BROADCASTING</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/60 group-hover:text-white font-bold flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current" />
                              <span>Play on Screen</span>
                            </span>
                          )}

                          {trailers.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteTrailer(trailer.id, e)}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition ml-1"
                              title="Delete from catalog"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM VIDEO FILE / URL */}
          {activeTab === 'CUSTOM_URL' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" />
                  Local Video Files Detected
                </h4>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  You added <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">public/trailers/ramayana.mp4</code>.
                  You can set any local video path or drop a video file below to immediately stream it onto the 3D Harkness curved screen.
                </p>
              </div>

              {/* Fast Shortcut for ramayana.mp4 */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Ramayana (3D) Official 1080p MP4</span>
                  <span className="text-[10px] text-emerald-400 font-mono">/trailers/ramayana.mp4 (Available in public folder)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSetCustomVideo('/trailers/ramayana.mp4', 'Ramayana (Showing in 3D • Telugu & Tamil)');
                    showToast('Broadcasting /trailers/ramayana.mp4 on 4K screen!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  Stream Ramayana MP4
                </button>
              </div>

              {/* Video URL Path Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80">Trailer Video Path or URL:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPathInput}
                    onChange={(e) => setCustomPathInput(e.target.value)}
                    placeholder="/trailers/my_movie.mp4 or https://..."
                    className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomPath}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer shrink-0"
                  >
                    Apply Video
                  </button>
                </div>
                <p className="text-[10px] text-white/40">
                  Tip: Put any .mp4 trailer into your project’s <code className="text-amber-300">public/trailers/</code> folder and refer to it as <code className="text-amber-300">/trailers/filename.mp4</code>.
                </p>
              </div>

              {/* Drag and Drop Video File */}
              <div className="pt-2">
                <label className="text-xs font-bold text-white/80 block mb-1.5">Or Upload / Drop MP4 File Directly:</label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer group">
                  <Upload className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Click to Select MP4 / WebM from Computer</span>
                  <span className="text-[10px] text-white/40 mt-0.5">Drag and drop file directly here</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/mkv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onLoadVideoFile(e.target.files[0]);
                        showToast(`Loaded ${e.target.files[0].name} for screening!`);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Reset to Procedural */}
              {customVideoUrl && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onSetCustomVideo(null, null);
                      showToast('Reverted to procedural 4K trailer');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Built-in Trailer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD NEW MOVIE */}
          {activeTab === 'ADD_NEW' && (
            <form onSubmit={handleCreateMovie} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Movie Title & Star Cast *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Game Changer (Ram Charan • Shankar)"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Genre</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="e.g. Political Action Thriller"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Language</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Telugu / Tamil">Telugu / Tamil (Bilingual)</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="NOW_SHOWING">Now Showing</option>
                    <option value="COMING_SOON">Coming Soon / Advance Booking</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/80">Trailer Video Path or URL</label>
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="/trailers/my_trailer.mp4"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/80">Auditorium 1 Showtimes</label>
                <input
                  type="text"
                  value={newShowtimes}
                  onChange={(e) => setNewShowtimes(e.target.value)}
                  placeholder="11:00 AM • 2:30 PM • 6:30 PM • 10:00 PM"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/80">Screen Ambient Glow Theme</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <span className="text-xs text-white/60 font-mono">{newColor}</span>
                  <span className="text-[10px] text-white/40">(Casts moving theater light reflections during showtime)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SELECT')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-950/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Now Showing & Broadcast</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <span>SJ Cinemas Nagari • 4K Dolby Atmos Admin Panel</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

