"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type GuidedMovementModel3DProps = {
  active?: boolean;
  className?: string;
};

type Limb = {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
};

const REST_POSE = {
  leftElbow: new THREE.Vector3(-0.78, 0.86, 0.02),
  rightElbow: new THREE.Vector3(0.78, 0.86, 0.02),
  leftWrist: new THREE.Vector3(-0.92, 0.28, 0.08),
  rightWrist: new THREE.Vector3(0.92, 0.28, 0.08),
};

const LIFT_POSE = {
  leftElbow: new THREE.Vector3(-0.66, 1.68, 0.04),
  rightElbow: new THREE.Vector3(0.66, 1.68, 0.04),
  leftWrist: new THREE.Vector3(-0.42, 2.28, 0.1),
  rightWrist: new THREE.Vector3(0.42, 2.28, 0.1),
};

function makeMaterial(color: number, roughness = 0.62, metalness = 0.04) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
}

function placeLimb(limb: Limb, start: THREE.Vector3, end: THREE.Vector3) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.04, direction.length());
  limb.mesh.position.copy(start).add(end).multiplyScalar(0.5);
  limb.mesh.scale.set(1, length, 1);
  limb.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function addLimb(
  parent: THREE.Group,
  material: THREE.MeshStandardMaterial,
  radius: number,
  start: THREE.Vector3,
  end: THREE.Vector3,
) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, 1, 8, 18), material);
  parent.add(mesh);
  const limb = { mesh, start: start.clone(), end: end.clone(), radius };
  placeLimb(limb, start, end);
  return limb;
}

function addJoint(parent: THREE.Group, material: THREE.MeshStandardMaterial, radius: number) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
  parent.add(mesh);
  return mesh;
}

export function GuidedMovementModel3D({ active = false, className = "" }: GuidedMovementModel3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
    camera.position.set(0, 0.75, 7.7);
    camera.lookAt(0, 0.55, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xfff5df, 0x10251c, 2.2);
    const keyLight = new THREE.DirectionalLight(0xffe7b5, 4.2);
    keyLight.position.set(-3.4, 5.4, 4.5);
    keyLight.castShadow = true;
    const rimLight = new THREE.PointLight(0x9ed7b5, 3.6, 8);
    rimLight.position.set(2.8, 1.7, 2.7);
    scene.add(ambient, keyLight, rimLight);

    const figure = new THREE.Group();
    figure.position.set(0, -1.55, 0);
    figure.rotation.y = -0.15;
    scene.add(figure);

    const skin = makeMaterial(0xc88f6a, 0.72);
    const cloth = makeMaterial(0xb9cdb4, 0.86);
    const clothLight = makeMaterial(0xd8e0cf, 0.8);
    const clothShadow = makeMaterial(0x547462, 0.9);
    const hair = makeMaterial(0x25342d, 0.7);
    const sandal = makeMaterial(0x80644d, 0.85);
    const gold = makeMaterial(0xe8cb83, 0.36, 0.12);

    const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), cloth);
    torso.position.set(0, 1.12, 0);
    torso.scale.set(0.57, 0.83, 0.34);
    torso.castShadow = true;
    figure.add(torso);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), clothLight);
    chest.position.set(0, 1.26, 0.285);
    chest.scale.set(0.4, 0.43, 0.055);
    figure.add(chest);

    const waist = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 32), gold);
    waist.rotation.x = Math.PI / 2;
    waist.position.set(0, 0.58, 0);
    waist.scale.set(1.15, 1, 0.72);
    figure.add(waist);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.25, 20), skin);
    neck.position.set(0, 1.91, 0);
    neck.castShadow = true;
    figure.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), skin);
    head.position.set(0, 2.23, 0.01);
    head.scale.set(0.87, 1.08, 0.9);
    head.castShadow = true;
    figure.add(head);

    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.305, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.54), hair);
    hairCap.position.set(0, 2.3, -0.02);
    hairCap.scale.set(0.92, 0.96, 0.92);
    figure.add(hairCap);

    const facePlane = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), clothLight);
    facePlane.position.set(0, 2.21, 0.27);
    facePlane.scale.set(0.75, 0.48, 0.15);
    figure.add(facePlane);

    const shoulderLeft = new THREE.Vector3(-0.43, 1.65, 0.01);
    const shoulderRight = new THREE.Vector3(0.43, 1.65, 0.01);
    const hipLeft = new THREE.Vector3(-0.24, 0.5, 0);
    const hipRight = new THREE.Vector3(0.24, 0.5, 0);

    const arms = {
      leftUpper: addLimb(figure, clothLight, 0.13, shoulderLeft, REST_POSE.leftElbow),
      rightUpper: addLimb(figure, clothLight, 0.13, shoulderRight, REST_POSE.rightElbow),
      leftForearm: addLimb(figure, cloth, 0.105, REST_POSE.leftElbow, REST_POSE.leftWrist),
      rightForearm: addLimb(figure, cloth, 0.105, REST_POSE.rightElbow, REST_POSE.rightWrist),
    };
    const hands = {
      left: addJoint(figure, skin, 0.13),
      right: addJoint(figure, skin, 0.13),
      leftElbow: addJoint(figure, gold, 0.07),
      rightElbow: addJoint(figure, gold, 0.07),
    };

    const upperLegLeft = addLimb(figure, clothShadow, 0.16, hipLeft, new THREE.Vector3(-0.31, -0.35, 0));
    const upperLegRight = addLimb(figure, clothShadow, 0.16, hipRight, new THREE.Vector3(0.31, -0.35, 0));
    const lowerLegLeft = addLimb(figure, cloth, 0.13, new THREE.Vector3(-0.31, -0.35, 0), new THREE.Vector3(-0.35, -1.2, 0.02));
    const lowerLegRight = addLimb(figure, cloth, 0.13, new THREE.Vector3(0.31, -0.35, 0), new THREE.Vector3(0.35, -1.2, 0.02));
    const feet = {
      left: new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), sandal),
      right: new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), sandal),
    };
    feet.left.position.set(-0.36, -1.31, 0.11);
    feet.right.position.set(0.36, -1.31, 0.11);
    feet.left.scale.set(0.3, 0.1, 0.48);
    feet.right.scale.set(0.3, 0.1, 0.48);
    figure.add(feet.left, feet.right);

    const joints = [
      addJoint(figure, gold, 0.065),
      addJoint(figure, gold, 0.065),
      addJoint(figure, gold, 0.065),
      addJoint(figure, gold, 0.065),
    ];
    joints[0].position.copy(shoulderLeft);
    joints[1].position.copy(shoulderRight);
    joints[2].position.copy(hipLeft);
    joints[3].position.copy(hipRight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 48),
      new THREE.MeshBasicMaterial({ color: 0x0d2119, transparent: true, opacity: 0.75 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -1.42, 0);
    ground.scale.set(1.3, 0.55, 1);
    scene.add(ground);

    const flow = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0xe8cb83, transparent: true, opacity: 0.55 }),
    );
    flow.rotation.x = Math.PI / 2;
    flow.position.y = -1.37;
    scene.add(flow);

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
    let progress = 0;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const target = activeRef.current ? 1 : 0;
      progress = THREE.MathUtils.damp(progress, target, 3.4, delta);

      const leftElbow = REST_POSE.leftElbow.clone().lerp(LIFT_POSE.leftElbow, progress);
      const rightElbow = REST_POSE.rightElbow.clone().lerp(LIFT_POSE.rightElbow, progress);
      const leftWrist = REST_POSE.leftWrist.clone().lerp(LIFT_POSE.leftWrist, progress);
      const rightWrist = REST_POSE.rightWrist.clone().lerp(LIFT_POSE.rightWrist, progress);
      placeLimb(arms.leftUpper, shoulderLeft, leftElbow);
      placeLimb(arms.rightUpper, shoulderRight, rightElbow);
      placeLimb(arms.leftForearm, leftElbow, leftWrist);
      placeLimb(arms.rightForearm, rightElbow, rightWrist);
      hands.left.position.lerp(leftWrist, 0.24);
      hands.right.position.lerp(rightWrist, 0.24);
      hands.leftElbow.position.lerp(leftElbow, 0.24);
      hands.rightElbow.position.lerp(rightElbow, 0.24);

      const breath = Math.sin(time * 0.0014) * 0.018;
      torso.scale.y = 0.83 + breath;
      chest.position.z = 0.285 + breath * 0.35;
      figure.position.y = -1.55 + Math.sin(time * 0.0008) * 0.012;
      figure.rotation.y = -0.15 + Math.sin(time * 0.00045) * 0.035;
      flow.rotation.z = time * 0.00018;
      flow.scale.setScalar(1 + Math.sin(time * 0.001) * 0.025);

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

  return <div aria-label="Kolları yorganı kaldırır gibi yükselten profesyonel 3D hareket modeli" className={`guided-movement-model-3d ${className}`} ref={mountRef} />;
}
