"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./style.css";

interface ThreeSceneProps {
  imageUrl?: string;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ imageUrl = "/brand-bg.png" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    if (canvasRef.current) {
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    }

    const geometry = new THREE.PlaneGeometry(2, 2);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture: any) => {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uTexture: { value: texture },
            uAmplitude: { value: 0.05 },
            uFrequency: { value: 10 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
uniform float uFrequency;   // Frequency of the wave
uniform float uAmplitude;   // Amplitude of the wave
uniform float uTime;        // Time uniform for animation
uniform sampler2D uTexture; // Texture uniform

varying vec2 vUv;           // Interpolated UV coordinates from the vertex shader

void main() {
    // Initialize UV coordinates
    vec2 uv = vUv;

    // Distance calculations
    float distanceFromTopLeft = length(uv);
    vec2 centerUv = vUv - 0.5;
    float distanceFromCenter = length(centerUv);
    vec2 bottomRightUv = vUv - vec2(1.0, 1.0);
    float distanceFromBottomRight = length(bottomRightUv);

    // Calculate individual waves
    float waveTopLeft = sin(distanceFromTopLeft * uFrequency - uTime) * uAmplitude;
    float waveCenter = sin(distanceFromCenter * uFrequency - uTime) * uAmplitude;
    float waveBottomRight = sin(distanceFromBottomRight * uFrequency - uTime) * uAmplitude;

    // Calculate falloff factors for each corner
    float falloffTopLeft = smoothstep(0.5, 0.35, distanceFromTopLeft);
    float falloffCenter = smoothstep(0.5, 0.35,  distanceFromCenter);
    float falloffBottomRight = smoothstep(0.5, 0.35, distanceFromBottomRight);

    // Apply falloff to each wave
    waveTopLeft *= falloffTopLeft;
    waveCenter *= falloffCenter;
    waveBottomRight *= falloffBottomRight;

    // Combine waves
    float combinedWave = waveTopLeft + waveCenter + waveBottomRight;

    // Create a falloff factor based on the y-coordinate to reduce effect near the bottom
    float verticalFalloff = smoothstep(0.1, 0.25, vUv.y); // Adjust range as needed
    combinedWave *= verticalFalloff;

    // Offset the UV coordinates based on the combined wave
    uv += centerUv * combinedWave;

    // Sample the texture with distorted UVs
    vec4 color = texture2D(uTexture, uv);

    gl_FragColor = color;
}



          `,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const animate = () => {
          requestAnimationFrame(animate);
          material.uniforms.uTime.value += 0.005;
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (err: any) => {
        console.error("An error occurred loading the texture", err);
      },
    );

    const handleResize = () => {
      if (canvasRef.current) {
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [imageUrl]);

  return <canvas ref={canvasRef} className="scene" />;
};

export default ThreeScene;
