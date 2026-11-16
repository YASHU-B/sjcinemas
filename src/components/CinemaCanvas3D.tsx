import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Seat, ScreenSpec, HallDimensions, AudioSpeaker, TrailerVideo, SeatScore } from '../types/theater';
import { EXACT_SEAT_PLAN } from '../data/sjCinemasData';

interface CinemaCanvas3DProps {
  hall: HallDimensions;
  screenSpec: ScreenSpec;
  seats: Seat[];
  speakers: AudioSpeaker[];
  selectedSeatId: string;
  scoresMap: Map<string, SeatScore>;
  onSelectSeat: (seatId: string) => void;
  activeTrailer: TrailerVideo;
  lightsUp: boolean;
  rowLightsOn?: boolean;
  viewMode: 'SEAT' | 'OVERVIEW' | 'HEATMAP';
  showSpeakers: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  customVideoUrl?: string | null;
  customVideoName?: string | null;
  onDropVideoFile?: (file: File) => void;
  isWalkingIn?: boolean;
  onWalkInComplete?: () => void;
  isEcoMode?: boolean;
}

export const CinemaCanvas3D: React.FC<CinemaCanvas3DProps> = ({
  hall,
  screenSpec,
  seats,
  speakers,
  selectedSeatId,
  scoresMap,
  onSelectSeat,
  activeTrailer,
  lightsUp,
  rowLightsOn = true,
  viewMode,
  showSpeakers,
  isPlaying,
  isMuted,
  volume,
  customVideoUrl,
  customVideoName,
  onDropVideoFile,
  isWalkingIn,
  onWalkInComplete,
  isEcoMode = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const totalDragDistance = useRef(0);
  const lastHoverCheck = useRef(0);
  const cameraAngles = useRef({ yaw: 0, pitch: 0 });
  const targetCameraPos = useRef(new THREE.Vector3(0, 3.8, 14.5));
  const currentCameraPos = useRef(new THREE.Vector3(0, 3.8, 14.5));
  const targetLookAt = useRef(new THREE.Vector3(0, screenSpec.centerHeight, screenSpec.z));
  const currentLookAt = useRef(new THREE.Vector3(0, screenSpec.centerHeight, screenSpec.z));

  const isEcoModeRef = useRef(isEcoMode);
  useEffect(() => {
    isEcoModeRef.current = isEcoMode;
    if (rendererRef.current) {
      const isMobile = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768 ||
        ('ontouchstart' in window && window.innerWidth <= 1024)
      );
      const maxDPR = isEcoMode || isMobile ? 1.0 : 1.5;
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
    }
  }, [isEcoMode]);

  // Live props refs to avoid stale closures inside the requestAnimationFrame loop
  const lightsUpRef = useRef(lightsUp);
  useEffect(() => { lightsUpRef.current = lightsUp; }, [lightsUp]);

  const rowLightsOnRef = useRef(rowLightsOn);
  useEffect(() => { rowLightsOnRef.current = rowLightsOn; }, [rowLightsOn]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const viewModeRef = useRef(viewMode);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  const selectedSeatIdRef = useRef(selectedSeatId);
  useEffect(() => { selectedSeatIdRef.current = selectedSeatId; }, [selectedSeatId]);

  // Walk-in Entrance state refs
  const isWalkingInRef = useRef(isWalkingIn);
  const walkInStartTime = useRef<number | null>(null);
  useEffect(() => {
    isWalkingInRef.current = isWalkingIn;
    if (isWalkingIn) {
      walkInStartTime.current = performance.now();
      currentCameraPos.current.set(0, 5.2, 30.5);
      currentLookAt.current.set(0, screenSpec.centerHeight, screenSpec.z);
    }
  }, [isWalkingIn, screenSpec]);

  // Video element & Raw video playback state
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [hasRawVideo, setHasRawVideo] = useState(false);
  const [showDragHint, setShowDragHint] = useState(true);

  // Canvas video & trailer playback refs
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const screenLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const trailerTimeRef = useRef(0);

  // Lighting refs
  const wallLightsRef = useRef<THREE.PointLight[]>([]);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const seatSpotLightRef = useRef<THREE.SpotLight | null>(null);
  const projectorSpotRef = useRef<THREE.SpotLight | null>(null);

  // Instanced seats meshes
  const instancedSeatsRef = useRef<THREE.InstancedMesh | null>(null);
  const instancedCushionsRef = useRef<THREE.InstancedMesh | null>(null);
  const instancedArmrestsRef = useRef<THREE.InstancedMesh | null>(null);
  const instancedHeadrestsRef = useRef<THREE.InstancedMesh | null>(null);
  const seatHighlightRingRef = useRef<THREE.Mesh | null>(null);

  // Three.js core refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // High-Fidelity Procedural Wall Texture (Optimized 512x512 with fast pattern generation)
  const createWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base mottled acoustic heather grey fabric (Matching real photo)
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(0, 0, 512, 512);

    // Fast acoustic fabric noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let py = 0; py < 512; py += 4) {
      for (let px = 0; px < 512; px += 4) {
        if ((px + py) % 8 === 0) {
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }

    // Distinct Vertical Crimson Geometric Acoustic Panels (Matching real photo pattern)
    const panelCols = [20, 60, 110, 155, 210, 260, 310, 360, 415, 465];
    panelCols.forEach((px, idx) => {
      const pWidth = idx % 2 === 0 ? 26 : 18;
      const grad = ctx.createLinearGradient(px, 0, px + pWidth, 0);
      grad.addColorStop(0, '#881337');
      grad.addColorStop(0.2, '#b91c1c');
      grad.addColorStop(0.8, '#dc2626');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(px, 0, pWidth, 350);

      // Acoustic shadow grooves between panels
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(px - 2, 0, 2, 350);
      ctx.fillRect(px + pWidth, 0, 2, 350);
    });

    // Lower Acoustic Wainscot / Dado (dark charcoal base along bottom of wall)
    ctx.fillStyle = '#080a12';
    ctx.fillRect(0, 358, 512, 154);

    // Glowing Warm-Amber LED Accent Line running above wainscot
    const amberGrad = ctx.createLinearGradient(0, 352, 0, 358);
    amberGrad.addColorStop(0, 'rgba(255, 190, 107, 0)');
    amberGrad.addColorStop(0.5, 'rgba(255, 205, 130, 1)');
    amberGrad.addColorStop(1, 'rgba(255, 180, 80, 0.2)');
    ctx.fillStyle = amberGrad;
    ctx.fillRect(0, 352, 512, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(6, 1);
    return texture;
  };

  // High-Fidelity Cinema Floor Carpet Texture (Optimized 256x256)
  const createCarpetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark midnight cinema carpet base
    ctx.fillStyle = '#10131d';
    ctx.fillRect(0, 0, 256, 256);

    // Diamond grid woven carpet pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let i = -256; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 256);
      ctx.lineTo(i + 256, 0);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 16);
    return texture;
  };

  // High-Fidelity Cinema Acoustic Ceiling Tile Grid Texture (Optimized 256x256)
  const createCeilingTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Pitch black acoustic tile base
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, 256, 256);

    // Fine acoustic micro-perforations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let py = 4; py < 256; py += 16) {
      for (let px = 4; px < 256; px += 16) {
        ctx.fillRect(px, py, 1.5, 1.5);
      }
    }

    // Modular Acoustic T-Bar Grid Bevel Seams
    ctx.strokeStyle = '#121624';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 18);
    return texture;
  };

  // Camera Target Calculation & Screen Eye-Level Centering
  useEffect(() => {
    if (viewMode === 'SEAT') {
      const selected = seats.find(s => s.id === selectedSeatId) || seats[Math.floor(seats.length / 2)];
      if (selected) {
        // Eye height: 1.18m above seat riser
        const eyeY = selected.position[1] + 1.18;
        targetCameraPos.current.set(
          selected.position[0],
          eyeY,
          selected.position[2]
        );
        targetLookAt.current.set(0, screenSpec.centerHeight, screenSpec.z);
        
        // Compute exact vertical pitch angle to vertically center the screen
        const dy = screenSpec.centerHeight - eyeY;
        const dz = selected.position[2] - screenSpec.z;
        const idealPitch = Math.atan2(dy, dz);
        cameraAngles.current = { yaw: selected.facing, pitch: idealPitch };
      }
    } else if (viewMode === 'OVERVIEW') {
      // Elevated vantage point overlooking auditorium and starry ceiling
      targetCameraPos.current.set(0, 7.2, 26);
      targetLookAt.current.set(0, screenSpec.centerHeight, screenSpec.z);
      cameraAngles.current = { yaw: 0, pitch: -0.1 };
    } else if (viewMode === 'HEATMAP') {
      // High bird's eye view to inspect seating tiers and sweet spots
      targetCameraPos.current.set(0, 14.5, 17);
      targetLookAt.current.set(0, 1.5, 15);
      cameraAngles.current = { yaw: 0, pitch: -0.85 };
    }
  }, [selectedSeatId, viewMode, seats, screenSpec]);

  // HTML5 Video Player Engine (Streams raw trailer files or user uploaded files)
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    let isCancelled = false;
    const videoSource = customVideoUrl || activeTrailer?.videoUrl || null;

    if (!videoSource) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      setHasRawVideo(false);
      return;
    }

    const handleLoaded = () => {
      if (isCancelled) return;
      setHasRawVideo(true);
      if (isPlaying) {
        video.muted = isMuted;
        video.volume = volume;
        video.play().catch(() => {
          // If browser blocks unmuted autoplay, smoothly fall back to muted autoplay
          video.muted = true;
          video.play().catch((e) => console.warn('Video play blocked:', e));
        });
      }
    };

    const handleError = () => {
      if (isCancelled) return;
      setHasRawVideo(false);
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('canplaythrough', handleLoaded);
    video.addEventListener('playing', () => { if (!isCancelled) setHasRawVideo(true); });
    video.addEventListener('timeupdate', () => { if (!isCancelled && video.currentTime > 0.05) setHasRawVideo(true); });
    video.addEventListener('error', handleError);

    video.src = videoSource;
    video.load();

    if (video.readyState >= 2) {
      handleLoaded();
    }

    return () => {
      isCancelled = true;
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('canplaythrough', handleLoaded);
      video.removeEventListener('error', handleError);
    };
  }, [activeTrailer, customVideoUrl]);

  // Synchronize Play/Pause with HTML5 Video
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Synchronize Volume and Mute with HTML5 Video
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  // Auto-unlock unmuted audio and start playback on user interaction
  useEffect(() => {
    const unlockMedia = () => {
      const video = videoElementRef.current;
      if (video) {
        video.muted = isMuted;
        video.volume = volume;
        if (isPlaying && video.paused) {
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      }
    };

    // If walk-in triggered, immediately try to play
    if (isWalkingIn) {
      unlockMedia();
    }

    window.addEventListener('click', unlockMedia);
    window.addEventListener('keydown', unlockMedia);
    window.addEventListener('touchstart', unlockMedia, { passive: true });
    return () => {
      window.removeEventListener('click', unlockMedia);
      window.removeEventListener('keydown', unlockMedia);
      window.removeEventListener('touchstart', unlockMedia);
    };
  }, [isMuted, volume, isPlaying, isWalkingIn]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x04060b);
    scene.fog = new THREE.FogExp2(0x04060b, 0.008);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 140);
    camera.position.copy(targetCameraPos.current);
    cameraRef.current = camera;

    // 3. WebGL Renderer (Optimized for broad cross-device compatibility & low power)
    const isMobile = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768) ||
      ('ontouchstart' in window && window.innerWidth <= 1024)
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile && !isEcoModeRef.current,
      powerPreference: isMobile || isEcoModeRef.current ? 'low-power' : 'default',
      precision: isMobile ? 'mediump' : 'highp',
      stencil: false,
      depth: true
    });
    renderer.setSize(width, height);
    const maxDPR = isMobile || isEcoModeRef.current ? 1.0 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = false; // Disabling shadow map pass saves up to 40% GPU fill rate & stops shader crashes on mobile
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Ambient & Base Lighting
    const ambientLight = new THREE.AmbientLight(0x282c3c, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0x7c5864, 0x161822, 0.9);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Ceiling Spotlight Illuminating Seating Bowl
    const seatSpot = new THREE.SpotLight(0xffecd6, 2.2, 35, Math.PI / 3, 0.6, 1.2);
    seatSpot.position.set(0, hall.height - 0.5, hall.depth * 0.6);
    seatSpot.target.position.set(0, 2, hall.depth * 0.5);
    scene.add(seatSpot);
    scene.add(seatSpot.target);
    seatSpotLightRef.current = seatSpot;

    // Screen Ambient Bounce Light (projects moving trailer light back into hall)
    const screenBounceLight = new THREE.PointLight(0xe11d2e, 2.8, 35, 1.1);
    screenBounceLight.position.set(0, screenSpec.centerHeight, screenSpec.z + 1.8);
    scene.add(screenBounceLight);
    screenLightRef.current = screenBounceLight;

    // 5. Floor & Stepped Stadium Risers
    const wallTex = createWallTexture();
    const carpetTex = createCarpetTexture();
    const ceilingTex = createCeilingTexture();

    const floorGeo = new THREE.PlaneGeometry(hall.width, hall.depth);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: carpetTex || undefined,
      color: 0x181b28,
      roughness: 0.92,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, hall.depth / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Stadium Risers with warm-amber step LED lights (Matching all 20 rows from A to T - Wall to Wall with Zero Gap)
    const riserGroup = new THREE.Group();
    for (let r = 0; r < 20; r++) {
      const riserHeight = 0.5 + r * 0.28;
      const riserDepth = 1.25;
      const isUpperBlock = r >= 9;
      const riserZ = 5.6 + r * 1.12 + (isUpperBlock ? 1.5 : 0);
      const boxGeo = new THREE.BoxGeometry(hall.width - 0.04, riserHeight, riserDepth);
      const boxMat = new THREE.MeshStandardMaterial({
        map: carpetTex || undefined,
        color: 0x1a1d2a,
        roughness: 0.88
      });
      const riserBox = new THREE.Mesh(boxGeo, boxMat);
      riserBox.position.set(0, riserHeight / 2, riserZ);
      riserBox.receiveShadow = true;
      riserGroup.add(riserBox);

      // Warm Amber Step Riser LED Strip (matching SJ Cinemas Nagari aisle step lights - flush wall-to-wall)
      const stepLightGeo = new THREE.BoxGeometry(hall.width - 0.04, 0.04, 0.05);
      const stepLightMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
      const stepLight = new THREE.Mesh(stepLightGeo, stepLightMat);
      stepLight.position.set(0, riserHeight + 0.02, riserZ - riserDepth / 2 + 0.03);
      riserGroup.add(stepLight);
    }

    // Cross Aisle Walkway between Row L and Row K (Spans flush wall-to-wall)
    const walkwayHeight = 0.5 + 8 * 0.28;
    const walkwayZ = 5.6 + 8 * 1.12 + 1.3;
    const walkwayBox = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width - 0.04, walkwayHeight, 1.4),
      new THREE.MeshStandardMaterial({
        map: carpetTex || undefined,
        color: 0x161824,
        roughness: 0.92
      })
    );
    walkwayBox.position.set(0, walkwayHeight / 2, walkwayZ);
    riserGroup.add(walkwayBox);

    // Rear Concourse Walkway behind Row A (Spans flush wall-to-wall connecting the two entrance doors)
    const rearWalkwayHeight = 0.5 + 19 * 0.28;
    const rowAEnd = 5.6 + 19 * 1.12 + 1.5 + 1.25 / 2;
    const rearWalkwayDepth = Math.max(1.8, hall.depth - rowAEnd);
    const rearWalkwayZ = hall.depth - rearWalkwayDepth / 2;
    const rearWalkwayBox = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width - 0.04, rearWalkwayHeight, rearWalkwayDepth),
      new THREE.MeshStandardMaterial({
        map: carpetTex || undefined,
        color: 0x161824,
        roughness: 0.92
      })
    );
    rearWalkwayBox.position.set(0, rearWalkwayHeight / 2, rearWalkwayZ);
    riserGroup.add(rearWalkwayBox);
    scene.add(riserGroup);

    // Helper to generate crisp illuminated canvas sign textures
    const createDoorSignTex = (title: string, subtitle: string, icon: string, accentColor: string) => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 200;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#080a14';
        ctx.fillRect(0, 0, 512, 200);

        // Outer glow frame
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, 496, 184);

        // Icon
        ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = accentColor;
        ctx.fillText(icon, 70, 100);

        // Title text
        ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(title, 290, 75);

        // Subtitle text
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(subtitle, 290, 135);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      return tex;
    };

    // 6. Acoustic Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex || undefined,
      color: 0x222533,
      roughness: 0.82,
      metalness: 0.12
    });

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, hall.height, hall.depth), wallMat);
    leftWall.position.set(-hall.width / 2, hall.height / 2, hall.depth / 2);
    scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, hall.height, hall.depth), wallMat);
    rightWall.position.set(hall.width / 2, hall.height / 2, hall.depth / 2);
    scene.add(rightWall);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(hall.width, hall.height, 0.4), wallMat);
    backWall.position.set(0, hall.height / 2, hall.depth);
    scene.add(backWall);

    // Front Wall (Behind Screen)
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width, hall.height, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x05060b, roughness: 0.98 })
    );
    frontWall.position.set(0, hall.height / 2, 0.2);
    scene.add(frontWall);

    // Low Stage Skirt below the screen (Flush to side walls)
    const stageHeight = 0.85;
    const stageMesh = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width - 0.04, stageHeight, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x0d0f17, roughness: 0.95 })
    );
    stageMesh.position.set(0, stageHeight / 2, 1.8);
    scene.add(stageMesh);

    // 7. Architectural Side Wall Sconces & Door Portals (Exact match to real SJ Cinemas photo)
    const wallLights: THREE.PointLight[] = [];

    // Circular Warm-Amber Sconces with Diagonal Black Accent Bars (Spaced to avoid K-L washroom doors)
    const sconceZPositions = [6.2, 10.8, 20.0, 25.0];
    const sconceBaseGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.03, 32);
    sconceBaseGeo.rotateZ(Math.PI / 2);
    const sconceBaseMat = new THREE.MeshStandardMaterial({ color: 0x090b12, metalness: 0.9, roughness: 0.25 });

    const sconceLensGeo = new THREE.CircleGeometry(0.18, 32);
    sconceLensGeo.rotateY(Math.PI / 2);
    const sconceLensMat = new THREE.MeshBasicMaterial({ color: 0xffd188, transparent: true, opacity: 1.0 });

    const diagBarGeo = new THREE.BoxGeometry(0.035, 0.76, 0.035);
    const diagBarMat = new THREE.MeshStandardMaterial({ color: 0x07090e, metalness: 0.8, roughness: 0.3 });

    sconceZPositions.forEach(zPos => {
      [-hall.width / 2 + 0.21, hall.width / 2 - 0.21].forEach((xPos, sideIdx) => {
        const sign = sideIdx === 0 ? 1 : -1;

        // Dark backplate
        const base = new THREE.Mesh(sconceBaseGeo, sconceBaseMat);
        base.position.set(xPos, 5.4, zPos);
        scene.add(base);

        // Circular warm-amber glowing lens
        const lens = new THREE.Mesh(sconceLensGeo, sconceLensMat);
        lens.position.set(xPos + sign * 0.02, 5.4, zPos);
        if (sign === -1) lens.rotateY(Math.PI);
        scene.add(lens);

        // Signature Diagonal Black Arm cutting through the sconce (matching photo)
        const diagBar = new THREE.Mesh(diagBarGeo, diagBarMat);
        diagBar.position.set(xPos + sign * 0.03, 5.4, zPos);
        diagBar.rotation.z = sign * 0.65; // ~37 degrees diagonal tilt
        scene.add(diagBar);
      });
    });

    // Washroom Doors on Both Side Walls Exactly Between Rows K and L
    // Left side: Women's Washroom / Restroom
    // Right side: Men's Washroom / Restroom
    const washroomZ = walkwayZ;
    const washroomDoorH = 2.6;
    const washroomDoorW = 1.35;
    const washroomFloorY = walkwayHeight;

    [-hall.width / 2 + 0.18, hall.width / 2 - 0.18].forEach((xPos, sideIdx) => {
      const isLeft = sideIdx === 0;
      const sign = isLeft ? 1 : -1;

      // Dark Door Inset with panel relief
      const doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, washroomDoorH, washroomDoorW),
        new THREE.MeshStandardMaterial({ color: 0x070912, roughness: 0.92 })
      );
      doorMesh.position.set(xPos, washroomFloorY + washroomDoorH / 2, washroomZ);
      scene.add(doorMesh);

      // Handle / Push Plate
      const handleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.25, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
      );
      handleMesh.position.set(xPos + sign * 0.02, washroomFloorY + 1.05, washroomZ + sign * 0.45);
      scene.add(handleMesh);

      // Glowing Warm-Amber Contour Frame (Top header & side jambs)
      const contourMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });

      // Top horizontal header trim
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, washroomDoorW + 0.08), contourMat);
      topTrim.position.set(xPos + sign * 0.01, washroomFloorY + washroomDoorH, washroomZ);
      scene.add(topTrim);

      // Front vertical trim leg
      const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(0.09, washroomDoorH, 0.06), contourMat);
      frontTrim.position.set(xPos + sign * 0.01, washroomFloorY + washroomDoorH / 2, washroomZ - washroomDoorW / 2 - 0.01);
      scene.add(frontTrim);

      // Rear vertical trim leg
      const rearTrim = new THREE.Mesh(new THREE.BoxGeometry(0.09, washroomDoorH, 0.06), contourMat);
      rearTrim.position.set(xPos + sign * 0.01, washroomFloorY + washroomDoorH / 2, washroomZ + washroomDoorW / 2 + 0.01);
      scene.add(rearTrim);

      // Illuminated Washroom Signage above Door
      // Left: Women's Washroom (Pink/Warm Rose), Right: Men's Washroom (Sky Blue)
      const signTex = isLeft
        ? createDoorSignTex("LADIES", "WOMEN'S RESTROOM", "🚺", "#f43f5e")
        : createDoorSignTex("GENTS", "MEN'S RESTROOM", "🚹", "#38bdf8");

      const signBoxGeo = new THREE.BoxGeometry(0.05, 0.32, 0.82);
      const signBoxMat = new THREE.MeshBasicMaterial({ color: 0x090c16 });
      const signBox = new THREE.Mesh(signBoxGeo, signBoxMat);
      signBox.position.set(xPos + sign * 0.01, washroomFloorY + washroomDoorH + 0.24, washroomZ);
      scene.add(signBox);

      const signFaceGeo = new THREE.PlaneGeometry(0.80, 0.30);
      const signFaceMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
      const signFace = new THREE.Mesh(signFaceGeo, signFaceMat);
      signFace.position.set(xPos + sign * 0.04, washroomFloorY + washroomDoorH + 0.24, washroomZ);
      signFace.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      scene.add(signFace);
    });

    // 8. Top of Theatre Ceiling Architecture (Matching real SJ Cinemas Nagari photo)
    // Continuous Warm-Amber Wall-Ceiling Cove Strip running along top edge of both walls
    const coveGeo = new THREE.BoxGeometry(0.12, 0.08, hall.depth - 3);
    const coveMat = new THREE.MeshBasicMaterial({ color: 0xffdf88, transparent: true, opacity: 1.0 });
    [-hall.width / 2 + 0.12, hall.width / 2 - 0.12].forEach(xPos => {
      const cove = new THREE.Mesh(coveGeo, coveMat);
      cove.position.set(xPos, hall.height - 0.04, hall.depth / 2);
      scene.add(cove);
    });

    // Pitch-black modular acoustic tiled ceiling plane
    const ceilingGeo = new THREE.PlaneGeometry(hall.width, hall.depth);
    ceilingGeo.rotateX(Math.PI / 2);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex || undefined,
      color: 0x07080f,
      roughness: 0.96,
      metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, hall.height, hall.depth / 2);
    scene.add(ceiling);

    // Centerline Circular Blue-White Downlight Cans (The signature SJ Cinemas ceiling feature)
    const canZPositions = [5.5, 9.5, 13.5, 17.5, 21.5, 25.5, 29.5];
    const canFixtureGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24);
    const canFixtureMat = new THREE.MeshStandardMaterial({ color: 0x0d111c, metalness: 0.85, roughness: 0.3 });
    const canLensGeo = new THREE.CircleGeometry(0.20, 24);
    canLensGeo.rotateX(Math.PI / 2);
    const canLensMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe, transparent: true, opacity: 1.0 });
    // Halo glow disc around the blue-white can light
    const canGlowGeo = new THREE.CircleGeometry(0.55, 24);
    canGlowGeo.rotateX(Math.PI / 2);
    const canGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    canZPositions.forEach(z => {
      const canFixture = new THREE.Mesh(canFixtureGeo, canFixtureMat);
      canFixture.position.set(0, hall.height - 0.02, z);
      scene.add(canFixture);

      const canLens = new THREE.Mesh(canLensGeo, canLensMat);
      canLens.position.set(0, hall.height - 0.038, z);
      scene.add(canLens);

      const canGlow = new THREE.Mesh(canGlowGeo, canGlowMat);
      canGlow.position.set(0, hall.height - 0.036, z);
      scene.add(canGlow);
    });

    // Dynamic Radiating Angled Red Neon LED Batons (Exact perspective pattern from photo)
    const angledRedStrips = [
      // Front amphitheater radiating strips (near screen)
      { x: 1.8, z: 6.2, len: 2.2, angle: 0.22 },
      { x: 3.8, z: 8.0, len: 2.5, angle: 0.36 },
      { x: 5.8, z: 9.8, len: 2.8, angle: 0.50 },

      // Mid-auditorium radiating strips
      { x: 1.9, z: 12.0, len: 2.3, angle: 0.24 },
      { x: 4.0, z: 14.0, len: 2.6, angle: 0.38 },
      { x: 6.0, z: 16.0, len: 2.9, angle: 0.52 },

      // Rear seating radiating strips
      { x: 2.0, z: 18.0, len: 2.4, angle: 0.25 },
      { x: 4.2, z: 20.0, len: 2.7, angle: 0.40 },
      { x: 6.2, z: 22.0, len: 2.9, angle: 0.54 },

      // Back balcony radiating strips
      { x: 2.1, z: 24.2, len: 2.4, angle: 0.26 },
      { x: 4.4, z: 26.2, len: 2.7, angle: 0.42 },
      { x: 6.4, z: 28.2, len: 2.9, angle: 0.55 }
    ];

    const redCoreMat = new THREE.MeshBasicMaterial({ color: 0xff1e2e, transparent: true, opacity: 1.0 });
    const redGlowMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    angledRedStrips.forEach(item => {
      // Symmetrical Left (-x) and Right (+x)
      [-1, 1].forEach(sideSign => {
        const posX = sideSign * item.x;
        const rotY = sideSign * -item.angle;

        // Core bright neon baton
        const barGeo = new THREE.BoxGeometry(0.06, 0.04, item.len);
        const barMesh = new THREE.Mesh(barGeo, redCoreMat);
        barMesh.position.set(posX, hall.height - 0.04, item.z);
        barMesh.rotation.y = rotY;
        scene.add(barMesh);

        // Soft neon emissive bloom halo
        const haloGeo = new THREE.BoxGeometry(0.18, 0.06, item.len + 0.1);
        const haloMesh = new THREE.Mesh(haloGeo, redGlowMat);
        haloMesh.position.set(posX, hall.height - 0.038, item.z);
        haloMesh.rotation.y = rotY;
        scene.add(haloMesh);
      });
    });

    // Starry Fiber-Optic Pin Lights (~550 points across ceiling in real photo)
    const starCount = 550;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let s = 0; s < starCount; s++) {
      starPositions[s * 3] = (Math.random() - 0.5) * (hall.width - 1.8);
      starPositions[s * 3 + 1] = hall.height - 0.055;
      starPositions[s * 3 + 2] = Math.random() * (hall.depth - 4.2) + 2.4;

      // Realistic mix: warm golden amber pins (65%), pure white (25%), ice-blue (10%)
      const randType = Math.random();
      if (randType < 0.65) {
        // Warm golden star
        const warm = Math.random() * 0.3 + 0.7;
        starColors[s * 3] = 1.0;
        starColors[s * 3 + 1] = 0.88 * warm;
        starColors[s * 3 + 2] = 0.55 * warm;
      } else if (randType < 0.90) {
        // Pure diamond white
        starColors[s * 3] = 1.0;
        starColors[s * 3 + 1] = 1.0;
        starColors[s * 3 + 2] = 1.0;
      } else {
        // Cool ice-blue
        starColors[s * 3] = 0.72;
        starColors[s * 3 + 1] = 0.92;
        starColors[s * 3 + 2] = 1.0;
      }
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.98
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Ceiling-Mounted Dolby Atmos Overhead Speakers (Matching photo)
    const overheadSpkGeo = new THREE.BoxGeometry(0.38, 0.22, 0.48);
    const overheadSpkMat = new THREE.MeshStandardMaterial({
      color: 0x090a10,
      metalness: 0.9,
      roughness: 0.25
    });

    [-3.8, 3.8].forEach((overheadX, sideIdx) => {
      [9.5, 17.5, 25.5].forEach(spkZ => {
        const spk = new THREE.Mesh(overheadSpkGeo, overheadSpkMat);
        spk.position.set(overheadX, hall.height - 0.12, spkZ);
        // Angle 14 degrees inward toward the audience
        spk.rotation.z = sideIdx === 0 ? -0.24 : 0.24;
        scene.add(spk);
      });
    });

    // 9. HIGH-PERFORMANCE DYNAMIC MOVIE SCREEN CANVAS
    const movieCanvas = document.createElement('canvas');
    // 960x540 provides crisp visual fidelity while saving 75% RAM and CPU compared to 1080p
    movieCanvas.width = 960;
    movieCanvas.height = 540;
    videoCanvasRef.current = movieCanvas;

    // Immediately render first frame so screen is never blank
    renderMovieScene(movieCanvas, 0);

    const screenTexture = new THREE.CanvasTexture(movieCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTexture.generateMipmaps = false; // Eliminates heavy GPU mipmap regeneration on every frame
    screenTexture.needsUpdate = true;
    screenTextureRef.current = screenTexture;

    // Mathematically Curved Screen Mesh (Concave towards Audience)
    const screenGeo = new THREE.PlaneGeometry(screenSpec.width, screenSpec.height, 64, 1);
    const posAttr = screenGeo.attributes.position;
    const curveRatio = (screenSpec.width / 2) / screenSpec.curveRadius;

    // Curve screen vertices forward towards audience in +Z direction
    for (let i = 0; i < posAttr.count; i++) {
      const xNorm = (posAttr.getX(i) / (screenSpec.width / 2)) * curveRatio;
      posAttr.setX(i, screenSpec.curveRadius * Math.sin(xNorm));
      posAttr.setZ(i, screenSpec.curveRadius * (1 - Math.cos(xNorm)));
    }
    posAttr.needsUpdate = true;
    screenGeo.computeVertexNormals();

    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false,
      side: THREE.DoubleSide
    });

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, screenSpec.centerHeight, 2.2);
    scene.add(screenMesh);
    screenMeshRef.current = screenMesh;

    // Clean Outer Frame Border (Top & Bottom Masking Bars)
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(screenSpec.width + 0.8, 0.25, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x05060b, roughness: 0.98 })
    );
    topBar.position.set(0, screenSpec.centerHeight + screenSpec.height / 2 + 0.12, 2.2);
    scene.add(topBar);

    const botBar = new THREE.Mesh(
      new THREE.BoxGeometry(screenSpec.width + 0.8, 0.25, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x05060b, roughness: 0.98 })
    );
    botBar.position.set(0, screenSpec.centerHeight - screenSpec.height / 2 - 0.12, 2.2);
    scene.add(botBar);

    // 10. Back Wall Architecture (Matching real SJ Cinemas Nagari photo)
    // Projection Booth Window with Metal Frame
    const boothFrameGeo = new THREE.BoxGeometry(1.6, 0.9, 0.08);
    const boothFrameMat = new THREE.MeshStandardMaterial({ color: 0x090a10, metalness: 0.9, roughness: 0.2 });
    const boothFrame = new THREE.Mesh(boothFrameGeo, boothFrameMat);
    boothFrame.position.set(0, hall.height - 1.6, hall.depth - 0.15);
    scene.add(boothFrame);

    const boothWindowGeo = new THREE.PlaneGeometry(1.45, 0.76);
    const boothMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const boothWindow = new THREE.Mesh(boothWindowGeo, boothMat);
    boothWindow.position.set(0, hall.height - 1.6, hall.depth - 0.18);
    boothWindow.rotateY(Math.PI);
    scene.add(boothWindow);

    // Horizontal Acoustic Louver Grille to the Right of Projection Booth (Matching photo)
    const louverFrameGeo = new THREE.BoxGeometry(2.0, 0.8, 0.06);
    const louverMat = new THREE.MeshStandardMaterial({ color: 0x0d0f17, roughness: 0.85 });
    const louverMesh = new THREE.Mesh(louverFrameGeo, louverMat);
    louverMesh.position.set(2.4, hall.height - 1.6, hall.depth - 0.16);
    scene.add(louverMesh);

    // Slats across louver
    for (let sl = -0.32; sl <= 0.32; sl += 0.09) {
      const slatGeo = new THREE.BoxGeometry(1.9, 0.025, 0.08);
      const slatMat = new THREE.MeshStandardMaterial({ color: 0x181b26, roughness: 0.7 });
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(2.4, hall.height - 1.6 + sl, hall.depth - 0.17);
      scene.add(slat);
    }

    // 4 Back Wall Circular Amber Sconces (Matching photo)
    const rearSconceXPositions = [-5.2, -2.4, 2.4, 5.2];
    rearSconceXPositions.forEach(rx => {
      const rearLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.18, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd188 })
      );
      rearLens.position.set(rx, 5.8, hall.depth - 0.18);
      rearLens.rotateY(Math.PI);
      scene.add(rearLens);

      // Diagonal Black Arm
      const rearArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.72, 0.035),
        new THREE.MeshStandardMaterial({ color: 0x08090e, metalness: 0.8 })
      );
      rearArm.position.set(rx, 5.8, hall.depth - 0.19);
      rearArm.rotation.z = 0.65;
      scene.add(rearArm);
    });

    // Consolidated architectural wash lights
    // Replaces 29 individual point lights with 4 strategic cluster washes to prevent uniform overflow & lag on mobile
    const leftWallWash = new THREE.PointLight(0xffbe6b, 2.6, 26, 1.4);
    leftWallWash.position.set(-hall.width / 2 + 1.2, 5.4, hall.depth * 0.5);
    scene.add(leftWallWash);
    wallLights.push(leftWallWash);

    const rightWallWash = new THREE.PointLight(0xffbe6b, 2.6, 26, 1.4);
    rightWallWash.position.set(hall.width / 2 - 1.2, 5.4, hall.depth * 0.5);
    scene.add(rightWallWash);
    wallLights.push(rightWallWash);

    const ceilingWash = new THREE.PointLight(0xa5f3fc, 2.0, 26, 1.5);
    ceilingWash.position.set(0, hall.height - 0.8, hall.depth * 0.48);
    scene.add(ceilingWash);
    wallLights.push(ceilingWash);

    const rearWallWash = new THREE.PointLight(0xffbe6b, 1.8, 18, 1.5);
    rearWallWash.position.set(0, 5.6, hall.depth - 1.5);
    scene.add(rearWallWash);
    wallLights.push(rearWallWash);

    wallLightsRef.current = wallLights;

    // Main Cinema Entrance Doors on Rear Wall Aligned with Aisle Gaps (Row A: 12-13 gap and 4-5 gap)
    // Left aisle center = -3.3m, Right aisle center = +3.3m
    const entranceAislePositions = [-3.3, 3.3];
    const entranceFloorY = 0.5 + 19 * 0.28; // 5.82m (Row A concourse floor level)
    const entranceDoorH = 2.5;
    const entranceDoorW = 1.4;
    const entranceZ = hall.depth - 0.16;

    const entranceSignTex = createDoorSignTex("ENTRANCE", "AUDITORIUM 1", "🚪", "#22c55e");

    entranceAislePositions.forEach(exX => {
      // Dark Acoustic Double-Door Inset
      const exDoor = new THREE.Mesh(
        new THREE.BoxGeometry(entranceDoorW, entranceDoorH, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x07080f, roughness: 0.95 })
      );
      exDoor.position.set(exX, entranceFloorY + entranceDoorH / 2, entranceZ);
      scene.add(exDoor);

      // Vertical door split line (center double door meeting stile)
      const centerStile = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, entranceDoorH, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x181a26, metalness: 0.5, roughness: 0.5 })
      );
      centerStile.position.set(exX, entranceFloorY + entranceDoorH / 2, entranceZ - 0.01);
      scene.add(centerStile);

      // Panic Push Bars on both doors
      [-0.32, 0.32].forEach(barOffsetX => {
        const pushBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.05, 0.05),
          new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
        );
        pushBar.position.set(exX + barOffsetX, entranceFloorY + 1.05, entranceZ - 0.04);
        scene.add(pushBar);
      });

      // Warm Amber Glowing Contour Trim
      const contourMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });
      // Top header trim
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(entranceDoorW + 0.08, 0.06, 0.08), contourMat);
      topTrim.position.set(exX, entranceFloorY + entranceDoorH, entranceZ - 0.02);
      scene.add(topTrim);
      // Left vertical trim
      const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, entranceDoorH, 0.08), contourMat);
      leftTrim.position.set(exX - entranceDoorW / 2 - 0.01, entranceFloorY + entranceDoorH / 2, entranceZ - 0.02);
      scene.add(leftTrim);
      // Right vertical trim
      const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, entranceDoorH, 0.08), contourMat);
      rightTrim.position.set(exX + entranceDoorW / 2 + 0.01, entranceFloorY + entranceDoorH / 2, entranceZ - 0.02);
      scene.add(rightTrim);

      // Illuminated Entrance Sign above door facing auditorium (rotation Y = Math.PI)
      const signBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.30, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x090c16 })
      );
      signBox.position.set(exX, entranceFloorY + entranceDoorH + 0.24, entranceZ - 0.02);
      scene.add(signBox);

      const signFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.80, 0.28),
        new THREE.MeshBasicMaterial({ map: entranceSignTex, transparent: true })
      );
      signFace.position.set(exX, entranceFloorY + entranceDoorH + 0.24, entranceZ - 0.055);
      signFace.rotation.y = Math.PI; // Face forward into the auditorium
      scene.add(signFace);

      // Floor threshold step light inviting viewers in
      const thresholdLight = new THREE.Mesh(
        new THREE.BoxGeometry(entranceDoorW, 0.03, 0.10),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      thresholdLight.position.set(exX, entranceFloorY + 0.015, entranceZ - 0.05);
      scene.add(thresholdLight);
    });

    // Realistic Barco 4K laser lens spotlight targeting the screen
    const projectorSpot = new THREE.SpotLight(0xa5f3fc, 2.8, 36, Math.PI / 5, 0.45, 1.2);
    projectorSpot.position.set(0, hall.height - 1.5, hall.depth - 0.2);
    projectorSpot.target.position.set(0, screenSpec.centerHeight, 2.2);
    scene.add(projectorSpot);
    scene.add(projectorSpot.target);
    projectorSpotRef.current = projectorSpot;

    // 11. Detailed Luxury Multiplex Crimson Cinema Seats (Instanced Meshes)
    const backGeo = new THREE.BoxGeometry(0.52, 0.52, 0.14);
    backGeo.translate(0, 0.52, 0.14);
    const cushionGeo = new THREE.BoxGeometry(0.52, 0.15, 0.46);
    cushionGeo.translate(0, 0.22, -0.02);
    // Signature Multiplex Black Leatherette Headrest (matching real SJ Cinemas photo)
    const headrestGeo = new THREE.BoxGeometry(0.34, 0.18, 0.16);
    headrestGeo.translate(0, 0.70, 0.14);
    const frameGeo = new THREE.BoxGeometry(0.58, 0.38, 0.44);
    frameGeo.translate(0, 0.19, 0);

    const plushRedMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.55,
      metalness: 0.12
    });

    const headrestMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e14,
      roughness: 0.4,
      metalness: 0.15
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x141620,
      roughness: 0.7,
      metalness: 0.2
    });

    const instancedBacks = new THREE.InstancedMesh(backGeo, plushRedMat, seats.length);
    const instancedCushions = new THREE.InstancedMesh(cushionGeo, plushRedMat, seats.length);
    const instancedHeadrests = new THREE.InstancedMesh(headrestGeo, headrestMat, seats.length);
    const instancedArmrests = new THREE.InstancedMesh(frameGeo, frameMat, seats.length);

    scene.add(instancedBacks);
    scene.add(instancedCushions);
    scene.add(instancedHeadrests);
    scene.add(instancedArmrests);

    instancedSeatsRef.current = instancedBacks;
    instancedCushionsRef.current = instancedCushions;
    instancedHeadrestsRef.current = instancedHeadrests;
    instancedArmrestsRef.current = instancedArmrests;

    // Set matrices and initial colors
    const dummy = new THREE.Object3D();
    seats.forEach((seat, index) => {
      dummy.position.set(seat.position[0], seat.position[1], seat.position[2]);
      dummy.rotation.set(0, seat.facing, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      instancedBacks.setMatrixAt(index, dummy.matrix);
      instancedCushions.setMatrixAt(index, dummy.matrix);
      instancedHeadrests.setMatrixAt(index, dummy.matrix);
      instancedArmrests.setMatrixAt(index, dummy.matrix);

      const baseColor = seat.tier === 'RECLINER' ? 0xdc2626 : seat.tier === 'GOLD' ? 0xb91c1c : 0x991b1b;
      instancedBacks.setColorAt(index, new THREE.Color(baseColor));
      instancedCushions.setColorAt(index, new THREE.Color(baseColor));
    });

    instancedBacks.instanceMatrix.needsUpdate = true;
    if (instancedBacks.instanceColor) instancedBacks.instanceColor.needsUpdate = true;
    instancedCushions.instanceMatrix.needsUpdate = true;
    if (instancedCushions.instanceColor) instancedCushions.instanceColor.needsUpdate = true;
    instancedHeadrests.instanceMatrix.needsUpdate = true;
    instancedArmrests.instanceMatrix.needsUpdate = true;

    // Selected Seat Highlight Ring (Cyan Glow Halo)
    const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide
    });
    const highlightRing = new THREE.Mesh(ringGeo, ringMat);
    scene.add(highlightRing);
    seatHighlightRingRef.current = highlightRing;

    // 11B. Seat Side Row Indicator Boxes with LED Light Function (Off/On)
    // Small illuminated box mounted on the side of the starting seat and aisle ends
    // indicating starting seat and block ranges (e.g. "A 1-4", "A 5-12", "A 13-16")
    const seatLookup = new Map<string, Seat>();
    seats.forEach(s => seatLookup.set(s.id, s));

    const rowPlateTexMap = new Map<string, THREE.CanvasTexture>();
    const getRowPlateTexture = (rowLabel: string, seatRange: string) => {
      const key = `${rowLabel}_${seatRange}`;
      if (rowPlateTexMap.has(key)) return rowPlateTexMap.get(key)!;

      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 144;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#060810';
        ctx.fillRect(0, 0, 256, 144);

        // Subtle outer border
        ctx.strokeStyle = '#272b3b';
        ctx.lineWidth = 4;
        ctx.strokeRect(3, 3, 250, 138);

        // Inner glowing panel recess
        ctx.fillStyle = '#0e1222';
        ctx.fillRect(10, 10, 236, 124);

        // Row Letter (Bold prominent gold amber)
        ctx.fillStyle = '#ffbe55';
        ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rowLabel, 128, 48);

        // Range (e.g. "1 - 4" or "1-4")
        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(seatRange, 128, 102);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      rowPlateTexMap.set(key, tex);
      return tex;
    };

    const rowPlateFaceMaterials = new Map<string, THREE.MeshBasicMaterial>();
    const getRowPlateFaceMat = (rowLabel: string, seatRange: string) => {
      const key = `${rowLabel}_${seatRange}`;
      if (rowPlateFaceMaterials.has(key)) return rowPlateFaceMaterials.get(key)!;
      const tex = getRowPlateTexture(rowLabel, seatRange);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1.0 });
      rowPlateFaceMaterials.set(key, mat);
      return mat;
    };

    const boxCasingGeo = new THREE.BoxGeometry(0.18, 0.12, 0.024);
    const boxCasingMat = new THREE.MeshStandardMaterial({ color: 0x090b14, metalness: 0.85, roughness: 0.3 });
    const plateFaceGeo = new THREE.PlaneGeometry(0.16, 0.10);
    const slitGeo = new THREE.BoxGeometry(0.12, 0.012, 0.02);
    const rowLightSlitMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 1.0 });

    const puddleGeo = new THREE.CircleGeometry(0.22, 16);
    puddleGeo.rotateX(-Math.PI / 2);
    const rowLightPuddleMat = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.30,
      blending: THREE.AdditiveBlending
    });

    const rowIndicatorGroup = new THREE.Group();

    EXACT_SEAT_PLAN.forEach(rowPlan => {
      const row = rowPlan.rowLabel;
      const rightRange = `${rowPlan.rightSeats[0]} - ${rowPlan.rightSeats[rowPlan.rightSeats.length - 1]}`;
      const centerRange = `${rowPlan.centerSeats[0]} - ${rowPlan.centerSeats[rowPlan.centerSeats.length - 1]}`;
      const leftRange = `${rowPlan.leftSeats[0]} - ${rowPlan.leftSeats[rowPlan.leftSeats.length - 1]}`;

      // Mounting definitions: [seatId, side ('right' | 'left'), rangeText]
      const mountDefs: [string, 'right' | 'left', string][] = [
        // Right Block: Outer armrest at starting seat (Seat 1)
        [`${row}${rowPlan.rightSeats[0]}`, 'right', rightRange],
        // Right Block: Aisle armrest
        [`${row}${rowPlan.rightSeats[rowPlan.rightSeats.length - 1]}`, 'left', rightRange],
        // Center Block: Right aisle armrest
        [`${row}${rowPlan.centerSeats[0]}`, 'right', centerRange],
        // Center Block: Left aisle armrest
        [`${row}${rowPlan.centerSeats[rowPlan.centerSeats.length - 1]}`, 'left', centerRange],
        // Left Block: Left aisle armrest
        [`${row}${rowPlan.leftSeats[0]}`, 'right', leftRange],
        // Left Block: Outer armrest
        [`${row}${rowPlan.leftSeats[rowPlan.leftSeats.length - 1]}`, 'left', leftRange]
      ];

      mountDefs.forEach(([seatId, side, rangeText]) => {
        const seat = seatLookup.get(seatId);
        if (!seat) return;

        const sx = seat.position[0];
        const sy = seat.position[1];
        const sz = seat.position[2];
        const facing = seat.facing;

        // Calculate offset position on the armrest
        const isRight = side === 'right';
        const sign = isRight ? 1 : -1;
        const bx = sx + sign * 0.30 * Math.cos(facing);
        const bz = sz + sign * 0.30 * Math.sin(facing);
        const by = sy + 0.36;
        const rotY = facing + sign * (Math.PI / 2);

        const group = new THREE.Group();
        group.position.set(bx, by, bz);
        group.rotation.y = rotY;

        // Metallic casing box
        const casing = new THREE.Mesh(boxCasingGeo, boxCasingMat);
        group.add(casing);

        // Illuminated face plate with row & seat numbers
        const faceMat = getRowPlateFaceMat(row, rangeText);
        const face = new THREE.Mesh(plateFaceGeo, faceMat);
        face.position.set(0, 0, 0.013);
        group.add(face);

        // Downlight LED slit on bottom of box
        const slit = new THREE.Mesh(slitGeo, rowLightSlitMat);
        slit.position.set(0, -0.06, 0);
        group.add(slit);

        rowIndicatorGroup.add(group);

        // Floor puddle on carpet
        const puddle = new THREE.Mesh(puddleGeo, rowLightPuddleMat);
        puddle.position.set(bx, sy + 0.01, bz);
        rowIndicatorGroup.add(puddle);
      });
    });

    scene.add(rowIndicatorGroup);

    // 12. 3D Dolby Atmos Speakers
    const speakerGroup = new THREE.Group();
    speakers.forEach(spk => {
      const spkGeo = new THREE.BoxGeometry(0.32, 0.48, 0.24);
      const spkMat = new THREE.MeshStandardMaterial({ color: 0x090a10, metalness: 0.85, roughness: 0.25 });
      const spkMesh = new THREE.Mesh(spkGeo, spkMat);
      spkMesh.position.set(spk.position[0], spk.position[1], spk.position[2]);

      if (spk.position[0] < -5) {
        spkMesh.rotation.y = 0.35;
      } else if (spk.position[0] > 5) {
        spkMesh.rotation.y = -0.35;
      } else if (spk.channel.startsWith('T')) {
        spkMesh.rotation.x = Math.PI / 2;
      }

      const driverGeo = new THREE.CircleGeometry(0.07, 16);
      const driverMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const driverRing = new THREE.Mesh(driverGeo, driverMat);
      driverRing.position.set(0, 0, 0.13);
      spkMesh.add(driverRing);

      speakerGroup.add(spkMesh);
    });
    speakerGroup.visible = showSpeakers;
    scene.add(speakerGroup);

    // 13. High-Performance Render Loop (Throttled & Power-Efficient)
    let lastTime = performance.now();
    let lastTrailerDraw = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      trailerTimeRef.current += dt;

      // Draw dynamic movie trailer on screen canvas throttled to cinematic 24 FPS
      // Avoids updating a huge canvas 60 or 120 times per second, cutting CPU & VRAM bandwidth by up to 75%
      const trailerFPS = isMobile || isEcoModeRef.current ? 20 : 24;
      const trailerInterval = 1000 / trailerFPS;
      if (videoCanvasRef.current && isPlayingRef.current && (now - lastTrailerDraw >= trailerInterval)) {
        lastTrailerDraw = now;
        renderMovieScene(videoCanvasRef.current, trailerTimeRef.current);
        if (screenTextureRef.current) {
          screenTextureRef.current.needsUpdate = true;
        }
      }

      // Walk-in Entrance Camera Animation or Interactive Smooth Orbit
      if (isWalkingInRef.current && walkInStartTime.current) {
        const elapsed = (now - walkInStartTime.current) / 1000;
        const totalDuration = 3.6;
        const p = Math.min(1, elapsed / totalDuration);

        const targetSeat = seats.find(s => s.id === selectedSeatIdRef.current) || seats[0];
        const eyeY = targetSeat.position[1] + 1.18;

        if (p < 0.6) {
          // Walking down center aisle towards row
          const subP = p / 0.6;
          const ease = subP * subP * (3 - 2 * subP);
          const startZ = 30.5;
          const endZ = targetSeat.position[2] + 2.0;
          currentCameraPos.current.x = 0;
          currentCameraPos.current.y = THREE.MathUtils.lerp(5.2, 4.4, ease);
          currentCameraPos.current.z = THREE.MathUtils.lerp(startZ, endZ, ease);
        } else {
          // Turning into row and sitting down
          const subP = (p - 0.6) / 0.4;
          const ease = subP * subP * (3 - 2 * subP);
          const startZ = targetSeat.position[2] + 2.0;
          currentCameraPos.current.x = THREE.MathUtils.lerp(0, targetSeat.position[0], ease);
          currentCameraPos.current.y = THREE.MathUtils.lerp(4.4, eyeY, ease);
          currentCameraPos.current.z = THREE.MathUtils.lerp(startZ, targetSeat.position[2], ease);
        }

        camera.position.copy(currentCameraPos.current);
        camera.lookAt(targetLookAt.current);

        if (p >= 1) {
          isWalkingInRef.current = false;
          walkInStartTime.current = null;
          onWalkInComplete?.();
        }
      } else {
        // Smooth camera interpolation towards target position & orientation
        currentCameraPos.current.lerp(targetCameraPos.current, 0.08);

        if (viewModeRef.current === 'SEAT') {
          const yaw = cameraAngles.current.yaw;
          const pitch = cameraAngles.current.pitch;
          const lookDir = new THREE.Vector3(
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            -Math.cos(yaw) * Math.cos(pitch)
          );
          camera.position.copy(currentCameraPos.current);
          camera.lookAt(currentCameraPos.current.clone().add(lookDir));
        } else {
          currentLookAt.current.lerp(targetLookAt.current, 0.08);
          camera.position.copy(currentCameraPos.current);
          camera.lookAt(currentLookAt.current);
        }
      }

      // Update selected seat highlight halo
      const currentSelected = seats.find(s => s.id === selectedSeatIdRef.current);
      if (currentSelected && seatHighlightRingRef.current) {
        seatHighlightRingRef.current.position.set(
          currentSelected.position[0],
          currentSelected.position[1] + 0.03,
          currentSelected.position[2]
        );
        seatHighlightRingRef.current.visible = true;
      }

      const time = now * 0.002;

      // Smooth Lighting Transitions (House Lights vs Showtime)
      const isLightsOn = lightsUpRef.current;
      const targetWallIntensity = isLightsOn ? 2.8 : 0.18;
      const targetAmbient = isLightsOn ? 0.95 : 0.22;
      const targetSpotIntensity = isLightsOn ? 3.8 : 0.25;
      const targetHemiIntensity = isLightsOn ? 1.2 : 0.25;
      const targetProjectorIntensity = isLightsOn ? 1.0 : 3.4;

      // Roof / Ceiling Light Dimming (Turn off completely when lights are off)
      const targetCoveOpacity = isLightsOn ? 1.0 : 0.0;
      const targetCanLensOpacity = isLightsOn ? 1.0 : 0.0;
      const targetCanGlowOpacity = isLightsOn ? 0.35 : 0.0;
      const targetRedCoreOpacity = isLightsOn ? 1.0 : 0.0;
      const targetRedGlowOpacity = isLightsOn ? 0.50 : 0.0;
      const targetStarOpacity = isLightsOn ? (0.8 + 0.2 * Math.sin(time * 2)) : 0.0;
      const targetSconceOpacity = isLightsOn ? 1.0 : 0.06;

      coveMat.opacity = THREE.MathUtils.lerp(coveMat.opacity, targetCoveOpacity, 0.12);
      canLensMat.opacity = THREE.MathUtils.lerp(canLensMat.opacity, targetCanLensOpacity, 0.12);
      canGlowMat.opacity = THREE.MathUtils.lerp(canGlowMat.opacity, targetCanGlowOpacity, 0.12);
      redCoreMat.opacity = THREE.MathUtils.lerp(redCoreMat.opacity, targetRedCoreOpacity, 0.12);
      redGlowMat.opacity = THREE.MathUtils.lerp(redGlowMat.opacity, targetRedGlowOpacity, 0.12);
      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetStarOpacity, 0.12);
      sconceLensMat.opacity = THREE.MathUtils.lerp(sconceLensMat.opacity, targetSconceOpacity, 0.12);

      wallLightsRef.current.forEach(light => {
        light.intensity = THREE.MathUtils.lerp(light.intensity, targetWallIntensity, 0.08);
      });
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.lerp(
          ambientLightRef.current.intensity,
          targetAmbient,
          0.08
        );
      }
      if (hemiLightRef.current) {
        hemiLightRef.current.intensity = THREE.MathUtils.lerp(
          hemiLightRef.current.intensity,
          targetHemiIntensity,
          0.08
        );
      }
      if (seatSpotLightRef.current) {
        seatSpotLightRef.current.intensity = THREE.MathUtils.lerp(
          seatSpotLightRef.current.intensity,
          targetSpotIntensity,
          0.08
        );
      }
      if (projectorSpotRef.current) {
        projectorSpotRef.current.intensity = THREE.MathUtils.lerp(
          projectorSpotRef.current.intensity,
          targetProjectorIntensity,
          0.08
        );
      }

      // Update Row Indicator Lights function (Off and On)
      const isRowLightsOn = rowLightsOnRef.current;
      const targetPlateOpacity = isRowLightsOn ? 1.0 : 0.20;
      const targetSlitOpacity = isRowLightsOn ? 1.0 : 0.0;
      const targetPuddleOpacity = isRowLightsOn ? 0.30 : 0.0;
      const plateColorHex = isRowLightsOn ? 0xffffff : 0x555555;
      const slitColorHex = isRowLightsOn ? 0xffb347 : 0x111111;

      if (Math.abs(rowLightSlitMat.opacity - targetSlitOpacity) > 0.005) {
        rowLightSlitMat.opacity = THREE.MathUtils.lerp(rowLightSlitMat.opacity, targetSlitOpacity, 0.12);
        rowLightPuddleMat.opacity = THREE.MathUtils.lerp(rowLightPuddleMat.opacity, targetPuddleOpacity, 0.12);
        rowLightSlitMat.color.setHex(slitColorHex);
        rowPlateFaceMaterials.forEach(mat => {
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetPlateOpacity, 0.12);
          mat.color.setHex(plateColorHex);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pause rendering and video when tab is hidden to save battery & device heat
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (videoElementRef.current && !videoElementRef.current.paused) {
          videoElementRef.current.pause();
        }
      } else {
        lastTime = performance.now();
        if (!animFrameRef.current) {
          animate();
        }
        if (isPlayingRef.current && videoElementRef.current && videoElementRef.current.paused) {
          videoElementRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update speakers visibility
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.traverse(child => {
        if (child instanceof THREE.Group && child.children.length === speakers.length) {
          child.visible = showSpeakers;
        }
      });
    }
  }, [showSpeakers, speakers]);

  // Update seat colors on heatmap or tier change
  useEffect(() => {
    if (!instancedSeatsRef.current || !instancedCushionsRef.current) return;
    const backs = instancedSeatsRef.current;
    const cushions = instancedCushionsRef.current;

    seats.forEach((seat, index) => {
      if (viewMode === 'HEATMAP') {
        const score = scoresMap.get(seat.id);
        const col = new THREE.Color(score ? score.color : '#334155');
        backs.setColorAt(index, col);
        cushions.setColorAt(index, col);
      } else {
        const isCurrent = seat.id === selectedSeatId;
        if (isCurrent) {
          const cyan = new THREE.Color('#06b6d4');
          backs.setColorAt(index, cyan);
          cushions.setColorAt(index, cyan);
        } else {
          const baseColor = seat.tier === 'RECLINER' ? 0xdc2626 : seat.tier === 'GOLD' ? 0xb91c1c : 0x991b1b;
          const col = new THREE.Color(baseColor);
          backs.setColorAt(index, col);
          cushions.setColorAt(index, col);
        }
      }
    });

    if (backs.instanceColor) backs.instanceColor.needsUpdate = true;
    if (cushions.instanceColor) cushions.instanceColor.needsUpdate = true;
  }, [viewMode, selectedSeatId, scoresMap, seats]);

  // Dedicated High-Fidelity Movie Scene Trailer Canvas Renderer
  const renderMovieScene = (canvas: HTMLCanvasElement, t: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const movie = activeTrailer?.id || 'ramayana';
    const [c1, c2, c3] = (activeTrailer?.colorPalette && activeTrailer.colorPalette.length >= 3)
      ? activeTrailer.colorPalette
      : ['#f59e0b', '#dc2626', '#451a03'];
    const video = videoElementRef.current;

    // 1. Check if raw video is actively playing frames with valid content
    const isVideoPlaying =
      video &&
      !video.paused &&
      video.currentTime > 0.08 &&
      (hasRawVideo || video.readyState >= 2) &&
      !video.error;

    if (isVideoPlaying && video.videoWidth > 0) {
      // Letterbox Bars Background
      ctx.fillStyle = '#020306';
      ctx.fillRect(0, 0, w, h);

      // Draw raw video preserving native aspect ratio
      const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
      const canvasAspect = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (videoAspect > canvasAspect) {
        drawH = w / videoAspect;
        offsetY = (h - drawH) / 2;
      } else {
        drawW = h * videoAspect;
        offsetX = (w - drawW) / 2;
      }

      ctx.drawImage(video, offsetX, offsetY, drawW, drawH);

      // Real-time screen ambient bounce lighting into theater
      if (screenLightRef.current) {
        screenLightRef.current.color.set(c1);
        screenLightRef.current.intensity = 3.4;
      }
      return;
    }

    // 2. Dynamic Cinema Trailer Reel Background (Fallback Canvas Animation)
    const grad = ctx.createRadialGradient(
      w / 2 + Math.sin(t * 1.5) * 280,
      h / 2 + Math.cos(t * 1.2) * 140,
      100,
      w / 2,
      h / 2,
      w * 0.78
    );
    grad.addColorStop(0, c1);
    grad.addColorStop(0.5, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. High-energy cinematic particles and atmosphere (Optimized particle count)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const particleCount = movie === 'leo' ? 24 : 16;
    for (let p = 0; p < particleCount; p++) {
      const px = ((p * 83 + t * (movie === 'leo' ? 140 : 200)) % (w - 40)) + 20;
      const py = ((p * 47 + Math.sin(t * 2.8 + p) * 90 + h / 2) % (h - 50)) + 25;
      const pr = 1.8 + (p % 3);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. CinemaScope 2.39:1 Letterbox Bars (Top & Bottom Masking)
    const letterboxHeight = 36;
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, w, letterboxHeight);
    ctx.fillRect(0, h - letterboxHeight, w, letterboxHeight);

    // Gold Top Cinema Ribbon
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('★ SJ CINEMAS SREENIVASA NAGARI • AUDITORIUM 1', 30, 24);

    ctx.textAlign = 'right';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('BARCO 4K RGB LASER • DOLBY ATMOS 64-CH SPATIAL SOUND', w - 30, 24);

    // 4. Movie-Specific Artwork, Credits & Typographic Trailer Scenes (High performance text without CPU blur)
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0; // Disabled costly 32px Gaussian blur filter

    const drawCrispText = (text: string, x: number, y: number, font: string, fill: string, strokeWidth = 0) => {
      ctx.font = font;
      if (strokeWidth > 0) {
        ctx.strokeStyle = '#020306';
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
    };

    // RAMAYANA - Official 3D Presentation
    drawCrispText('RAMAYANA', w / 2, h / 2 - 25, '900 44px "Plus Jakarta Sans", sans-serif', '#fef08a', 5);
    drawCrispText('★ SHOWING IN 3D • TELUGU & TAMIL ★', w / 2, h / 2 + 10, 'bold 17px monospace', '#f59e0b', 3);
    drawCrispText('NAMIT MALHOTRA • NITESH TIWARI • RANBIR KAPOOR • SAI PALLAVI • YASH', w / 2, h / 2 + 36, 'bold 13px "Plus Jakarta Sans", sans-serif', '#ffffff', 2);
    drawCrispText('BARCO 4K RGB LASER 3D • 64-CHANNEL DOLBY ATMOS IMMERSION', w / 2, h / 2 + 58, '600 11px monospace', '#fbbf24');

    // 5. 64-Channel Audio Equalizer Spectrum (Live Animated Waves)
    const barCount = 36;
    const barWidth = 6;
    const spacing = 11;
    const startX = (w - barCount * spacing) / 2;

    for (let b = 0; b < barCount; b++) {
      const freq = Math.abs(Math.sin(t * 8.5 + b * 0.38));
      const barH = 8 + 45 * freq;

      ctx.fillStyle = b % 2 === 0 ? '#38bdf8' : '#e11d2e';
      ctx.fillRect(startX + b * spacing, h - letterboxHeight - 10 - barH, barWidth, barH);
    }

    // 6. Raw Trailer Guidance Badge (on-screen prompt to place .mp4 in public/trailers)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    const boxW = 480;
    const boxH = 22;
    const boxX = (w - boxW) / 2;
    const boxY = h - letterboxHeight - 38;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📁 Place "${activeTrailer.id}.mp4" into public/trailers/ or drop any video file`, w / 2, boxY + 15);

    // Update screen bounce light in theater
    if (screenLightRef.current) {
      screenLightRef.current.color.set(c1);
      screenLightRef.current.intensity = 2.6 + 1.2 * Math.abs(Math.sin(t * 4));
    }
  };

  // Drag to Look Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    totalDragDistance.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) {
      // Throttle hover raycasting to ~16 Hz (every 60ms) to avoid lagging mouse events
      const now = performance.now();
      if (now - lastHoverCheck.current < 60) return;
      lastHoverCheck.current = now;

      // Check hover over seats to show pointer cursor
      if (mountRef.current && cameraRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const meshes = [
          instancedSeatsRef.current,
          instancedCushionsRef.current,
          instancedHeadrestsRef.current,
          instancedArmrestsRef.current
        ].filter(Boolean) as THREE.InstancedMesh[];
        const hits = raycasterRef.current.intersectObjects(meshes);
        if (hits.length > 0 && hits[0].instanceId !== undefined) {
          mountRef.current.style.cursor = 'pointer';
        } else {
          mountRef.current.style.cursor = 'grab';
        }
      }
      return;
    }

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    totalDragDistance.current += Math.abs(dx) + Math.abs(dy);
    dragStart.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0035;
    cameraAngles.current.yaw -= dx * sensitivity;
    cameraAngles.current.pitch = Math.max(
      -0.65,
      Math.min(0.95, cameraAngles.current.pitch + dy * sensitivity)
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Drag & drop raw video file onto 3D screen
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mkv')) {
        onDropVideoFile?.(file);
      }
    }
  };

  // Click directly on 3D Seat (Reliably raycasts back, cushion, headrest, or armrest)
  const handleClick = (e: React.MouseEvent) => {
    // If user dragged more than 15px to look around, do not trigger seat selection
    if (totalDragDistance.current > 15) return;
    if (!mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = [
      instancedSeatsRef.current,
      instancedCushionsRef.current,
      instancedHeadrestsRef.current,
      instancedArmrestsRef.current
    ].filter(Boolean) as THREE.InstancedMesh[];

    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const hitSeat = seats[intersects[0].instanceId];
      if (hitSeat) {
        onSelectSeat(hitSeat.id);
      }
    }
  };

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* HTML5 Native Video Element Attached to DOM */}
      <video
        ref={videoElementRef}
        playsInline
        // @ts-expect-error webkit-playsinline for iOS Safari
        webkit-playsinline="true"
        crossOrigin="anonymous"
        loop
        preload="auto"
        muted={isMuted}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '320px',
          height: '180px',
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
    </div>
  );
};
