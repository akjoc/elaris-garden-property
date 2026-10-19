import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useI18n } from '../i18n';
import {
  VIEWS, BUILDING, residences, commercial, filterHomes, filterCommercial, unitPosition,
  mulberry32, type Property,
} from '../data';
import { Symbol, RollingLink, useMedia, REDUCED } from '../components';
import { HomeFilterControls, CommFilterControls } from './Catalogue';
import { PlanTabs, PropertySummary } from './Detail';
import { RES_BOUNDS, COM_BOUNDS } from '../components';

type Mode = 'overview' | 'homes' | 'work';
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerpC = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);

/* ---------------- procedural facade textures (stable seeded windows) ---------------- */
function facadeTextures() {
  const rnd = mulberry32(42);
  const mk = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    draw(c.getContext('2d')!, 1024, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const lit: boolean[][] = [];
  for (let r = 0; r < 6; r++) { lit.push([]); for (let cI = 0; cI < 18; cI++) lit[r].push(rnd() > 0.45); }
  const map = mk((g, w, h) => {
    g.fillStyle = '#e7dec6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ded2b2'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, 0, 2, h);
    for (let r = 0; r < 6; r++) for (let cI = 0; cI < 18; cI++) {
      const x = 18 + cI * 55, y = 22 + r * 80;
      g.fillStyle = '#8a6c42'; g.fillRect(x - 3, y - 3, 40, 58);
      g.fillStyle = '#5b6d72'; g.fillRect(x, y, 34, 52);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 3, y + 3, 12, 46);
    }
  });
  const emissive = mk((g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 6; r++) for (let cI = 0; cI < 18; cI++) {
      if (!lit[r][cI]) continue;
      g.fillStyle = '#ffb45e'; g.fillRect(18 + cI * 55, 22 + r * 80, 34, 52);
    }
  });
  return { map, emissive };
}

/* ---------------- daylight ---------------- */
function daylightAt(t: number) {
  const ang = Math.PI * (0.08 + t * 0.84);
  const elev = Math.sin(ang);
  const sun = new THREE.Vector3(Math.cos(ang) * 60, 8 + elev * 46, 34);
  const warm = new THREE.Color('#ffb377'), noon = new THREE.Color('#fff3dd');
  const sunColor = lerpC(warm, noon, clamp01(elev * 1.6));
  const sky = lerpC(new THREE.Color('#e8c9a0'), new THREE.Color('#bcd8ea'), clamp01(elev * 1.5));
  const duskiness = clamp01((0.34 - elev) * 3);
  return { sun, sunColor, sunI: 0.7 + elev * 2.1, sky, hemiSky: sky, hemiGround: new THREE.Color('#8b927b'), amb: 0.25 + elev * 0.4, emissive: duskiness * 1.6, elev };
}
function DaylightRig({ time, emissiveMats }: { time: number; emissiveMats: React.RefObject<THREE.MeshStandardMaterial[]> }) {
  const dir = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useFrame((_, dt) => {
    const d = daylightAt(time); const k = 1 - Math.pow(0.0015, dt);
    if (dir.current) { dir.current.position.lerp(d.sun, k); dir.current.color.lerp(d.sunColor, k); dir.current.intensity += (d.sunI - dir.current.intensity) * k; }
    if (hemi.current) { hemi.current.color.lerp(d.hemiSky, k); hemi.current.groundColor.lerp(d.hemiGround, k); hemi.current.intensity = 0.55 + d.elev * 0.5; }
    if (amb.current) amb.current.intensity += (d.amb - amb.current.intensity) * k;
    if (rim.current) { rim.current.position.set(-d.sun.x, 20, -30); rim.current.intensity = 0.35 + d.emissive * 0.2; }
    (scene.background as THREE.Color)?.lerp?.(d.sky, k);
    if (scene.fog) (scene.fog as THREE.Fog).color.lerp(d.sky, k);
    emissiveMats.current?.forEach((m) => { if (m) m.emissiveIntensity = d.emissive; });
  });
  const d = daylightAt(time);
  return (
    <>
      <directionalLight ref={dir} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} position={d.sun.toArray()} />
      <hemisphereLight ref={hemi} />
      <ambientLight ref={amb} />
      <directionalLight ref={rim} color="#ffd9a8" />
      <Sky sunPosition={d.sun.toArray()} turbidity={6} rayleigh={1.2} />
    </>
  );
}

/* ---------------- building + context ---------------- */
function Wing({ x, mats }: { x: number; mats: { map: THREE.Texture; emissive: THREE.Texture; reg: (m: THREE.MeshStandardMaterial | null) => void } }) {
  const { floorH, floors } = BUILDING;
  const H = 0.85 + floors * floorH;
  const fins = useMemo(() => { const r = mulberry32(x > 0 ? 7 : 13); return Array.from({ length: 16 }, (_, i) => ({ x: -11 + i * 1.45, lean: (r() - 0.5) * 0.35, h: H * (0.55 + r() * 0.4) })); }, [x, H]);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, H, 8.4]} />
        <meshStandardMaterial ref={mats.reg as any} map={mats.map} emissiveMap={mats.emissive} emissive="#ffb45e" emissiveIntensity={0} roughness={0.85} />
      </mesh>
      <mesh position={[0, H + 0.22, 0]} receiveShadow>
        <boxGeometry args={[23.4, 0.45, 7.8]} /><meshStandardMaterial color="#5c7350" roughness={1} />
      </mesh>
      {fins.map((f, i) => (
        <mesh key={i} position={[f.x, f.h / 2 + 0.4, 4.35]} rotation={[0, 0, f.lean]} castShadow>
          <boxGeometry args={[0.28, f.h, 0.5]} /><meshStandardMaterial color="#d8cba6" roughness={0.8} />
        </mesh>
      ))}
      {[-8, -3, 3, 8].map((tx) => (
        <group key={tx} position={[tx, H + 0.4, 1.5]}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.09, 0.12, 1]} /><meshStandardMaterial color="#6b5636" /></mesh>
          <mesh position={[0, 1.25, 0]} castShadow><sphereGeometry args={[0.85, 10, 8]} /><meshStandardMaterial color="#55704a" roughness={1} /></mesh>
        </group>
      ))}
    </group>
  );
}
function Context() {
  const { blocks, trees, people } = useMemo(() => {
    const r = mulberry32(99);
    const blocks = Array.from({ length: 26 }, () => {
      let x = (r() - 0.5) * 130, z = (r() - 0.5) * 90;
      if (Math.abs(x) < 34 && Math.abs(z) < 18) { z += z > 0 ? 26 : -26; }
      return { x, z, w: 6 + r() * 10, d: 6 + r() * 8, h: 3 + r() * 9, rot: r() * 0.6 };
    });
    const trees = Array.from({ length: 70 }, () => ({ x: (r() - 0.5) * 90, z: 7 + r() * 22 * (r() > 0.5 ? 1 : -1.6), s: 0.7 + r() * 0.7 }));
    const people = Array.from({ length: 18 }, () => ({ x: (r() - 0.5) * 40, z: 6.5 + r() * 3, c: ['#a68150', '#60735c', '#314759', '#8c4a3c'][Math.floor(r() * 4)] }));
    return { blocks, trees, people };
  }, []);
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} rotation={[0, b.rot, 0]} receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} /><meshStandardMaterial color="#ddd6c0" roughness={1} />
        </mesh>
      ))}
      {trees.map((tr, i) => (
        <group key={i} position={[tr.x, 0, tr.z]} scale={tr.s}>
          <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.1, 0.14, 1.6]} /><meshStandardMaterial color="#6b5636" /></mesh>
          <mesh position={[0, 2.1, 0]} castShadow><sphereGeometry args={[1.15, 10, 8]} /><meshStandardMaterial color="#5d7a4e" roughness={1} /></mesh>
        </group>
      ))}
      {people.map((pp, i) => (
        <mesh key={i} position={[pp.x, 0.85, pp.z]} castShadow>
          <capsuleGeometry args={[0.22, 1.1, 4, 8]} /><meshStandardMaterial color={pp.c} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
function Traffic({ time }: { time: number }) {
  const cars = useRef<THREE.Group[]>([]);
  const train = useRef<THREE.Group>(null);
  const specs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ speed: 5.5 + i * 0.9, off: i * 13.7, lane: i % 2 ? 10.6 : 12.2, dir: i % 2 ? -1 : 1, color: ['#e8e2d0', '#314759', '#a68150', '#5d7a4e', '#cfc8b4', '#7a4a3a'][i] })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    cars.current.forEach((g, i) => {
      if (!g) return; const s = specs[i];
      const span = 95; const p = (((t * s.speed + s.off) % span) / span);
      g.position.x = (p - 0.5) * span * s.dir; g.position.z = s.lane; g.rotation.y = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      const fade = Math.min(1, Math.min(p, 1 - p) * 8);
      g.traverse((o: any) => { if (o.material) { o.material.transparent = true; o.material.opacity = fade; } });
    });
    if (train.current) {
      const p = (t % 10) / 10; // 10s linear repeat, normalized travel −15→20 scaled ×3
      train.current.position.x = -45 + p * 105;
      const fade = Math.min(1, Math.min(p / 0.1, (1 - p) / 0.1));
      train.current.traverse((o: any) => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, fade); } });
    }
  });
  const d = daylightAt(time);
  return (
    <group>
      {specs.map((s, i) => (
        <group key={i} ref={(g) => { if (g) cars.current[i] = g; }}>
          <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[1.05, 0.55, 2.3]} /><meshStandardMaterial color={s.color} roughness={0.5} metalness={0.3} /></mesh>
          <mesh position={[0, 0.85, -0.1]}><boxGeometry args={[0.9, 0.45, 1.2]} /><meshStandardMaterial color="#cfdde2" roughness={0.2} metalness={0.4} emissive="#ffd9a0" emissiveIntensity={d.emissive * 0.4} /></mesh>
        </group>
      ))}
      <group ref={train} position={[0, 0, -15]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[i * 7.4 - 7.4, 0, 0]}>
            <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[7, 2.2, 2.2]} /><meshStandardMaterial color="#b9c2bd" metalness={0.55} roughness={0.35} /></mesh>
            <mesh position={[0, 1.9, 1.12]}><boxGeometry args={[6.6, 0.7, 0.05]} /><meshStandardMaterial color="#314759" emissive="#ffd9a0" emissiveIntensity={d.emissive * 0.7} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
function Clouds() {
  const ref = useRef<THREE.Group>(null);
  const puffs = useMemo(() => { const r = mulberry32(5); return Array.from({ length: 5 }, (_, ci) => ({ x: (r() - 0.5) * 110, y: 24 + r() * 8, z: (r() - 0.5) * 70, blobs: Array.from({ length: 6 }, () => ({ x: (r() - 0.5) * 9, s: 2.4 + r() * 3.4 })) })); }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.position.x = Math.sin(clock.elapsedTime * 0.06) * 6; });
  return (
    <group ref={ref}>
      {puffs.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]}>
          {c.blobs.map((b, j) => (
            <mesh key={j} position={[b.x, 0, (j % 3) - 1]} scale={[1, 0.42, 1]}>
              <sphereGeometry args={[b.s, 12, 10]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------------- unit overlays ---------------- */
function Overlays({ list, matchIds, selected, onSelect }: {
  list: Property[]; matchIds: Set<string> | null; selected: Property | null; onSelect: (p: Property) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <group>
      {list.map((p) => {
        const { pos, w } = unitPosition(p);
        const match = matchIds === null || matchIds.has(p.slug);
        const sold = p.status === 'sold';
        const isSel = selected?.slug === p.slug;
        const isHover = hover === p.slug;
        const color = sold ? '#EF4444' : isSel ? '#E7FD55' : isHover ? '#22C55E' : '#ffffff';
        const opacity = !match ? 0.08 : isSel ? 1 : 0.9;
        const front = pos[2] >= 0;
        return (
          <mesh key={p.meshId} position={pos} rotation={[0, front ? 0 : Math.PI, 0]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); if (match) { setHover(p.slug); document.body.style.cursor = sold ? 'default' : 'pointer'; } }}
            onPointerOut={() => { setHover(null); document.body.style.cursor = ''; }}
            onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (match && !sold) onSelect(p); }}>
            <planeGeometry args={[w, BUILDING.floorH * 0.82]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------------- camera rigs ---------------- */
function DesktopRig({ viewIdx }: { viewIdx: number }) {
  const { camera } = useThree();
  const base = useRef({ pos: new THREE.Vector3(...VIEWS[3].position), tgt: new THREE.Vector3(...VIEWS[3].lookAt) });
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffect(() => {
    const v = VIEWS[viewIdx];
    const t1 = gsap.to(base.current.pos, { x: v.position[0], y: v.position[1], z: v.position[2], duration: 1, ease: 'power2.inOut' });
    const t2 = gsap.to(base.current.tgt, { x: v.lookAt[0], y: v.lookAt[1], z: v.lookAt[2], duration: 1, ease: 'power2.inOut' });
    return () => { t1.kill(); t2.kill(); };
  }, [viewIdx]);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      tilt.current.tx = (e.clientX / innerWidth - 0.5) * 2;
      tilt.current.ty = (e.clientY / innerHeight - 0.5) * 2;
    };
    addEventListener('pointermove', onMove);
    return () => removeEventListener('pointermove', onMove);
  }, []);
  useFrame((_, dt) => {
    const k = 1 - Math.pow(1 - 0.02, dt * 60); // ≈.02/frame smoothing, delta-correct
    tilt.current.x += (tilt.current.tx - tilt.current.x) * k;
    tilt.current.y += (tilt.current.ty - tilt.current.y) * k;
    const maxTilt = THREE.MathUtils.degToRad(5) * (REDUCED() ? 0 : 1);
    const off = base.current.pos.clone().sub(base.current.tgt);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), -tilt.current.x * maxTilt);
    off.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt.current.y * maxTilt * 0.6);
    camera.position.copy(base.current.tgt).add(off);
    camera.lookAt(base.current.tgt);
  });
  return null;
}
function TouchIntro({ resetSignal }: { resetSignal: number }) {
  const { camera, controls } = useThree() as any;
  useEffect(() => {
    camera.position.set(0, 55, 20);
    const obj = { x: 0, y: 55, z: 20 };
    const tw = gsap.to(obj, {
      x: 30, y: 6, z: 18, duration: REDUCED() ? 0 : 2, delay: REDUCED() ? 0 : 1, ease: 'power2.inOut',
      onUpdate: () => { camera.position.set(obj.x, obj.y, obj.z); controls?.target?.set(0, 3, 0); controls?.update?.(); },
    });
    return () => { tw.kill(); };
  }, [resetSignal]); // eslint-disable-line
  return null;
}

/* ---------------- noise dissolve reveal ---------------- */
function Dissolve({ start }: { start: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [done, setDone] = useState(false);
  const began = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!mesh.current || done) return;
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    mesh.current.position.copy(camera.position).add(dir.multiplyScalar(1.2));
    mesh.current.quaternion.copy(camera.quaternion);
    if (start && began.current === null) began.current = clock.elapsedTime;
    if (began.current !== null && mat.current) {
      const p = Math.min(1.2, (clock.elapsedTime - began.current) * 0.45);
      mat.current.uniforms.uProgress.value = p;
      if (p >= 1.2) setDone(true);
    }
  });
  if (done) return null;
  return (
    <mesh ref={mesh} renderOrder={999} frustumCulled={false}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial ref={mat} depthTest={false} depthWrite={false} transparent
        uniforms={{ uProgress: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`
          uniform float uProgress; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
          float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
          void main(){
            float n = fbm(vUv*6.0);
            float th = uProgress*1.35 - 0.2;
            float d = n - th;
            if(d < -0.06) discard;
            float edge = smoothstep(0.06, 0.0, abs(d));
            vec3 col = mix(vec3(0.99,0.98,0.94), vec3(1.0,0.99,0.9), edge);
            gl_FragColor = vec4(col + edge*0.25, 1.0);
          }`} />
    </mesh>
  );
}

function Scene({ time, mode, viewIdx, isDesktop, resetSignal, matchIds, selected, onSelect, revealStart }: any) {
  useLoader(THREE.TextureLoader, '/images/neighbourhood/map.svg');
  const tex = useMemo(() => facadeTextures(), []);
  const emissiveMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const reg = (m: THREE.MeshStandardMaterial | null) => { if (m && !emissiveMats.current.includes(m)) emissiveMats.current.push(m); };
  const mats = { map: tex.map, emissive: tex.emissive, reg };
  const { floorH, floors } = BUILDING; const H = 0.85 + floors * floorH;
  return (
    <>
      <color attach="background" args={['#cfe0ea']} />
      <fog attach="fog" args={['#cfe0ea', 55, 130]} />
      <DaylightRig time={time} emissiveMats={emissiveMats} />
      {/* ground / streets / courtyard / transit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[220, 160]} /><meshStandardMaterial color="#d9d2ba" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 11.4]} receiveShadow>
        <planeGeometry args={[200, 5.4]} /><meshStandardMaterial color="#6e6a5e" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8]} receiveShadow>
        <planeGeometry args={[70, 6]} /><meshStandardMaterial color="#7d9c66" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -15]}>
        <planeGeometry args={[200, 2.6]} /><meshStandardMaterial color="#8d8672" roughness={1} />
      </mesh>
      {/* wings + glazed courtyard connector + entrance */}
      <Wing x={-BUILDING.wingCentreX} mats={mats} />
      <Wing x={BUILDING.wingCentreX} mats={mats} />
      <mesh position={[0, 1.9, -1]} castShadow>
        <boxGeometry args={[7, 3.8, 6.5]} />
        <meshPhysicalMaterial color="#bcd0d4" transparent opacity={0.55} roughness={0.12} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.65, 4.6]}>
        <boxGeometry args={[5.5, 1.3, 1.4]} /><meshStandardMaterial color="#3a3428" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.6, 4.9]}>
        <boxGeometry args={[7.5, 0.22, 2.4]} /><meshStandardMaterial color="#a68150" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, H * 0.32, 0]}>
        <boxGeometry args={[3.4, H * 0.6, 5]} /><meshStandardMaterial color="#e2d7ba" roughness={0.9} />
      </mesh>
      <Context /><Traffic time={time} /><Clouds />
      {mode === 'homes' && <Overlays list={residences} matchIds={matchIds} selected={selected} onSelect={onSelect} />}
      {mode === 'work' && <Overlays list={commercial} matchIds={matchIds} selected={selected} onSelect={onSelect} />}
      {isDesktop ? <DesktopRig viewIdx={viewIdx} /> : (
        <>
          <OrbitControls makeDefault enablePan={false} minPolarAngle={Math.PI * 0.42} maxPolarAngle={Math.PI * 0.48}
            minDistance={12} maxDistance={70} target={[0, 3, 0]} />
          <TouchIntro resetSignal={resetSignal} />
        </>
      )}
      <Dissolve start={revealStart} />
    </>
  );
}

/* ---------------- page shell ---------------- */
class GLBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}
function fmtTime(t: number) {
  const mins = 5 * 60 + t * 15 * 60;
  const q = Math.round(mins / 15) * 15;
  return `${String(Math.floor(q / 60)).padStart(2, '0')}:${String(q % 60).padStart(2, '0')}`;
}

export default function Experience() {
  const { t, lp } = useI18n();
  const isDesktop = useMedia('(min-width: 1121px)');
  const { progress, active } = useProgress();
  const [loaded, setLoaded] = useState(false);
  const [loadGone, setLoadGone] = useState(false);
  const [mode, setMode] = useState<Mode>('overview');
  const [modeOpen, setModeOpen] = useState(false);
  const [time, setTime] = useState(0.33);
  const [viewIdx, setViewIdx] = useState(3);
  const [resetSignal, setResetSignal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);
  const wheelLock = useRef(false); const wheelAcc = useRef(0);
  const [homeF, setHomeF] = useState({ cats: [] as any[], area: RES_BOUNDS as [number, number], floor: [1, 6] as [number, number], balcony: false, garden: false, wings: [] as any[] });
  const [comF, setComF] = useState({ type: 'all' as const, area: COM_BOUNDS as [number, number], floor: [0, 3] as [number, number], wings: [] as any[] });

  const matchIds = useMemo(() => {
    if (mode === 'overview') return null;
    const list = mode === 'homes' ? filterHomes(homeF) : filterCommercial(comF);
    return new Set(list.map((p) => p.slug));
  }, [mode, homeF, comF]);
  useEffect(() => { if (selected && matchIds && !matchIds.has(selected.slug)) setSelected(null); }, [matchIds]); // eslint-disable-line

  useEffect(() => {
    const to = setTimeout(() => setLoaded(true), 3500); /* timeout fallback */
    if (!active && progress >= 100) setLoaded(true);
    return () => clearTimeout(to);
  }, [active, progress]);
  useEffect(() => {
    if (!loaded) return;
    const a = setTimeout(() => setLoadGone(true), 1000);
    return () => clearTimeout(a);
  }, [loaded]);

  /* wheel stepping between the twelve viewpoints */
  useEffect(() => {
    if (!isDesktop) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('.exp-panel,.exp-filters,.exp-bar,.compass')) return;
      wheelAcc.current += e.deltaY;
      if (Math.abs(wheelAcc.current) < 8 || wheelLock.current) return;
      const dir = wheelAcc.current > 0 ? 1 : -1; wheelAcc.current = 0; wheelLock.current = true;
      setViewIdx((v) => (v + dir + 12) % 12);
      setTimeout(() => { wheelLock.current = false; }, 1050);
    };
    addEventListener('wheel', onWheel, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setViewIdx((v) => (v + 1) % 12);
      if (e.key === 'ArrowLeft') setViewIdx((v) => (v + 11) % 12);
      if (e.key === 'Escape') { setSelected(null); setFiltersOpen(false); setModeOpen(false); }
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); };
  }, [isDesktop]);

  useEffect(() => { window.__lenis?.stop(); document.body.style.overflow = 'hidden'; return () => { window.__lenis?.start(); document.body.style.overflow = ''; }; }, []);

  const webglOK = useMemo(() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }, []);
  const fallback = (
    <div className="exp-fallback">
      <h1 className="serif" style={{ fontSize: '3rem' }}>{t('exp.fallbackT')}</h1>
      <p style={{ maxWidth: '30rem', margin: '1rem auto' }}>{t('exp.fallback')}</p>
      <img src="/images/hero/anchor.jpg" alt="Elaris Gardens" />
      <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <RollingLink to={lp('/residences')} theme="onLight">{t('cta.viewHomes')}</RollingLink>
        <RollingLink to={lp('/commercial')} theme="onLight">{t('cta.viewWork')}</RollingLink>
      </div>
    </div>
  );
  if (!webglOK) return <div className="exp">{fallback}</div>;

  const modeLabel = mode === 'overview' ? t('exp.overview') : mode === 'homes' ? t('exp.homes') : t('exp.work');
  return (
    <div className="exp">
      <GLBoundary fallback={fallback}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: VIEWS[3].position, fov: 42, near: 0.1, far: 400 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }} aria-label={t('exp.title')}>
          <Suspense fallback={null}>
            <Scene time={time} mode={mode} viewIdx={viewIdx} isDesktop={isDesktop} resetSignal={resetSignal}
              matchIds={matchIds} selected={selected} revealStart={loadGone}
              onSelect={(p: Property) => { setSelected(p); setFiltersOpen(false); }} />
          </Suspense>
        </Canvas>
      </GLBoundary>

      {!loadGone && (
        <div className="exp-loader" style={{ opacity: loaded ? 0 : 1, pointerEvents: loaded ? 'none' : 'auto', transition: 'opacity .5s' }} role="status">
          <Symbol />
          <div className="loader-track"><div className="loader-fill" style={{ transform: `scaleX(${Math.max(progress, loaded ? 100 : 12) / 100})` }} /></div>
          <div className="loader-pct">{Math.round(Math.max(progress, loaded ? 100 : 12))}%</div>
          <p>{t('exp.loading')}</p>
        </div>
      )}

      <div className="exp-hint">{t('exp.hint')}</div>

      {isDesktop && (
        <div className="compass" role="group" aria-label={t('exp.view')}>
          {VIEWS.map((_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <button key={i} className={i === viewIdx ? 'on' : ''} aria-label={`${t('exp.view')} ${i + 1}`} aria-pressed={i === viewIdx}
                style={{ transform: `translate(${Math.cos(a) * 2.6}rem, ${Math.sin(a) * 2.6}rem)` }}
                onClick={() => setViewIdx(i)}>{i + 1}</button>
            );
          })}
        </div>
      )}

      {(selected || filtersOpen) && <div className="exp-bk" onClick={() => { setSelected(null); setFiltersOpen(false); }} />}

      <aside className={`exp-filters ${filtersOpen ? 'open' : ''}`} data-lenis-prevent aria-hidden={!filtersOpen} aria-label={t('cta.filters')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="serif" style={{ fontSize: '1.9rem' }}>{t('cta.filters')}</h2>
          <button className="circ onLight" onClick={() => setFiltersOpen(false)} aria-label={t('nav.close')}>✕</button>
        </div>
        <div className="filters" style={{ position: 'static' }}>
          {mode === 'homes'
            ? <HomeFilterControls value={homeF as any} onChange={setHomeF as any} />
            : <CommFilterControls value={comF as any} onChange={setComF as any} />}
        </div>
        <p aria-live="polite"><span className="serif" style={{ fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{matchIds?.size ?? 0}</span> {t('f.results')}</p>
      </aside>

      <aside className={`exp-panel ${selected ? 'open' : ''}`} data-lenis-prevent aria-hidden={!selected} aria-label={selected?.id ?? ''}>
        {selected && (
          <>
            <button className="circ onLight" style={{ position: 'absolute', top: '5.6rem', right: '1.4rem' }}
              onClick={() => setSelected(null)} aria-label={t('exp.close')}>✕</button>
            <h2 className="serif" style={{ fontSize: '3.6rem', color: 'var(--bronze)' }}>{selected.id}</h2>
            <PropertySummary p={selected} />
            <table className="area-table"><tbody>
              {selected.rooms.slice(0, 5).map((r) => <tr key={r.key}><td>{t(`room.${r.key}`)}</td><td>{r.area.toFixed(1)} m²</td></tr>)}
            </tbody></table>
            <PlanTabs p={selected} compact />
            <div style={{ marginTop: '1.4rem' }}>
              <Link className="rbtn solid" to={lp(selected.kind === 'home' ? `/residences/${selected.slug}` : `/commercial/${selected.slug}`)}>
                {t('cta.fullDetails')} →
              </Link>
            </div>
          </>
        )}
      </aside>

      <div className="exp-bar">
        <div className={`modewrap ${modeOpen ? 'open' : ''}`}>
          <button className="modebtn" aria-haspopup="listbox" aria-expanded={modeOpen} onClick={() => setModeOpen(!modeOpen)}>
            {modeLabel} <span className="car">⌃</span>
          </button>
          <div className="modemenu" role="listbox" aria-label={t('exp.title')}><div>
            {(['overview', 'homes', 'work'] as Mode[]).map((mm) => (
              <button key={mm} role="option" aria-selected={mode === mm} className={mode === mm ? 'on' : ''}
                onClick={() => { setMode(mm); setModeOpen(false); setSelected(null); setFiltersOpen(false); }}>
                {mm === 'overview' ? t('exp.overview') : mm === 'homes' ? t('exp.homes') : t('exp.work')}
              </button>
            ))}
          </div></div>
        </div>
        <button className="exp-btn" disabled={mode === 'overview'} aria-expanded={filtersOpen}
          onClick={() => { setFiltersOpen(!filtersOpen); setSelected(null); }}>{t('cta.filters')}</button>
        <div className="sunslider">
          <span aria-hidden="true">☀</span>
          <input type="range" min={0} max={1} step={0.004} value={time} aria-label={t('exp.time')}
            onChange={(e) => setTime(Number(e.target.value))} />
          <span aria-hidden="true">☾</span>
          <strong style={{ minWidth: '3.2em' }}>{fmtTime(time)}</strong>
        </div>
        {!isDesktop && <button className="exp-btn" onClick={() => setResetSignal((s) => s + 1)}>{t('exp.reset')}</button>}
        {isDesktop && (
          <>
            <button className="exp-btn" aria-label={t('cta.prev')} onClick={() => setViewIdx((v) => (v + 11) % 12)}>←</button>
            <button className="exp-btn" aria-label={t('cta.next')} onClick={() => setViewIdx((v) => (v + 1) % 12)}>→</button>
          </>
        )}
      </div>
    </div>
  );
}
