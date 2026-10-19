import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// CRISP INLINE AVIATION SVG ICONS (No external icon package needed!)
// ============================================================================
const IconPlane = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);

const IconActivity = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 14 4-4" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
  </svg>
);

const IconSliders = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" /><line x1="18" x2="22" y1="16" y2="16" />
  </svg>
);

const IconRotateCcw = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const IconArrowUp = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const IconArrowDown = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ============================================================================
// MAIN GLASS-COCKPIT AVIONICS STUDIO COMPONENT
// ============================================================================
export default function App() {
  // Automatically inject Tailwind CSS & reset Vite's default narrow #root styles
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn-script';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
    const styleId = 'avionics-fullscreen-reset';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: 100vh !important;
          background-color: #060b14 !important;
          color: #f1f5f9 !important;
          display: block !important;
          text-align: left !important;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
        }
        input[type="range"] {
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // --- Aerodynamic & Mass Center Positions (% of fuselage length) ---
  const [xAc, setXAc] = useState(30.0);         // Aerodynamic Center (Wing)
  const [xCg, setXCg] = useState(41.0);         // Center of Gravity (Mass)
  const [xNp, setXNp] = useState(52.0);         // Neutral Point (Total Aero Center)
  const [elevator, setElevator] = useState(0.0); // Pilot Elevator Stick (-20° to +20°)
  const [activePreset, setActivePreset] = useState(2);

  // --- Real-Time Flight Dynamics State ---
  const [theta, setTheta] = useState(0.0);         // Pitch attitude (deg)
  const [thetaDot, setThetaDot] = useState(0.0);   // Pitch rate (deg/s)
  const [flowOffset, setFlowOffset] = useState(0); // Animated wind streamline phase
  const [history, setHistory] = useState(() =>
    Array.from({ length: 160 }, (_, i) => ({ t: i * 0.04, theta: 0, elev: 0 }))
  );

  // Keep synchronous ref for 60-FPS requestAnimationFrame physics loop
  const physRef = useRef({
    xAc: 30.0,
    xCg: 41.0,
    xNp: 52.0,
    elevator: 0.0,
    theta: 0.0,
    thetaDot: 0.0,
    trimTheta: 0.0,
    t: 6.4,
    flow: 0.0,
  });

  useEffect(() => {
    physRef.current.xAc = xAc;
    physRef.current.xCg = xCg;
    physRef.current.xNp = xNp;
    physRef.current.elevator = elevator;
  }, [xAc, xCg, xNp, elevator]);

  // --- Inject Pitch Disturbance (Gust Up / Gust Down) ---
  const applyDisturbance = useCallback((deltaDeg) => {
    const p = physRef.current;
    const sm = p.xNp - p.xCg;
    p.theta = Math.max(-32, Math.min(32, p.theta + deltaDeg));
    if (Math.abs(sm) <= 1.5) {
      // In Neutrally Stable mode, a disturbance sets a new constant inclination
      p.trimTheta = p.theta;
      p.thetaDot = 0.0;
    } else {
      p.thetaDot += deltaDeg * 0.9;
    }
    setTheta(p.theta);
    setThetaDot(p.thetaDot);
  }, []);

  // --- Reset Level Flight & Stick ---
  const resetFlight = useCallback(() => {
    const p = physRef.current;
    p.elevator = 0.0;
    p.theta = 0.0;
    p.thetaDot = 0.0;
    p.trimTheta = 0.0;
    setElevator(0.0);
    setTheta(0.0);
    setThetaDot(0.0);
    setHistory(Array.from({ length: 160 }, (_, i) => ({ t: i * 0.04, theta: 0, elev: 0 })));
  }, []);

  // --- Load the 4 Stability Scenarios ---
  const loadPreset = useCallback((mode) => {
    setActivePreset(mode);
    const p = physRef.current;
    p.theta = 0.0;
    p.thetaDot = 0.0;
    p.trimTheta = 0.0;

    if (mode === 1) {
      // 1. Overstable: CG far ahead of AC and NP
      setXAc(32.0); setXNp(52.0); setXCg(21.0);
      setElevator(15.0);
      p.xAc = 32.0; p.xNp = 52.0; p.xCg = 21.0; p.elevator = 15.0;
    } else if (mode === 2) {
      // 2. Positively Stable: CG comfortably between AC and NP
      setXAc(30.0); setXNp(52.0); setXCg(41.0);
      setElevator(8.0);
      p.xAc = 30.0; p.xNp = 52.0; p.xCg = 41.0; p.elevator = 8.0;
    } else if (mode === 3) {
      // 3. Neutrally Stable: CG exactly at NP
      setXAc(30.0); setXNp(52.0); setXCg(52.0);
      setElevator(0.0);
      p.xAc = 30.0; p.xNp = 52.0; p.xCg = 52.0; p.elevator = 0.0;
      p.theta = 10.0;
      p.trimTheta = 10.0;
      setTheta(10.0);
    } else if (mode === 4) {
      // 4. Negatively Stable / Unstable: CG aft of NP (Slow growing oscillation)
      setXAc(30.0); setXNp(52.0); setXCg(59.0);
      setElevator(0.0);
      p.xAc = 30.0; p.xNp = 52.0; p.xCg = 59.0; p.elevator = 0.0;
      p.theta = 2.0; // Small initial deflection to start slow oscillation
      p.thetaDot = 1.2;
      setTheta(2.0);
    }
  }, []);

  // --- Keyboard Controls (Up/Down Arrows, Spacebar, Keys 1-4) ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp') {
        setElevator((prev) => Math.min(20, +(prev + 1.5).toFixed(1)));
      } else if (e.key === 'ArrowDown') {
        setElevator((prev) => Math.max(-20, +(prev - 1.5).toFixed(1)));
      } else if (e.key === ' ') {
        setElevator(0.0);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        loadPreset(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loadPreset]);

  // --- 60-FPS Longitudinal Flight Physics Loop ---
  useEffect(() => {
    let rafId;
    let lastTime = performance.now();

    const stepPhysics = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      const p = physRef.current;
      const sm = p.xNp - p.xCg; // Static Margin (%)
      const tailArm = Math.max(20.0, 92.0 - p.xCg);
      const elevEff = 0.42 * (tailArm / 50.0);
      const kElev = 20.0 * elevEff;
      const elevMoment = kElev * p.elevator;

      if (Math.abs(sm) <= 1.5) {
        // 3. NEUTRALLY STABLE (CG == NP): Zero restoring stiffness.
        // Elevator input commands pitch rate; when stick returns to 0°, plane holds its new angle.
        const damping = 4.0;
        const accel = elevMoment * 0.42 - damping * p.thetaDot;
        p.thetaDot += accel * dt;
        p.theta = Math.max(-30, Math.min(30, p.theta + p.thetaDot * dt));
      } else if (sm > 1.5) {
        // 1 & 2. POSITIVELY STABLE or OVERSTABLE (CG ahead of NP):
        // Positive restoring stiffness proportional to Static Margin fights pitch changes.
        const kSpring = 1.65 * sm;
        const damping = 1.6 + 0.11 * sm;
        const accel = -kSpring * p.theta - damping * p.thetaDot + elevMoment;
        p.thetaDot += accel * dt;
        p.theta = Math.max(-32, Math.min(32, p.theta + p.thetaDot * dt));
      } else {
        // 4. NEGATIVELY STABLE / UNSTABLE (CG aft of NP):
        // Tuned for a SLOW, smooth, realistic growing-amplitude oscillation!
        const absSm = Math.abs(sm);
        const omegaSq = 1.45 + 0.12 * absSm;      // Slow oscillation frequency (period ~4.5 sec)
        const negDamping = -0.055 * Math.min(absSm, 14); // Gentle amplitude growth per cycle

        // Tiny background air ripple if completely still at 0°
        if (Math.abs(p.theta) < 0.08 && Math.abs(p.thetaDot) < 0.08 && Math.abs(p.elevator) < 0.1) {
          p.theta = 0.35;
        }

        const accel = -omegaSq * p.theta - negDamping * p.thetaDot + elevMoment * 0.55;
        p.thetaDot = Math.max(-22, Math.min(22, p.thetaDot + accel * dt));
        p.theta += p.thetaDot * dt;

        // Soft aerodynamic stall boundary at +/- 30 deg
        if (Math.abs(p.theta) > 30.0) {
          p.theta = Math.sign(p.theta) * 30.0;
          p.thetaDot *= -0.45;
        }
      }

      p.t += dt;
      p.flow = (p.flow + 32 * dt) % 24;

      setTheta(p.theta);
      setThetaDot(p.thetaDot);
      setFlowOffset(p.flow);
      setHistory((prev) => {
        const next = prev.slice(1);
        next.push({ t: p.t, theta: p.theta, elev: p.elevator });
        return next;
      });

      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // --- Computed Telemetry & Stick Force Metrics ---
  const sm = xNp - xCg;
  const tailArm = Math.max(20.0, 92.0 - xCg);
  const elevEff = 0.42 * (tailArm / 50.0);
  const kElev = 20.0 * elevEff;
  const stiffnessPenalty = 1.0 + Math.max(0.0, sm) * 0.14;
  const liveForceN = Math.abs(elevator) * 6.5 * stiffnessPenalty;

  let reqElev10 = 0.0;
  let reqForce10 = 0.0;
  if (Math.abs(sm) > 1.5) {
    const kSpring = 1.65 * sm;
    reqElev10 = (kSpring * 10.0) / kElev;
    reqForce10 = Math.abs(reqElev10) * 6.5 * (sm > 0 ? stiffnessPenalty : 1.0);
  }

  // --- Regime Classification ---
  const getRegimeInfo = () => {
    if (sm > 14.0) {
      return {
        id: 1,
        badge: '1. OVERSTABLE (EXCESSIVE STATIC MARGIN)',
        headline: 'HIGH PILOT EFFORT: CG is far forward ahead of AC & NP.',
        color: '#38bdf8', // Sky Blue
        borderClass: 'border-sky-500/80',
        bgBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
        explanation:
          'Both wing and tail generate strong nose-down restoring moments. Whenever the pilot pitches up or down, the plane snaps aggressively back to 0° trim—requiring exhausting stick force to maneuver.',
      };
    } else if (sm > 1.5) {
      return {
        id: 2,
        badge: '2. POSITIVELY STABLE (IDEAL HANDLING ZONE)',
        headline: 'OPTIMAL BALANCE: CG sits comfortably between AC and NP.',
        color: '#10b981', // Emerald Green
        borderClass: 'border-emerald-500/80',
        bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
        explanation:
          'Because CG is behind the wing AC (destabilizing) but ahead of the Neutral Point (stabilizing tail), the two moments partially cancel. The plane returns smoothly to level flight hands-off with light stick force.',
      };
    } else if (Math.abs(sm) <= 1.5) {
      return {
        id: 3,
        badge: '3. NEUTRALLY / CRITICALLY STABLE (CG = NP)',
        headline: 'ZERO RESTORING MOMENT: CG coincides with the Neutral Point.',
        color: '#f59e0b', // Amber Gold
        borderClass: 'border-amber-500/80',
        bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
        explanation:
          'Net pitching moment sensitivity is zero (Cmα = 0). If pitched up or down, the aircraft generates zero restoring torque and stays locked at that exact new inclination angle indefinitely.',
      };
    } else {
      return {
        id: 4,
        badge: '4. NEGATIVELY STABLE / UNSTABLE (CG AFT OF NP)',
        headline: 'GROWING AMPLITUDE OSCILLATION: CG is beyond the Neutral Point.',
        color: '#ef4444', // Red
        borderClass: 'border-rose-500/80',
        bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/50',
        explanation:
          'CG has moved behind the Neutral Point (SM < 0). Any small deflection creates a destabilizing moment that feeds slow, growing-amplitude oscillations. Use the Elevator Slider or ↑/↓ keys to counter-steer!',
      };
    }
  };

  const regime = getRegimeInfo();

  // --- Helper to Rotate 2D Coordinates Around Aircraft CG ---
  // SVG Viewport is 700 x 300. Aircraft chord maps x: [0..100]% -> [85..615] px, y_center = 152 px.
  const mapX = (pct) => 85 + (pct / 100) * 530;
  const cgSvgX = mapX(xCg);
  const cgSvgY = 152 - Math.max(-24, Math.min(24, theta * 0.65)); // Subtle vertical heave with pitch

  const rotPt = (pctX, offsetY) => {
    const rawX = mapX(pctX);
    const rawY = cgSvgY + offsetY;
    const rad = (-theta * Math.PI) / 180; // Nose-up (+theta) rotates counter-clockwise in screen coords (nose is on left)
    const dx = rawX - cgSvgX;
    const dy = rawY - cgSvgY;
    return {
      x: cgSvgX + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cgSvgY + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  const acPt = rotPt(xAc, 0);
  const cgPt = rotPt(xCg, 0);
  const npPt = rotPt(xNp, 0);
  const tailPt = rotPt(95.5, -5);

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 p-3 md:p-5 select-none">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4">
        
        {/* ================================================================
            TOP AVIONICS TELEMETRY HEADER BAR
        ================================================================ */}
        <header className="bg-[#0d1526] border border-slate-800/90 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-inner">
              <IconPlane className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-wide text-white flex items-center gap-2.5">
                AVIONICS LONGITUDINAL STABILITY & STICK FORCE STUDIO
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${regime.bgBadge}`}>
                  {regime.badge}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Interactive 2D Flight Dynamics • Movable AC, CG & Neutral Point • Real-Time Elevator Trim & Stick Force
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 font-medium">Hotkeys:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-300 font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-sky-300 font-mono">↓</kbd>
            <span>Elevator</span>
            <span className="text-slate-700">|</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-rose-300 font-mono">Space</kbd>
            <span>Center 0°</span>
            <span className="text-slate-700">|</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-300 font-mono">1-4</kbd>
            <span>Presets</span>
          </div>
        </header>

        {/* ================================================================
            MAIN 2-COLUMN COCKPIT DASHBOARD GRID
        ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* ==============================================================
              LEFT COLUMN (7 COLS): 2D FLIGHT VIEW + STATION BAR + SLIDERS
          ============================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* --- 1. 2D AIRCRAFT FLIGHT DYNAMICS VIEWPORT --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3.5 shadow-xl relative overflow-hidden">
              {/* Viewport Top Overlay HUD Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: regime.color }} />
                    2D FLIGHT DYNAMICS VIEWPORT
                  </span>
                  <span className="font-mono bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 rounded text-slate-200">
                    Pitch θ: <strong style={{ color: regime.color }}>{theta >= 0 ? `+${theta.toFixed(1)}°` : `${theta.toFixed(1)}°`}</strong>
                  </span>
                  <span className="font-mono bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 rounded text-slate-200">
                    Elevator δe: <strong className="text-rose-400">{elevator >= 0 ? `+${elevator.toFixed(1)}°` : `${elevator.toFixed(1)}°`}</strong>
                  </span>
                </div>

                {/* Legend Badges */}
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 inline-block bg-cyan-400" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                    AC ({xAc.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-400 border border-slate-950" />
                    CG ({xCg.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1 text-purple-300">
                    <span className="w-2.5 h-2.5 inline-block bg-purple-400 rotate-45" />
                    NP ({xNp.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-3 h-1.5 rounded-sm inline-block bg-rose-500" />
                    Elevator
                  </span>
                </div>
              </div>

              {/* 2D Interactive SVG Canvas */}
              <svg viewBox="0 0 700 295" className="w-full h-[275px] md:h-[295px] bg-[#070d19] rounded-lg border border-slate-800/60">
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#081121" />
                    <stop offset="50%" stopColor="#0b172a" />
                    <stop offset="100%" stopColor="#060c17" />
                  </linearGradient>
                  <linearGradient id="fuselageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="55%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                  <linearGradient id="canopyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                  <marker id="arrowGold" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                  <marker id="arrowCyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#22d3ee" />
                  </marker>
                  <marker id="arrowPurple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#c084fc" />
                  </marker>
                  <marker id="arrowRed" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#fb7185" />
                  </marker>
                </defs>

                {/* Sky Background */}
                <rect x="0" y="0" width="700" height="295" fill="url(#skyGrad)" />

                {/* Horizon Datum Line */}
                <line x1="0" y1="152" x2="700" y2="152" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="6 6" />

                {/* Left & Right Edge HUD Pitch Ladder (Placed at edges so it NEVER overlaps center vectors!) */}
                {[-20, -10, 10, 20].map((deg) => {
                  const yPos = 152 - deg * 3.8;
                  return (
                    <g key={deg} opacity="0.55">
                      <line x1="16" y1={yPos} x2="36" y2={yPos} stroke="#475569" strokeWidth="1.5" />
                      <text x="41" y={yPos + 3.5} fill="#64748b" fontSize="10" fontFamily="monospace">
                        {deg > 0 ? `+${deg}°` : `${deg}°`}
                      </text>
                      <line x1="664" y1={yPos} x2="684" y2={yPos} stroke="#475569" strokeWidth="1.5" />
                      <text x="659" y={yPos + 3.5} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                        {deg > 0 ? `+${deg}°` : `${deg}°`}
                      </text>
                    </g>
                  );
                })}

                {/* Animated Relative Airflow Streamlines */}
                <text x="18" y="24" fill="#38bdf8" fontSize="10" fontWeight="bold" opacity="0.8" letterSpacing="0.8">
                  RELATIVE AIRFLOW ➔
                </text>
                {[42, 85, 218, 258].map((rowY) =>
                  [0, 1, 2, 3, 4].map((col) => {
                    const xStart = 20 + ((col * 135 + flowOffset * 5.5) % 640);
                    return (
                      <g key={`${rowY}-${col}`} opacity="0.32">
                        <line x1={xStart} y1={rowY} x2={xStart + 34} y2={rowY} stroke="#38bdf8" strokeWidth="1.3" />
                        <polygon points={`${xStart + 38},${rowY} ${xStart + 32},${rowY - 2.5} ${xStart + 32},${rowY + 2.5}`} fill="#38bdf8" />
                      </g>
                    );
                  })
                )}

                {/* ============================================================
                    ROTATING 2D AIRCRAFT BODY GROUP (Pivots around CG!)
                ============================================================ */}
                <g transform={`translate(${cgSvgX}, ${cgSvgY}) rotate(${-theta}) translate(${-cgSvgX}, ${-cgSvgY})`}>
                  {/* Vertical Tail Fin */}
                  <polygon
                    points={`${mapX(74)},${cgSvgY - 16} ${mapX(88)},${cgSvgY - 78} ${mapX(96)},${cgSvgY - 78} ${mapX(97)},${cgSvgY - 6}`}
                    fill="#334155"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  {/* Rudder Accent Stripe */}
                  <polygon
                    points={`${mapX(92)},${cgSvgY - 76} ${mapX(95.5)},${cgSvgY - 76} ${mapX(96.5)},${cgSvgY - 12} ${mapX(92.5)},${cgSvgY - 12}`}
                    fill="#475569"
                  />

                  {/* Under-Wing Jet Engine Nacelle */}
                  <path
                    d={`M ${mapX(30)} ${cgSvgY + 10} L ${mapX(46)} ${cgSvgY + 10} L ${mapX(44)} ${cgSvgY + 25} L ${mapX(30)} ${cgSvgY + 25} Z`}
                    fill="#475569"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />

                  {/* Main Sleek Jet Fuselage Silhouette */}
                  <path
                    d={`
                      M ${mapX(0)} ${cgSvgY + 2}
                      Q ${mapX(6)} ${cgSvgY - 10}, ${mapX(15)} ${cgSvgY - 18}
                      Q ${mapX(23)} ${cgSvgY - 24}, ${mapX(34)} ${cgSvgY - 21}
                      L ${mapX(73)} ${cgSvgY - 19}
                      Q ${mapX(87)} ${cgSvgY - 14}, ${mapX(99)} ${cgSvgY - 4}
                      L ${mapX(99)} ${cgSvgY + 1}
                      Q ${mapX(90)} ${cgSvgY + 12}, ${mapX(72)} ${cgSvgY + 16}
                      L ${mapX(22)} ${cgSvgY + 16}
                      Q ${mapX(9)} ${cgSvgY + 13}, ${mapX(0)} ${cgSvgY + 2}
                      Z
                    `}
                    fill="url(#fuselageGrad)"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />

                  {/* Cockpit Glass Canopy */}
                  <path
                    d={`
                      M ${mapX(12)} ${cgSvgY - 13}
                      Q ${mapX(18)} ${cgSvgY - 24}, ${mapX(26)} ${cgSvgY - 22}
                      L ${mapX(31)} ${cgSvgY - 18}
                      L ${mapX(14)} ${cgSvgY - 11}
                      Z
                    `}
                    fill="url(#canopyGrad)"
                    stroke="#0f172a"
                    strokeWidth="1.4"
                  />

                  {/* Main Swept Wing Fairing */}
                  <polygon
                    points={`${mapX(26)},${cgSvgY + 3} ${mapX(50)},${cgSvgY + 5} ${mapX(47)},${cgSvgY - 6} ${mapX(29)},${cgSvgY - 7}`}
                    fill="#64748b"
                    stroke="#0f172a"
                    strokeWidth="1.6"
                  />

                  {/* Fixed Horizontal Stabilizer */}
                  <polygon
                    points={`${mapX(80)},${cgSvgY - 2} ${mapX(91)},${cgSvgY - 2} ${mapX(91)},${cgSvgY - 9} ${mapX(82)},${cgSvgY - 9}`}
                    fill="#64748b"
                    stroke="#0f172a"
                    strokeWidth="1.4"
                  />

                  {/* Movable Elevator Control Flap (Articulates with Pilot Stick!) */}
                  <g
                    transform={`translate(${mapX(91)}, ${cgSvgY - 5.5}) rotate(${-elevator * 1.45}) translate(${-mapX(91)}, ${-(cgSvgY - 5.5)})`}
                  >
                    <polygon
                      points={`${mapX(91)},${cgSvgY - 1.5} ${mapX(100.5)},${cgSvgY - 3} ${mapX(100.5)},${cgSvgY - 8} ${mapX(91)},${cgSvgY - 9.5}`}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="1.4"
                    />
                  </g>

                  {/* Fuselage Datum Chord Reference Line */}
                  <line
                    x1={mapX(4)}
                    y1={cgSvgY}
                    x2={mapX(96)}
                    y2={cgSvgY}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </g>

                {/* ============================================================
                    FORCE VECTORS & 3 MOVABLE CENTERS (AC, CG, NP)
                    Labels are placed at arrow tips so they NEVER overlap!
                ============================================================ */}
                {/* 1. Wing Lift Vector at AC (Cyan) */}
                <line
                  x1={acPt.x}
                  y1={acPt.y - 8}
                  x2={acPt.x}
                  y2={acPt.y - 48}
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                  markerEnd="url(#arrowCyan)"
                />
                <text x={acPt.x} y={acPt.y - 54} fill="#22d3ee" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  L_wing (AC)
                </text>

                {/* 2. Restoring Aerodynamic Lift Vector at Neutral Point (Violet) */}
                {(() => {
                  const liftLen = Math.max(28, Math.min(68, 44 + theta * 1.2));
                  return (
                    <g>
                      <line
                        x1={npPt.x}
                        y1={npPt.y - 8}
                        x2={npPt.x}
                        y2={npPt.y - liftLen}
                        stroke="#c084fc"
                        strokeWidth="2.5"
                        markerEnd="url(#arrowPurple)"
                      />
                      <text x={npPt.x} y={npPt.y - liftLen - 7} fill="#c084fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                        ΔLift (NP)
                      </text>
                    </g>
                  );
                })()}

                {/* 3. Weight Vector at Center of Gravity (Gold - Always straight down) */}
                <line
                  x1={cgPt.x}
                  y1={cgPt.y + 10}
                  x2={cgPt.x}
                  y2={cgPt.y + 66}
                  stroke="#fbbf24"
                  strokeWidth="2.8"
                  markerEnd="url(#arrowGold)"
                />
                <text x={cgPt.x} y={cgPt.y + 80} fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Weight (CG)
                </text>

                {/* 4. Elevator Tail Force Vector (Rose Red - Appears when stick is deflected) */}
                {Math.abs(elevator) > 0.3 && (() => {
                  // Pulling stick (+elevator) deflects elevator UP -> creates DOWNWARD tail force -> pitches nose UP
                  const tailDy = elevator * 2.1;
                  const tipY = tailPt.y + tailDy;
                  return (
                    <g>
                      <line
                        x1={tailPt.x}
                        y1={tailPt.y}
                        x2={tailPt.x}
                        y2={tipY}
                        stroke="#fb7185"
                        strokeWidth="2.6"
                        markerEnd="url(#arrowRed)"
                      />
                      <text
                        x={tailPt.x - 6}
                        y={tailDy > 0 ? tipY + 14 : tipY - 8}
                        fill="#fb7185"
                        fontSize="10.5"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        Tail Force
                      </text>
                    </g>
                  );
                })()}

                {/* Center Markers Drawn Cleanly on Top of Fuselage */}
                {/* AC Marker (Cyan Triangle) */}
                <polygon
                  points={`${acPt.x},${acPt.y - 8} ${acPt.x - 7},${acPt.y + 6} ${acPt.x + 7},${acPt.y + 6}`}
                  fill="#00e5ff"
                  stroke="#090d16"
                  strokeWidth="1.8"
                />
                {/* NP Marker (Neon Violet Diamond) */}
                <polygon
                  points={`${npPt.x},${npPt.y - 8} ${npPt.x + 8},${npPt.y} ${npPt.x},${npPt.y + 8} ${npPt.x - 8},${npPt.y}`}
                  fill="#c084fc"
                  stroke="#090d16"
                  strokeWidth="1.8"
                />
                {/* CG Marker (Gold Circle with Target Crosshair) */}
                <circle cx={cgPt.x} cy={cgPt.y} r="8" fill="#fbbf24" stroke="#090d16" strokeWidth="2.2" />
                <circle cx={cgPt.x} cy={cgPt.y} r="2.5" fill="#090d16" />

                {/* Bottom-Left Regime Status Pill inside Viewport */}
                <g transform="translate(16, 256)">
                  <rect x="0" y="0" width="325" height="26" rx="6" fill={regime.color} />
                  <text x="12" y="17" fill="#060b14" fontSize="11.5" fontWeight="800" letterSpacing="0.4">
                    {regime.badge}
                  </text>
                </g>
              </svg>
            </div>

            {/* --- 2. 3-TIER FUSELAGE LONGITUDINAL STATION BAR (Zero Badge Overlap!) --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200 tracking-wide">
                  FUSELAGE LONGITUDINAL STATION (% FROM NOSE TO TAIL)
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40 border border-sky-400" /> Overstable Zone
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-400" /> Ideal Stable Zone
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-400" /> Unstable Zone (Aft of NP)
                  </span>
                </div>
              </div>

              {/* 3-Tier Track Container */}
              <div className="relative h-14 bg-[#070d19] rounded-lg border border-slate-800 overflow-hidden">
                {/* Colored Stability Zones */}
                <div
                  className="absolute top-0 bottom-0 bg-sky-500/20 border-r border-sky-400/30"
                  style={{ left: '0%', width: `${xAc}%` }}
                />
                {xNp > xAc && (
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/25"
                    style={{ left: `${xAc}%`, width: `${xNp - xAc}%` }}
                  />
                )}
                <div
                  className="absolute top-0 bottom-0 bg-rose-500/20 border-l border-rose-400/30"
                  style={{ left: `${xNp}%`, width: `${100 - xNp}%` }}
                />

                {/* Vertical Lines & Staggered 3-Row Labels (Top: AC, Middle: CG, Bottom: NP) */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400" style={{ left: `${xAc}%` }}>
                  <span className="absolute top-1 left-1.5 px-1.5 py-0.2 bg-slate-950/90 border border-cyan-400/60 rounded text-[10px] font-bold text-cyan-300 whitespace-nowrap">
                    AC {xAc.toFixed(0)}%
                  </span>
                </div>

                <div className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10" style={{ left: `${xCg}%` }}>
                  <span className="absolute top-5 left-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded text-[10.5px] font-extrabold whitespace-nowrap shadow">
                    CG {xCg.toFixed(0)}%
                  </span>
                </div>

                <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-purple-400" style={{ left: `${xNp}%` }}>
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.2 bg-slate-950/90 border border-purple-400/60 rounded text-[10px] font-bold text-purple-300 whitespace-nowrap">
                    NP {xNp.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1 px-1">
                <span>0% (Nose)</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100% (Tail)</span>
              </div>
            </div>

            {/* --- 3. INTERACTIVE FLIGHT & CENTER SLIDERS PANEL --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                  <IconSliders className="w-4 h-4 text-sky-400" />
                  AERODYNAMIC CENTERS & PILOT ELEVATOR STICK CONTROLS
                </span>
                <span className="text-[11px] text-slate-400">Drag sliders or use ↑ / ↓ arrow keys</span>
              </div>

              {/* Elevator Stick Slider Row */}
              <div className="grid grid-cols-12 items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="col-span-4 sm:col-span-3">
                  <div className="text-xs font-bold text-rose-400">Elevator Stick (δe)</div>
                  <div className="text-[10px] text-slate-400">[-Push Nose Down / +Pull Up]</div>
                </div>
                <div className="col-span-5 sm:col-span-6 flex items-center">
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={elevator}
                    onChange={(e) => setElevator(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg accent-rose-500"
                  />
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <span className="font-mono text-xs font-bold text-rose-400 w-12 text-right">
                    {elevator >= 0 ? `+${elevator.toFixed(1)}°` : `${elevator.toFixed(1)}°`}
                  </span>
                  <button
                    onClick={() => setElevator(0.0)}
                    className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-300 text-xs font-bold transition"
                  >
                    Center 0°
                  </button>
                </div>
              </div>

              {/* AC, CG, NP Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* AC Slider */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-cyan-300">Aerodynamic Center (AC)</span>
                    <span className="font-mono text-cyan-400">{xAc.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    step="0.5"
                    value={xAc}
                    onChange={(e) => setXAc(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-400"
                  />
                </div>

                {/* CG Slider */}
                <div className="bg-slate-900/50 border border-amber-500/40 rounded-lg p-2.5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-amber-300">Center of Gravity (CG)</span>
                    <span className="font-mono text-amber-400">{xCg.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="75"
                    step="0.5"
                    value={xCg}
                    onChange={(e) => setXCg(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg accent-amber-400"
                  />
                </div>

                {/* NP Slider */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-purple-300">Neutral Point (NP)</span>
                    <span className="font-mono text-purple-400">{xNp.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="75"
                    step="0.5"
                    value={xNp}
                    onChange={(e) => setXNp(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg accent-purple-400"
                  />
                </div>
              </div>

              {/* Action Buttons Row: Gust Pitch Up, Gust Pitch Down, Reset */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <button
                  onClick={() => applyDisturbance(8.0)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/50 text-sky-200 text-xs font-bold transition shadow"
                >
                  <IconArrowUp /> Gust Pitch Up (+8°)
                </button>
                <button
                  onClick={() => applyDisturbance(-8.0)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/50 text-sky-200 text-xs font-bold transition shadow"
                >
                  <IconArrowDown /> Gust Pitch Down (-8°)
                </button>
                <button
                  onClick={resetFlight}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition shadow"
                >
                  <IconRotateCcw /> Reset Level & Stick
                </button>
              </div>
            </div>
          </div>

          {/* ==============================================================
              RIGHT COLUMN (5 COLS): TELEMETRY GRAPH + GAUGE + DIAGNOSTICS + PRESETS
          ============================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* --- 1. REAL-TIME TELEMETRY OSCILLOSCOPE CHART --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                  <IconActivity className="w-4 h-4 text-emerald-400" />
                  REAL-TIME TELEMETRY: PITCH ATTITUDE θ(t) & ELEVATOR δe(t)
                </span>
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="flex items-center gap-1.5" style={{ color: regime.color }}>
                    <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: regime.color }} />
                    Pitch θ (°)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-3 h-0.5 inline-block bg-rose-400 border-b border-dashed" />
                    Elevator Stick δe (°)
                  </span>
                </div>
              </div>

              <svg viewBox="0 0 500 175" className="w-full h-[165px] bg-[#070d19] rounded-lg border border-slate-800/70">
                {/* Horizontal Reference Grid Lines */}
                {[-20, -10, 0, 10, 20].map((val) => {
                  const y = 87.5 - (val / 32) * 75;
                  return (
                    <g key={val}>
                      <line
                        x1="34"
                        y1={y}
                        x2="490"
                        y2={y}
                        stroke={val === 0 ? '#334155' : '#1e293b'}
                        strokeWidth={val === 0 ? '1.4' : '1'}
                        strokeDasharray={val === 0 ? '4 4' : '2 3'}
                      />
                      <text x="28" y={y + 3} fill="#64748b" fontSize="9.5" fontFamily="monospace" textAnchor="end">
                        {val > 0 ? `+${val}°` : `${val}°`}
                      </text>
                    </g>
                  );
                })}

                {/* Elevator Deflection Trace (Dashed Rose Red) */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                    points={history
                      .map((pt, i) => {
                        const x = 35 + (i / (history.length - 1)) * 452;
                        const y = 87.5 - (pt.elev / 32) * 75;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Aircraft Pitch Attitude Trace (Solid Regime Color) */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={regime.color}
                    strokeWidth="2.5"
                    points={history
                      .map((pt, i) => {
                        const x = 35 + (i / (history.length - 1)) * 452;
                        const y = 87.5 - (pt.theta / 32) * 75;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>

            {/* --- 2. PILOT STICK EFFORT GAUGE --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <IconGauge className="w-4 h-4 text-amber-400" />
                  PILOT STICK EFFORT GAUGE: <strong className="text-white font-mono">{liveForceN.toFixed(0)} N</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Hold +10° Climb Requires: <strong className="text-slate-200">{reqElev10 >= 0 ? `+${reqElev10.toFixed(1)}°` : `${reqElev10.toFixed(1)}°`}</strong> ({reqForce10.toFixed(0)} N)
                </span>
              </div>

              {/* Segmented Force Bar */}
              <div className="relative h-6 bg-[#070d19] rounded-lg border border-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (liveForceN / 400) * 100)}%`,
                    backgroundColor:
                      liveForceN < 110 ? '#10b981' : liveForceN < 240 ? '#f59e0b' : '#ef4444',
                  }}
                />
                {/* Threshold Markers */}
                <div className="absolute top-0 bottom-0 left-[27.5%] border-r border-dashed border-slate-600" />
                <div className="absolute top-0 bottom-0 left-[60%] border-r border-dashed border-slate-600" />

                <div className="absolute inset-0 grid grid-cols-3 items-center text-[10px] font-bold tracking-wider text-slate-300 pointer-events-none">
                  <span className="text-center">LIGHT (&lt;110 N)</span>
                  <span className="text-center">MODERATE</span>
                  <span className="text-center">EXCESSIVE (&gt;240 N)</span>
                </div>
              </div>
            </div>

            {/* --- 3. STABILITY DIAGNOSTICS & 4-CARD METRICS (Zero Overflow!) --- */}
            <div className={`bg-[#0b1324] border-2 ${regime.borderClass} rounded-xl p-4 shadow-xl flex flex-col gap-3`}>
              <div>
                <div className="text-xs font-extrabold tracking-wide uppercase" style={{ color: regime.color }}>
                  {regime.headline}
                </div>
              </div>

              {/* 4 Self-Contained Telemetry Metric Cards (Never clips or overflows!) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#070d19] border border-slate-800/90 rounded-lg p-2">
                  <div className="text-[10px] text-slate-400">Static Margin</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {sm >= 0 ? `+${sm.toFixed(1)}%` : `${sm.toFixed(1)}%`}
                  </div>
                </div>
                <div className="bg-[#070d19] border border-slate-800/90 rounded-lg p-2">
                  <div className="text-[10px] text-slate-400">Live Pitch (θ)</div>
                  <div className="text-sm font-mono font-bold" style={{ color: regime.color }}>
                    {theta >= 0 ? `+${theta.toFixed(1)}°` : `${theta.toFixed(1)}°`}
                  </div>
                </div>
                <div className="bg-[#070d19] border border-slate-800/90 rounded-lg p-2">
                  <div className="text-[10px] text-slate-400">Trim @ +10° Pitch</div>
                  <div className="text-sm font-mono font-bold text-rose-400">
                    {reqElev10 >= 0 ? `+${reqElev10.toFixed(1)}°` : `${reqElev10.toFixed(1)}°`}
                  </div>
                </div>
                <div className="bg-[#070d19] border border-slate-800/90 rounded-lg p-2">
                  <div className="text-[10px] text-slate-400">Force @ +10°</div>
                  <div className="text-sm font-mono font-bold text-amber-400">
                    {reqForce10.toFixed(0)} N
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/90 pt-2.5">
                {regime.explanation}
              </p>
            </div>

            {/* --- 4. QUICK STABILITY SCENARIO PRESET CARDS (KEYS 1 - 4) --- */}
            <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3.5 shadow-lg">
              <div className="text-xs font-bold text-slate-300 mb-2.5 tracking-wide">
                QUICK STABILITY SCENARIO PRESETS (CLICK OR PRESS KEYS 1 - 4)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => loadPreset(1)}
                  className={`text-left p-2.5 rounded-lg border transition ${
                    activePreset === 1
                      ? 'bg-sky-950/90 border-sky-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-sky-500/50'
                  }`}
                >
                  <div className="text-xs font-bold text-sky-400">1. Overstable (Heavy Stick)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CG=21% (Far forward) • Pulls +15° stick
                  </div>
                </button>

                <button
                  onClick={() => loadPreset(2)}
                  className={`text-left p-2.5 rounded-lg border transition ${
                    activePreset === 2
                      ? 'bg-emerald-950/90 border-emerald-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-400">2. Positively Stable (Ideal)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CG=41% (Between AC & NP) • Smooth trim
                  </div>
                </button>

                <button
                  onClick={() => loadPreset(3)}
                  className={`text-left p-2.5 rounded-lg border transition ${
                    activePreset === 3
                      ? 'bg-amber-950/90 border-amber-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-400">3. Neutrally Stable (CG = NP)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CG=52% (On Neutral Point) • Holds +10°
                  </div>
                </button>

                <button
                  onClick={() => loadPreset(4)}
                  className={`text-left p-2.5 rounded-lg border transition ${
                    activePreset === 4
                      ? 'bg-rose-950/90 border-rose-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/50'
                  }`}
                >
                  <div className="text-xs font-bold text-rose-400">4. Negatively Stable (Unstable)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CG=59% (Aft of NP) • Slow growing wave
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}