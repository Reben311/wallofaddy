import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function BitcoinMesh() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.012;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Coin body */}
      <mesh castShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.22, 64]} />
        <meshStandardMaterial
          color="#ff7300"
          metalness={0.92}
          roughness={0.08}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Coin rim */}
      <mesh>
        <cylinderGeometry args={[1.13, 1.13, 0.18, 64, 1, true]} />
        <meshStandardMaterial
          color="#cc5a00"
          metalness={0.95}
          roughness={0.05}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Front face glow disk */}
      <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.09, 64]} />
        <meshStandardMaterial
          color="#ffaa44"
          metalness={0.6}
          roughness={0.2}
          emissive="#ff7300"
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Back face */}
      <mesh position={[0, -0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.09, 64]} />
        <meshStandardMaterial
          color="#cc5a00"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      {/* ₿ symbol front */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.52, 64]} />
        <meshStandardMaterial color="#7a3000" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Vertical bar of B - front */}
      <mesh position={[-0.08, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 0.68]} />
        <meshStandardMaterial color="#7a3000" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Upper bump */}
      <mesh position={[0.04, 0.12, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshStandardMaterial color="#7a3000" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Lower bump */}
      <mesh position={[0.04, 0.12, -0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.14]} />
        <meshStandardMaterial color="#7a3000" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

export default function Bitcoin3D({ size = 120 }) {
  return (
    <div style={{ width: size, height: size, cursor: 'grab' }}>
      <Canvas
        camera={{ position: [0, 2.2, 3.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} color="#ffffff" />
        <directionalLight position={[-4, -2, -4]} intensity={0.4} color="#ff9944" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#ff7300" />
        <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffffff" />
        <BitcoinMesh />
      </Canvas>
    </div>
  );
}
