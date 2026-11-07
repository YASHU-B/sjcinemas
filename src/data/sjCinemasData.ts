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
// Matches official BookMyShow layout for "SJ CINEMAS SREENIVASA A/C 4K DOLBY ATMOS: Nagari"
// Rows from front to back:
// Row T is closest to the screen (front)
// Row A is at the very back (elevated rear)
// There is a cross-aisle walkway between Row K and Row L
export interface SeatSlot {
  slot: number; // 0-based column index within the block (Left: 0..5, Center: 0..9, Right: 0..5)
  seatNum: number; // Printed BookMyShow seat number
}

export interface ExactRowPlan {
  rowLabel: string;
  leftSlots: SeatSlot[];
  centerSlots: SeatSlot[];
  rightSlots: SeatSlot[];
  leftSeats: number[];
  centerSeats: number[];
  rightSeats: number[];
}

const makeSlots = (slots: number[], startNum: number): { slots: SeatSlot[], nums: number[] } => {
  const result: SeatSlot[] = [];
  const nums: number[] = [];
  slots.forEach((s, idx) => {
    const num = startNum + idx;
    result.push({ slot: s, seatNum: num });
    nums.push(num);
  });
  return { slots: result, nums };
};

// Row definitions matching the exact BookMyShow screenshot
export const EXACT_SEAT_PLAN: ExactRowPlan[] = [
  // Front Lower Block (Rows T to L)
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'T', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'S', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'R', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'Q', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'P', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'O', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'N', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'M', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    // Row L: 5 seats on left (slots 0..4), 10 seats in center (slots 0..9), 5 seats on right (slots 0..4)
    const l = makeSlots([0, 1, 2, 3, 4], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 6);
    const r = makeSlots([0, 1, 2, 3, 4], 16);
    return { rowLabel: 'L', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),

  // Walkway / Cross-Aisle between Row L and Row K

  // Upper Stadium Block (Rows K to A)
  (() => {
    // Row K: 4 seats left (slots 2,3,4,5), 10 seats center (slots 0..9), 4 seats right (slots 0,1,2,3)
    const l = makeSlots([2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    const r = makeSlots([0, 1, 2, 3], 15);
    return { rowLabel: 'K', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'J', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'I', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'H', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'G', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'F', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'E', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    const l = makeSlots([0, 1, 2, 3, 4, 5], 1);
    const c = makeSlots([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    const r = makeSlots([0, 1, 2, 3, 4, 5], 17);
    return { rowLabel: 'D', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    // Row C: 4 seats left (slots 2,3,4,5), 6 seats center (slots 2..7), 4 seats right (slots 0,1,2,3)
    const l = makeSlots([2, 3, 4, 5], 1);
    const c = makeSlots([2, 3, 4, 5, 6, 7], 5);
    const r = makeSlots([0, 1, 2, 3], 11);
    return { rowLabel: 'C', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    // Row B: 4 seats left (slots 2,3,4,5), 6 seats center (slots 2..7), 4 seats right (slots 0,1,2,3)
    const l = makeSlots([2, 3, 4, 5], 1);
    const c = makeSlots([2, 3, 4, 5, 6, 7], 5);
    const r = makeSlots([0, 1, 2, 3], 11);
    return { rowLabel: 'B', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })(),
  (() => {
    // Row A: 4 seats left (slots 2,3,4,5), 8 seats center (slots 1..8), 4 seats right (slots 0,1,2,3)
    const l = makeSlots([2, 3, 4, 5], 1);
    const c = makeSlots([1, 2, 3, 4, 5, 6, 7, 8], 5);
    const r = makeSlots([0, 1, 2, 3], 13);
    return { rowLabel: 'A', leftSlots: l.slots, centerSlots: c.slots, rightSlots: r.slots, leftSeats: l.nums, centerSeats: c.nums, rightSeats: r.nums };
  })()
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

    // Function to place a block of seats matching exact column slots
    const placeBlock = (seatSlots: SeatSlot[], blockType: 'LEFT' | 'CENTER' | 'RIGHT') => {
      seatSlots.forEach(({ slot, seatNum }) => {
        let posX = 0;

        if (blockType === 'CENTER') {
          // Center block: 10 slots (0..9) centered around x = 0
          posX = (slot - 4.5) * seatWidth;
        } else if (blockType === 'LEFT') {
          // Left block: 6 slots (0..5), slot 5 is adjacent to the left walkway aisle
          posX = -(4.5 * seatWidth + aisleWidth + (5 - slot) * seatWidth);
        } else if (blockType === 'RIGHT') {
          // Right block: 6 slots (0..5), slot 0 is adjacent to the right walkway aisle
          posX = +(4.5 * seatWidth + aisleWidth + slot * seatWidth);
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

    placeBlock(plan.leftSlots, 'LEFT');
    placeBlock(plan.centerSlots, 'CENTER');
    placeBlock(plan.rightSlots, 'RIGHT');
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
