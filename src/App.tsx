import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import * as THREE from 'three';
import React from 'react';
import analytics from './analytics';
import './App.css';

useGLTF.preload('/peacock-feather/source/Peacock feather.glb');
useGLTF.preload('/dhyey/test.glb')
useGLTF.preload('/dhyey/hehe.glb')


function App() {
  useEffect(() => {
    analytics.send({
      hitType: 'pageview',
      page: '/',
    });
  }, []);

  useEffect(() => {
    const titleText = "dhyey 😝 rocks 🤘🏽";
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      const rotatedText = titleText.slice(currentIndex) + titleText.slice(0, currentIndex);
      document.title = rotatedText;
      currentIndex = (currentIndex + 1) % titleText.length;
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <Scene />
    </main>
  )
}

export default App

type PeacockFeatherProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  xWiggle?: WiggleProps;
  yWiggle?: WiggleProps;
  zWiggle?: WiggleProps;
};

type WiggleProps = {
    amplitude: number,
    frequency: number,
    dampingFactor: number,
    noiseInfluence: number,
    phase: number  
}

type DhyeyProps = {
  position?: [number, number, number];
  modelPath: string;
  isSpinningFast?: boolean;
};

function Dhyey({
  position = [0, 0, 0],
  modelPath,
  isSpinningFast = false,
}: DhyeyProps) {
  const { scene } = useGLTF(modelPath);
  const group = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime();
      const spinSpeed = isSpinningFast ? 4.5 : 0.4;
      group.current.rotation.set(4.5, 6 + t * spinSpeed, 0);
    }
  });
  return <group ref={group} position={position as [number, number, number]}><primitive object={scene} scale={2} /></group>;
}

function PeacockFeather({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  xWiggle,
  yWiggle,
}: PeacockFeatherProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/peacock-feather/source/Peacock feather.glb');
  const yWig = useRef(yWiggle)
  const xWig = useRef(xWiggle);
  const clonedScene = scene.clone();

  useFrame((state, delta) => {
    if (group.current) {
        if (yWig.current) {
            yWig.current.phase += delta * yWig.current.frequency;
            let rotationY = Math.sin(yWig.current.phase) * yWig.current.amplitude;
            const noise = (Math.random() / 10) * yWig.current.noiseInfluence * yWig.current.amplitude;
            rotationY += noise;
            rotationY *= (1 - yWig.current.dampingFactor);
            group.current.rotation.y = rotationY
        }
        if (xWig.current) {
            xWig.current.phase += delta * xWig.current.frequency;
            let rotationX = Math.sin(xWig.current.phase) * xWig.current.amplitude;
            const noise = (Math.random() / 10) * xWig.current.noiseInfluence * xWig.current.amplitude;
            rotationX += noise;
            rotationX *= (1 - xWig.current.dampingFactor);
            group.current.rotation.x = rotationX
        }
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

interface Feather {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  startTime: number;
  velocity: [number, number, number];
  shooting: boolean;
  yWiggle?: WiggleProps;
}

type FeatherTrailProps = {
  feathers: Feather[];
  setFeathers: Dispatch<SetStateAction<Feather[]>>;
};

function FeatherTrail({ feathers, setFeathers }: FeatherTrailProps) {
  useFrame(state => {
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const dt = state.clock.getDelta();
    setFeathers(f =>
      f
        .map(feather => {
          let newPosition: [number, number, number];
          if (feather.shooting) {
            newPosition = [
              feather.position[0] + feather.velocity[0] * dt,
              feather.position[1] + feather.velocity[1] * dt,
              feather.position[2] + feather.velocity[2] * dt
            ];
          } else {
            const elapsed = (performance.now() - feather.startTime) / 1000;
            newPosition = [
              feather.position[0],
              elapsed * 1.5,
              feather.position[2]
            ];
          }
          return {
            ...feather,
            position: newPosition,
          };
        })
        .filter(feather => feather.position[1] > -5 && feather.position[1] < 40)
    );
  });
  return (
    <>
      {feathers.map((feather, idx) => (
        <group key={idx} position={feather.position} rotation={feather.rotation} scale={[feather.scale, feather.scale, feather.scale]}>
          <PeacockFeather yWiggle={feather.yWiggle} />
        </group>
      ))}
    </>
  );
}

function BackgroundColorAnimator() {
  const colorA = new THREE.Color('#FF9900');
  const colorB = new THREE.Color('#FF5500');
  const [color, setColor] = React.useState('#FF9900');
  useFrame((state) => {
    const t = (Math.sin(state.clock.getElapsedTime() * 0.25) + 1) / 2;
    const lerped = colorA.clone().lerp(colorB, t);
    setColor(`#${lerped.getHexString()}`);
  });
  return <color attach="background" args={[color]} />;
}

function BoxEnvironment({ lightColor, lightIntensity }: { lightColor: string; lightIntensity: number }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      const radius = 8;
      const speed = 0.2;
      
      lightRef.current.position.x = Math.sin(time * speed) * radius;
      lightRef.current.position.z = Math.cos(time * speed) * radius;
      lightRef.current.position.y = Math.sin(time * speed * 0.7) * 3 + 5;
    }
  });

  return (
    <>
      <mesh position={[0, 0, -7.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[11, 15]} />
        <meshStandardMaterial color="#A8D8A8" />
      </mesh>
      <mesh position={[-5.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#B8E8B8" />
      </mesh>
      <mesh position={[5.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#B8E8B8" />
      </mesh>
      <mesh position={[0, -7.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#A8D8A8" />
      </mesh>
      <spotLight ref={lightRef} position={[0, 5, 0]} intensity={lightIntensity} color={lightColor} distance={300} decay={2} angle={Math.PI / 2} penumbra={1} />
    </>
  );
}

function Scene() {
  const [feathers, setFeathers] = useState<Feather[]>([]);
  const [modelPath, setModelPath] = React.useState('/dhyey/test.glb');
  const [lightColor, setLightColor] = React.useState('#FFFFFF');
  const [lightIntensity, setLightIntensity] = React.useState(120);
  const [clickCount, setClickCount] = React.useState(0);
  const [lastClickTime, setLastClickTime] = React.useState(0);
  const [isSpinningFast, setIsSpinningFast] = React.useState(false);

  const getWorldPosition = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000);
    camera.position.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.y / dir.y;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    return [pos.x, 0, pos.z];
  }, []);

  const handlePointerMove = useCallback((event: MouseEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const position = getWorldPosition(event, canvas) as [number, number, number];
    const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0];
    const baseScale = 3.5;
    const scale = baseScale * (1 + Math.random() * 2);
    let velocity: [number, number, number];
    let shooting = false;
    if (Math.random() < 0.05) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      const vy = 0.5 + Math.random();
      velocity = [vx, vy, vz];
      shooting = true;
    } else {
      velocity = [0, 1.5, 0];
      shooting = false;
    }
    setFeathers(f => [
      ...f,
      {
        position,
        rotation,
        scale,
        velocity,
        startTime: performance.now(),
        shooting,
      } as Feather,
    ]);
  }, [getWorldPosition]);

  React.useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.addEventListener('pointermove', handlePointerMove);
    return () => canvas.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const velocity: [number, number, number] = [0, 1.5, 0];
      const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0];
      const baseScale = 3.5;
      const scale = baseScale * (1 + Math.random() * 2);
      const yWiggle = {
        amplitude: 0.1 + Math.random() * 0.1,
        frequency: 0.5 + Math.random() * 2,
        dampingFactor: 0.01 + Math.random() * 0.03,
        noiseInfluence: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2
      };
      setFeathers(f => [
        ...f,
        {
          position: [0, 0, 0],
          rotation,
          scale,
          velocity,
          startTime: performance.now(),
          shooting: false,
          yWiggle,
        } as Feather,
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full">
      <Canvas camera={{ position: [0, 20, 0], fov: 50 }}
        style={{ background: '#FF9933' }}
        onPointerDown={() => {
          analytics.event('click')
          setModelPath(p => p === '/dhyey/test.glb' ? '/dhyey/hehe.glb' : '/dhyey/test.glb');
          setLightColor(c => c === '#FFFFFF' ? '#FF69B4' : '#FFFFFF');
          setLightIntensity(i => i === 120 ? 1200 : 120);
          
          const now = Date.now();
          if (now - lastClickTime < 3000) {
            const newClickCount = clickCount + 1;
            setClickCount(newClickCount);
            if (newClickCount >= 5) {
              setIsSpinningFast(true);
              setClickCount(0);
            }
          } else {
            setClickCount(1);
          }
          setLastClickTime(now);
        }}
      >
        <BackgroundColorAnimator />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />
        <directionalLight
          position={[0, 30, 20]}
          intensity={2}
          target-position={[0, 18, 0]}
        />
        <spotLight
          position={[0, 25, 10]}
          angle={0.5}
          penumbra={0.5}
          intensity={2}
          castShadow
          target-position={[0, 18, 0]}
        />
        <Dhyey position={[0, 18, -0.2]} modelPath={modelPath} isSpinningFast={isSpinningFast} />
        <BoxEnvironment lightColor={lightColor} lightIntensity={lightIntensity} />
        <FeatherTrail feathers={feathers} setFeathers={setFeathers} />
        <OrbitControls 
          enableRotate={false} enableZoom={false} enablePan={false}
        />
      </Canvas>
    </div>
  );
} 
