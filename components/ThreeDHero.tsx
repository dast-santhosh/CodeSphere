
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * UTILS: Random data generation for the "Chaos" state
 */
const count = 40;
const generateRandomData = () => {
  return new Array(count).fill(0).map(() => ({
    // Random scattered positions
    randomPos: [
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10
    ],
    // Random rotation speed
    speed: Math.random() * 0.5 + 0.2,
    // Random rotation axis
    rotAxis: [Math.random(), Math.random(), Math.random()]
  }));
};

interface BlockData {
    randomPos: number[];
    speed: number;
    rotAxis: number[];
}

interface DataBlockProps {
    index: number;
    initialData: BlockData;
}

/**
 * COMPONENT: Single Data Block
 * Represents a line of code or a data packet
 */
const DataBlock: React.FC<DataBlockProps> = ({ index, initialData }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  // Calculate target position (The "Structure" / Tower)
  // We arrange them in a spiral tower shape
  const targetPos = useMemo(() => {
    const angle = (index / count) * Math.PI * 8; // Spiral angle
    const radius = 1.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (index / count) * 8 - 4; // Stack vertically
    return [x, y, z];
  }, [index]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    // Use time to drive the animation (0 to 1 oscillation)
    // Slower cycle for background ambiance
    const time = state.clock.getElapsedTime();
    // 0 -> 1 -> 0 cycle every 10 seconds approx
    const r1 = (Math.sin(time * 0.5) + 1) / 2;
    
    // Continuous Idle Animation (Floating)
    const floatY = Math.sin(time * initialData.speed * 2) * 0.2;

    // Interpolate Position (Chaos -> Structure)
    const currentX = THREE.MathUtils.lerp(initialData.randomPos[0], targetPos[0], r1);
    const currentY = THREE.MathUtils.lerp(initialData.randomPos[1], targetPos[1], r1) + floatY;
    const currentZ = THREE.MathUtils.lerp(initialData.randomPos[2], targetPos[2], r1);
    
    mesh.current.position.set(currentX, currentY, currentZ);

    // Interpolate Rotation (Random -> Aligned)
    // At start (Chaos), rotates freely. At end (Structure), faces center.
    if (r1 < 0.8) {
        mesh.current.rotation.x += delta * initialData.speed;
        mesh.current.rotation.y += delta * initialData.speed;
    } else {
        // Smoothly orient towards center
        const dummy = new THREE.Object3D();
        dummy.position.set(currentX, currentY, currentZ);
        dummy.lookAt(0, currentY, 0);
        mesh.current.quaternion.slerp(dummy.quaternion, 0.1);
    }

    // Color Transition (Red -> Blue -> Green)
    const material = mesh.current.material as THREE.MeshStandardMaterial;
    
    if (r1 < 0.3) {
      // Chaos Phase (Red/Grey)
      material.color.setHSL(0, 0.5, 0.2 + r1); // Reddish
      material.emissive.setHSL(0, 0.8, r1 * 0.5);
    } else if (r1 < 0.7) {
      // Logic Phase (Blue/Cyan)
      material.color.setHSL(0.6, 0.8, 0.5); 
      material.emissive.setHSL(0.6, 0.8, 0.5);
    } else {
      // Structure Phase (Green/Neon)
      material.color.setHSL(0.35, 1, 0.5); 
      material.emissive.setHSL(0.35, 0.8, 1);
      material.emissiveIntensity = 1 + Math.sin(time * 3) * 0.5;
    }
  });

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[0.6, 0.2, 0.6]} /> {/* Flat "server blade" shape */}
      <meshStandardMaterial 
        roughness={0.2} 
        metalness={0.8} 
      />
    </mesh>
  );
};

const CoreBeam: React.FC = () => {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    const r1 = (Math.sin(time * 0.5) + 1) / 2;
    
    // Only appear in the "Structure" phase (top of sine wave)
    const visibility = THREE.MathUtils.smoothstep(r1, 0.7, 0.9);
    
    mesh.current.scale.set(visibility, 1, visibility);
    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = visibility * 0.5;
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 10, 32]} />
      <meshBasicMaterial color="#44ff88" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

const Experience: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const blockData = useMemo(() => generateRandomData(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const r1 = (Math.sin(time * 0.5) + 1) / 2;
    // Spin faster when structure is formed
    groupRef.current.rotation.y -= delta * (0.1 + r1 * 0.3);
  });

  return (
    <group ref={groupRef}>
      {blockData.map((data, i) => (
        <DataBlock key={i} index={i} initialData={data} />
      ))}
      <CoreBeam />
    </group>
  );
};

const ThreeDHero: React.FC = () => {
  return (
    <div className="w-full h-full bg-black/50">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true }} 
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4444ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff4444" />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <Experience />
      </Canvas>
    </div>
  );
};

export default ThreeDHero;
