"use client";

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef } from "react";
import "./CircularGallery.css";

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

export interface CircularGalleryItem {
  image: string;
  text: string;
}

export interface CircularGalleryProps {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  className?: string;
}

const DEFAULT_ITEMS: CircularGalleryItem[] = [
  { image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", text: "Productivity Shastra" },
  { image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80", text: "Conclave 2026" },
  { image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", text: "Tribe Networking" },
  { image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80", text: "Sacred Space" },
  { image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80", text: "Mastermind Group" },
];

export default function CircularGallery({
  items = DEFAULT_ITEMS,
  bend = 3,
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = "bold 24px Inter, sans-serif",
  scrollSpeed = 2,
  scrollEase = 0.05,
  className = "",
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create OGL Renderer
    const renderer = new Renderer({ antialias: true, alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.className = "circular-gallery-canvas";
    container.appendChild(canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.z = 5;

    const scene = new Transform();
    const planeGeometry = new Plane(gl, { heightSegments: 10, widthSegments: 10 });

    const vertexShader = `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uBend;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z -= pow(abs(pos.x), 2.0) * uBend * 0.1;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform sampler2D tMap;
      uniform float uBorderRadius;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        // Simple rounded corners mask
        vec2 d = abs(uv - 0.5) * 2.0;
        float radius = 1.0 - uBorderRadius * 2.0;
        if (d.x > radius && d.y > radius) {
          if (length(d - vec2(radius)) > (1.0 - radius)) {
            discard;
          }
        }
        vec4 color = texture2D(tMap, uv);
        gl_FragColor = color;
      }
    `;

    // Create card textures from canvas with text
    const meshes: Mesh[] = [];
    const count = items.length;

    items.forEach((item, index) => {
      const textCanvas = document.createElement("canvas");
      textCanvas.width = 512;
      textCanvas.height = 640;
      const ctx = textCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#1b1722";
        ctx.fillRect(0, 0, 512, 640);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item.image;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 512, 520);
          ctx.fillStyle = textColor;
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.fillText(item.text, 256, 580);
          texture.needsUpdate = true;
        };

        ctx.fillStyle = textColor;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.fillText(item.text, 256, 580);
      }

      const texture = new Texture(gl, { generateMipmaps: false });
      texture.image = textCanvas;

      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          tMap: { value: texture },
          uBend: { value: bend },
          uBorderRadius: { value: borderRadius },
        },
        transparent: true,
      });

      const mesh = new Mesh(gl, { geometry: planeGeometry, program });
      mesh.scale.set(1.4, 1.75, 1);
      mesh.setParent(scene);
      meshes.push(mesh);
    });

    let currentScroll = 0;
    let targetScroll = 0;
    let isDragging = false;
    let startX = 0;
    let startScroll = 0;

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const onWheel = (e: WheelEvent) => {
      targetScroll += e.deltaY * 0.001 * scrollSpeed;
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      startScroll = targetScroll;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = startX - e.clientX;
      targetScroll = startScroll + deltaX * 0.003 * scrollSpeed;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let animationFrameId: number;

    const update = () => {
      currentScroll = lerp(currentScroll, targetScroll, scrollEase);

      const spacing = 1.8;
      const totalWidth = count * spacing;

      meshes.forEach((mesh, index) => {
        let x = index * spacing - currentScroll;
        // Wrap items endlessly around totalWidth
        x = ((x % totalWidth) + totalWidth) % totalWidth - totalWidth / 2;
        mesh.position.x = x;
        mesh.position.z = -Math.abs(x) * 0.3;
        mesh.rotation.y = -x * 0.15;
      });

      renderer.render({ scene, camera });
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase]);

  return <div ref={containerRef} className={`circular-gallery-container ${className}`} />;
}
