export type SeatTier = 'RECLINER' | 'GOLD' | 'SILVER';
export type QualityTier = 'BEST' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'COMPROMISED';

export interface SeatPosition {
  x: number;
  y: number;
  z: number;
}

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  rowLabel: string;
  position: [number, number, number];
  facing: number;
  tier: SeatTier;
  price: number;
  accessible?: boolean;
}

export interface ScreenSpec {
  width: number;
  height: number;
  centerHeight: number;
  z: number;
  curvature: 'CURVED' | 'FLAT';
  curveRadius: number;
  resolution: string;
  peakNits: number;
  aspectRatio: number;
}

export interface AudioSpeaker {
  id: string;
  channel: 'L' | 'C' | 'R' | 'LFE' | 'Ls' | 'Rs' | 'Rls' | 'Rrs' | 'Tfl' | 'Tfr' | 'Trl' | 'Trr';
  name: string;
  position: [number, number, number];
  powerWatts: number;
}

export interface HallDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface SeatMetrics {
  distance: number;
  horizontalFovDeg: number;
  verticalFovDeg: number;
  screenCoverage: number;
  horizontalOffAxisDeg: number;
  verticalAngleDeg: number;
  edgeAngleDeg: number;
}

export interface SeatScore {
  seatId: string;
  quality: number; // 0 - 100
  immersion: number; // 0 - 100
  audio: number; // 0 - 100
  tierName: QualityTier;
  color: string;
  metrics: SeatMetrics;
}

export interface TrailerVideo {
  id: string;
  title: string;
  genre: string;
  duration: string;
  aspectRatio: number;
  thumbnail: string;
  youtubeId?: string;
  language?: string;
  videoUrl?: string; // HTML5 video or canvas simulation
  audioTone: string;
  colorPalette: [string, string, string]; // Dynamic ambient light colors
}

