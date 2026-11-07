import { ScreenSpec, HallDimensions, Seat, SeatScore, SeatMetrics, QualityTier } from '../types/theater';

const RAD2DEG = 180 / Math.PI;

function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  const h1 = Math.hypot(x1, y1);
  const h2 = Math.hypot(x2, y2);
  if (h1 === 0 || h2 === 0) return 0;
  const dot = (x1 * x2 + y1 * y2) / (h1 * h2);
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

function gaussian(x: number, mean: number, stdDev: number): number {
  return Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

export function computeSeatMetrics(
  seat: Seat,
  screen: ScreenSpec,
  eyeHeight = 1.18
): SeatMetrics {
  const eyePos: [number, number, number] = [
    seat.position[0],
    seat.position[1] + eyeHeight,
    seat.position[2]
  ];

  const screenCenter: [number, number, number] = [0, screen.centerHeight, screen.z];
  const delta = [
    screenCenter[0] - eyePos[0],
    screenCenter[1] - eyePos[1],
    screenCenter[2] - eyePos[2]
  ];

  const distToScreenPlane = Math.abs(eyePos[2] - screen.z);
  const planarDistToCenter = Math.hypot(eyePos[0] - screenCenter[0], eyePos[2] - screenCenter[2]);
  const straightDist = Math.hypot(delta[0], delta[1], delta[2]);

  const halfWidth = screen.width / 2;
  const leftX = -halfWidth - eyePos[0];
  const rightX = halfWidth - eyePos[0];
  const distZ = screen.z - eyePos[2];

  // Horizontal Field of View (FOV)
  const hFov = angleBetween(leftX, distZ, rightX, distZ) * RAD2DEG;

  // Vertical Field of View
  const halfHeight = screen.height / 2;
  const topAngle = Math.atan2(screen.centerHeight + halfHeight - eyePos[1], planarDistToCenter);
  const bottomAngle = Math.atan2(screen.centerHeight - halfHeight - eyePos[1], planarDistToCenter);
  const vFov = (topAngle - bottomAngle) * RAD2DEG;

  // Screen coverage (solid angle approximation)
  const coverage = Math.min(1, (hFov * vFov) / 9600);

  // Horizontal off-axis angle from screen normal
  const offAxis = Math.atan2(Math.abs(eyePos[0]), distToScreenPlane) * RAD2DEG;

  // Vertical viewing elevation angle (eye to screen center)
  const vertAngle = Math.atan2(screen.centerHeight - eyePos[1], planarDistToCenter) * RAD2DEG;

  // Facing vector vs screen direction
  const facingVec = { x: Math.sin(seat.facing), z: -Math.cos(seat.facing) };
  const seatLookAngle = angleBetween(facingVec.x, facingVec.z, delta[0], delta[2]) * RAD2DEG;

  return {
    distance: Math.round(straightDist * 10) / 10,
    horizontalFovDeg: Math.round(hFov * 10) / 10,
    verticalFovDeg: Math.round(vFov * 10) / 10,
    screenCoverage: Math.round(coverage * 100) / 100,
    horizontalOffAxisDeg: Math.round(offAxis * 10) / 10,
    verticalAngleDeg: Math.round(vertAngle * 10) / 10,
    edgeAngleDeg: Math.round((seatLookAngle + hFov / 2) * 10) / 10
  };
}

export function calculateSeatScore(
  seat: Seat,
  screen: ScreenSpec,
  hall: HallDimensions,
  eyeHeight = 1.18
): SeatScore {
  const metrics = computeSeatMetrics(seat, screen, eyeHeight);

  // Target horizontal FOV for standard 4K Dolby Atmos cinema is ~45° (SMPTE/THX optimum)
  const targetFov = 46;
  const fovRatio = metrics.horizontalFovDeg;
  let fovScore = 0;
  if (fovRatio <= targetFov) {
    fovScore = 100 * Math.pow(clamp(fovRatio / targetFov), 0.75);
  } else {
    fovScore = 100 * gaussian(fovRatio, targetFov, 0.7 * targetFov);
  }

  // Coverage score
  const idealCoverage = clamp((0.6 * targetFov * (0.55 * targetFov)) / 9600);
  const coverageScore = 100 * clamp(metrics.screenCoverage / Math.max(idealCoverage, 0.12));

  // Off-axis penalty (center seats score 100, off-axis seats drop)
  const offAxisScore = 100 * gaussian(metrics.horizontalOffAxisDeg, 0, 18);

  // Vertical viewing comfort (5° to 15° slight upward tilt is ideal, >30° causes neck strain)
  const vertAngleScore = 100 * gaussian(metrics.verticalAngleDeg, 8, 14);

  // Resolution clarity vs distance
  const distanceOptimumScore = 100 * gaussian(metrics.distance, hall.depth * 0.58, hall.depth * 0.35);

  // Dolby Atmos acoustic score
  const eyePos = [seat.position[0], seat.position[1] + eyeHeight, seat.position[2]];
  const acousticCenterZ = screen.z + 0.58 * hall.depth;
  const lateralOffset = eyePos[0] / (0.35 * hall.width);
  const depthOffset = (eyePos[2] - acousticCenterZ) / (0.32 * hall.depth);
  const baseAudio = 100 * gaussian(lateralOffset, 0, 1.3) * gaussian(depthOffset, 0, 1.3);
  // Dolby Atmos object-based diffusion gives great surround even off-center
  const atmosAudio = baseAudio + (100 - baseAudio) * 0.3;

  // Weighted overall quality (Weights: Coverage 32%, OffAxis 20%, Vertical 14%, Audio 26%, Distance 8%)
  const visualImmersion = 0.55 * fovScore + 0.3 * coverageScore + 0.15 * offAxisScore;
  const totalQuality =
    0.32 * (0.6 * fovScore + 0.4 * coverageScore) +
    0.20 * offAxisScore +
    0.14 * vertAngleScore +
    0.26 * atmosAudio +
    0.08 * distanceOptimumScore;

  const qualityClamped = Math.round(clamp(totalQuality, 10, 100) * 10) / 10;
  const immersionClamped = Math.round(clamp(visualImmersion, 10, 100) * 10) / 10;
  const audioClamped = Math.round(clamp(atmosAudio, 10, 100) * 10) / 10;

  const tierName = getQualityTier(qualityClamped);
  const color = getQualityColor(qualityClamped);

  return {
    seatId: seat.id,
    quality: qualityClamped,
    immersion: immersionClamped,
    audio: audioClamped,
    tierName,
    color,
    metrics
  };
}

export function getQualityTier(score: number): QualityTier {
  if (score >= 86) return 'BEST';
  if (score >= 72) return 'EXCELLENT';
  if (score >= 58) return 'GOOD';
  if (score >= 42) return 'FAIR';
  return 'COMPROMISED';
}

export function getQualityColor(score: number): string {
  // Color gradient: <40: Red (#ef4444), 40-60: Orange (#f97316), 60-75: Yellow (#eab308), 75-88: Light Green (#84cc16), >88: Emerald (#10b981)
  if (score >= 86) return '#10b981'; // Emerald sweet spot
  if (score >= 72) return '#84cc16'; // Lime
  if (score >= 58) return '#eab308'; // Amber
  if (score >= 42) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export function getTierBadgeInfo(tier: QualityTier): { label: string; badgeClass: string; desc: string } {
  switch (tier) {
    case 'BEST':
      return {
        label: 'Sweet Spot (Top Quality)',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        desc: 'Ideal SMPTE 45° viewing angle, centered Dolby Atmos acoustics, zero neck strain.'
      };
    case 'EXCELLENT':
      return {
        label: 'Excellent View',
        badgeClass: 'bg-lime-500/20 text-lime-400 border-lime-500/40',
        desc: 'Great panoramic screen immersion with balanced surround audio channels.'
      };
    case 'GOOD':
      return {
        label: 'Good Seat',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        desc: 'Solid cinematic experience with standard viewing angle and full sound.'
      };
    case 'FAIR':
      return {
        label: 'Fair View',
        badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        desc: 'Slightly off-axis or higher screen angle; good for budget choice.'
      };
    case 'COMPROMISED':
      return {
        label: 'High Angle / Edge',
        badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        desc: 'Noticeable side angle or steep upward gaze towards screen.'
      };
  }
}

