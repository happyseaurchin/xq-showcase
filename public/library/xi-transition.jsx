import React, { useState } from 'react';

export default function XiTransition() {
  const [phase, setPhase] = useState(0); // 0: Q1, 1: zoom, 2: Q2 emerges
  
  const width = 700;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  
  // Rotation for 3D view
  const rotX = 0.5;
  const rotY = 0.3;
  
  // Generate torus wireframe with optional transform
  const generateTorusWireframe = (R, r, numToroidal, numPoloidal, transform = null) => {
    const toroidalCircles = [];
    const poloidalCircles = [];
    
    // Helper to apply transform
    const applyTransform = (x, y, z) => {
      if (!transform) return { x, y, z };
      
      let tx = x, ty = y, tz = z;
      
      // Apply rotation first
      if (transform.rotateAxis === 'x') {
        const cos = Math.cos(transform.rotateAngle);
        const sin = Math.sin(transform.rotateAngle);
        const newY = ty * cos - tz * sin;
        const newZ = ty * sin + tz * cos;
        ty = newY;
        tz = newZ;
      } else if (transform.rotateAxis === 'y') {
        const cos = Math.cos(transform.rotateAngle);
        const sin = Math.sin(transform.rotateAngle);
        const newX = tx * cos + tz * sin;
        const newZ = -tx * sin + tz * cos;
        tx = newX;
        tz = newZ;
      }
      
      // Then translate
      tx += transform.offsetX || 0;
      ty += transform.offsetY || 0;
      tz += transform.offsetZ || 0;
      
      return { x: tx, y: ty, z: tz };
    };
    
    // Project 3D to 2D with rotation
    const project = (x, y, z) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      
      const scale = 400 / (400 + z2);
      return {
        x: cx + x1 * scale,
        y: cy - y1 * scale,
        z: z2
      };
    };
    
    // Generate toroidal circles (around the tube)
    for (let i = 0; i < numToroidal; i++) {
      const theta = (i / numToroidal) * Math.PI * 2;
      const circle = [];
      
      for (let j = 0; j <= numPoloidal; j++) {
        const phi = (j / numPoloidal) * Math.PI * 2;
        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = r * Math.sin(phi);
        const z = (R + r * Math.cos(phi)) * Math.sin(theta);
        
        const transformed = applyTransform(x, y, z);
        circle.push(project(transformed.x, transformed.y, transformed.z));
      }
      toroidalCircles.push(circle);
    }
    
    // Generate poloidal circles (along the major circle)
    for (let j = 0; j < numPoloidal; j++) {
      const phi = (j / numPoloidal) * Math.PI * 2;
      const circle = [];
      
      for (let i = 0; i <= numToroidal; i++) {
        const theta = (i / numToroidal) * Math.PI * 2;
        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = r * Math.sin(phi);
        const z = (R + r * Math.cos(phi)) * Math.sin(theta);
        
        const transformed = applyTransform(x, y, z);
        circle.push(project(transformed.x, transformed.y, transformed.z));
      }
      poloidalCircles.push(circle);
    }
    
    return { toroidalCircles, poloidalCircles };
  };
  
  const pointsToPath = (points) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };
  
  // Parameters
  const R1 = 120;
  const r1 = 45;
  const tubeRatio = 0.4;
  const R2 = r1;  // Q2's major radius = Q1's tube radius
  const r2 = R2 * tubeRatio;
  
  // Q1 torus - no transform (XY plane)
  const q1 = generateTorusWireframe(R1, r1, 16, 24);
  
  // Q2 torus - transformed to sit inside Q1's tube
  // Offset to right side of Q1's major circle, rotated 90° around X
  const q2Scale = Math.min(1, Math.max(0, phase - 0.5) * 2);
  const q2Transform = {
    offsetX: R1,
    offsetY: 0,
    offsetZ: 0,
    rotateAxis: 'x',
    rotateAngle: Math.PI / 2
  };
  const q2 = generateTorusWireframe(R2 * q2Scale, r2 * q2Scale, 12, 16, q2Transform);
  
  // Highlight ring - the tube cross-section where Q2 emerges
  const highlightRing = [];
  const highlightTheta = 0; // Right side of Q1
  for (let j = 0; j <= 32; j++) {
    const phi = (j / 32) * Math.PI * 2;
    const x = (R1 + r1 * Math.cos(phi)) * Math.cos(highlightTheta);
    const y = r1 * Math.sin(phi);
    const z = (R1 + r1 * Math.cos(phi)) * Math.sin(highlightTheta);
    
    // Project
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    const scale = 400 / (400 + z2);
    
    highlightRing.push({
      x: cx + x1 * scale,
      y: cy - y1 * scale
    });
  }
  
  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-2">×i Transition: Level Emergence</h1>
      <p className="text-gray-400 text-sm mb-4">How tube radius (r) becomes context (R) for nested level</p>
      
      <svg width={width} height={height} className="bg-gray-950 rounded-lg">
        <defs>
          <radialGradient id="q2Glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff44ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff44ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Q1 Torus - Blue */}
        <g opacity={phase < 1.5 ? 1 : 0.4}>
          {q1.toroidalCircles.map((pts, i) => (
            <path 
              key={`t1-${i}`} 
              d={pointsToPath(pts)} 
              fill="none" 
              stroke="#4a9eff" 
              strokeWidth="1.2" 
              opacity="0.5" 
            />
          ))}
          {q1.poloidalCircles.map((pts, i) => (
            <path 
              key={`p1-${i}`} 
              d={pointsToPath(pts)} 
              fill="none" 
              stroke="#4a9eff" 
              strokeWidth="0.8" 
              opacity="0.3" 
            />
          ))}
        </g>
        
        {/* Highlight ring - the tube cross-section where Q2 emerges */}
        {phase >= 0.2 && (
          <g opacity={Math.min(1, (phase - 0.2) * 2)}>
            <path 
              d={pointsToPath(highlightRing)} 
              fill="none" 
              stroke="#ff44ff" 
              strokeWidth="3" 
              strokeDasharray={phase < 1 ? "8,4" : "none"}
            />
          </g>
        )}
        
        {/* Q2 Torus - Magenta, emerging inside tube */}
        {phase >= 0.5 && (
          <g opacity={q2Scale}>
            {q2.toroidalCircles.map((pts, i) => (
              <path 
                key={`t2-${i}`} 
                d={pointsToPath(pts)} 
                fill="none" 
                stroke="#ff44ff" 
                strokeWidth="1.5" 
                opacity="0.7" 
              />
            ))}
            {q2.poloidalCircles.map((pts, i) => (
              <path 
                key={`p2-${i}`} 
                d={pointsToPath(pts)} 
                fill="none" 
                stroke="#ff44ff" 
                strokeWidth="1" 
                opacity="0.5" 
              />
            ))}
          </g>
        )}
        
        {/* Labels */}
        <g opacity={phase < 1 ? 1 : 0.5}>
          <text x={cx - 130} y={80} fill="#4a9eff" fontSize="18" fontWeight="bold">
            Q1: Sensation
          </text>
          <text x={cx - 130} y={100} fill="#4a9eff" fontSize="12" opacity="0.7">
            R₁ = {R1}, r₁ = {r1}
          </text>
        </g>
        
        {/* ×i indicator */}
        {phase >= 0.3 && (
          <g opacity={Math.min(1, (phase - 0.3) * 2)}>
            <text 
              x={cx + 160} 
              y={cy - 80} 
              fill="#ff44ff" 
              fontSize="32" 
              fontWeight="bold"
              fontFamily="serif"
            >
              ×i
            </text>
            <text x={cx + 160} y={cy - 55} fill="#aaa" fontSize="12">
              90° rotation
            </text>
            <text x={cx + 160} y={cy - 40} fill="#aaa" fontSize="12">
              into tube
            </text>
          </g>
        )}
        
        {/* Q2 label */}
        {phase >= 1 && (
          <g opacity={Math.min(1, (phase - 1) * 2)}>
            <text x={cx + 150} y={cy + 50} fill="#ff44ff" fontSize="16" fontWeight="bold">
              Q2: Perception
            </text>
            <text x={cx + 150} y={cy + 70} fill="#ff44ff" fontSize="12" opacity="0.7">
              R₂ = r₁ = {r1}
            </text>
            <text x={cx + 150} y={cy + 88} fill="#888" fontSize="11">
              (tube becomes context)
            </text>
          </g>
        )}
        
        {/* Equation box */}
        <g transform="translate(40, 380)">
          <rect x="0" y="0" width="180" height="90" fill="#1a1a2e" stroke="#333" rx="8" />
          <text x="90" y="25" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">
            Transition Rule:
          </text>
          <text x="90" y="52" fill="#ff44ff" fontSize="18" textAnchor="middle" fontFamily="serif">
            r<tspan fontSize="12" dy="4">n</tspan><tspan dy="-4"> → R</tspan><tspan fontSize="12" dy="4">n+1</tspan>
          </text>
          <text x="90" y="75" fill="#888" fontSize="11" textAnchor="middle">
            tube becomes context
          </text>
        </g>
        
        {/* Visual key showing the perpendicular relationship */}
        {phase >= 1.5 && (
          <g transform="translate(500, 400)" opacity={Math.min(1, (phase - 1.5) * 2)}>
            <text x="0" y="0" fill="#666" fontSize="11">Perpendicular nesting:</text>
            <line x1="0" y1="15" x2="40" y2="15" stroke="#4a9eff" strokeWidth="2" />
            <text x="50" y="19" fill="#4a9eff" fontSize="10">Q1 plane</text>
            <line x1="20" y1="15" x2="20" y2="45" stroke="#ff44ff" strokeWidth="2" />
            <text x="30" y="35" fill="#ff44ff" fontSize="10">Q2 (⊥)</text>
          </g>
        )}
      </svg>
      
      {/* Controls */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setPhase(0)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              phase < 0.3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Q1 Torus
          </button>
          <button
            onClick={() => setPhase(0.8)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              phase >= 0.3 && phase < 1.2 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ×i Transition
          </button>
          <button
            onClick={() => setPhase(2)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              phase >= 1.2 ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Q2 Emerges
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-96">
          <span className="text-gray-400 text-sm w-16">Phase:</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={phase}
            onChange={(e) => setPhase(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-gray-500 text-sm w-10">{phase.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg max-w-xl">
        <h3 className="text-white font-semibold mb-2">The ×i Mechanism</h3>
        <div className="text-gray-300 text-sm space-y-2">
          <p>
            <span className="text-blue-400 font-bold">Q1</span>'s tube radius <span className="text-pink-400 font-bold">r₁ = {r1}</span> defines the "thickness" of sensation.
          </p>
          <p>
            Multiplying by <span className="text-pink-400 font-bold">i</span> = 90° rotation into a perpendicular plane.
          </p>
          <p>
            <span className="text-pink-400 font-bold">Q2</span> emerges <em>inside</em> that tube, using <span className="text-pink-400 font-bold">r₁</span> as its new context <span className="text-pink-400 font-bold">R₂</span>.
          </p>
          <p className="text-gray-500 pt-2 border-t border-gray-700">
            The tube of each level becomes the universe for the next. Each ×i is an emergence into nested reality.
          </p>
        </div>
      </div>
    </div>
  );
}
