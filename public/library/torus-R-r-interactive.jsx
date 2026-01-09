import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function TorusInteractive() {
  const [R, setR] = useState(100); // major radius
  const [r, setRMinor] = useState(40); // minor radius
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [showMajorCircle, setShowMajorCircle] = useState(true);
  const [showMinorCircle, setShowMinorCircle] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const canvasRef = useRef(null);

  const width = 600;
  const height = 600;
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
    
    const scale = 400 / (400 + z2);
    return {
      x: centerX + x1 * scale,
      y: centerY - y1 * scale,
      z: z2,
      scale
    };
  }, [rotation, centerX, centerY]);

  // Generate torus wireframe lines
  const generateTorusLines = useCallback(() => {
    const lines = [];
    
    // Toroidal circles (around the hole - latitude-like)
    for (let i = 0; i < 12; i++) {
      const theta = (i / 12) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 48; j++) {
        const phi = (j / 48) * 2 * Math.PI;
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        pts.push({ x, y, z });
      }
      lines.push({ points: pts, type: 'toroidal', theta });
    }
    
    // Poloidal circles (around the tube - longitude-like)
    for (let i = 0; i < 24; i++) {
      const phi = (i / 24) * 2 * Math.PI;
      const pts = [];
      for (let j = 0; j <= 32; j++) {
        const theta = (j / 32) * 2 * Math.PI;
        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);
        pts.push({ x, y, z });
      }
      lines.push({ points: pts, type: 'poloidal', phi });
    }
    
    return lines;
  }, [R, r]);

  // Generate major circle (center path)
  const generateMajorCircle = useCallback(() => {
    const pts = [];
    for (let j = 0; j <= 48; j++) {
      const phi = (j / 48) * 2 * Math.PI;
      const x = R * Math.cos(phi);
      const y = R * Math.sin(phi);
      const z = 0;
      pts.push({ x, y, z });
    }
    return pts;
  }, [R]);

  // Generate minor circle at phi = 0
  const generateMinorCircle = useCallback(() => {
    const pts = [];
    for (let j = 0; j <= 32; j++) {
      const theta = (j / 32) * 2 * Math.PI;
      const x = R + r * Math.cos(theta);
      const y = 0;
      const z = r * Math.sin(theta);
      pts.push({ x, y, z });
    }
    return pts;
  }, [R, r]);

  // Draw the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Generate wireframe
    const lines = generateTorusLines();
    
    // Draw wireframe lines
    lines.forEach(line => {
      const projectedPoints = line.points.map(p => project(p.x, p.y, p.z));
      
      ctx.beginPath();
      for (let i = 0; i < projectedPoints.length - 1; i++) {
        const p1 = projectedPoints[i];
        const p2 = projectedPoints[i + 1];
        const avgZ = (p1.z + p2.z) / 2;
        const maxZ = Math.max(R + r, 150);
        const depthFactor = (avgZ + maxZ) / (2 * maxZ);
        
        const alpha = 0.6 - depthFactor * 0.4;
        ctx.strokeStyle = `rgba(74, 158, 255, ${Math.max(0.1, alpha)})`;
        ctx.lineWidth = 1;
        
        if (i === 0) {
          ctx.moveTo(p1.x, p1.y);
        }
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    });
    
    // Draw major circle (R) if enabled
    if (showMajorCircle) {
      const majorPts = generateMajorCircle().map(p => project(p.x, p.y, p.z));
      ctx.beginPath();
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      majorPts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw minor circle (r) if enabled
    if (showMinorCircle) {
      const minorPts = generateMinorCircle().map(p => project(p.x, p.y, p.z));
      ctx.beginPath();
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 3;
      minorPts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      
      // Draw center of minor circle
      const minorCenter = project(R, 0, 0);
      ctx.beginPath();
      ctx.arc(minorCenter.x, minorCenter.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#44ff44';
      ctx.fill();
    }
    
    // Draw center point
    const center = project(0, 0, 0);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Draw R line from center to minor circle center
    if (showMajorCircle && showMinorCircle) {
      const minorCenter = project(R, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2;
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(minorCenter.x, minorCenter.y);
      ctx.stroke();
    }
    
    // Info panel
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(10, 10, 200, 100);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, 10, 200, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Torus Parameters', 20, 32);
    
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ff6666';
    ctx.fillText(`R (major): ${R}`, 20, 52);
    ctx.fillStyle = '#44ff44';
    ctx.fillText(`r (minor): ${r}`, 20, 70);
    
    // Topology indicator
    ctx.fillStyle = '#888';
    let topology = 'Ring torus';
    if (R === r) topology = 'Horn torus';
    else if (R < r) topology = 'Spindle torus';
    else if (R === 0) topology = 'Sphere';
    ctx.fillText(`Type: ${topology}`, 20, 90);
    
    // Labels
    if (showLabels) {
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('R', center.x + 20, center.y - 10);
      
      if (showMinorCircle) {
        const minorCenter = project(R, 0, 0);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('r', minorCenter.x + 15, minorCenter.y - 15);
      }
    }
    
  }, [R, r, rotation, project, generateTorusLines, generateMajorCircle, generateMinorCircle, showMajorCircle, showMinorCircle, showLabels]);

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

  const ToggleButton = ({ active, onClick, children, color = 'purple' }) => {
    const colors = {
      purple: active ? 'bg-purple-600 shadow-purple-500/30' : 'bg-gray-700',
      green: active ? 'bg-green-600 shadow-green-500/30' : 'bg-gray-700',
      red: active ? 'bg-red-600 shadow-red-500/30' : 'bg-gray-700',
    };
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded font-medium transition-all text-sm ${colors[color]} ${
          active ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-600'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-1">Torus Construction: Two Circles</h1>
      <p className="text-gray-400 text-sm mb-4">Interactive R/r Ratio Exploration</p>
      
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        <ToggleButton active={showMajorCircle} onClick={() => setShowMajorCircle(!showMajorCircle)} color="red">
          Major Circle (R)
        </ToggleButton>
        <ToggleButton active={showMinorCircle} onClick={() => setShowMinorCircle(!showMinorCircle)} color="green">
          Minor Circle (r)
        </ToggleButton>
        <ToggleButton active={showLabels} onClick={() => setShowLabels(!showLabels)}>
          Labels
        </ToggleButton>
      </div>
      
      {/* Sliders */}
      <div className="flex flex-col gap-4 mb-4 w-full max-w-md">
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="text-red-400 font-medium">R (major radius)</label>
            <span className="text-red-400 font-bold">{R}</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={R}
            onChange={(e) => setR(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 (sphere)</span>
            <span>150</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <label className="text-green-400 font-medium">r (minor radius)</label>
            <span className="text-green-400 font-bold">{r}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={r}
            onChange={(e) => setRMinor(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>100</span>
          </div>
        </div>
        
        {/* Preset buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => { setR(100); setRMinor(40); }}
            className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
          >
            Ring (R &gt; r)
          </button>
          <button
            onClick={() => { setR(50); setRMinor(50); }}
            className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
          >
            Horn (R = r)
          </button>
          <button
            onClick={() => { setR(30); setRMinor(60); }}
            className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
          >
            Spindle (R &lt; r)
          </button>
          <button
            onClick={() => { setR(0); setRMinor(80); }}
            className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
          >
            Sphere (R = 0)
          </button>
        </div>
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
      <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-md">
        <h3 className="text-white font-semibold mb-2">Torus Construction</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-400" style={{backgroundImage: 'repeating-linear-gradient(90deg, #f87171 0, #f87171 8px, transparent 8px, transparent 12px)'}}></div>
            <span className="text-gray-300"><strong className="text-red-400">R</strong>: Major radius (center to tube center)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-400"></div>
            <span className="text-gray-300"><strong className="text-green-400">r</strong>: Minor radius (tube radius)</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          <p><strong>R &gt; r</strong>: Ring torus (donut with hole)</p>
          <p><strong>R = r</strong>: Horn torus (hole becomes point)</p>
          <p><strong>R &lt; r</strong>: Spindle torus (self-intersecting)</p>
          <p><strong>R = 0</strong>: Degenerates to sphere</p>
        </div>
      </div>
    </div>
  );
}
