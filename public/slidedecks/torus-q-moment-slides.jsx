import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TorusQMomentSlides() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const totalSlides = 8;
  
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  
  // Reusable torus wireframe generator
  const generateTorusWireframe = (R, r, rotX = 0.5, rotY = 0.3, numToroidal = 8, numPoloidal = 16) => {
    const project = (x, y, z) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      const scale = 300 / (300 + z2);
      return { x: x1 * scale, y: -y1 * scale, z: z2 };
    };
    
    const toroidalCircles = [];
    for (let i = 0; i < numToroidal; i++) {
      const theta = (i / numToroidal) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 48; j++) {
        const phi = (j / 48) * 2 * Math.PI;
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        pts.push(project(x, y, z));
      }
      toroidalCircles.push(pts);
    }
    
    const poloidalCircles = [];
    for (let i = 0; i < numPoloidal; i++) {
      const phi = (i / numPoloidal) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 24; j++) {
        const theta = (j / 24) * 2 * Math.PI;
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        pts.push(project(x, y, z));
      }
      poloidalCircles.push(pts);
    }
    
    return { toroidalCircles, poloidalCircles, project };
  };
  
  const pointsToPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Slide 1: Multiplication by i in complex plane
  const Slide1 = () => (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Multiplication by i: 90° Rotation</h2>
      <svg viewBox="-220 -220 440 440" className="w-96 h-96">
        {/* Axes */}
        <line x1="-200" y1="0" x2="200" y2="0" stroke="#666" strokeWidth="1" />
        <line x1="0" y1="-200" x2="0" y2="200" stroke="#666" strokeWidth="1" />
        <text x="185" y="25" fill="#888" fontSize="14">Re</text>
        <text x="15" y="-185" fill="#888" fontSize="14">Im</text>
        
        {/* Unit circle */}
        <circle cx="0" cy="0" r="120" fill="none" stroke="#444" strokeWidth="2" />
        
        {/* Points on unit circle */}
        <circle cx="120" cy="0" r="12" fill="#44ff44" />
        <text x="155" y="8" fill="#44ff44" fontSize="18" fontWeight="bold">1</text>
        
        <circle cx="0" cy="-120" r="12" fill="#ff44ff" />
        <text x="18" y="-145" fill="#ff44ff" fontSize="18" fontWeight="bold">i</text>
        
        <circle cx="-120" cy="0" r="12" fill="#ffd700" />
        <text x="-175" y="8" fill="#ffd700" fontSize="18" fontWeight="bold">-1</text>
        
        <circle cx="0" cy="120" r="12" fill="#44ffff" />
        <text x="18" y="160" fill="#44ffff" fontSize="18" fontWeight="bold">-i</text>
        
        {/* Rotation arrows */}
        <path d="M 100 -40 A 100 100 0 0 0 40 -100" fill="none" stroke="#ff6666" strokeWidth="3" markerEnd="url(#arrowhead)" />
        <path d="M -40 -100 A 100 100 0 0 0 -100 -40" fill="none" stroke="#ff6666" strokeWidth="3" markerEnd="url(#arrowhead)" />
        <path d="M -100 40 A 100 100 0 0 0 -40 100" fill="none" stroke="#ff6666" strokeWidth="3" markerEnd="url(#arrowhead)" />
        <path d="M 40 100 A 100 100 0 0 0 100 40" fill="none" stroke="#ff6666" strokeWidth="3" markerEnd="url(#arrowhead)" />
        
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff6666" />
          </marker>
        </defs>
        
        {/* ×i Labels - positioned further out */}
        <text x="90" y="-90" fill="#ff6666" fontSize="14" fontWeight="bold">×i</text>
        <text x="-105" y="-90" fill="#ff6666" fontSize="14" fontWeight="bold">×i</text>
        <text x="-105" y="100" fill="#ff6666" fontSize="14" fontWeight="bold">×i</text>
        <text x="90" y="100" fill="#ff6666" fontSize="14" fontWeight="bold">×i</text>
      </svg>
      <div className="mt-4 text-gray-300 text-center max-w-lg">
        <p className="mb-2"><strong>z × i</strong> rotates z by 90° counterclockwise (τ/4 = π/2)</p>
        <p>1 → i → -1 → -i → 1 (returns after 4 rotations: i⁴ = 1)</p>
      </div>
    </div>
  );
  
  // Slide 2: Q-Moment mapping
  const Slide2 = () => (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Q-Moments as Quadrants</h2>
      <svg viewBox="-200 -200 400 400" className="w-96 h-96">
        {/* Quadrant fills */}
        <path d="M 0 0 L 150 0 A 150 150 0 0 0 0 -150 Z" fill="rgba(68, 255, 68, 0.2)" />
        <path d="M 0 0 L 0 -150 A 150 150 0 0 0 -150 0 Z" fill="rgba(255, 68, 255, 0.2)" />
        <path d="M 0 0 L -150 0 A 150 150 0 0 0 0 150 Z" fill="rgba(255, 215, 0, 0.2)" />
        <path d="M 0 0 L 0 150 A 150 150 0 0 0 150 0 Z" fill="rgba(68, 255, 255, 0.2)" />
        
        {/* Axes */}
        <line x1="-180" y1="0" x2="180" y2="0" stroke="#666" strokeWidth="2" />
        <line x1="0" y1="-180" x2="0" y2="180" stroke="#666" strokeWidth="2" />
        
        {/* Unit circle */}
        <circle cx="0" cy="0" r="150" fill="none" stroke="#888" strokeWidth="2" />
        
        {/* Quadrant labels */}
        <text x="65" y="-70" fill="#44ff44" fontSize="18" fontWeight="bold">Q1</text>
        <text x="40" y="-45" fill="#44ff44" fontSize="12">[sensation]</text>
        
        <text x="-95" y="-70" fill="#ff44ff" fontSize="18" fontWeight="bold">Q2</text>
        <text x="-115" y="-45" fill="#ff44ff" fontSize="12">(perception)</text>
        
        <text x="-90" y="70" fill="#ffd700" fontSize="18" fontWeight="bold">Q3</text>
        <text x="-100" y="92" fill="#ffd700" fontSize="12">{"{thought}"}</text>
        
        <text x="50" y="70" fill="#44ffff" fontSize="18" fontWeight="bold">Q4</text>
        <text x="22" y="92" fill="#44ffff" fontSize="12">"representation"</text>
        
        {/* Emergent direction */}
        <path d="M 120 -30 A 120 120 0 0 0 30 -120" fill="none" stroke="#ff6666" strokeWidth="4" markerEnd="url(#arrowhead2)" />
        <text x="100" y="-95" fill="#ff6666" fontSize="14" fontWeight="bold">×i</text>
        <text x="80" y="-115" fill="#ff6666" fontSize="10">emergent</text>
        
        <defs>
          <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff6666" />
          </marker>
        </defs>
      </svg>
      <div className="mt-4 text-gray-300 text-center max-w-lg">
        <p className="mb-2"><strong>×i</strong>: Q1 → Q2 → Q3 → Q4 (emergent, upward)</p>
        <p><strong>×(-i)</strong>: Q4 → Q3 → Q2 → Q1 (reflective, downward)</p>
      </div>
    </div>
  );
  
  // Slide 3: Direction matters - arrival path
  const Slide3 = () => (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Arrival Direction Matters</h2>
      <div className="flex gap-8">
        <svg viewBox="-180 -180 360 360" className="w-80 h-80">
          <text x="0" y="-155" fill="#44ff44" fontSize="16" fontWeight="bold" textAnchor="middle">External Source</text>
          
          {/* Circle */}
          <circle cx="0" cy="0" r="100" fill="none" stroke="#555" strokeWidth="2" />
          
          {/* Q1 highlighted */}
          <path d="M 0 0 L 100 0 A 100 100 0 0 0 0 -100 Z" fill="rgba(68, 255, 68, 0.3)" />
          <circle cx="55" cy="-55" r="20" fill="#44ff44" />
          <text x="55" y="-50" fill="#000" fontSize="14" fontWeight="bold" textAnchor="middle">Q1</text>
          
          {/* External arrow coming IN to Q1 - rendered after Q1 so it's on top */}
          <line x1="160" y1="0" x2="115" y2="0" stroke="#44ff44" strokeWidth="3" markerEnd="url(#arrow3)" />
          
          {/* [mouse] label - rendered last so it's on top of everything */}
          <text x="158" y="-15" fill="#44ff44" fontSize="14" fontWeight="bold" textAnchor="middle">[mouse]</text>
          
          {/* Label */}
          <text x="0" y="130" fill="#ccc" fontSize="13" textAnchor="middle">Cat sees actual mouse</text>
          <text x="0" y="150" fill="#888" fontSize="11" textAnchor="middle">Arrived via ×i from reality</text>
          
          <defs>
            <marker id="arrow3" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#44ff44" />
            </marker>
          </defs>
        </svg>
        
        <svg viewBox="-180 -180 360 360" className="w-80 h-80">
          <text x="0" y="-155" fill="#ff44ff" fontSize="16" fontWeight="bold" textAnchor="middle">Internal Source</text>
          
          {/* Circle */}
          <circle cx="0" cy="0" r="100" fill="none" stroke="#555" strokeWidth="2" />
          
          {/* Arrow from Q3 to Q1 along the circle arc (clockwise, the long way via Q4) */}
          <path d="M -71 71 A 100 100 0 1 1 71 -71" fill="none" stroke="#ff44ff" strokeWidth="3" strokeDasharray="8,4" markerEnd="url(#arrow3b)" />
          
          {/* Q1 highlighted */}
          <path d="M 0 0 L 100 0 A 100 100 0 0 0 0 -100 Z" fill="rgba(255, 68, 255, 0.3)" />
          <circle cx="55" cy="-55" r="20" fill="#ff44ff" />
          <text x="55" y="-50" fill="#000" fontSize="14" fontWeight="bold" textAnchor="middle">Q1</text>
          
          {/* Q3 source */}
          <circle cx="-55" cy="55" r="14" fill="#ffd700" opacity="0.9" />
          <text x="-55" y="60" fill="#000" fontSize="10" fontWeight="bold" textAnchor="middle">Q3</text>
          
          {/* {mouse} label beside Q3 */}
          <text x="-110" y="60" fill="#ffd700" fontSize="14" fontWeight="bold" textAnchor="middle">{"{mouse}"}</text>
          
          {/* ×(-i) labels */}
          <text x="120" y="50" fill="#ff44ff" fontSize="12" fontWeight="bold">×(-i)</text>
          <text x="120" y="70" fill="#ff44ff" fontSize="12" fontWeight="bold">×(-i)</text>
          
          {/* Label */}
          <text x="0" y="130" fill="#ccc" fontSize="13" textAnchor="middle">Cat imagines mouse</text>
          <text x="0" y="150" fill="#888" fontSize="11" textAnchor="middle">Arrived via ×(-i) from thought</text>
          
          <defs>
            <marker id="arrow3b" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ff44ff" />
            </marker>
          </defs>
        </svg>
      </div>
      <div className="mt-4 text-gray-300 text-center max-w-lg">
        <p>Same quadrant (Q1), different phenomenology based on <strong>how you got there</strong></p>
      </div>
    </div>
  );
  
  // Slide 4: Torus construction basics
  const Slide4 = () => {
    const R = 80;
    const r = 35;
    const { toroidalCircles, poloidalCircles, project } = generateTorusWireframe(R, r, 0.5, 0.3, 8, 16);
    
    // Highlighted major circle (R) - center path
    const majorCirclePts = [];
    for (let j = 0; j <= 48; j++) {
      const phi = (j / 48) * 2 * Math.PI;
      const cosY = Math.cos(0.3), sinY = Math.sin(0.3);
      const cosX = Math.cos(0.5), sinX = Math.sin(0.5);
      const x = R * Math.cos(phi), y = R * Math.sin(phi), z = 0;
      let x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
      const scale = 300 / (300 + z2);
      majorCirclePts.push({ x: x1 * scale, y: -y1 * scale });
    }
    
    // Highlighted minor circle (r) at phi=0
    const minorCirclePts = [];
    for (let j = 0; j <= 24; j++) {
      const theta = (j / 24) * 2 * Math.PI;
      const cosY = Math.cos(0.3), sinY = Math.sin(0.3);
      const cosX = Math.cos(0.5), sinX = Math.sin(0.5);
      const x = (R + r * Math.cos(theta)), y = 0, z = r * Math.sin(theta);
      let x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
      const scale = 300 / (300 + z2);
      minorCirclePts.push({ x: x1 * scale, y: -y1 * scale });
    }
    
    // URL for interactive version
    const interactiveUrl = "https://claude.ai/public/artifacts/3fb15965-41b7-4e1b-a5fb-a9b1244415e2";
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-6">Torus Construction: Two Circles</h2>
        <svg viewBox="-180 -140 360 280" className="w-full max-w-xl h-80">
          {/* Wireframe - toroidal circles */}
          {toroidalCircles.map((pts, i) => (
            <path key={`tor-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.35" />
          ))}
          {/* Wireframe - poloidal circles */}
          {poloidalCircles.map((pts, i) => (
            <path key={`pol-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.35" />
          ))}
          
          {/* Highlighted major circle (R) - dashed red */}
          <path d={pointsToPath(majorCirclePts)} fill="none" stroke="#ff6666" strokeWidth="2.5" strokeDasharray="6,4" />
          
          {/* Highlighted minor circle (r) - solid green */}
          <path d={pointsToPath(minorCirclePts)} fill="none" stroke="#44ff44" strokeWidth="3" />
          
          {/* Center point */}
          <circle cx={project(0,0,0).x} cy={project(0,0,0).y} r="4" fill="#fff" />
          
          {/* Labels */}
          <text x="-160" y="-100" fill="#ff6666" fontSize="13" fontWeight="bold">R (major radius)</text>
          <text x="-160" y="-85" fill="#ff6666" fontSize="11">path of rotation</text>
          
          <text x="-160" y="-60" fill="#44ff44" fontSize="13" fontWeight="bold">r (minor radius)</text>
          <text x="-160" y="-45" fill="#44ff44" fontSize="11">generating circle</text>
        </svg>
        <div className="mt-4 text-gray-300 text-center max-w-lg space-y-2">
          <p><strong className="text-green-400">Minor circle</strong> (radius r): The generating manifold</p>
          <p><strong className="text-red-400">Major circle</strong> (radius R): The path of rotation</p>
          <p>The minor circle's center traces the major circle</p>
        </div>
        
        {/* Link to interactive version */}
        <a 
          href={interactiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <span>Try Interactive Version</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  };
  
  // Slide 5: R/r relationship - what topology results
  const Slide5 = () => {
    // Generate different torus types
    const ringTorus = generateTorusWireframe(50, 20, 0.5, 0.2, 6, 12);
    const hornTorus = generateTorusWireframe(30, 30, 0.5, 0.2, 6, 12);
    const spindleTorus = generateTorusWireframe(15, 40, 0.5, 0.2, 6, 12);
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-4">R/r Ratio Determines Topology</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Ring torus R > r */}
          <div className="flex flex-col items-center">
            <svg viewBox="-90 -70 180 140" className="w-44 h-32">
              {ringTorus.toroidalCircles.map((pts, i) => (
                <path key={`rt-${i}`} d={pointsToPath(pts)} fill="none" stroke="#44ff44" strokeWidth="0.8" opacity="0.5" />
              ))}
              {ringTorus.poloidalCircles.map((pts, i) => (
                <path key={`rp-${i}`} d={pointsToPath(pts)} fill="none" stroke="#44ff44" strokeWidth="0.8" opacity="0.4" />
              ))}
            </svg>
            <p className="text-green-400 font-bold text-sm">Ring: R &gt; r</p>
            <p className="text-gray-400 text-xs">Distinct hole, levels separate</p>
          </div>
          
          {/* Horn torus R = r */}
          <div className="flex flex-col items-center">
            <svg viewBox="-90 -70 180 140" className="w-44 h-32">
              {hornTorus.toroidalCircles.map((pts, i) => (
                <path key={`ht-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ffd700" strokeWidth="0.8" opacity="0.5" />
              ))}
              {hornTorus.poloidalCircles.map((pts, i) => (
                <path key={`hp-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ffd700" strokeWidth="0.8" opacity="0.4" />
              ))}
              <circle cx="0" cy={hornTorus.project(0, 0, 0).y} r="2" fill="#ffd700" />
            </svg>
            <p className="text-yellow-400 font-bold text-sm">Horn: R = r</p>
            <p className="text-gray-400 text-xs">Hole → point, tangent</p>
          </div>
          
          {/* Spindle torus R < r */}
          <div className="flex flex-col items-center">
            <svg viewBox="-90 -70 180 140" className="w-44 h-32">
              {spindleTorus.toroidalCircles.map((pts, i) => (
                <path key={`st-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff6666" strokeWidth="0.8" opacity="0.5" />
              ))}
              {spindleTorus.poloidalCircles.map((pts, i) => (
                <path key={`sp-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff6666" strokeWidth="0.8" opacity="0.4" />
              ))}
            </svg>
            <p className="text-red-400 font-bold text-sm">Spindle: R &lt; r</p>
            <p className="text-gray-400 text-xs">Self-intersecting, overlap</p>
          </div>
          
          {/* Sphere R = 0 */}
          <div className="flex flex-col items-center">
            <svg viewBox="-90 -70 180 140" className="w-44 h-32">
              <circle cx="0" cy="0" r="40" fill="none" stroke="#4a9eff" strokeWidth="1.5" />
              <ellipse cx="0" cy="0" rx="40" ry="14" fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.5" />
              <ellipse cx="0" cy="0" rx="14" ry="40" fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.5" />
              <ellipse cx="0" cy="0" rx="40" ry="14" fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.3" transform="rotate(45)" />
              <ellipse cx="0" cy="0" rx="40" ry="14" fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.3" transform="rotate(-45)" />
            </svg>
            <p className="text-blue-400 font-bold text-sm">Sphere: R = 0</p>
            <p className="text-gray-400 text-xs">No separation, collapse</p>
          </div>
        </div>
        <div className="mt-3 text-gray-300 text-center max-w-lg text-sm">
          <p><strong>R &gt; 0</strong>: Emergent levels maintain distinct identity</p>
          <p><strong>R = 0</strong>: No distinction between Q-moments</p>
        </div>
      </div>
    );
  };
  
  // Slide 6: Four-fold nesting - nested tori
  const Slide6 = () => {
    // Generate nested tori wireframes
    const r1 = 70, r2 = 40, r3 = 22, r4 = 12;
    const R1 = r1, R2 = r1 * 0.45, R3 = r2 * 0.45, R4 = r3 * 0.45;
    
    const rotX = 0.5, rotY = 0.3;
    
    const torus1 = generateTorusWireframe(R1, r1 * 0.35, rotX, rotY, 10, 20);
    const torus2 = generateTorusWireframe(R2, r2 * 0.4, rotX, rotY, 8, 16);
    const torus3 = generateTorusWireframe(R3, r3 * 0.45, rotX, rotY, 6, 12);
    const torus4 = generateTorusWireframe(R4, r4 * 0.5, rotX, rotY, 5, 10);
    
    const interactiveUrl = "https://claude.ai/public/artifacts/d820fc65-3918-4440-bcd6-2eaf29e15728";
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-4">Four-Fold Nested Structure</h2>
        <div className="flex gap-6 items-center">
          <svg viewBox="-140 -110 280 220" className="w-80 h-64">
            {/* Q1 - Blue (outermost) */}
            {torus1.toroidalCircles.map((pts, i) => (
              <path key={`t1-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="0.8" opacity="0.35" />
            ))}
            {torus1.poloidalCircles.map((pts, i) => (
              <path key={`p1-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="0.6" opacity="0.25" />
            ))}
            
            {/* Q2 - Magenta */}
            {torus2.toroidalCircles.map((pts, i) => (
              <path key={`t2-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff44ff" strokeWidth="0.9" opacity="0.45" />
            ))}
            {torus2.poloidalCircles.map((pts, i) => (
              <path key={`p2-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff44ff" strokeWidth="0.7" opacity="0.35" />
            ))}
            
            {/* Q3 - Green */}
            {torus3.toroidalCircles.map((pts, i) => (
              <path key={`t3-${i}`} d={pointsToPath(pts)} fill="none" stroke="#44ff44" strokeWidth="1" opacity="0.55" />
            ))}
            {torus3.poloidalCircles.map((pts, i) => (
              <path key={`p3-${i}`} d={pointsToPath(pts)} fill="none" stroke="#44ff44" strokeWidth="0.8" opacity="0.45" />
            ))}
            
            {/* Q4 - Yellow (innermost) */}
            {torus4.toroidalCircles.map((pts, i) => (
              <path key={`t4-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ffd700" strokeWidth="1.2" opacity="0.7" />
            ))}
            {torus4.poloidalCircles.map((pts, i) => (
              <path key={`p4-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.6" />
            ))}
            
            {/* Center point */}
            <circle cx="0" cy="0" r="3" fill="#fff" />
          </svg>
          
          {/* Legend */}
          <div className="flex flex-col justify-center space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#4a9eff'}}></div>
              <span style={{color: '#4a9eff'}}>Q1: [sensation]</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#ff44ff'}}></div>
              <span style={{color: '#ff44ff'}}>Q2: (perception)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#44ff44'}}></div>
              <span style={{color: '#44ff44'}}>Q3: {'{thought}'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#ffd700'}}></div>
              <span style={{color: '#ffd700'}}>Q4: "representation"</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-gray-300 text-center max-w-lg">
          <p>Each <strong className="text-purple-400">×i</strong> creates transition to nested manifold</p>
          <p className="text-sm mt-2 text-gray-400">r of outer level → R context of inner level</p>
        </div>
        
        {/* Link to interactive version */}
        <a 
          href={interactiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <span>Try Interactive Version</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  };
  
  // Slide 7: ×i Transition Mechanism
  const Slide7 = () => {
    // Q1 torus parameters
    const R1 = 80;
    const r1 = 30;
    const tubeRatio = 0.4;
    const R2 = r1 * 0.8;  // Q2's major radius derived from r1
    const r2 = R2 * tubeRatio;
    
    const rotX = 0.5, rotY = 0.3;
    const cx = 0, cy = 0;
    
    // Generate torus with transform support
    const generateTransformedTorus = (R, r, numT, numP, transform = null) => {
      const toroidalCircles = [];
      const poloidalCircles = [];
      
      const applyTransform = (x, y, z) => {
        if (!transform) return { x, y, z };
        let tx = x, ty = y, tz = z;
        if (transform.rotateAxis === 'x') {
          const cos = Math.cos(transform.rotateAngle);
          const sin = Math.sin(transform.rotateAngle);
          const newY = ty * cos - tz * sin;
          const newZ = ty * sin + tz * cos;
          ty = newY; tz = newZ;
        }
        tx += transform.offsetX || 0;
        ty += transform.offsetY || 0;
        tz += transform.offsetZ || 0;
        return { x: tx, y: ty, z: tz };
      };
      
      const project = (x, y, z) => {
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        const scale = 300 / (300 + z2);
        return { x: cx + x1 * scale, y: cy - y1 * scale };
      };
      
      for (let i = 0; i < numT; i++) {
        const theta = (i / numT) * Math.PI * 2;
        const circle = [];
        for (let j = 0; j <= numP; j++) {
          const phi = (j / numP) * Math.PI * 2;
          const x = (R + r * Math.cos(phi)) * Math.cos(theta);
          const y = r * Math.sin(phi);
          const z = (R + r * Math.cos(phi)) * Math.sin(theta);
          const t = applyTransform(x, y, z);
          circle.push(project(t.x, t.y, t.z));
        }
        toroidalCircles.push(circle);
      }
      
      for (let j = 0; j < numP; j++) {
        const phi = (j / numP) * Math.PI * 2;
        const circle = [];
        for (let i = 0; i <= numT; i++) {
          const theta = (i / numT) * Math.PI * 2;
          const x = (R + r * Math.cos(phi)) * Math.cos(theta);
          const y = r * Math.sin(phi);
          const z = (R + r * Math.cos(phi)) * Math.sin(theta);
          const t = applyTransform(x, y, z);
          circle.push(project(t.x, t.y, t.z));
        }
        poloidalCircles.push(circle);
      }
      
      return { toroidalCircles, poloidalCircles };
    };
    
    // Q1 torus (no transform)
    const q1 = generateTransformedTorus(R1, r1, 12, 18);
    
    // Q2 torus (transformed: offset to R1, rotated 90° around X)
    const q2Transform = {
      offsetX: R1, offsetY: 0, offsetZ: 0,
      rotateAxis: 'x', rotateAngle: Math.PI / 2
    };
    const q2 = generateTransformedTorus(R2, r2, 10, 14, q2Transform);
    
    // Highlight ring at tube cross-section (theta = 0)
    const highlightRing = [];
    for (let j = 0; j <= 32; j++) {
      const phi = (j / 32) * Math.PI * 2;
      const x = (R1 + r1 * Math.cos(phi));
      const y = r1 * Math.sin(phi);
      const z = 0;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      const scale = 300 / (300 + z2);
      highlightRing.push({ x: cx + x1 * scale, y: cy - y1 * scale });
    }
    
    const interactiveUrl = "https://claude.ai/public/artifacts/bc02edab-acd8-40bd-8f33-7f01cb39e9a9";
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-4">×i Transition: Level Emergence</h2>
        <div className="flex gap-4 items-start">
          <svg viewBox="-140 -100 280 200" className="w-96 h-64">
            {/* Q1 Torus - Blue */}
            {q1.toroidalCircles.map((pts, i) => (
              <path key={`t1-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="0.8" opacity="0.4" />
            ))}
            {q1.poloidalCircles.map((pts, i) => (
              <path key={`p1-${i}`} d={pointsToPath(pts)} fill="none" stroke="#4a9eff" strokeWidth="0.5" opacity="0.25" />
            ))}
            
            {/* Highlight ring - tube cross-section */}
            <path d={pointsToPath(highlightRing)} fill="none" stroke="#ff44ff" strokeWidth="2" opacity="0.9" />
            
            {/* Q2 Torus - Magenta (inside tube) */}
            {q2.toroidalCircles.map((pts, i) => (
              <path key={`t2-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff44ff" strokeWidth="1" opacity="0.7" />
            ))}
            {q2.poloidalCircles.map((pts, i) => (
              <path key={`p2-${i}`} d={pointsToPath(pts)} fill="none" stroke="#ff44ff" strokeWidth="0.7" opacity="0.5" />
            ))}
            
            {/* Labels */}
            <text x="-100" y="-70" fill="#4a9eff" fontSize="11" fontWeight="bold">Q1</text>
            <text x="95" y="15" fill="#ff44ff" fontSize="11" fontWeight="bold">Q2</text>
            
            {/* ×i indicator */}
            <text x="50" y="-60" fill="#ff44ff" fontSize="16" fontWeight="bold" fontFamily="serif">×i</text>
            <text x="50" y="-45" fill="#888" fontSize="8">90°</text>
          </svg>
          
          {/* Explanation */}
          <div className="flex flex-col justify-center space-y-3 text-sm max-w-48">
            <div className="border-l-2 border-blue-500 pl-2">
              <span className="text-blue-400 font-bold">Q1</span>
              <span className="text-gray-400"> tube radius </span>
              <span className="text-pink-400 font-bold">r₁</span>
            </div>
            <div className="text-gray-500 text-center">↓ ×i</div>
            <div className="border-l-2 border-pink-500 pl-2">
              <span className="text-pink-400 font-bold">Q2</span>
              <span className="text-gray-400"> context </span>
              <span className="text-pink-400 font-bold">R₂ = r₁</span>
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
              <p className="text-gray-300">r<sub>n</sub> → R<sub>n+1</sub></p>
              <p className="text-gray-500">tube becomes context</p>
            </div>
          </div>
        </div>
        
        <p className="mt-3 text-gray-400 text-sm text-center max-w-md">
          Each <strong className="text-pink-400">×i</strong> rotates 90° into the tube, where the tube radius becomes the new major radius
        </p>
        
        {/* Link to interactive version */}
        <a 
          href={interactiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <span>Try Interactive Version</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  };
  
  // Slide 8: Synthesis - e^(iθ) connection
  const Slide8 = () => (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Synthesis: e^(iθ) and Emergence</h2>
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg">
        <div className="space-y-4 text-gray-300">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="font-mono text-lg">e^(iπ/2) = i</p>
            <p className="text-sm text-gray-400">Quarter turn = one emergent level</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="font-mono text-lg">e^(iπ) = -1</p>
            <p className="text-sm text-gray-400">Half turn = two emergent levels</p>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-mono text-lg">e^(i3π/2) = -i</p>
            <p className="text-sm text-gray-400">Three-quarter turn = three levels</p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-mono text-lg">e^(iτ) = e^(i2π) = 1</p>
            <p className="text-sm text-gray-400">Full cycle = return to unity (containing all)</p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-600">
            <p className="text-center font-bold text-lg">
              (e^(iτ/4))⁴ = i⁴ = 1
            </p>
            <p className="text-center text-sm text-gray-400 mt-2">
              Each power of i is a complete Q-moment.<br/>
              The product returns to unity — but a unity<br/>
              that now contains all four as structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];
  const slideNames = [
    "1. ×i as 90° Rotation",
    "2. Q-Moments as Quadrants", 
    "3. Arrival Direction",
    "4. Torus Construction",
    "5. R/r Topology",
    "6. Four-Fold Nesting",
    "7. Clifford Torus",
    "8. Synthesis"
  ];
  
  const CurrentSlide = slides[currentSlide];
  
  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      {/* Home button */}
      <Link
        to="/"
        className="absolute top-4 left-4 px-4 py-2 bg-gray-800 border border-gray-600 text-gray-400 rounded-lg text-sm hover:border-purple-500 hover:text-purple-300 transition-all z-10"
      >
        ← XQ Gallery
      </Link>
      
      <h1 className="text-xl font-bold text-white text-center mb-2">
        Torus Geometry & Q-Moment Emergence
      </h1>
      <p className="text-gray-500 text-sm text-center mb-4">
        Multiplication by i as Emergent Level Transition
      </p>
      
      {/* Slide selector */}
      <div className="flex flex-wrap justify-center gap-1 mb-4">
        {slideNames.map((name, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`px-2 py-1 text-xs rounded transition-all ${
              currentSlide === idx 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      
      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center bg-gray-800 rounded-lg p-6 min-h-96">
        <CurrentSlide />
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={prevSlide}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-all"
        >
          ← Previous
        </button>
        
        <span className="text-gray-400 text-sm">
          {slideNames[currentSlide]}
        </span>
        
        <button
          onClick={nextSlide}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
