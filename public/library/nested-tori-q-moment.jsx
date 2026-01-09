import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function NestedToriInteractive() {
  // Four nested tori - Q1 outermost to Q4 innermost
  const [r1, setR1] = useState(120); // Q1 - largest, outermost
  const [r2, setR2] = useState(60);  // Q2
  const [r3, setR3] = useState(30);  // Q3
  const [r4, setR4] = useState(15);  // Q4 - smallest, innermost
  
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  
  const [showQ1, setShowQ1] = useState(true);
  const [showQ2, setShowQ2] = useState(true);
  const [showQ3, setShowQ3] = useState(true);
  const [showQ4, setShowQ4] = useState(true);
  const [showMajorCircles, setShowMajorCircles] = useState(true);
  
  // NEW: Toggle between nesting modes
  const [nestingMode, setNestingMode] = useState('common'); // 'common' or 'true'
  
  const canvasRef = useRef(null);

  const width = 700;
  const height = 700;
  const centerX = width / 2;
  const centerY = height / 2;

  // 3D to 2D projection with rotation
  const project = useCallback((x, y, z) => {
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    
    const scale = 500 / (500 + z2);
    return {
      x: centerX + x1 * scale,
      y: centerY - y1 * scale,
      z: z2,
      scale
    };
  }, [rotation, centerX, centerY]);

  // Generate torus wireframe with full transform: offset position and rotation
  // For true nesting: each level rotates 90° and positions on parent's tube
  const generateTorusWireframe = useCallback((R, r, transform = null, numToroidal = 12, numPoloidal = 24) => {
    const toroidalCircles = [];
    const poloidalCircles = [];
    
    // Default transform: identity
    const xform = transform || { 
      offsetX: 0, offsetY: 0, offsetZ: 0,
      rotateAxis: 'none', rotateAngle: 0
    };
    
    // Apply rotation around an axis, then translate
    const applyTransform = (x, y, z) => {
      let nx = x, ny = y, nz = z;
      
      // Rotate around specified axis
      if (xform.rotateAxis === 'x') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        ny = y * cos - z * sin;
        nz = y * sin + z * cos;
      } else if (xform.rotateAxis === 'y') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        nx = x * cos + z * sin;
        nz = -x * sin + z * cos;
      } else if (xform.rotateAxis === 'z') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        nx = x * cos - y * sin;
        ny = x * sin + y * cos;
      }
      
      // Translate
      return {
        x: nx + xform.offsetX,
        y: ny + xform.offsetY,
        z: nz + xform.offsetZ
      };
    };
    
    // Toroidal circles (around the hole)
    for (let i = 0; i < numToroidal; i++) {
      const theta = (i / numToroidal) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 48; j++) {
        const phi = (j / 48) * 2 * Math.PI;
        // Standard torus parametric equations
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        const transformed = applyTransform(x, y, z);
        pts.push(project(transformed.x, transformed.y, transformed.z));
      }
      toroidalCircles.push(pts);
    }
    
    // Poloidal circles (around the tube)
    for (let i = 0; i < numPoloidal; i++) {
      const phi = (i / numPoloidal) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 32; j++) {
        const theta = (j / 32) * 2 * Math.PI;
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        const transformed = applyTransform(x, y, z);
        pts.push(project(transformed.x, transformed.y, transformed.z));
      }
      poloidalCircles.push(pts);
    }
    
    return { toroidalCircles, poloidalCircles };
  }, [project]);

  // Generate major circle (R path) with transform
  const generateMajorCircle = useCallback((R, transform = null) => {
    const xform = transform || { offsetX: 0, offsetY: 0, offsetZ: 0, rotateAxis: 'none', rotateAngle: 0 };
    
    const applyTransform = (x, y, z) => {
      let nx = x, ny = y, nz = z;
      if (xform.rotateAxis === 'x') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        ny = y * cos - z * sin;
        nz = y * sin + z * cos;
      } else if (xform.rotateAxis === 'y') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        nx = x * cos + z * sin;
        nz = -x * sin + z * cos;
      } else if (xform.rotateAxis === 'z') {
        const cos = Math.cos(xform.rotateAngle);
        const sin = Math.sin(xform.rotateAngle);
        nx = x * cos - y * sin;
        ny = x * sin + y * cos;
      }
      return { x: nx + xform.offsetX, y: ny + xform.offsetY, z: nz + xform.offsetZ };
    };
    
    const pts = [];
    for (let j = 0; j <= 48; j++) {
      const phi = (j / 48) * 2 * Math.PI;
      const transformed = applyTransform(R * Math.cos(phi), R * Math.sin(phi), 0);
      pts.push(project(transformed.x, transformed.y, transformed.z));
    }
    return pts;
  }, [project]);

  // Draw path from points
  const drawPath = (ctx, pts, color, lineWidth, dash = []) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw torus wireframe
  const drawTorus = (ctx, R, r, wireColor, majorColor, opacity, transform = null, numT = 10, numP = 20) => {
    const { toroidalCircles, poloidalCircles } = generateTorusWireframe(R, r, transform, numT, numP);
    
    // Draw wireframe
    ctx.globalAlpha = opacity;
    toroidalCircles.forEach(pts => drawPath(ctx, pts, wireColor, 1));
    poloidalCircles.forEach(pts => drawPath(ctx, pts, wireColor, 0.8));
    ctx.globalAlpha = 1;
    
    // Draw major circle if enabled
    if (showMajorCircles && R > 0) {
      const majorPts = generateMajorCircle(R, transform);
      drawPath(ctx, majorPts, majorColor, 2, [6, 3]);
    }
  };

  // Draw the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    if (nestingMode === 'common') {
      // COMMON CENTER MODE: All tori share the same center
      const R1 = r1;
      const R2 = r1 * 0.5;
      const R3 = r2 * 0.5;
      const R4 = r3 * 0.5;
      
      if (showQ1) drawTorus(ctx, R1, r1 * 0.4, 'rgba(74, 158, 255, 0.35)', '#4a9eff', 0.4, null, 12, 24);
      if (showQ2) drawTorus(ctx, R2, r2 * 0.5, 'rgba(255, 68, 255, 0.4)', '#ff44ff', 0.5, null, 10, 20);
      if (showQ3) drawTorus(ctx, R3, r3 * 0.6, 'rgba(68, 255, 68, 0.5)', '#44ff44', 0.6, null, 8, 16);
      if (showQ4) drawTorus(ctx, R4, r4 * 0.7, 'rgba(255, 215, 0, 0.6)', '#ffd700', 0.7, null, 6, 12);
      
    } else {
      // TRUE NESTING MODE: Each inner torus is centered on the tube of the outer
      // AND rotated 90° so it sits perpendicular inside the tube
      
      const tubeRatio = 0.4;
      const PI_2 = Math.PI / 2;
      
      // Q1 - at origin, in XY plane (standard orientation)
      // Tube at (R1, 0, 0) has axis in Y direction (tangent to major circle)
      const R1 = r1;
      const tube1 = r1 * tubeRatio;
      const transform1 = null; // Identity - no transform
      
      // Q2 - centered on Q1's tube (at x = R1), rotated 90° around X axis
      // This puts Q2's major circle in XZ plane, perpendicular to Q1's tube axis (Y)
      const R2 = r2;
      const tube2 = r2 * tubeRatio;
      const transform2 = {
        offsetX: R1, offsetY: 0, offsetZ: 0,
        rotateAxis: 'x', rotateAngle: PI_2
      };
      
      // Q3 - centered on Q2's tube
      // Q2 is at (R1, 0, 0) in XZ plane. Point on Q2's major circle at z=R2: (R1, 0, R2)
      // Q2's tube axis there is tangent to XZ circle = -X direction
      // So Q3 rotates around Y to have its major circle in YZ plane (perpendicular to X)
      const R3 = r3;
      const tube3 = r3 * tubeRatio;
      const transform3 = {
        offsetX: R1, offsetY: 0, offsetZ: R2,
        rotateAxis: 'y', rotateAngle: PI_2
      };
      
      // Q4 - centered on Q3's tube
      // Q3 is at (R1, 0, R2) in YZ plane (after Y rotation). Point at y=R3: (R1, R3, R2)
      // Q3's tube axis there is tangent to YZ circle = Z direction  
      // So Q4 needs its major circle in XY plane (perpendicular to Z) = default orientation
      const R4 = r4;
      const tube4 = r4 * tubeRatio;
      const transform4 = {
        offsetX: R1, offsetY: R3, offsetZ: R2,
        rotateAxis: 'none', rotateAngle: 0
      };
      
      if (showQ1) drawTorus(ctx, R1, tube1, 'rgba(74, 158, 255, 0.35)', '#4a9eff', 0.4, transform1, 12, 24);
      if (showQ2) drawTorus(ctx, R2, tube2, 'rgba(255, 68, 255, 0.45)', '#ff44ff', 0.5, transform2, 10, 20);
      if (showQ3) drawTorus(ctx, R3, tube3, 'rgba(68, 255, 68, 0.55)', '#44ff44', 0.6, transform3, 8, 16);
      if (showQ4) drawTorus(ctx, R4, tube4, 'rgba(255, 215, 0, 0.65)', '#ffd700', 0.7, transform4, 6, 12);
    }
    
    // Draw center point
    const center = project(0, 0, 0);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Info panel
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(10, 10, 240, 160);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, 10, 240, 160);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Nested Q-Moment Tori', 20, 32);
    
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Mode: ${nestingMode === 'common' ? 'Common Center' : 'True Nesting'}`, 20, 50);
    
    ctx.font = '11px monospace';
    if (showQ1) { ctx.fillStyle = '#4a9eff'; ctx.fillText(`Q1 [sensation]: r=${r1}`, 20, 70); }
    if (showQ2) { ctx.fillStyle = '#ff44ff'; ctx.fillText(`Q2 (perception): r=${r2}`, 20, 86); }
    if (showQ3) { ctx.fillStyle = '#44ff44'; ctx.fillText(`Q3 {thought}: r=${r3}`, 20, 102); }
    if (showQ4) { ctx.fillStyle = '#ffd700'; ctx.fillText(`Q4 "representation": r=${r4}`, 20, 118); }
    
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText('Each ×i = transition to nested level', 20, 140);
    ctx.fillText(nestingMode === 'common' ? 'All levels share origin' : 'Inner centered on outer tube', 20, 154);
    
  }, [r1, r2, r3, r4, rotation, project, generateTorusWireframe, generateMajorCircle, 
      showQ1, showQ2, showQ3, showQ4, showMajorCircles, nestingMode]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - lastMouse.x;
    const dy = y - lastMouse.y;
    setRotation(prev => ({
      x: prev.x + dy * 0.008,
      y: prev.y + dx * 0.008
    }));
    setLastMouse({ x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const ToggleButton = ({ active, onClick, children, color }) => {
    const bgColor = active ? color : '#374151';
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded font-medium transition-all text-sm ${
          active ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-600'
        }`}
        style={{ backgroundColor: active ? color : undefined }}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-1">Nested Tori: Q-Moment Levels</h1>
      <p className="text-gray-400 text-sm mb-4">×i creates transition between nested manifolds</p>
      
      {/* Nesting mode toggle */}
      <div className="flex gap-2 mb-3 p-1 bg-gray-800 rounded-lg">
        <button
          onClick={() => setNestingMode('common')}
          className={`px-4 py-2 rounded font-medium text-sm transition-all ${
            nestingMode === 'common' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Common Center
        </button>
        <button
          onClick={() => setNestingMode('true')}
          className={`px-4 py-2 rounded font-medium text-sm transition-all ${
            nestingMode === 'true' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          True Nesting
        </button>
      </div>
      
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        <ToggleButton active={showQ1} onClick={() => setShowQ1(!showQ1)} color="#4a9eff">Q1</ToggleButton>
        <ToggleButton active={showQ2} onClick={() => setShowQ2(!showQ2)} color="#ff44ff">Q2</ToggleButton>
        <ToggleButton active={showQ3} onClick={() => setShowQ3(!showQ3)} color="#44ff44">Q3</ToggleButton>
        <ToggleButton active={showQ4} onClick={() => setShowQ4(!showQ4)} color="#ffd700">Q4</ToggleButton>
        <span className="w-px bg-gray-600 mx-2"></span>
        <ToggleButton active={showMajorCircles} onClick={() => setShowMajorCircles(!showMajorCircles)} color="#9333ea">
          R circles
        </ToggleButton>
      </div>
      
      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 w-full max-w-xl">
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium" style={{color: '#4a9eff'}}>r₁ (Q1 - outermost)</label>
            <span style={{color: '#4a9eff'}} className="font-bold">{r1}</span>
          </div>
          <input
            type="range" min="40" max="150" value={r1}
            onChange={(e) => setR1(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{accentColor: '#4a9eff'}}
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium" style={{color: '#ff44ff'}}>r₂ (Q2)</label>
            <span style={{color: '#ff44ff'}} className="font-bold">{r2}</span>
          </div>
          <input
            type="range" min="20" max="100" value={r2}
            onChange={(e) => setR2(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{accentColor: '#ff44ff'}}
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium" style={{color: '#44ff44'}}>r₃ (Q3)</label>
            <span style={{color: '#44ff44'}} className="font-bold">{r3}</span>
          </div>
          <input
            type="range" min="10" max="60" value={r3}
            onChange={(e) => setR3(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{accentColor: '#44ff44'}}
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium" style={{color: '#ffd700'}}>r₄ (Q4 - innermost)</label>
            <span style={{color: '#ffd700'}} className="font-bold">{r4}</span>
          </div>
          <input
            type="range" min="5" max="40" value={r4}
            onChange={(e) => setR4(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{accentColor: '#ffd700'}}
          />
        </div>
      </div>
      
      {/* Preset buttons */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        <button
          onClick={() => { setR1(120); setR2(60); setR3(30); setR4(15); }}
          className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
        >
          Standard Nesting
        </button>
        <button
          onClick={() => { setR1(100); setR2(100); setR3(100); setR4(100); }}
          className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
        >
          Equal r (Horn tori)
        </button>
        <button
          onClick={() => { setR1(80); setR2(80); setR3(40); setR4(20); }}
          className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
        >
          Paired Levels
        </button>
        <button
          onClick={() => { setR1(150); setR2(75); setR3(37); setR4(18); }}
          className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
        >
          Halving Cascade
        </button>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-gray-700 rounded-lg cursor-grab active:cursor-grabbing"
      />
      <p className="text-gray-500 text-xs mt-2">Drag to rotate</p>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-xl">
        <h3 className="text-white font-semibold mb-2">×i as Level Transition</h3>
        <div className="space-y-1 text-sm">
          <p className="text-gray-300">Each multiplication by <strong className="text-purple-400">i</strong> creates a transition from one Q-level to the next nested manifold.</p>
          <p className="text-gray-400 text-xs mt-2">
            <strong>Common Center:</strong> All tori share origin (abstract view)<br/>
            <strong>True Nesting:</strong> Inner torus centered on outer's tube (geometric embedding)
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#4a9eff'}}></div>
            <span className="text-gray-300">Q1: [sensation] - outermost</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff44ff'}}></div>
            <span className="text-gray-300">Q2: (perception)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#44ff44'}}></div>
            <span className="text-gray-300">Q3: {'{thought}'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ffd700'}}></div>
            <span className="text-gray-300">Q4: "representation" - innermost</span>
          </div>
        </div>
      </div>
    </div>
  );
}
