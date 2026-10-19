import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { neighbourhood } from '../data';
import { useI18n } from '../i18n';

/* Feathered perspective map: textured plane + pointer-lit shader patch + HTML pins.
   Baseline values per brief: uRadius .05, uSoftness .05, uStrength .9, rotations
   x -.35π / z .35π, pointer offsets .02/.03, camera [0,-.2,4.5] fov 45, fog 4–8. */
function MapPlane({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const tex = useLoader(THREE.TextureLoader, '/images/neighbourhood/map.svg');
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const target = useRef({ x: 0, z: 0, hover: 0 });
  const uniforms = useMemo(() => ({
    uMap: { value: tex },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uRadius: { value: 0.05 }, uSoftness: { value: 0.05 }, uStrength: { value: 0.9 },
  }), [tex]);
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; }, [tex]);
  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    const k = 1 - Math.pow(1 - 0.08, dt * 60); // delta-correct ≈0.08/frame smoothing
    g.rotation.x += ((-0.35 * Math.PI + target.current.x) - g.rotation.x) * k;
    g.rotation.z += ((0.35 * Math.PI + target.current.z) - g.rotation.z) * k;
    if (mat.current) {
      const u = mat.current.uniforms.uHover;
      const kk = 1 - Math.pow(1 - 0.12, dt * 60);
      u.value += (target.current.hover - u.value) * kk;
    }
  });
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.uv && mat.current) mat.current.uniforms.uMouse.value.copy(e.uv);
    target.current.hover = 1;
    target.current.x = (e.uv ? (e.uv.y - 0.5) * 2 : 0) * 0.02;
    target.current.z = (e.uv ? (e.uv.x - 0.5) * 2 : 0) * 0.03;
  };
  return (
    <group ref={group} rotation={[-0.35 * Math.PI, 0, 0.35 * Math.PI]}>
      <mesh onPointerMove={onMove} onPointerLeave={() => { target.current.hover = 0; target.current.x = 0; target.current.z = 0; }}>
        <planeGeometry args={[5.6, 5.6, 1, 1]} />
        <shaderMaterial ref={mat} uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            uniform sampler2D uMap; uniform vec2 uMouse; uniform float uHover,uRadius,uSoftness,uStrength;
            varying vec2 vUv;
            void main(){
              vec4 c = texture2D(uMap, vUv);
              float d = distance(vUv, uMouse);
              float patch = smoothstep(uRadius+uSoftness, uRadius-uSoftness, d) * uHover;
              c.rgb += patch * uStrength * vec3(0.16,0.14,0.05);
              float edge = smoothstep(0.0,0.06,vUv.x)*smoothstep(1.0,0.94,vUv.x)*smoothstep(0.0,0.06,vUv.y)*smoothstep(1.0,0.94,vUv.y);
              gl_FragColor = vec4(c.rgb, c.a * (0.25 + 0.75*edge));
            }`} transparent />
      </mesh>
      {neighbourhood.map((p, i) => (
        <Html key={p.id} position={[(p.x - 0.5) * 5.6, (p.y - 0.5) * 5.6, 0.05]} center zIndexRange={[10, 0]}>
          <button className={`mappin ${i === active ? 'on' : ''}`} aria-label={p.name.en}
            onMouseEnter={() => onSelect(i)} onClick={() => onSelect(i)} onFocus={() => onSelect(i)}>
            <span className="mapthumb"><img src={p.img} alt="" /></span>
          </button>
        </Html>
      ))}
    </group>
  );
}
export default function NeighbourhoodScene({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { locale } = useI18n();
  void locale;
  return (
    <Canvas camera={{ position: [0, -0.2, 4.5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
      aria-label="Eastbank neighbourhood map">
      <fog attach="fog" args={['#FDFBEF', 4, 8]} />
      <ambientLight intensity={1.2} />
      <MapPlane active={active} onSelect={onSelect} />
    </Canvas>
  );
}
