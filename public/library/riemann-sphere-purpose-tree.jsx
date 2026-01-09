import React, { useState, useRef, useEffect, useCallback } from 'react';

// Dummy purpose tree data for each person
const generatePurposeTree = (id) => {
  const purposes = {
    // Positive pscales (future projection, social coordination)
    10: ["be a good human", "leave the world better", "contribute to humanity"][id % 3],
    9: ["be a good parent", "be a good man/woman", "fulfill my role"][id % 3],
    8: ["serve my community", "be a good citizen", "uphold values"][id % 3],
    7: ["succeed in my career", "provide for family", "master my craft"][id % 3],
    6: ["complete this project", "achieve this goal", "build this thing"][id % 3],
    5: ["finish this month well", "meet this deadline", "resolve this situation"][id % 3],
    4: ["get through this week", "handle these tasks", "manage this load"][id % 3],
    3: ["survive today", "do today's work", "be present today"][id % 3],
    2: ["navigate this hour", "handle this meeting", "stay focused now"][id % 3],
    1: ["manage this conversation", "respond well here", "listen carefully"][id % 3],
    // pscale 0 is the equator - the moment itself (5-10 mins)
    0: ["present in this moment", "engaged now", "here"][id % 3],
    // Negative pscales (internal processing, quadrants)
    [-1]: ["tracking this exchange", "following the thread", "attending"][id % 3],
    [-2]: ["processing these words", "hearing the tone", "sensing intent"][id % 3],
    [-3]: { q: 4, text: ["parsing language", "word recognition", "symbol processing"][id % 3] },
    [-4]: { q: 3, text: ["forming thought", "conceptualizing", "pattern matching"][id % 3] },
    [-5]: { q: 2, text: ["feeling response", "value resonance", "emotional tone"][id % 3] },
    [-6]: { q: 1, text: ["cellular sensing", "embodied reception", "raw sensation"][id % 3] },
  };
  
  // Determinancy (intensity) for each level - varies by person
  const determinancy = {};
  Object.keys(purposes).forEach(k => {
    const pscale = parseInt(k);
    // Higher determinancy near equator, lower at extremes, with individual variation
    const base = Math.exp(-Math.abs(pscale) * 0.15);
    const variation = 0.3 + (((id * 7 + pscale * 3) % 10) / 10) * 0.7;
    determinancy[k] = Math.min(1, base * variation);
  });
  
  return { purposes, determinancy };
};

export default function RiemannSphere() {
  const [n, setN] = useState(5);
  const [showAxes, setShowAxes] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showIdeal, setShowIdeal] = useState(false);
  const [showRandom, setShowRandom] = useState(true);
  const [showPurposes, setShowPurposes] = useState(true);
  const [showMeridians, setShowMeridians] = useState(true);
  const [selectedPscale, setSelectedPscale] = useState(0);
  const [xValue, setXValue] = useState(1.5);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const canvasRef = useRef(null);

  const width = 800;
  const height = 800;
  const radius = 280;
  const centerX = width / 2;
  const centerY = height / 2;

  // Pscale range we're visualizing
  const PSCALE_MIN = -6;
  const PSCALE_MAX = 10;

  useEffect(() => {
    if (points.length !== n) {
      initializePoints();
    }
  }, [n]);

  const initializePoints = useCallback(() => {
    const newPoints = [];
    for (let i = 0; i < n; i++) {
      // Start at roots of unity positions
      const angle = (2 * Math.PI * i) / n;
      newPoints.push({
        id: i,
        angle: angle,
        purposeTree: generatePurposeTree(i)
      });
    }
    setPoints(newPoints);
  }, [n]);

  // Map pscale to latitude (in radians)
  // pscale 0 = equator (lat 0)
  // pscale +10 = near north pole
  // pscale -6 = near south pole
  const pscaleToLatitude = (pscale) => {
    // Map [-6, +10] to [-75°, +75°] in radians
    const normalized = (pscale - PSCALE_MIN) / (PSCALE_MAX - PSCALE_MIN); // 0 to 1
    const latDegrees = -75 + normalized * 150; // -75 to +75
    return (latDegrees * Math.PI) / 180;
  };

  // Get the radius at a given latitude (for plotting on sphere surface)
  const getRadiusAtLatitude = (lat) => {
    return radius * Math.cos(lat);
  };

  const project = (x, y, z) => {
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    
    const scale = 600 / (600 + z2);
    return {
      x: centerX + x1 * scale,
      y: centerY - y1 * scale,
      z: z2,
      scale
    };
  };

  // Convert spherical to cartesian
  const sphericalToCartesian = (theta, lat) => {
    const r = radius;
    const x = r * Math.cos(lat) * Math.cos(theta);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.sin(theta);
    return { x, y, z };
  };

  const generateSphereLines = () => {
    const lines = [];
    
    // Latitude lines - now with pscale labels
    const pscaleLatitudes = [];
    for (let ps = PSCALE_MIN; ps <= PSCALE_MAX; ps++) {
      pscaleLatitudes.push({ pscale: ps, lat: pscaleToLatitude(ps) });
    }
    
    pscaleLatitudes.forEach(({ pscale, lat }) => {
      const pts = [];
      const r = getRadiusAtLatitude(lat);
      const y = radius * Math.sin(lat);
      
      for (let lon = 0; lon <= 360; lon += 5) {
        const lonRad = (lon * Math.PI) / 180;
        pts.push({ x: r * Math.cos(lonRad), y: y, z: r * Math.sin(lonRad) });
      }
      lines.push({ 
        points: pts, 
        isEquator: pscale === 0, 
        type: 'latitude', 
        pscale,
        isSelected: pscale === selectedPscale
      });
    });
    
    // Longitude lines (fewer, just for reference)
    for (let lon = 0; lon < 360; lon += 45) {
      const pts = [];
      const lonRad = (lon * Math.PI) / 180;
      
      for (let theta = -85; theta <= 85; theta += 5) {
        const thetaRad = (theta * Math.PI) / 180;
        const x = radius * Math.cos(thetaRad) * Math.cos(lonRad);
        const y = radius * Math.sin(thetaRad);
        const z = radius * Math.cos(thetaRad) * Math.sin(lonRad);
        pts.push({ x, y, z });
      }
      lines.push({ points: pts, isEquator: false, type: 'longitude', lon });
    }
    
    return lines;
  };

  // Generate meridian arc for a person
  const generateMeridianArc = (theta) => {
    const pts = [];
    for (let ps = PSCALE_MIN; ps <= PSCALE_MAX; ps += 0.5) {
      const lat = pscaleToLatitude(ps);
      const pos = sphericalToCartesian(theta, lat);
      pts.push({ ...pos, pscale: ps });
    }
    return pts;
  };

  // Get quadrant color
  const getQuadrantColor = (q) => {
    const colors = {
      1: '#ff6b6b', // Q1 - red (embodied)
      2: '#ffd93d', // Q2 - yellow (feeling/value)
      3: '#6bcb77', // Q3 - green (thought/concept)
      4: '#4d96ff'  // Q4 - blue (language/symbol)
    };
    return colors[q] || '#ffffff';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw wireframe with pscale lines
    if (showWireframe) {
      const lines = generateSphereLines();
      
      lines.forEach(line => {
        const projectedPoints = line.points.map(p => project(p.x, p.y, p.z));
        
        for (let i = 0; i < projectedPoints.length - 1; i++) {
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[i + 1];
          const avgZ = (p1.z + p2.z) / 2;
          const depthFactor = (avgZ + radius) / (2 * radius);
          
          ctx.beginPath();
          if (line.isEquator) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.95 - depthFactor * 0.4})`;
            ctx.lineWidth = 3;
          } else if (line.isSelected) {
            ctx.strokeStyle = `rgba(255, 100, 255, ${0.9 - depthFactor * 0.4})`;
            ctx.lineWidth = 2;
          } else if (line.type === 'latitude') {
            const alpha = 0.4 - depthFactor * 0.3;
            ctx.strokeStyle = `rgba(100, 150, 200, ${Math.max(0.05, alpha)})`;
            ctx.lineWidth = 0.5;
          } else {
            const alpha = 0.3 - depthFactor * 0.2;
            ctx.strokeStyle = `rgba(80, 120, 180, ${Math.max(0.05, alpha)})`;
            ctx.lineWidth = 0.5;
          }
          
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
      
      // Draw pscale labels on the right side
      for (let ps = PSCALE_MIN; ps <= PSCALE_MAX; ps += 2) {
        const lat = pscaleToLatitude(ps);
        const pos = sphericalToCartesian(Math.PI / 2, lat); // Right side
        const p = project(pos.x, pos.y, pos.z);
        
        if (p.z < radius * 0.5) { // Only show if facing us
          ctx.fillStyle = ps === selectedPscale ? '#ff88ff' : 
                          ps === 0 ? '#ffd700' : '#666666';
          ctx.font = ps === 0 ? 'bold 11px monospace' : '9px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${ps >= 0 ? '+' : ''}${ps}`, p.x + 10, p.y + 3);
        }
      }
    }
    
    // Draw meridian arcs for each person
    if (showMeridians && showRandom) {
      points.forEach((pt, idx) => {
        const arc = generateMeridianArc(pt.angle);
        const projectedArc = arc.map(p => ({ ...project(p.x, p.y, p.z), pscale: p.pscale }));
        
        // Draw the meridian line
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 150, 150, 0.3)`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < projectedArc.length - 1; i++) {
          const p1 = projectedArc[i];
          const p2 = projectedArc[i + 1];
          if (i === 0) ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
        
        // Draw purpose segments if enabled
        if (showPurposes) {
          const tree = pt.purposeTree;
          
          Object.keys(tree.purposes).forEach(psKey => {
            const ps = parseInt(psKey);
            const purpose = tree.purposes[psKey];
            const det = tree.determinancy[psKey];
            
            const lat = pscaleToLatitude(ps);
            const pos = sphericalToCartesian(pt.angle, lat);
            const p = project(pos.x, pos.y, pos.z);
            
            // Skip if behind sphere
            if (p.z > radius * 0.3) return;
            
            // Determine color based on quadrant (for negative pscales) or neutral
            let color;
            if (ps < -2 && typeof purpose === 'object') {
              color = getQuadrantColor(purpose.q);
            } else {
              // Gradient from warm (low pscale) to cool (high pscale)
              if (ps < 0) {
                color = `rgb(255, ${150 + ps * 15}, ${100 + ps * 10})`;
              } else {
                color = `rgb(${150 - ps * 10}, ${180 - ps * 5}, 255)`;
              }
            }
            
            // Draw segment marker
            const size = 3 + det * 4;
            const alpha = 0.3 + det * 0.7;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * p.scale, 0, Math.PI * 2);
            ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            ctx.fill();
            
            // Highlight selected pscale
            if (ps === selectedPscale) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      });
    }
    
    // Draw equator connections
    if (showConnections && showRandom && points.length > 1) {
      const sortedPoints = [...points].sort((a, b) => a.angle - b.angle);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.lineWidth = 2;
      
      sortedPoints.forEach((pt, i) => {
        const pos = sphericalToCartesian(pt.angle, 0); // On equator
        const p = project(pos.x, pos.y, pos.z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      const firstPos = sphericalToCartesian(sortedPoints[0].angle, 0);
      const firstP = project(firstPos.x, firstPos.y, firstPos.z);
      ctx.lineTo(firstP.x, firstP.y);
      ctx.stroke();
    }
    
    // Draw equator points (the "meeting" at pscale 0)
    if (showRandom) {
      // Sort by depth for proper rendering
      const sortedByDepth = [...points].sort((a, b) => {
        const posA = sphericalToCartesian(a.angle, 0);
        const posB = sphericalToCartesian(b.angle, 0);
        const pA = project(posA.x, posA.y, posA.z);
        const pB = project(posB.x, posB.y, posB.z);
        return pA.z - pB.z;
      });
      
      sortedByDepth.forEach((pt) => {
        const pos = sphericalToCartesian(pt.angle, 0);
        const p = project(pos.x, pos.y, pos.z);
        const size = 12 * p.scale;
        
        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Point
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa44';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label
        if (n <= 12) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${9 * p.scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pt.id.toString(), p.x, p.y);
        }
      });
    }
    
    // Info panel
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(10, 10, 280, 200);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, 10, 280, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`n = ${n} people at pscale 0 (equator)`, 20, 32);
    
    ctx.font = '11px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`x^0 = 1 for all x (equator: shared moment)`, 20, 52);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`x = ${xValue.toFixed(2)}`, 20, 72);
    ctx.fillText(`At pscale ${selectedPscale}: x^${selectedPscale} = ${Math.pow(xValue, selectedPscale).toFixed(3)}`, 20, 88);
    
    ctx.fillStyle = '#888888';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Negative pscale: internal processing`, 20, 110);
    ctx.fillText(`  -3: Q4 language  -4: Q3 thought`, 20, 124);
    ctx.fillText(`  -5: Q2 feeling   -6: Q1 sensation`, 20, 138);
    ctx.fillText(`Positive pscale: social projection`, 20, 156);
    ctx.fillText(`  +1: minute  +3: day  +7: career  +10: life`, 20, 170);
    
    // Quadrant legend
    ctx.fillStyle = '#ff6b6b'; ctx.fillText('■', 20, 190);
    ctx.fillStyle = '#ffd93d'; ctx.fillText('■', 50, 190);
    ctx.fillStyle = '#6bcb77'; ctx.fillText('■', 80, 190);
    ctx.fillStyle = '#4d96ff'; ctx.fillText('■', 110, 190);
    ctx.fillStyle = '#666666';
    ctx.fillText('Q1  Q2  Q3  Q4', 30, 190);
    
    // Show hovered point's purpose at selected pscale
    if (hoveredPoint !== null && showPurposes) {
      const pt = points.find(p => p.id === hoveredPoint);
      if (pt) {
        const purpose = pt.purposeTree.purposes[selectedPscale];
        const det = pt.purposeTree.determinancy[selectedPscale];
        const text = typeof purpose === 'object' ? purpose.text : purpose;
        
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(width - 300, 10, 290, 60);
        ctx.strokeStyle = '#ffaa44';
        ctx.strokeRect(width - 300, 10, 290, 60);
        
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Person ${pt.id} at pscale ${selectedPscale}:`, width - 290, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText(`"${text}"`, width - 290, 48);
        ctx.fillStyle = '#888888';
        ctx.fillText(`determinancy: ${(det * 100).toFixed(0)}%`, width - 290, 62);
      }
    }
    
  }, [n, showAxes, showConnections, showWireframe, showIdeal, showRandom, 
      showPurposes, showMeridians, selectedPscale, xValue, rotation, points, hoveredPoint]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      setRotation(prev => ({
        x: prev.x + dy * 0.008,
        y: prev.y + dx * 0.008
      }));
      setLastMouse({ x, y });
    } else {
      // Check for hover on equator points
      let found = null;
      points.forEach(pt => {
        const pos = sphericalToCartesian(pt.angle, 0);
        const p = project(pos.x, pos.y, pos.z);
        const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
        if (dist < 20) found = pt.id;
      });
      setHoveredPoint(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const ToggleButton = ({ active, onClick, children, color = 'purple' }) => {
    const colors = {
      purple: active ? 'bg-purple-600' : 'bg-gray-700',
      green: active ? 'bg-green-600' : 'bg-gray-700',
      red: active ? 'bg-red-600' : 'bg-gray-700',
      yellow: active ? 'bg-yellow-600' : 'bg-gray-700',
      blue: active ? 'bg-blue-600' : 'bg-gray-700',
    };
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${colors[color]} ${
          active ? 'text-white' : 'text-gray-400 hover:bg-gray-600'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen">
      <h1 className="text-xl font-bold text-white mb-1">Riemann Sphere: Pscale Purpose Trees</h1>
      <p className="text-gray-400 text-xs mb-3">Individual meridians from 0 (embodied) through equator (moment) toward ∞ (projection)</p>
      
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        <ToggleButton active={showWireframe} onClick={() => setShowWireframe(!showWireframe)}>Grid</ToggleButton>
        <ToggleButton active={showConnections} onClick={() => setShowConnections(!showConnections)}>Connect</ToggleButton>
        <ToggleButton active={showMeridians} onClick={() => setShowMeridians(!showMeridians)} color="red">Meridians</ToggleButton>
        <ToggleButton active={showPurposes} onClick={() => setShowPurposes(!showPurposes)} color="yellow">Purposes</ToggleButton>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-3 p-3 bg-gray-800 rounded-lg">
        <div className="flex flex-col">
          <label className="text-white text-xs mb-1">People (n): <span className="text-yellow-400">{n}</span></label>
          <input
            type="range" min="3" max="12" value={n}
            onChange={(e) => setN(parseInt(e.target.value))}
            className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-white text-xs mb-1">Pscale focus: <span className="text-pink-400">{selectedPscale}</span></label>
          <input
            type="range" min={PSCALE_MIN} max={PSCALE_MAX} value={selectedPscale}
            onChange={(e) => setSelectedPscale(parseInt(e.target.value))}
            className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-white text-xs mb-1">x value: <span className="text-cyan-400">{xValue.toFixed(2)}</span></label>
          <input
            type="range" min="0.5" max="2.5" step="0.05" value={xValue}
            onChange={(e) => setXValue(parseFloat(e.target.value))}
            className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <button
          onClick={initializePoints}
          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500"
        >
          Reset
        </button>
      </div>
      
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
      <p className="text-gray-500 text-xs mt-2">Drag to rotate • Hover over equator points to see purposes</p>
      
      <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-2xl text-xs">
        <h3 className="text-white font-semibold mb-2">Interpretation</h3>
        <div className="grid grid-cols-2 gap-4 text-gray-400">
          <div>
            <p className="text-yellow-400 font-medium">Equator (pscale 0):</p>
            <p>x^0 = 1 for all x. The shared moment where n individuals meet as 1^n.</p>
            <p className="mt-2 text-red-400 font-medium">Below equator (negative pscale):</p>
            <p>Individual internal processing. Q4→Q3→Q2→Q1 toward embodied 0.</p>
          </div>
          <div>
            <p className="text-blue-400 font-medium">Above equator (positive pscale):</p>
            <p>Projections into future. May align (shared purpose) or diverge.</p>
            <p className="mt-2 text-cyan-400 font-medium">x value slider:</p>
            <p>At pscale n: x^n. Shows how deviation from 1 amplifies at higher scales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
