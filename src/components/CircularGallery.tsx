'use client';
import { useRef, useEffect } from 'react';
import { Renderer, Camera, Transform, Plane, Mesh, Program, Texture } from 'ogl';
import './CircularGallery.css';

const vertex = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Apply circular bend
    float radius = 10.0;
    float angle = pos.x * uBend / radius;
    pos.x = sin(angle) * radius;
    pos.z = cos(angle) * radius - radius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  varying vec2 vUv;
  
  // Rounded box signed distance function
  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main() {
    vec4 color = texture2D(tMap, vUv);
    
    // Calculate distance from center for rounded corners
    vec2 p = vUv * 2.0 - 1.0;
    float dist = sdRoundRect(p, vec2(1.0), uBorderRadius);
    
    // Smoothstep for anti-aliased edges
    float alpha = 1.0 - smoothstep(0.0, 0.02, dist);
    
    gl_FragColor = vec4(color.rgb, color.a * alpha);
  }
`;

interface CircularGalleryProps {
  items?: Array<{ image: string; text: string }>;
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  scrollEase?: number;
  fontUrl?: string;
  font?: string;
}

const defaultItems = [
  { image: 'https://picsum.photos/800/600?random=1', text: 'Discovery' },
  { image: 'https://picsum.photos/800/600?random=2', text: 'Connection' },
  { image: 'https://picsum.photos/800/600?random=3', text: 'Growth' },
  { image: 'https://picsum.photos/800/600?random=4', text: 'Community' },
  { image: 'https://picsum.photos/800/600?random=5', text: 'Impact' },
];

export default function CircularGallery({
  items = defaultItems,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  scrollEase = 0.02,
  fontUrl = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600&display=swap',
  font = '600 30px "Hanken Grotesk"',
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Load custom font if provided
    if (fontUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      document.head.appendChild(link);
    }

    const renderer = new Renderer({ alpha: true, antialias: true, dpr: window.devicePixelRatio });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.z = 5;

    const scene = new Transform();

    // Create a canvas to generate textures with text overlaid
    const createTextureWithText = (imgSrc: string, text: string) => {
      const texture = new Texture(gl, { generateMipmaps: false });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw image, crop to center square
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
        
        // Add dark gradient overlay for text readability
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.font = font;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, canvas.width / 2, canvas.height - 60);

        texture.image = canvas;
      };
      img.src = imgSrc;
      return texture;
    };

    const geometry = new Plane(gl, { width: 1.5, height: 1.5, widthSegments: 20 });
    const meshes: Mesh[] = [];
    const radius = 2.5;

    items.forEach((item, i) => {
      const texture = createTextureWithText(item.image, item.text);
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          tMap: { value: texture },
          uBend: { value: bend },
          uBorderRadius: { value: borderRadius },
        },
        transparent: true,
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      meshes.push(mesh);
    });

    let targetScroll = 0;
    let currentScroll = 0;
    let isDragging = false;
    let startX = 0;

    const handleWheel = (e: WheelEvent) => {
      targetScroll += e.deltaY * 0.002;
    };
    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      startX = e.touches[0].clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const x = e.touches[0].clientX;
      targetScroll -= (x - startX) * 0.005;
      startX = x;
    };
    const handleTouchEnd = () => {
      isDragging = false;
    };
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      container.style.cursor = 'grabbing';
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const x = e.clientX;
      targetScroll -= (x - startX) * 0.005;
      startX = x;
    };
    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let animationFrameId: number;
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener('resize', resize);
    resize();

    const update = () => {
      currentScroll += (targetScroll - currentScroll) * scrollEase;
      
      meshes.forEach((mesh, i) => {
        const theta = (i / meshes.length) * Math.PI * 2 + currentScroll;
        mesh.position.x = Math.sin(theta) * radius;
        mesh.position.z = Math.cos(theta) * radius;
        // Face outward/inward depending on bend
        mesh.rotation.y = theta + (bend > 0 ? 0 : Math.PI);
      });

      renderer.render({ scene, camera });
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (fontUrl) {
        const links = document.head.querySelectorAll(`link[href="${fontUrl}"]`);
        links.forEach(l => l.remove());
      }
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  }, [items, bend, textColor, borderRadius, scrollEase, fontUrl, font]);

  return <div ref={containerRef} className="circular-gallery-container" />;
}
