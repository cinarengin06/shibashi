"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type LivePosePoint = {
  name?: string;
  score?: number;
  x: number;
  y: number;
};

const CONNECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

const JOINTS = Array.from(new Set(CONNECTIONS.flat()));

const DEFAULT_POSE: Record<string, [number, number]> = {
  nose: [0, 0.92],
  left_shoulder: [-0.42, 0.58],
  right_shoulder: [0.42, 0.58],
  left_elbow: [-0.82, 0.23],
  right_elbow: [0.82, 0.23],
  left_wrist: [-1.02, -0.12],
  right_wrist: [1.02, -0.12],
  left_hip: [-0.29, -0.38],
  right_hip: [0.29, -0.38],
  left_knee: [-0.46, -1.2],
  right_knee: [0.46, -1.2],
  left_ankle: [-0.52, -2.05],
  right_ankle: [0.52, -2.05],
};

function colorFromHex(value: string, fallback: number) {
  const parsed = Number.parseInt(value.replace("#", ""), 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function pointForPose(name: string, pose: Map<string, LivePosePoint>, bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  const point = pose.get(name);
  if (!point || (point.score ?? 1) < 0.25) {
    const [x, y] = DEFAULT_POSE[name] ?? [0, 0];
    return new THREE.Vector3(x, y, 0);
  }

  const spanX = Math.max(120, bounds.maxX - bounds.minX);
  const spanY = Math.max(180, bounds.maxY - bounds.minY);
  const scale = 4.1 / Math.max(spanY, spanX * 1.35);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const floorY = bounds.maxY;
  const depth = name.includes("wrist") ? (point.x < centerX ? 0.16 : -0.16) : name.includes("elbow") ? (point.x < centerX ? 0.08 : -0.08) : 0;
  return new THREE.Vector3((point.x - centerX) * scale, (floorY - point.y) * scale - 2.05, depth);
}

function placeBone(bone: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  bone.position.copy(start).add(end).multiplyScalar(0.5);
  bone.scale.set(1, Math.max(0.01, length), 1);
  bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

export function LivePose3D({
  accent = "#7ee2a8",
  active = false,
  className = "",
  pose,
}: {
  accent?: string;
  active?: boolean;
  className?: string;
  pose: LivePosePoint[];
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const poseRef = useRef(pose);
  const accentRef = useRef(accent);
  const activeRef = useRef(active);

  poseRef.current = pose;
  accentRef.current = accent;
  activeRef.current = active;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.05, 7.2);
    camera.lookAt(0, -0.45, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xf4fff7, 0x06120d, 2.1);
    const keyLight = new THREE.PointLight(colorFromHex(accentRef.current, 0x7ee2a8), 8, 9);
    keyLight.position.set(-2.8, 3.2, 3.5);
    const rimLight = new THREE.PointLight(0xe7c878, 5, 7);
    rimLight.position.set(2.7, -0.4, 2.6);
    scene.add(ambient, keyLight, rimLight);

    const figure = new THREE.Group();
    figure.position.y = 0.18;
    scene.add(figure);

    const boneMaterial = new THREE.MeshStandardMaterial({
      color: colorFromHex(accentRef.current, 0x7ee2a8),
      emissive: colorFromHex(accentRef.current, 0x7ee2a8),
      emissiveIntensity: 0.45,
      metalness: 0.32,
      roughness: 0.28,
    });
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f0d7,
      emissive: colorFromHex(accentRef.current, 0x7ee2a8),
      emissiveIntensity: 0.5,
      metalness: 0.18,
      roughness: 0.2,
    });

    const bones = new Map<string, THREE.Mesh>();
    CONNECTIONS.forEach(([start, end]) => {
      const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 1, 4, 8), boneMaterial);
      bone.name = `${start}-${end}`;
      figure.add(bone);
      bones.set(`${start}-${end}`, bone);
    });

    const joints = new Map<string, THREE.Mesh>();
    JOINTS.forEach((name) => {
      const joint = new THREE.Mesh(new THREE.SphereGeometry(name === "nose" ? 0.14 : 0.095, 16, 12), jointMaterial);
      figure.add(joint);
      joints.set(name, joint);
    });

    const headGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 20, 14),
      new THREE.MeshBasicMaterial({ color: colorFromHex(accentRef.current, 0x7ee2a8), transparent: true, opacity: 0.12 }),
    );
    figure.add(headGlow);

    const rings = [0.98, 1.42, 1.88].map((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.009, 8, 80),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? 0xe7c878 : colorFromHex(accentRef.current, 0x7ee2a8),
          transparent: true,
          opacity: 0.32 - index * 0.06,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.3 + index * 0.36;
      scene.add(ring);
      return ring;
    });

    const grid = new THREE.GridHelper(4.6, 12, 0x6c9c85, 0x1e392f);
    grid.position.y = -2.03;
    grid.rotation.x = 0;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.18;
    scene.add(grid);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let frame = 0;
    const animate = (time: number) => {
      const poseMap = new Map(poseRef.current.filter((point) => point.name).map((point) => [point.name as string, point]));
      const visiblePoints = [...poseMap.values()].filter((point) => (point.score ?? 1) >= 0.25);
      const bounds = visiblePoints.length
        ? {
            minX: Math.min(...visiblePoints.map((point) => point.x)),
            maxX: Math.max(...visiblePoints.map((point) => point.x)),
            minY: Math.min(...visiblePoints.map((point) => point.y)),
            maxY: Math.max(...visiblePoints.map((point) => point.y)),
          }
        : { minX: 0, maxX: 640, minY: 0, maxY: 480 };

      const points = new Map(JOINTS.map((name) => [name, pointForPose(name, poseMap, bounds)]));
      joints.forEach((joint, name) => {
        const target = points.get(name);
        if (target) joint.position.lerp(target, 0.18);
      });
      CONNECTIONS.forEach(([start, end]) => {
        const bone = bones.get(`${start}-${end}`);
        const startPoint = points.get(start);
        const endPoint = points.get(end);
        if (bone && startPoint && endPoint) {
          const smoothedStart = (bone.userData.start ?? startPoint.clone()) as THREE.Vector3;
          const smoothedEnd = (bone.userData.end ?? endPoint.clone()) as THREE.Vector3;
          smoothedStart.lerp(startPoint, 0.18);
          smoothedEnd.lerp(endPoint, 0.18);
          bone.userData.start = smoothedStart;
          bone.userData.end = smoothedEnd;
          placeBone(bone, smoothedStart, smoothedEnd);
        }
      });

      const breath = Math.sin(time * 0.0012) * 0.035;
      figure.rotation.y = Math.sin(time * 0.00045) * 0.08;
      figure.position.y = 0.18 + breath;
      headGlow.position.copy(joints.get("nose")?.position ?? new THREE.Vector3(0, 0.92, 0));
      headGlow.scale.setScalar(1 + Math.sin(time * 0.002) * 0.08);
      rings.forEach((ring, index) => {
        ring.rotation.z = time * (0.00018 + index * 0.00008) * (index % 2 ? -1 : 1);
        ring.scale.setScalar(1 + Math.sin(time * 0.001 + index) * 0.025);
      });
      const liveColor = colorFromHex(accentRef.current, 0x7ee2a8);
      boneMaterial.color.set(liveColor);
      boneMaterial.emissive.set(liveColor);
      jointMaterial.emissive.set(liveColor);
      (headGlow.material as THREE.MeshBasicMaterial).color.set(liveColor);
      rings.forEach((ring, index) => {
        (ring.material as THREE.MeshBasicMaterial).color.set(index === 1 ? 0xe7c878 : liveColor);
      });
      keyLight.color.set(liveColor);
      figure.scale.setScalar(activeRef.current ? 1 : 0.92);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
    };
  }, []);

  return <div aria-label="Canlı 3D hareket modeli" className={`live-pose-3d ${className}`} ref={mountRef} />;
}
