import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function RiemannSphere() {
  const [n, setN] = useState(5);
  const [showAxes, setShowAxes] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showIdeal, setShowIdeal] = useState(true);
  const [showRandom, setShowRandom] = useState(false);
  const [rotation, setRotation] = useState({ x: 0.4, y: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  // Points now have stable IDs: [{id: 0, angle: 1.23}, {id: 1, angle: 2.45}, ...]
  const [points, setPoints] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [organizationMethod, setOrganizationMethod] = useState('neighbours');
  const [fineTuning, setFineTuning] = useState(false);
  const [solo, setSolo] = useState(false);
  const [soloId, setSoloId] = useState(0); // Now tracks by ID, not index
  const [speed, setSpeed] = useState(0.02);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const width = 700;
  const height = 700;
  const radius = 250;
  const centerX = width / 2;
  const centerY = height / 2;
  const MIN_DISTANCE = 0.01;

  useEffect(() => {
    if (showRandom && points.length !== n) {
      initializeRandomPoints();
    }
  }, [n, showRandom]);

  const initializeRandomPoints = useCallback(() => {
    const newPoints = [];
    for (let i = 0; i < n; i++) {
      newPoints.push({
        id: i,
        angle: Math.random() * 2 * Math.PI
      });
    }
    setPoints(newPoints);
    setSoloId(0);
  }, [n]);

  // Get points sorted by angle (for neighbor calculations)
  const getSortedPoints = useCallback(() => {
    return [...points].sort((a, b) => a.angle - b.angle);
  }, [points]);

  const project = (x, y, z) => {
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
  };

  const generateSphereLines = () => {
    const lines = [];
    
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = [];
      const latRad = (lat * Math.PI) / 180;
      const r = radius * Math.cos(latRad);
      const y = radius * Math.sin(latRad);
      
      for (let lon = 0; lon <= 360; lon += 5) {
        const lonRad = (lon * Math.PI) / 180;
        pts.push({ x: r * Math.cos(lonRad), y: y, z: r * Math.sin(lonRad) });
      }
      lines.push({ points: pts, isEquator: lat === 0, type: 'latitude', lat });
    }
    
    for (let lon = 0; lon < 360; lon += 30) {
      const pts = [];
      const lonRad = (lon * Math.PI) / 180;
      
      for (let theta = 0; theta <= 360; theta += 5) {
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

  const generateIdealRoots = () => {
    const roots = [];
    for (let k = 0; k < n; k++) {
      const theta = (2 * Math.PI * k) / n;
      roots.push({
        x: radius * Math.cos(theta),
        y: 0,
        z: radius * Math.sin(theta),
        angle: theta,
        k,
        isEulerIdentity: n % 2 === 0 && k === n / 2,
        type: 'ideal'
      });
    }
    return roots;
  };

  const generateRandomRoots = () => {
    return points.map((pt) => ({
      x: radius * Math.cos(pt.angle),
      y: 0,
      z: radius * Math.sin(pt.angle),
      angle: pt.angle,
      id: pt.id,
      isSolo: solo && pt.id === soloId,
      type: 'random'
    }));
  };

  const generateAxes = () => {
    const axisLength = radius * 1.3;
    return {
      points: [
        { label: '0', x: 0, y: -radius, z: 0, color: '#4a9eff', desc: 'Zero (South)' },
        { label: '∞', x: 0, y: radius, z: 0, color: '#ff4a4a', desc: 'Infinity (North)' },
        { label: '1', x: radius, y: 0, z: 0, color: '#44ff44', desc: 'Unity (Real+)' },
        { label: '-1', x: -radius, y: 0, z: 0, color: '#ffd700', desc: 'e^πi (Real-)' },
        { label: 'i', x: 0, y: 0, z: radius, color: '#ff44ff', desc: 'Imaginary+' },
        { label: '-i', x: 0, y: 0, z: -radius, color: '#44ffff', desc: 'Imaginary-' },
      ],
      lines: [
        { from: { x: -axisLength, y: 0, z: 0 }, to: { x: axisLength, y: 0, z: 0 }, color: '#ffaa00', label: 'Real Axis' },
        { from: { x: 0, y: 0, z: -axisLength }, to: { x: 0, y: 0, z: axisLength }, color: '#ff44ff', label: 'Imaginary Axis' },
        { from: { x: 0, y: -axisLength, z: 0 }, to: { x: 0, y: axisLength, z: 0 }, color: '#ffffff', label: 'Projection Axis' },
      ]
    };
  };

  const normalizeAngle = (angle) => {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  };

  const calculateInscribedAngle = (angleR, angleA, angleB) => {
    const vecRA = { x: Math.cos(angleA) - Math.cos(angleR), y: Math.sin(angleA) - Math.sin(angleR) };
    const vecRB = { x: Math.cos(angleB) - Math.cos(angleR), y: Math.sin(angleB) - Math.sin(angleR) };
    
    const dot = vecRA.x * vecRB.x + vecRA.y * vecRB.y;
    const magA = Math.sqrt(vecRA.x * vecRA.x + vecRA.y * vecRA.y);
    const magB = Math.sqrt(vecRB.x * vecRB.x + vecRB.y * vecRB.y);
    
    if (magA < 0.0001 || magB < 0.0001) return Math.PI / n;
    
    const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
    return Math.acos(cosAngle);
  };

  const organizationStep = useCallback(() => {
    if (points.length < 3) return;

    // Sort by angle for neighbor relationships
    const sorted = getSortedPoints();
    const idealAngularDistance = (2 * Math.PI) / n;
    
    // Create a map from id to adjustment
    const adjustments = {};
    points.forEach(p => { adjustments[p.id] = 0; });
    
    // Find solo point's index in sorted array
    const soloSortedIdx = solo ? sorted.findIndex(p => p.id === soloId) : -1;
    
    if (organizationMethod === 'neighbours') {
      if (solo && soloSortedIdx !== -1) {
        // SOLO NEIGHBOURS: Solo enforces ideal distance to its neighbors
        const soloAngle = sorted[soloSortedIdx].angle;
        const leftSortedIdx = (soloSortedIdx - 1 + n) % n;
        const rightSortedIdx = (soloSortedIdx + 1) % n;
        const leftId = sorted[leftSortedIdx].id;
        const rightId = sorted[rightSortedIdx].id;
        
        // Left neighbor should be at soloAngle - idealAngularDistance
        const idealLeftAngle = normalizeAngle(soloAngle - idealAngularDistance);
        const leftError = normalizeAngle(sorted[leftSortedIdx].angle - idealLeftAngle);
        if (leftError > Math.PI) {
          adjustments[leftId] = (2 * Math.PI - leftError) * speed;
        } else {
          adjustments[leftId] = -leftError * speed;
        }
        
        // Right neighbor should be at soloAngle + idealAngularDistance
        const idealRightAngle = normalizeAngle(soloAngle + idealAngularDistance);
        const rightError = normalizeAngle(sorted[rightSortedIdx].angle - idealRightAngle);
        if (rightError > Math.PI) {
          adjustments[rightId] = (2 * Math.PI - rightError) * speed;
        } else {
          adjustments[rightId] = -rightError * speed;
        }
        
        // Other points use regular neighbor equalization
        for (let i = 0; i < n; i++) {
          const pt = sorted[i];
          if (pt.id === soloId || pt.id === leftId || pt.id === rightId) continue;
          
          const myLeftIdx = (i - 1 + n) % n;
          const myRightIdx = (i + 1) % n;
          
          let leftAngle = sorted[myLeftIdx].angle;
          let rightAngle = sorted[myRightIdx].angle;
          const myAngle = pt.angle;
          
          // Handle wrap-around
          if (myLeftIdx > i) leftAngle -= 2 * Math.PI;
          if (myRightIdx < i) rightAngle += 2 * Math.PI;
          
          const leftDist = myAngle - leftAngle;
          const rightDist = rightAngle - myAngle;
          
          adjustments[pt.id] = (rightDist - leftDist) / 2 * speed;
        }
        
      } else {
        // Regular distributed neighbors method
        for (let i = 0; i < n; i++) {
          const pt = sorted[i];
          const leftIdx = (i - 1 + n) % n;
          const rightIdx = (i + 1) % n;
          
          let leftAngle = sorted[leftIdx].angle;
          let rightAngle = sorted[rightIdx].angle;
          
          if (leftIdx > i) leftAngle -= 2 * Math.PI;
          if (rightIdx < i) rightAngle += 2 * Math.PI;
          
          const leftDist = pt.angle - leftAngle;
          const rightDist = rightAngle - pt.angle;
          
          const imbalance = (rightDist - leftDist) / 2;
          adjustments[pt.id] = imbalance * speed;
        }
      }
      
    } else if (organizationMethod === 'angle') {
      const idealInscribedAngle = Math.PI / n;
      const feedbackCount = {};
      points.forEach(p => { feedbackCount[p.id] = 0; });
      
      if (solo && soloSortedIdx !== -1) {
        // SOLO ANGLE: Only solo acts as reference
        const refAngle = sorted[soloSortedIdx].angle;
        
        for (let i = 0; i < n; i++) {
          if (sorted[i].id === soloId) continue;
          
          const t1 = sorted[i];
          const t1Left = (i - 1 + n) % n;
          const t1Right = (i + 1) % n;
          
          const neighborsToCheck = [];
          if (sorted[t1Left].id !== soloId) {
            neighborsToCheck.push({ t2Idx: t1Left, isCounterclockwise: false });
          }
          if (sorted[t1Right].id !== soloId) {
            neighborsToCheck.push({ t2Idx: t1Right, isCounterclockwise: true });
          }
          
          for (const { t2Idx, isCounterclockwise } of neighborsToCheck) {
            const t2 = sorted[t2Idx];
            
            const observedAngle = calculateInscribedAngle(refAngle, t1.angle, t2.angle);
            const error = observedAngle - idealInscribedAngle;
            const moveAmount = error * speed * 0.5;
            
            if (isCounterclockwise) {
              adjustments[t1.id] += moveAmount;
              adjustments[t2.id] -= moveAmount;
            } else {
              adjustments[t1.id] -= moveAmount;
              adjustments[t2.id] += moveAmount;
            }
            
            feedbackCount[t1.id]++;
            feedbackCount[t2.id]++;
          }
        }
        
        // Average the adjustments
        points.forEach(p => {
          if (feedbackCount[p.id] > 0) {
            adjustments[p.id] /= feedbackCount[p.id];
          }
        });
        
      } else {
        // Regular distributed angle method
        for (let refIdx = 0; refIdx < n; refIdx++) {
          const ref = sorted[refIdx];
          
          let t1Idx = refIdx;
          while (t1Idx === refIdx) {
            t1Idx = Math.floor(Math.random() * n);
          }
          const t1 = sorted[t1Idx];
          
          const t1Left = (t1Idx - 1 + n) % n;
          const t1Right = (t1Idx + 1) % n;
          
          let t2Idx, t2IsCounterclockwise;
          
          if (t1Left === refIdx) {
            t2Idx = t1Right;
            t2IsCounterclockwise = true;
          } else if (t1Right === refIdx) {
            t2Idx = t1Left;
            t2IsCounterclockwise = false;
          } else {
            if (Math.random() < 0.5) {
              t2Idx = t1Right;
              t2IsCounterclockwise = true;
            } else {
              t2Idx = t1Left;
              t2IsCounterclockwise = false;
            }
          }
          
          const t2 = sorted[t2Idx];
          
          const observedAngle = calculateInscribedAngle(ref.angle, t1.angle, t2.angle);
          const error = observedAngle - idealInscribedAngle;
          const moveAmount = error * speed;
          
          if (t2IsCounterclockwise) {
            adjustments[t1.id] += moveAmount;
            adjustments[t2.id] -= moveAmount;
          } else {
            adjustments[t1.id] -= moveAmount;
            adjustments[t2.id] += moveAmount;
          }
          
          feedbackCount[t1.id]++;
          feedbackCount[t2.id]++;
        }
        
        // Average the adjustments
        points.forEach(p => {
          if (feedbackCount[p.id] > 0) {
            adjustments[p.id] /= feedbackCount[p.id];
          }
        });
      }
    }
    
    // Apply adjustments (solo point doesn't move)
    let newPoints = points.map(p => ({
      ...p,
      angle: (solo && p.id === soloId) ? p.angle : normalizeAngle(p.angle + adjustments[p.id])
    }));
    
    // Fine-tuning: anchor one point near x=1 (angle = 0)
    if (fineTuning && !solo) {
      let closestId = newPoints[0].id;
      let closestDist = Math.min(newPoints[0].angle, 2 * Math.PI - newPoints[0].angle);
      
      for (const p of newPoints) {
        const dist = Math.min(p.angle, 2 * Math.PI - p.angle);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = p.id;
        }
      }
      
      if (closestDist < 0.3) {
        newPoints = newPoints.map(p => {
          if (p.id === closestId) {
            const moveToward = p.angle > Math.PI ? 2 * Math.PI : 0;
            return {
              ...p,
              angle: normalizeAngle(p.angle + (moveToward - p.angle) * speed * 2)
            };
          }
          return p;
        });
      }
    }
    
    // Enforce minimum distance (using sorted order)
    const sortedNew = [...newPoints].sort((a, b) => a.angle - b.angle);
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const curr = sortedNew[i];
      const next = sortedNew[nextIdx];
      
      let dist = nextIdx === 0 
        ? (2 * Math.PI - curr.angle + next.angle)
        : (next.angle - curr.angle);
      
      if (dist < MIN_DISTANCE) {
        const push = (MIN_DISTANCE - dist) / 2;
        const currIsSolo = solo && curr.id === soloId;
        const nextIsSolo = solo && next.id === soloId;
        
        if (!currIsSolo && !nextIsSolo) {
          curr.angle = normalizeAngle(curr.angle - push);
          next.angle = normalizeAngle(next.angle + push);
        } else if (!currIsSolo) {
          curr.angle = normalizeAngle(curr.angle - push * 2);
        } else if (!nextIsSolo) {
          next.angle = normalizeAngle(next.angle + push * 2);
        }
      }
    }
    
    setPoints(sortedNew);
  }, [points, n, organizationMethod, fineTuning, solo, soloId, speed, getSortedPoints]);

  useEffect(() => {
    if (isAnimating && showRandom) {
      animationRef.current = requestAnimationFrame(() => {
        organizationStep();
      });
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, showRandom, organizationStep, points]);

  const calculateMetrics = () => {
    if (points.length < 2) return { maxError: 0, avgError: 0 };
    
    const idealAngle = (2 * Math.PI) / n;
    const sorted = getSortedPoints();
    
    let totalError = 0;
    let maxError = 0;
    
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      let gap = nextIdx === 0 
        ? (2 * Math.PI - sorted[i].angle + sorted[0].angle)
        : (sorted[nextIdx].angle - sorted[i].angle);
      
      const error = Math.abs(gap - idealAngle);
      totalError += error;
      maxError = Math.max(maxError, error);
    }
    
    return {
      maxError: (maxError / idealAngle * 100).toFixed(1),
      avgError: (totalError / n / idealAngle * 100).toFixed(1)
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
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
          } else {
            const alpha = 0.7 - depthFactor * 0.5;
            ctx.strokeStyle = `rgba(100, 180, 255, ${Math.max(0.1, alpha)})`;
            ctx.lineWidth = 1;
          }
          
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    }
    
    if (showAxes) {
      const axes = generateAxes();
      
      axes.lines.forEach(line => {
        const from = project(line.from.x, line.from.y, line.from.z);
        const to = project(line.to.x, line.to.y, line.to.z);
        
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      
      axes.points.forEach(axis => {
        const p = project(axis.x, axis.y, axis.z);
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25 * p.scale);
        gradient.addColorStop(0, axis.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 25 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = axis.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${16 * p.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(axis.label, p.x, p.y - 22 * p.scale);
      });
    }
    
    if (showIdeal) {
      const idealRoots = generateIdealRoots();
      
      if (showConnections && idealRoots.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        
        idealRoots.forEach((root, i) => {
          const p = project(root.x, root.y, root.z);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        const firstP = project(idealRoots[0].x, idealRoots[0].y, idealRoots[0].z);
        ctx.lineTo(firstP.x, firstP.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      const sortedIdeal = [...idealRoots].sort((a, b) => {
        const pa = project(a.x, a.y, a.z);
        const pb = project(b.x, b.y, b.z);
        return pa.z - pb.z;
      });
      
      sortedIdeal.forEach((root) => {
        const p = project(root.x, root.y, root.z);
        const size = 6 * p.scale;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    
    if (showRandom) {
      const randomRoots = generateRandomRoots();
      
      if (showConnections && randomRoots.length > 1) {
        const sortedForConnection = [...randomRoots].sort((a, b) => a.angle - b.angle);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        
        sortedForConnection.forEach((root, i) => {
          const p = project(root.x, root.y, root.z);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        const firstP = project(sortedForConnection[0].x, sortedForConnection[0].y, sortedForConnection[0].z);
        ctx.lineTo(firstP.x, firstP.y);
        ctx.stroke();
      }
      
      // Sort by z for proper depth rendering
      const sortedRandom = [...randomRoots].sort((a, b) => {
        const pa = project(a.x, a.y, a.z);
        const pb = project(b.x, b.y, b.z);
        return pa.z - pb.z;
      });
      
      sortedRandom.forEach((root) => {
        const p = project(root.x, root.y, root.z);
        const isSoloPoint = root.isSolo;
        const size = (isSoloPoint ? 14 : 10) * p.scale;
        
        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
        if (isSoloPoint) {
          gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
        }
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Point
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isSoloPoint ? '#ffcc00' : '#ff6666';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSoloPoint ? 3 : 1.5;
        ctx.stroke();
        
        // Label
        if (isSoloPoint) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${10 * p.scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', p.x, p.y);
        } else if (n <= 20) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${8 * p.scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(root.id.toString(), p.x, p.y);
        }
      });
    }
    
    // Info panel
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(10, 10, 240, showRandom ? 150 : 100);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, 10, 240, showRandom ? 150 : 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`n = ${n} people`, 20, 32);
    
    ctx.font = '12px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`Ideal distance: 2π/${n} = ${(360/n).toFixed(1)}°`, 20, 52);
    ctx.fillText(`Inscribed angle: π/${n} = ${(180/n).toFixed(1)}°`, 20, 70);
    
    if (showRandom) {
      const metrics = calculateMetrics();
      ctx.fillStyle = '#ff6666';
      ctx.fillText(`Max error: ${metrics.maxError}%`, 20, 92);
      ctx.fillText(`Avg error: ${metrics.avgError}%`, 20, 110);
      
      if (solo) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`★ Solo point: ID ${soloId}`, 20, 128);
      }
      
      ctx.fillStyle = isAnimating ? '#44ff44' : '#888888';
      ctx.fillText(isAnimating ? '● Organizing...' : '○ Paused', 20, solo ? 146 : 128);
    }
    
  }, [n, showAxes, showConnections, showWireframe, showIdeal, showRandom, rotation, points, isAnimating, solo, soloId]);

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
      yellow: active ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-gray-700',
    };
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded font-medium transition-all ${colors[color]} ${
          active ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-600'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-1">Riemann Sphere: Psycho-Social Dynamics</h1>
      <p className="text-gray-400 text-sm mb-4">Self-Organization with Stable Point Identities</p>
      
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        <ToggleButton active={showAxes} onClick={() => setShowAxes(!showAxes)}>Axes</ToggleButton>
        <ToggleButton active={showConnections} onClick={() => setShowConnections(!showConnections)}>Connections</ToggleButton>
        <ToggleButton active={showWireframe} onClick={() => setShowWireframe(!showWireframe)}>Wireframe</ToggleButton>
        <span className="w-px bg-gray-600 mx-2"></span>
        <ToggleButton active={showIdeal} onClick={() => setShowIdeal(!showIdeal)} color="green">Ideal</ToggleButton>
        <ToggleButton active={showRandom} onClick={() => setShowRandom(!showRandom)} color="red">Random</ToggleButton>
      </div>
      
      <div className="flex flex-col items-center mb-3 w-full max-w-md">
        <label className="text-white text-sm mb-1">Number of People: <span className="font-bold text-purple-400">{n}</span></label>
        <input
          type="range"
          min="3"
          max="150"
          value={n}
          onChange={(e) => setN(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      {showRandom && (
        <div className="flex flex-col gap-3 mb-4 p-4 bg-gray-800 rounded-lg w-full max-w-xl">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Self-Organization</span>
            <div className="flex gap-2">
              <button
                onClick={initializeRandomPoints}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500"
              >
                Randomize
              </button>
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className={`px-4 py-1 rounded text-sm font-medium ${
                  isAnimating ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                {isAnimating ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-400 text-sm">Method:</span>
            <button
              onClick={() => setOrganizationMethod('neighbours')}
              className={`px-3 py-1 rounded text-sm ${
                organizationMethod === 'neighbours' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              Neighbours
            </button>
            <button
              onClick={() => setOrganizationMethod('angle')}
              className={`px-3 py-1 rounded text-sm ${
                organizationMethod === 'angle' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              Angle (π/n)
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-400 text-sm">Mode:</span>
            <button
              onClick={() => setSolo(!solo)}
              className={`px-3 py-1 rounded text-sm ${
                solo ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-600 text-gray-300'
              }`}
            >
              ★ Solo
            </button>
            {solo && (
              <select
                value={soloId}
                onChange={(e) => setSoloId(parseInt(e.target.value))}
                className="px-2 py-1 bg-gray-600 text-white text-sm rounded"
              >
                {points.map((p) => (
                  <option key={p.id} value={p.id}>Point {p.id}</option>
                ))}
              </select>
            )}
            {!solo && (
              <button
                onClick={() => setFineTuning(!fineTuning)}
                className={`px-3 py-1 rounded text-sm ${
                  fineTuning ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                Fine-tune (x=1)
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Speed:</span>
            <input
              type="range"
              min="0.005"
              max="0.1"
              step="0.005"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-400 text-xs w-12">{(speed * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
      
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
      <p className="text-gray-500 text-xs mt-2">Drag to rotate • Point IDs are now stable</p>
      
      <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-xl">
        <h3 className="text-white font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-gray-300">Ideal positions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-gray-300">Organizing points</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-xs">★</span>
            <span className="text-gray-300">Solo authority</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          <p><b>Bug fix:</b> Points now have stable IDs that persist through sorting.</p>
          <p>Point 3 remains Point 3 regardless of its angular position.</p>
        </div>
      </div>
    </div>
  );
}
