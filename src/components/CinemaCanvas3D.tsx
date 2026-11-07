import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Seat, ScreenSpec, HallDimensions, AudioSpeaker, TrailerVideo, SeatScore } from '../types/theater';

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
  viewMode,
  showSpeakers,
  isPlaying,
  isMuted,
  volume,
  customVideoUrl,
  customVideoName,
  onDropVideoFile,
  isWalkingIn,
  onWalkInComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const totalDragDistance = useRef(0);
  const cameraAngles = useRef({ yaw: 0, pitch: 0 });
  const targetCameraPos = useRef(new THREE.Vector3(0, 3.8, 14.5));
  const currentCameraPos = useRef(new THREE.Vector3(0, 3.8, 14.5));
  const targetLookAt = useRef(new THREE.Vector3(0, screenSpec.centerHeight, screenSpec.z));
  const currentLookAt = useRef(new THREE.Vector3(0, screenSpec.centerHeight, screenSpec.z));

  // Live props refs to avoid stale closures inside the requestAnimationFrame loop
  const lightsUpRef = useRef(lightsUp);
  useEffect(() => { lightsUpRef.current = lightsUp; }, [lightsUp]);

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

  // High-Fidelity Procedural Wall Texture (Matching SJ Cinemas Nagari acoustic panels)
  const createWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base mottled acoustic heather grey fabric (Matching real photo)
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine acoustic fabric weave & granite noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 36;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Distinct Vertical Crimson Geometric Acoustic Panels (Matching real photo pattern)
    const panelCols = [40, 120, 220, 310, 420, 520, 620, 720, 830, 930];
    panelCols.forEach((px, idx) => {
      const pWidth = idx % 2 === 0 ? 52 : 36;
      const grad = ctx.createLinearGradient(px, 0, px + pWidth, 0);
      grad.addColorStop(0, '#881337');
      grad.addColorStop(0.2, '#b91c1c');
      grad.addColorStop(0.8, '#dc2626');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(px, 0, pWidth, 700);

      // Acoustic shadow grooves between panels
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(px - 3, 0, 3, 700);
      ctx.fillRect(px + pWidth, 0, 3, 700);
    });

    // Lower Acoustic Wainscot / Dado (dark charcoal base along bottom of wall)
    ctx.fillStyle = '#080a12';
    ctx.fillRect(0, 715, 1024, 309);

    // Glowing Warm-Amber LED Accent Line running above wainscot
    const amberGrad = ctx.createLinearGradient(0, 704, 0, 716);
    amberGrad.addColorStop(0, 'rgba(255, 190, 107, 0)');
    amberGrad.addColorStop(0.5, 'rgba(255, 205, 130, 1)');
    amberGrad.addColorStop(1, 'rgba(255, 180, 80, 0.2)');
    ctx.fillStyle = amberGrad;
    ctx.fillRect(0, 704, 1024, 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(6, 1);
    return texture;
  };

  // High-Fidelity Cinema Floor Carpet Texture
  const createCarpetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark midnight cinema carpet base
    ctx.fillStyle = '#10131d';
    ctx.fillRect(0, 0, 512, 512);

    // Diamond grid woven carpet pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let i = -512; i <= 1024; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 512);
      ctx.lineTo(i + 512, 0);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 16);
    return texture;
  };

  // High-Fidelity Cinema Acoustic Ceiling Tile Grid Texture (Matching SJ Cinemas Nagari)
  const createCeilingTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Pitch black acoustic tile base
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, 512, 512);

    // Fine acoustic micro-perforations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let py = 6; py < 512; py += 16) {
      for (let px = 6; px < 512; px += 16) {
        ctx.fillRect(px, py, 1.5, 1.5);
      }
    }

    // Modular Acoustic T-Bar Grid Bevel Seams (Matching modular ceiling panels)
    ctx.strokeStyle = '#121624';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
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
    const videoSource = customVideoUrl || activeTrailer.videoUrl || `/trailers/${activeTrailer.id}.mp4`;

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

  // Auto-unlock unmuted audio on first user interaction anywhere in the window
  useEffect(() => {
    const unlockAudio = () => {
      const video = videoElementRef.current;
      if (video) {
        video.muted = isMuted;
        video.volume = volume;
        if (isPlaying && video.paused) {
          video.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [isMuted, volume, isPlaying]);

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

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // Stadium Risers with warm-amber step LED lights (Matching all 20 rows from A to T)
    const riserGroup = new THREE.Group();
    for (let r = 0; r < 20; r++) {
      const riserHeight = 0.5 + r * 0.28;
      const riserDepth = 1.25;
      const isUpperBlock = r >= 9;
      const riserZ = 5.6 + r * 1.12 + (isUpperBlock ? 1.5 : 0);
      const boxGeo = new THREE.BoxGeometry(hall.width - 0.8, riserHeight, riserDepth);
      const boxMat = new THREE.MeshStandardMaterial({
        map: carpetTex || undefined,
        color: 0x1a1d2a,
        roughness: 0.88
      });
      const riserBox = new THREE.Mesh(boxGeo, boxMat);
      riserBox.position.set(0, riserHeight / 2, riserZ);
      riserBox.receiveShadow = true;
      riserGroup.add(riserBox);

      // Warm Amber Step Riser LED Strip (matching SJ Cinemas Nagari aisle step lights)
      const stepLightGeo = new THREE.BoxGeometry(hall.width - 1.2, 0.04, 0.05);
      const stepLightMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
      const stepLight = new THREE.Mesh(stepLightGeo, stepLightMat);
      stepLight.position.set(0, riserHeight + 0.02, riserZ - riserDepth / 2 + 0.03);
      riserGroup.add(stepLight);
    }

    // Cross Aisle Walkway between Row L and Row K
    const walkwayHeight = 0.5 + 8 * 0.28;
    const walkwayBox = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width - 0.8, walkwayHeight, 1.4),
      new THREE.MeshStandardMaterial({
        map: carpetTex || undefined,
        color: 0x161824,
        roughness: 0.92
      })
    );
    walkwayBox.position.set(0, walkwayHeight / 2, 5.6 + 8 * 1.12 + 1.3);
    riserGroup.add(walkwayBox);
    scene.add(riserGroup);

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

    // Low Stage Skirt below the screen
    const stageHeight = 0.85;
    const stageMesh = new THREE.Mesh(
      new THREE.BoxGeometry(hall.width - 2, stageHeight, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x0d0f17, roughness: 0.95 })
    );
    stageMesh.position.set(0, stageHeight / 2, 1.8);
    scene.add(stageMesh);

    // 7. Architectural Side Wall Sconces & Door Portals (Exact match to real SJ Cinemas photo)
    const wallLights: THREE.PointLight[] = [];

    // Circular Warm-Amber Sconces with Diagonal Black Accent Bars
    const sconceZPositions = [6.5, 11.5, 16.5, 21.5, 26.5];
    const sconceBaseGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.03, 32);
    sconceBaseGeo.rotateZ(Math.PI / 2);
    const sconceBaseMat = new THREE.MeshStandardMaterial({ color: 0x090b12, metalness: 0.9, roughness: 0.25 });

    const sconceLensGeo = new THREE.CircleGeometry(0.18, 32);
    sconceLensGeo.rotateY(Math.PI / 2);
    const sconceLensMat = new THREE.MeshBasicMaterial({ color: 0xffd188 });

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

        // Warm amber point light casting light fan onto acoustic panel
        const sconceLight = new THREE.PointLight(0xffbe6b, 1.8, 8.5, 1.6);
        sconceLight.position.set(xPos + sign * 0.35, 5.4, zPos);
        scene.add(sconceLight);
        wallLights.push(sconceLight);
      });
    });

    // Side Entrance / Exit Doors with Warm-Amber Illuminated Contour Outlines (Matching photo at z = 9.5)
    [-hall.width / 2 + 0.2, hall.width / 2 - 0.2].forEach((xPos, sideIdx) => {
      const sign = sideIdx === 0 ? 1 : -1;
      const doorZ = 9.5;

      // Dark Door Inset
      const doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 2.7, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x05060b, roughness: 0.95 })
      );
      doorMesh.position.set(xPos, 2.7 / 2 + 0.4, doorZ);
      scene.add(doorMesh);

      // Glowing Warm-Amber Contour Frame (Top and side trims)
      const contourMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });

      // Top horizontal header trim
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 1.48), contourMat);
      topTrim.position.set(xPos + sign * 0.01, 2.7 + 0.4, doorZ);
      scene.add(topTrim);

      // Front vertical trim leg
      const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.7, 0.06), contourMat);
      frontTrim.position.set(xPos + sign * 0.01, 2.7 / 2 + 0.4, doorZ - 0.71);
      scene.add(frontTrim);

      // Rear vertical trim leg
      const rearTrim = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.7, 0.06), contourMat);
      rearTrim.position.set(xPos + sign * 0.01, 2.7 / 2 + 0.4, doorZ + 0.71);
      scene.add(rearTrim);
    });

    // 8. Top of Theatre Ceiling Architecture (Matching real SJ Cinemas Nagari photo)
    // Continuous Warm-Amber Wall-Ceiling Cove Strip running along top edge of both walls
    [-hall.width / 2 + 0.12, hall.width / 2 - 0.12].forEach(xPos => {
      const coveGeo = new THREE.BoxGeometry(0.12, 0.08, hall.depth - 3);
      const coveMat = new THREE.MeshBasicMaterial({ color: 0xffdf88 });
      const cove = new THREE.Mesh(coveGeo, coveMat);
      cove.position.set(xPos, hall.height - 0.04, hall.depth / 2);
      scene.add(cove);

      // Downward perimeter cove wash lights
      for (let cz = 6.0; cz < hall.depth - 2; cz += 6.0) {
        const covePt = new THREE.PointLight(0xffb74d, 1.4, 8, 1.8);
        covePt.position.set(xPos + (xPos < 0 ? 0.4 : -0.4), hall.height - 0.25, cz);
        scene.add(covePt);
        wallLights.push(covePt);
      }
    });

    wallLightsRef.current = wallLights;

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
    const canLensMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
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

      const canLight = new THREE.PointLight(0xa5f3fc, 1.2, 7, 2.0);
      canLight.position.set(0, hall.height - 0.3, z);
      scene.add(canLight);
      wallLights.push(canLight);
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

    const redCoreMat = new THREE.MeshBasicMaterial({ color: 0xff1e2e });
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

    // 9. HIGH-RESOLUTION DYNAMIC 4K MOVIE SCREEN CANVAS
    const movieCanvas = document.createElement('canvas');
    movieCanvas.width = 1920;
    movieCanvas.height = 1080;
    videoCanvasRef.current = movieCanvas;

    // Immediately render first frame so screen is never blank
    renderMovieScene(movieCanvas, 0);

    const screenTexture = new THREE.CanvasTexture(movieCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
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

      const rearPt = new THREE.PointLight(0xffbe6b, 1.6, 7.5, 1.8);
      rearPt.position.set(rx, 5.8, hall.depth - 0.45);
      scene.add(rearPt);
      wallLights.push(rearPt);
    });

    // Rear Corner Exit Portals with Illuminated Green EXIT Signs
    [-hall.width / 2 + 1.2, hall.width / 2 - 1.2].forEach(exX => {
      // Dark door frame
      const exDoor = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.5, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x07080f, roughness: 0.95 })
      );
      exDoor.position.set(exX, 2.5 / 2 + 0.4, hall.depth - 0.16);
      scene.add(exDoor);

      // Green illuminated exit sign above door
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.16, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      signMesh.position.set(exX, 2.5 + 0.55, hall.depth - 0.19);
      scene.add(signMesh);
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

    instancedBacks.castShadow = true;
    instancedBacks.receiveShadow = true;
    instancedCushions.receiveShadow = true;
    instancedHeadrests.castShadow = true;

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

    // 13. High-Performance Render Loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      trailerTimeRef.current += dt;

      // Draw high-resolution dynamic movie trailer on the screen canvas
      if (videoCanvasRef.current && isPlayingRef.current) {
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

      // Starry Sky Twinkle Effect
      const time = now * 0.002;
      starMat.opacity = 0.8 + 0.2 * Math.sin(time * 2);

      // Smooth Lighting Transitions (House Lights vs Showtime)
      const isLightsOn = lightsUpRef.current;
      const targetWallIntensity = isLightsOn ? 2.8 : 0.18;
      const targetAmbient = isLightsOn ? 0.95 : 0.22;
      const targetSpotIntensity = isLightsOn ? 3.8 : 0.25;
      const targetHemiIntensity = isLightsOn ? 1.2 : 0.25;
      const targetProjectorIntensity = isLightsOn ? 1.0 : 3.4;

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

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
    const movie = activeTrailer.id;
    const [c1, c2, c3] = activeTrailer.colorPalette;
    const video = videoElementRef.current;

    // 1. Check if raw video from public/trailers/ or user drop is playing
    if (video && (hasRawVideo || video.readyState >= 1) && !video.error) {
      if (video.videoWidth > 0) {
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

    // 2. High-energy cinematic particles and atmosphere
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const particleCount = movie === 'leo' ? 65 : 45;
    for (let p = 0; p < particleCount; p++) {
      const px = ((p * 83 + t * (movie === 'leo' ? 220 : 340)) % (w - 80)) + 40;
      const py = ((p * 47 + Math.sin(t * 2.8 + p) * 160 + h / 2) % (h - 90)) + 45;
      const pr = 2.5 + (p % 4);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. CinemaScope 2.39:1 Letterbox Bars (Top & Bottom Masking)
    const letterboxHeight = 70;
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, w, letterboxHeight);
    ctx.fillRect(0, h - letterboxHeight, w, letterboxHeight);

    // Gold Top Cinema Ribbon
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('★ SJ CINEMAS SREENIVASA NAGARI • AUDITORIUM 1', 60, 45);

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('BARCO 4K RGB LASER • DOLBY ATMOS 64-CH SPATIAL SOUND', w - 60, 45);

    // 4. Movie-Specific Artwork, Credits & Typographic Trailer Scenes
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 32;

    if (movie === 'leo') {
      // LEO - Official Trailer
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LEO', w / 2, h / 2 - 45);

      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('★ BLOODY SWEET ★', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('THALAPATHY VIJAY • LOKESH KANAGARAJ • ANIRUDH', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('LOKESH CINEMATIC UNIVERSE (LCU) • 64-CHANNEL DOLBY ATMOS', w / 2, h / 2 + 95);
    } else if (movie === 'coolie') {
      // COOLIE - Official Teaser
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 78px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('COOLIE', w / 2, h / 2 - 45);

      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('D . I . S . C . O', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('SUPERSTAR RAJINIKANTH • LOKESH KANAGARAJ • SUN PICTURES', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#eab308';
      ctx.fillText('THALAIVAR 171 • ANIRUDH "POWERHOUSE" BASS MIX', w / 2, h / 2 + 95);
    } else if (movie === 'goat') {
      // THE GREATEST OF ALL TIME (GOAT)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('THE GREATEST OF ALL TIME', w / 2, h / 2 - 45);

      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('G . O . A . T', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('THALAPATHY VIJAY • VENKAT PRABHU • YUVAN SHANKAR RAJA', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('A VENKAT PRABHU HERO • HIGH-OCTANE CHASE DOLBY ATMOS', w / 2, h / 2 + 95);
    } else if (movie === 'amaran') {
      // AMARAN - Official Trailer
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('AMARAN', w / 2, h / 2 - 45);

      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#86efac';
      ctx.fillText('MAJOR MUKUND VARADARAJAN AC', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('SIVAKARTHIKEYAN • SAI PALLAVI • RAAJ KAMAL FILMS', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('MUSIC BY GV PRAKASH KUMAR • RASHTRIYA RIFLES TACTICAL ATMOS', w / 2, h / 2 + 95);
    } else if (movie === 'vikram') {
      // VIKRAM - Official Trailer
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('VIKRAM', w / 2, h / 2 - 45);

      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#f87171';
      ctx.fillText('ONCE UPON A TIME THERE LIVED A GHOST', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('KAMAL HAASAN • FAHADH FAASIL • VIJAY SETHUPATHI', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('DIRECTED BY LOKESH KANAGARAJ • ANIRUDH CANNON BASS', w / 2, h / 2 + 95);
    } else if (movie === 'jailer') {
      // JAILER - Showcase
      ctx.fillStyle = '#fde047';
      ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('JAILER', w / 2, h / 2 - 45);

      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('★ TIGER KA HUKUM ★', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('SUPERSTAR RAJINIKANTH • NELSON DILIPKUMAR • ANIRUDH', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('MUTHUVEL PANDIAN MASS SHOWCASE • 64-CHANNEL ATMOS THUMP', w / 2, h / 2 + 95);
    } else {
      // PUSHPA 2: THE RULE
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 72px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PUSHPA 2: THE RULE', w / 2, h / 2 - 45);

      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = '#f97316';
      ctx.fillText('WILDFIRE HAS BEGUN', w / 2, h / 2 + 10);

      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('ALLU ARJUN • RASHMIKA MANDANNA • SUKUMAR', w / 2, h / 2 + 55);

      ctx.font = '600 18px monospace';
      ctx.fillStyle = '#fb923c';
      ctx.fillText('MUSIC BY DEVI SRI PRASAD (DSP) • WILDFIRE DOLBY ATMOS', w / 2, h / 2 + 95);
    }

    // 5. 64-Channel Audio Equalizer Spectrum (Live Animated Waves)
    ctx.shadowBlur = 0;
    const barCount = 56;
    const barWidth = 10;
    const spacing = 18;
    const startX = (w - barCount * spacing) / 2;

    for (let b = 0; b < barCount; b++) {
      const freq = Math.abs(Math.sin(t * 8.5 + b * 0.38));
      const barH = 14 + 75 * freq;

      ctx.fillStyle = b % 2 === 0 ? '#38bdf8' : '#e11d2e';
      ctx.fillRect(startX + b * spacing, h - letterboxHeight - 15 - barH, barWidth, barH);
    }

    // 6. Raw Trailer Guidance Badge (on-screen prompt to place .mp4 in public/trailers)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    const boxW = 620;
    const boxH = 32;
    const boxX = (w - boxW) / 2;
    const boxY = h - letterboxHeight - 62;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📁 RAW TRAILERS: Place "${activeTrailer.id}.mp4" into public/trailers/ or drop any video here`, w / 2, boxY + 21);

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
        crossOrigin="anonymous"
        loop
        preload="auto"
        muted={isMuted}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
    </div>
  );
};
