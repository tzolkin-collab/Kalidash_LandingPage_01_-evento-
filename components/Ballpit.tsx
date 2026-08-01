"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface BallpitProps {
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: number[];
}

export default function Ballpit({
  count = 70,
  gravity = 0.03,
  friction = 0.99,
  wallBounce = 0.85,
  followCursor = true,
  colors = [0x9333ea, 0x6366f1, 0xa855f7, 0x3b82f6, 0xec4899, 0xffffff],
}: BallpitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x9333ea, 1.5);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Ball properties & Instances
    const ballRadius = 0.7;
    const geometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    scene.add(instancedMesh);

    // Assign random colors
    const colorObj = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const hex = colors[i % colors.length];
      colorObj.setHex(hex);
      instancedMesh.setColorAt(i, colorObj);
    }
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // Physics state
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    // Initial random positions & velocities
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      vel[i * 3] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    // Mouse tracking
    const mouse = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();

    const handleMouseMove = (e: MouseEvent) => {
      if (!followCursor) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, mouseWorld);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const dummy = new THREE.Object3D();

    // Physics Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Boundaries based on aspect ratio & FOV
      const vFov = (camera.fov * Math.PI) / 180;
      const boundY = Math.tan(vFov / 2) * camera.position.z - ballRadius;
      const boundX = boundY * camera.aspect;
      const boundZ = 4;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;

        // Apply gravity downwards
        vel[idx + 1] -= gravity * 0.1;

        // Update positions
        pos[idx] += vel[idx];
        pos[idx + 1] += vel[idx + 1];
        pos[idx + 2] += vel[idx + 2];

        // Apply friction
        vel[idx] *= friction;
        vel[idx + 1] *= friction;
        vel[idx + 2] *= friction;

        // Wall collisions (X)
        if (pos[idx] > boundX) {
          pos[idx] = boundX;
          vel[idx] *= -wallBounce;
        } else if (pos[idx] < -boundX) {
          pos[idx] = -boundX;
          vel[idx] *= -wallBounce;
        }

        // Wall collisions (Y - floor & ceiling)
        if (pos[idx + 1] < -boundY) {
          pos[idx + 1] = -boundY;
          vel[idx + 1] *= -wallBounce;
          // Add slight horizontal kick on floor bounce
          vel[idx] += (Math.random() - 0.5) * 0.01;
        } else if (pos[idx + 1] > boundY) {
          pos[idx + 1] = boundY;
          vel[idx + 1] *= -wallBounce;
        }

        // Wall collisions (Z)
        if (pos[idx + 2] > boundZ) {
          pos[idx + 2] = boundZ;
          vel[idx + 2] *= -wallBounce;
        } else if (pos[idx + 2] < -boundZ) {
          pos[idx + 2] = -boundZ;
          vel[idx + 2] *= -wallBounce;
        }

        // Mouse repelling force
        if (followCursor && mouse.x !== -999) {
          const dx = pos[idx] - mouseWorld.x;
          const dy = pos[idx + 1] - mouseWorld.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 16 && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const force = (4 - dist) * 0.04;
            vel[idx] += (dx / dist) * force;
            vel[idx + 1] += (dy / dist) * force;
          }
        }

        // Ball to Ball collisions
        for (let j = i + 1; j < count; j++) {
          const jdx = j * 3;
          const dx = pos[jdx] - pos[idx];
          const dy = pos[jdx + 1] - pos[idx + 1];
          const dz = pos[jdx + 2] - pos[idx + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          const minDist = ballRadius * 2;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            // Separate spheres
            pos[idx] -= nx * overlap;
            pos[idx + 1] -= ny * overlap;
            pos[idx + 2] -= nz * overlap;

            pos[jdx] += nx * overlap;
            pos[jdx + 1] += ny * overlap;
            pos[jdx + 2] += nz * overlap;

            // Impulse calculation
            const kx = vel[idx] - vel[jdx];
            const ky = vel[idx + 1] - vel[jdx + 1];
            const kz = vel[idx + 2] - vel[jdx + 2];
            const p = (nx * kx + ny * ky + nz * kz);

            vel[idx] -= p * nx * 0.8;
            vel[idx + 1] -= p * ny * 0.8;
            vel[idx + 2] -= p * nz * 0.8;

            vel[jdx] += p * nx * 0.8;
            vel[jdx + 1] += p * ny * 0.8;
            vel[jdx + 2] += p * nz * 0.8;
          }
        }

        // Update Dummy & InstancedMesh
        dummy.position.set(pos[idx], pos[idx + 1], pos[idx + 2]);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count, gravity, friction, wallBounce, followCursor, colors]);

  return <div ref={containerRef} className="w-full h-full" />;
}
