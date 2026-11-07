import { ScreenSpec, HallDimensions, AudioSpeaker, Seat, SeatTier, TrailerVideo } from '../types/theater';

export const SJ_CINEMAS_INFO = {
  name: 'SJ Cinemas Sreenivasa',
  shortName: 'SJ Cinemas Nagari',
  tagline: '4K RGB Laser Projection & Dolby Atmos 64-Channel Sound',
  address: 'NH 205, Nagaraj Kuppam Road, Nagari, Andhra Pradesh 517590',
  screenName: 'Auditorium 1 - 4K Dolby Atmos',
  capacity: 412,
  projector: 'Barco Series 4 4K RGB Laser (35,000 Lumens, High Frame Rate)',
  soundSystem: 'Dolby Atmos 64-Channel Immersive Audio with QSC Amplifiers',
  screenType: 'Harkness Perlux 1.8 Gain Curved Silver Screen (48 ft)',
};

export const HALL_DIMENSIONS: HallDimensions = {
  width: 18.2,
  depth: 32,
  height: 9.8
};

export const SCREEN_SPEC: ScreenSpec = {
  width: 15.6,
  height: 6.8,
  centerHeight: 4.5,
  z: 2.2,
  curvature: 'CURVED',
  curveRadius: 28,
  resolution: '4096 x 2160 (Native 4K)',
  peakNits: 108,
  aspectRatio: 2.39
};

export const SPEAKERS: AudioSpeaker[] = [
  // Behind Screen LCR + LFE
  { id: 'spk-l', channel: 'L', name: 'Stage Left', position: [-5.8, 4.5, 1.8], powerWatts: 1200 },
  { id: 'spk-c', channel: 'C', name: 'Stage Center (Dialogues)', position: [0, 4.5, 1.8], powerWatts: 1400 },
  { id: 'spk-r', channel: 'R', name: 'Stage Right', position: [5.8, 4.5, 1.8], powerWatts: 1200 },
  { id: 'spk-sub1', channel: 'LFE', name: 'Subwoofer Array L', position: [-2.8, 1.2, 1.8], powerWatts: 2400 },
  { id: 'spk-sub2', channel: 'LFE', name: 'Subwoofer Array R', position: [2.8, 1.2, 1.8], powerWatts: 2400 },

  // Left Wall Surrounds
  { id: 'spk-ls1', channel: 'Ls', name: 'Left Surround 1', position: [-8.9, 4.5, 7], powerWatts: 600 },
  { id: 'spk-ls2', channel: 'Ls', name: 'Left Surround 2', position: [-8.9, 5.0, 12], powerWatts: 600 },
  { id: 'spk-ls3', channel: 'Ls', name: 'Left Surround 3', position: [-8.9, 5.6, 17], powerWatts: 600 },
  { id: 'spk-ls4', channel: 'Ls', name: 'Left Surround 4', position: [-8.9, 6.2, 22], powerWatts: 600 },
  { id: 'spk-ls5', channel: 'Ls', name: 'Left Surround 5', position: [-8.9, 6.8, 27], powerWatts: 600 },

  // Right Wall Surrounds
  { id: 'spk-rs1', channel: 'Rs', name: 'Right Surround 1', position: [8.9, 4.5, 7], powerWatts: 600 },
  { id: 'spk-rs2', channel: 'Rs', name: 'Right Surround 2', position: [8.9, 5.0, 12], powerWatts: 600 },
  { id: 'spk-rs3', channel: 'Rs', name: 'Right Surround 3', position: [8.9, 5.6, 17], powerWatts: 600 },
  { id: 'spk-rs4', channel: 'Rs', name: 'Right Surround 4', position: [8.9, 6.2, 22], powerWatts: 600 },
  { id: 'spk-rs5', channel: 'Rs', name: 'Right Surround 5', position: [8.9, 6.8, 27], powerWatts: 600 },

  // Rear Wall Surrounds
  { id: 'spk-rls', channel: 'Rls', name: 'Rear Left Surround', position: [-5, 7.5, 31.5], powerWatts: 600 },
  { id: 'spk-rrs', channel: 'Rrs', name: 'Rear Right Surround', position: [5, 7.5, 31.5], powerWatts: 600 },

  // Ceiling Atmos Height Channels
  { id: 'spk-tfl', channel: 'Tfl', name: 'Top Front Left', position: [-4.5, 9.8, 10], powerWatts: 500 },
  { id: 'spk-tfr', channel: 'Tfr', name: 'Top Front Right', position: [4.5, 9.8, 10], powerWatts: 500 },
  { id: 'spk-tml', channel: 'Tfl', name: 'Top Mid Left', position: [-4.5, 9.8, 18], powerWatts: 500 },
  { id: 'spk-tmr', channel: 'Tfr', name: 'Top Mid Right', position: [4.5, 9.8, 18], powerWatts: 500 },
  { id: 'spk-trl', channel: 'Trl', name: 'Top Rear Left', position: [-4.5, 9.8, 25], powerWatts: 500 },
  { id: 'spk-trr', channel: 'Trr', name: 'Top Rear Right', position: [4.5, 9.8, 25], powerWatts: 500 },
];

// Exact SJ Cinemas Nagari BookMyShow Seat Plan
// Rows from front to back:
// Row T is closest to the screen (front)
// Row A is at the very back (elevated rear)
// There is a cross-aisle walkway between Row K and Row L
export interface ExactRowPlan {
  rowLabel: string;
  leftSeats: number[];
  centerSeats: number[];
  rightSeats: number[];
}

export const EXACT_SEAT_PLAN: ExactRowPlan[] = [
  // Front block (Rows T to L)
  { rowLabel: 'T', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'S', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'R', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'Q', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'P', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'O', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'N', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'M', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'L', leftSeats: [1,2,3,4,5], centerSeats: [6,7,8,9,10,11,12,13,14,15], rightSeats: [16,17,18,19,20] },

  // Walkway / Gangway between L and K

  // Upper / Rear Stadium block (Rows K to A)
  { rowLabel: 'K', leftSeats: [1,2,3,4], centerSeats: [5,6,7,8,9,10,11,12,13,14], rightSeats: [15,16,17,18] },
  { rowLabel: 'J', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'I', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'H', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'G', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'F', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'E', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'D', leftSeats: [1,2,3,4,5,6], centerSeats: [7,8,9,10,11,12,13,14,15,16], rightSeats: [17,18,19,20,21,22] },
  { rowLabel: 'C', leftSeats: [1,2,3,4], centerSeats: [5,6,7,8,9,10], rightSeats: [11,12,13,14] },
  { rowLabel: 'B', leftSeats: [1,2,3,4], centerSeats: [5,6,7,8,9,10], rightSeats: [11,12,13,14] },
  { rowLabel: 'A', leftSeats: [1,2,3,4], centerSeats: [5,6,7,8,9,10,11,12], rightSeats: [13,14,15,16] }
];

export function generateSeats(): Seat[] {
  const seats: Seat[] = [];
  const frontGap = 5.6; // Distance from screen to front row (Row T)
  const rowPitch = 1.12; // Distance between successive rows
  const seatWidth = 0.58; // Luxury pushback cinema seat width
  const aisleWidth = 1.15; // 1.15m gangway walkway between Left/Center and Center/Right blocks
  const rowCurveRadius = 42; // Gentle amphitheater curvature facing screen center

  // Order of rows from front (Row T) to back (Row A):
  // rowIndex 0 = Row T (front) ... rowIndex 19 = Row A (back)
  EXACT_SEAT_PLAN.forEach((plan, rowIndex) => {
    // Elevation: Row T is lowest (0.5m), each row rises by 0.28m
    let riserHeight = 0.5 + rowIndex * 0.28;
    // Cross aisle between Row L (index 8) and Row K (index 9) adds an extra 1.4m walkway
    const isUpperBlock = rowIndex >= 9;
    const baseZ = frontGap + rowIndex * rowPitch + (isUpperBlock ? 1.5 : 0);

    // Tier naming:
    let tier: SeatTier = 'GOLD';
    if (rowIndex >= 16) {
      tier = 'RECLINER'; // Back rows A, B, C, D
    } else if (rowIndex <= 3) {
      tier = 'SILVER'; // Front rows T, S, R, Q
    }

    // Function to place a block of seats (matching SJ Cinemas Nagari BookMyShow arrangement)
    const placeBlock = (seatNumbers: number[], blockType: 'LEFT' | 'CENTER' | 'RIGHT') => {
      seatNumbers.forEach((seatNum, idxInBlock) => {
        let posX = 0;

        if (blockType === 'CENTER') {
          // Center block is symmetrically centered around x = 0
          const count = seatNumbers.length;
          const centeredIndex = idxInBlock - (count - 1) / 2;
          posX = centeredIndex * seatWidth;
        } else if (blockType === 'LEFT') {
          // Left block sits to the left of the left walkway aisle (x <= -4.05m)
          // The rightmost seat in the left block is adjacent to the left aisle
          const distFromLeftAisle = (seatNumbers.length - 1 - idxInBlock) * seatWidth;
          posX = -(5 * seatWidth + aisleWidth + seatWidth / 2 + distFromLeftAisle);
        } else if (blockType === 'RIGHT') {
          // Right block sits to the right of the right walkway aisle (x >= +4.05m)
          // The leftmost seat in the right block is adjacent to the right aisle
          const distFromRightAisle = idxInBlock * seatWidth;
          posX = +(5 * seatWidth + aisleWidth + seatWidth / 2 + distFromRightAisle);
        }

        // Apply gentle row curvature so every seat faces screen center
        let curvedZ = baseZ;
        let facingAngle = 0;
        if (rowCurveRadius > 0) {
          const theta = posX / rowCurveRadius;
          posX = Math.sin(theta) * rowCurveRadius;
          curvedZ = baseZ - (rowCurveRadius - Math.cos(theta) * rowCurveRadius);
          facingAngle = -theta;
        }

        const seatId = `${plan.rowLabel}${seatNum}`;
        seats.push({
          id: seatId,
          label: `${plan.rowLabel}${seatNum}`,
          row: rowIndex,
          col: seatNum - 1,
          rowLabel: plan.rowLabel,
          position: [
            Math.round(posX * 100) / 100,
            Math.round(riserHeight * 100) / 100,
            Math.round(curvedZ * 100) / 100
          ],
          facing: Math.round(facingAngle * 1000) / 1000,
          tier,
          price: 150
        });
      });
    };

    placeBlock(plan.leftSeats, 'LEFT');
    placeBlock(plan.centerSeats, 'CENTER');
    placeBlock(plan.rightSeats, 'RIGHT');
  });

  return seats;
}

export const TRAILERS: TrailerVideo[] = [
  {
    id: 'leo',
    title: 'Leo — Official Trailer (Thalapathy Vijay • Lokesh Kanagaraj • Anirudh)',
    genre: 'Action Thriller • LCU (Lokesh Kanagaraj)',
    duration: '2:44',
    aspectRatio: 2.39,
    thumbnail: '🦁',
    language: 'Tamil',
    youtubeId: 'Po3jStA673E',
    videoUrl: '/trailers/leo.mp4',
    audioTone: 'Anirudh "Badass" Bass Drops & 64-Channel Gunfire',
    colorPalette: ['#e11d2e', '#f97316', '#450a0a']
  },
  {
    id: 'coolie',
    title: 'Coolie — Official Teaser (Superstar Rajinikanth • Lokesh Kanagaraj • Anirudh)',
    genre: 'Action Epic • Superstar Rajinikanth',
    duration: '3:16',
    aspectRatio: 2.39,
    thumbnail: '👑',
    language: 'Tamil',
    youtubeId: 'OXHTlMPbX7o',
    videoUrl: '/trailers/coolie.mp4',
    audioTone: 'Thalaivar Gold Chains & Anirudh "Powerhouse" Atmos',
    colorPalette: ['#eab308', '#ca8a04', '#422006']
  },
  {
    id: 'goat',
    title: 'The Greatest of All Time (GOAT) (Thalapathy Vijay • Venkat Prabhu • Yuvan Shankar Raja)',
    genre: 'Sci-Fi Action • Thalapathy Vijay',
    duration: '2:51',
    aspectRatio: 2.39,
    thumbnail: '🎯',
    language: 'Tamil',
    youtubeId: 'jxCRlebiebw',
    videoUrl: '/trailers/goat.mp4',
    audioTone: 'Yuvan High-Octane Car Chases & Spatial Explosions',
    colorPalette: ['#0284c7', '#2563eb', '#0f172a']
  },
  {
    id: 'amaran',
    title: 'Amaran — Official Trailer (Sivakarthikeyan • Sai Pallavi • GV Prakash)',
    genre: 'Biographical War Action • Sivakarthikeyan',
    duration: '2:32',
    aspectRatio: 2.39,
    thumbnail: '🎖️',
    language: 'Tamil',
    youtubeId: 'hylIXfZeB4c',
    videoUrl: '/trailers/amaran.mp4',
    audioTone: 'GV Prakash Heavy Artillery & Spatial Bullet Whistles',
    colorPalette: ['#15803d', '#166534', '#052e16']
  },
  {
    id: 'vikram',
    title: 'Vikram — Official Trailer (Kamal Haasan • Vijay Sethupathi • Fahadh Faasil • Anirudh)',
    genre: 'Action / Crime • Kamal Haasan',
    duration: '2:40',
    aspectRatio: 2.39,
    thumbnail: '🦅',
    language: 'Tamil',
    youtubeId: 'OKBMCL-frPU',
    videoUrl: '/trailers/vikram.mp4',
    audioTone: 'Anirudh Roaring Synth Horns & Heavy Machine Guns',
    colorPalette: ['#dc2626', '#991b1b', '#18181b']
  },
  {
    id: 'jailer',
    title: 'Jailer — Showcase (Superstar Rajinikanth • Nelson • Anirudh)',
    genre: 'Action Comedy • Superstar Rajinikanth',
    duration: '2:15',
    aspectRatio: 2.39,
    thumbnail: '🕶️',
    language: 'Tamil',
    youtubeId: 'Y5BeWdODPqo',
    videoUrl: '/trailers/jailer.mp4',
    audioTone: 'Tiger Ka Hukum Massive Dolby Atmos Thumps',
    colorPalette: ['#f59e0b', '#b45309', '#1c1917']
  },
  {
    id: 'pushpa2',
    title: 'Pushpa 2: The Rule (Allu Arjun • DSP)',
    genre: 'Action Drama • Allu Arjun',
    duration: '3:12',
    aspectRatio: 2.39,
    thumbnail: '🔥',
    language: 'Telugu / Tamil',
    youtubeId: '1kVK0KEkS18',
    videoUrl: '/trailers/pushpa2.mp4',
    audioTone: 'DSP Thumping Tribal Beats & Dolby Atmos Bass',
    colorPalette: ['#dc2626', '#ea580c', '#7f1d1d']
  }
];
