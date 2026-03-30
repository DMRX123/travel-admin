import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Sparkles, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';

function RotatingCar({ modelPath = '/models/car.glb', scale = 1, position = [0, 0, 0] }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const { scene } = useGLTF(modelPath);

  return React.createElement('primitive', {
    ref: meshRef,
    object: scene,
    scale: hovered ? scale * 1.1 : scale,
    position: position,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false)
  });
}

export default function Vehicle3D({ type = 'car', rotating = true, className = '' }) {
  const vehicleConfigs = {
    car: { model: '/models/car.glb', scale: 1.2, color: '#F97316', icon: '🚗' },
    bike: { model: '/models/bike.glb', scale: 0.8, color: '#3B82F6', icon: '🏍️' },
    bus: { model: '/models/bus.glb', scale: 1.5, color: '#10B981', icon: '🚌' },
    tempo: { model: '/models/tempo.glb', scale: 1.3, color: '#8B5CF6', icon: '🚐' },
  };

  const config = vehicleConfigs[type] || vehicleConfigs.car;

  return React.createElement(
    'div',
    { className: `relative ${className}` },
    React.createElement(
      Canvas,
      { camera: { position: [0, 2, 5], fov: 50 } },
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10], intensity: 1 }),
      React.createElement('spotLight', { position: [0, 5, 0], intensity: 0.8 }),
      React.createElement(Environment, { preset: "city" }),
      React.createElement(Sparkles, { count: 100, scale: 10, size: 0.1, speed: 0.5 }),
      React.createElement(RotatingCar, { modelPath: config.model, scale: config.scale }),
      rotating && React.createElement(OrbitControls, { enableZoom: false, enablePan: false, autoRotate: true, autoRotateSpeed: 1.5 })
    ),
    React.createElement(
      'div',
      { className: "absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white" },
      `${config.icon} ${type.toUpperCase()}`
    )
  );
}