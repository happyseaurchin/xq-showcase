import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function MandelbrotRiemannSphere() {
  const containerRef = useRef(null);
  const [maxIterations, setMaxIterations] = useState(200);
  const [rotationSpeed, setRotationSpeed] = useState(0.3);
  const [colorScheme, setColorScheme] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  
  const MAX_ITER_LIMIT = 1600;
  
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraRef = useRef(null);
  const pointsGroupRef = useRef(null);
  const rotationSpeedRef = useRef(rotationSpeed);
  const autoRotateRef = useRef(autoRotate);
  
  // Mouse/touch interaction state
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const sphereRotation = useRef({ x: 0, y: 0 });

  // Keep refs in sync
  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);
  
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Map complex number to sphere coordinates via stereographic projection
  // Matches texture: re = x/(1-y), im = z/(1-y)
  // Inverse: x = 2re/(1+|z|²), z = 2im/(1+|z|²), y = (|z|²-1)/(1+|z|²)
  const complexToSphere = (re, im) => {
    const modSq = re * re + im * im;
    const denom = 1 + modSq;
    return new THREE.Vector3(
      (2 * re) / denom,
      (modSq - 1) / denom,
      (2 * im) / denom
    );
  };

  // Generate Mandelbrot texture matching Three.js SphereGeometry UV mapping
  const generateMandelbrotTexture = (iterations, scheme) => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const u = px / size;
        const v = py / size;
        
        // Three.js SphereGeometry conventions:
        // phi = azimuthal angle (around Y axis), 0 to 2π
        // theta = polar angle (from top), 0 to π
        const phi = u * 2 * Math.PI;
        const theta = v * Math.PI;
        
        // Three.js sphere position formula
        const x = -Math.cos(phi) * Math.sin(theta);
        const y = Math.cos(theta);
        const z = Math.sin(phi) * Math.sin(theta);
        
        // Inverse stereographic projection from north pole (0, 1, 0)
        let re, im;
        if (y > 0.9999) {
          re = Infinity;
          im = Infinity;
        } else {
          re = x / (1 - y);
          im = z / (1 - y);
        }

        // Compute Mandelbrot iteration
        let zr = 0, zi = 0;
        let iter = 0;
        const cr = re, ci = im;

        if (isFinite(cr) && isFinite(ci)) {
          while (zr * zr + zi * zi < 4 && iter < iterations) {
            const temp = zr * zr - zi * zi + cr;
            zi = 2 * zr * zi + ci;
            zr = temp;
            iter++;
          }
        }

        const idx = (py * size + px) * 4;
        
        if (iter === iterations) {
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
        } else if (!isFinite(cr)) {
          if (scheme === 0) {
            imageData.data[idx] = 20;
            imageData.data[idx + 1] = 10;
            imageData.data[idx + 2] = 60;
          } else if (scheme === 1) {
            imageData.data[idx] = 60;
            imageData.data[idx + 1] = 5;
            imageData.data[idx + 2] = 30;
          } else {
            // Rainbow at infinity - deep violet
            imageData.data[idx] = 30;
            imageData.data[idx + 1] = 10;
            imageData.data[idx + 2] = 50;
          }
        } else {
          const smooth = iter + 1 - Math.log2(Math.log2(zr * zr + zi * zi));
          // Use log scaling so colors don't darken with higher iterations
          // This keeps colors consistent regardless of max iteration setting
          const t = Math.log(smooth + 1) / Math.log(iterations + 1);
          // Also compute a raw iteration-based value for schemes that want more spread
          const rawT = Math.min(1, smooth / 100); // Normalized to ~100 iterations for full range
          
          let r, g, b;
          if (scheme === 0) {
            // Electric - use log-scaled t
            r = Math.floor(9 * (1 - t) * t * t * t * 255);
            g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
            b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255 + 
                          (1 - (1-t)*(1-t)*(1-t)*(1-t)) * 200);
          } else if (scheme === 1) {
            // Fire - use sqrt of log-scaled t for extended gradations
            const s = Math.sqrt(t);
            
            if (s < 0.2) {
              const p = s / 0.2;
              r = Math.floor(p * 80);
              g = Math.floor(p * 10);
              b = Math.floor(p * 40);
            } else if (s < 0.4) {
              const p = (s - 0.2) / 0.2;
              r = Math.floor(80 + p * 175);
              g = Math.floor(10 + p * 20);
              b = Math.floor(40 - p * 40);
            } else if (s < 0.6) {
              const p = (s - 0.4) / 0.2;
              r = 255;
              g = Math.floor(30 + p * 130);
              b = 0;
            } else if (s < 0.8) {
              const p = (s - 0.6) / 0.2;
              r = 255;
              g = Math.floor(160 + p * 95);
              b = Math.floor(p * 50);
            } else {
              const p = (s - 0.8) / 0.2;
              r = 255;
              g = 255;
              b = Math.floor(50 + p * 205);
            }
          } else {
            // Rainbow - cycles through full spectrum, extends far
            const hue = (smooth * 0.05) % 1; // Cycle through colors
            const sat = 0.85;
            const light = 0.35 + 0.25 * t;
            
            // HSL to RGB conversion
            const c = (1 - Math.abs(2 * light - 1)) * sat;
            const hPrime = hue * 6;
            const x = c * (1 - Math.abs(hPrime % 2 - 1));
            const m = light - c / 2;
            
            let r1, g1, b1;
            if (hPrime < 1) { r1 = c; g1 = x; b1 = 0; }
            else if (hPrime < 2) { r1 = x; g1 = c; b1 = 0; }
            else if (hPrime < 3) { r1 = 0; g1 = c; b1 = x; }
            else if (hPrime < 4) { r1 = 0; g1 = x; b1 = c; }
            else if (hPrime < 5) { r1 = x; g1 = 0; b1 = c; }
            else { r1 = c; g1 = 0; b1 = x; }
            
            r = Math.floor((r1 + m) * 255);
            g = Math.floor((g1 + m) * 255);
            b = Math.floor((b1 + m) * 255);
          }
          
          imageData.data[idx] = r;
          imageData.data[idx + 1] = g;
          imageData.data[idx + 2] = b;
        }
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  };

  // Create text sprite for labels
  const createTextSprite = (text, color = '#ffffff') => {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size/2, size/2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false 
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.3, 0.3, 1);
    return sprite;
  };

  // Create key points group
  const createKeyPoints = () => {
    const group = new THREE.Group();
    
    const points = [
      { z: [0, 0], label: '0', color: '#00ff00', desc: 'Origin (south pole)' },
      { z: [1, 0], label: '1', color: '#ff6600', desc: 'One' },
      { z: [-1, 0], label: '-1', color: '#ff0066', desc: 'Negative One' },
      { z: [0, 1], label: 'i', color: '#00ffff', desc: 'Imaginary unit' },
      { z: [0, -1], label: '-i', color: '#ff00ff', desc: 'Neg Imaginary' },
      { z: 'infinity', label: '∞', color: '#ffffff', desc: 'Infinity (north pole)' },
      // Additional interesting points
      { z: [-0.75, 0], label: 'c₂', color: '#ffff00', desc: 'Period-2 bulb center' },
      { z: [-0.125, 0.75], label: 'c₃', color: '#88ff88', desc: 'Period-3 bulb' },
    ];
    
    points.forEach(({ z, label, color }) => {
      let pos;
      if (z === 'infinity') {
        pos = new THREE.Vector3(0, 1, 0); // North pole (Y-up)
      } else {
        pos = complexToSphere(z[0], z[1]);
      }
      
      // Create glowing sphere marker
      const markerGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: color });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos).multiplyScalar(1.02);
      group.add(marker);
      
      // Create outer glow
      const glowGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.3 
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(pos).multiplyScalar(1.02);
      group.add(glow);
      
      // Create label
      const sprite = createTextSprite(label, color);
      sprite.position.copy(pos).multiplyScalar(1.25);
      group.add(sprite);
    });
    
    // Add equator ring to show unit circle
    const equatorGeometry = new THREE.TorusGeometry(1.01, 0.005, 8, 64);
    const equatorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x666666, 
      transparent: true, 
      opacity: 0.5 
    });
    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    equator.rotation.x = Math.PI / 2; // Rotate to lie in XZ plane
    group.add(equator);
    
    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere with Mandelbrot texture
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const texture = generateMandelbrotTexture(maxIterations, colorScheme);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Add subtle ambient glow
    const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glow);

    // Create key points group
    const pointsGroup = createKeyPoints();
    pointsGroup.visible = showPoints;
    sphere.add(pointsGroup);
    pointsGroupRef.current = pointsGroup;

    // Mouse/touch handlers
    const getEventPosition = (e) => {
      if (e.touches) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e) => {
      isDragging.current = true;
      const pos = getEventPosition(e);
      previousMouse.current = pos;
      setAutoRotate(false);
    };

    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      
      const pos = getEventPosition(e);
      const deltaX = pos.x - previousMouse.current.x;
      const deltaY = pos.y - previousMouse.current.y;
      
      sphereRotation.current.y += deltaX * 0.005;
      sphereRotation.current.x += deltaY * 0.005;
      
      // Clamp vertical rotation
      sphereRotation.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, sphereRotation.current.x));
      
      previousMouse.current = pos;
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(1.5, Math.min(6, camera.position.z + e.deltaY * 0.002));
    };

    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('mouseleave', onPointerUp);
    renderer.domElement.addEventListener('touchstart', onPointerDown);
    renderer.domElement.addEventListener('touchmove', onPointerMove);
    renderer.domElement.addEventListener('touchend', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (autoRotateRef.current) {
        sphereRotation.current.y += rotationSpeedRef.current * 0.01;
      }
      
      sphere.rotation.x = sphereRotation.current.x;
      sphere.rotation.y = sphereRotation.current.y;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onPointerDown);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('mouseup', onPointerUp);
      renderer.domElement.removeEventListener('mouseleave', onPointerUp);
      renderer.domElement.removeEventListener('touchstart', onPointerDown);
      renderer.domElement.removeEventListener('touchmove', onPointerMove);
      renderer.domElement.removeEventListener('touchend', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update texture when parameters change
  useEffect(() => {
    if (sphereRef.current) {
      const newTexture = generateMandelbrotTexture(maxIterations, colorScheme);
      newTexture.wrapS = THREE.RepeatWrapping;
      newTexture.wrapT = THREE.ClampToEdgeWrapping;
      sphereRef.current.material.map = newTexture;
      sphereRef.current.material.needsUpdate = true;
    }
  }, [maxIterations, colorScheme]);

  // Update points visibility
  useEffect(() => {
    if (pointsGroupRef.current) {
      pointsGroupRef.current.visible = showPoints;
    }
  }, [showPoints]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-light tracking-wide text-center mb-3">
          Mandelbrot Set on Riemann Sphere
        </h1>
        
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Iterations:</label>
            <input
              type="range"
              min="20"
              max={MAX_ITER_LIMIT}
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
            <span className="text-sm w-8">{maxIterations}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Speed:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(Number(e.target.value))}
              className="w-20 accent-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Colors:</label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value={0}>Electric</option>
              <option value={1}>Fire</option>
              <option value={2}>Rainbow</option>
            </select>
          </div>
          
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              autoRotate 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {autoRotate ? '⏸ Auto' : '▶ Auto'}
          </button>
          
          <button
            onClick={() => setShowPoints(!showPoints)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showPoints 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {showPoints ? '● Points' : '○ Points'}
          </button>
        </div>
        
        {showPoints && (
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="text-green-400">● 0 (south pole)</span>
            <span className="text-white">● ∞ (north pole)</span>
            <span className="text-orange-400">● 1</span>
            <span className="text-pink-500">● -1</span>
            <span className="text-cyan-400">● i</span>
            <span className="text-fuchsia-400">● -i</span>
            <span className="text-yellow-400">● c₂ (period-2)</span>
            <span className="text-green-300">● c₃ (period-3)</span>
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-1 cursor-grab active:cursor-grabbing" 
      />
      
      <div className="p-3 border-t border-gray-800 text-xs text-gray-500 text-center">
        <p>
          <strong>Controls:</strong> Drag to rotate • Scroll to zoom •
          South pole = 0 (in set) • North pole = ∞ • Equator = unit circle |z|=1
        </p>
      </div>
    </div>
  );
}
