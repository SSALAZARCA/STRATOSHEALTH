import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ size = 36, showText = true, variant = "light" }: LogoProps) {
  const uniqueId = React.useId().replace(/:/g, "");
  
  // Aspect ratio math: if showText is true, the viewBox is 620x100 (aspect ratio 6.2)
  // Otherwise, it is a square 100x100
  const svgWidth = showText ? size * 6.2 : size;
  const viewBox = showText ? "0 0 620 100" : "0 0 100 100";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", userSelect: "none" }}>
      {/* Self-contained CSS for high-tech holographic animations */}
      <style>{`
        @keyframes cyberRotateCW-${uniqueId} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cyberRotateCCW-${uniqueId} {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes corePulse-${uniqueId} {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 12px #06b6d4); }
        }
        @keyframes circuitPulse-${uniqueId} {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; stroke: #f59e0b; }
        }
        @keyframes chromeFloat-${uniqueId} {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        .stratos-logo-container-${uniqueId}:hover .chrome-swirl-${uniqueId} {
          filter: saturate(1.5) drop-shadow(0 8px 20px rgba(6, 182, 212, 0.6));
          transform: scale(1.05) rotate(5deg);
        }
        .stratos-logo-container-${uniqueId}:hover .tech-core-${uniqueId} {
          transform: scale(1.1);
        }
        .chrome-swirl-${uniqueId} {
          transform-origin: 50px 50px;
          animation: chromeFloat-${uniqueId} 6s ease-in-out infinite;
          transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.6s ease;
        }
        .tech-core-${uniqueId} {
          transform-origin: 50px 50px;
          transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
      `}</style>

      <div 
        className={`stratos-logo-container-${uniqueId}`}
        style={{ 
          position: "relative", 
          width: svgWidth, 
          height: size, 
          display: "flex", 
          alignItems: "center"
        }}
      >
        <svg
          width={svgWidth}
          height={size}
          viewBox={viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Cosmic Blur Filter */}
            <filter id={`hologram-glow-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glowing Neon Gradients */}
            <radialGradient id={`core-glow-grad-${uniqueId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`neon-cyan-purple-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Futuristic Chrome/Liquid Metal Swirl Gradients */}
            <linearGradient id={`chrome-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#cbd5e1" />
              <stop offset="30%" stopColor="#475569" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="65%" stopColor="#94a3b8" />
              <stop offset="85%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <linearGradient id={`chrome-highlight-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
            </linearGradient>

            {/* Dynamic Shifting Gradient for STRATOS text */}
            <linearGradient id={`stratos-text-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {variant === "light" ? (
                <>
                  <stop offset="0%" stopColor="#1e3b8b">
                    <animate attributeName="stop-color" values="#1e3b8b;#4f46e5;#06b6d4;#1e3b8b" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#3b82f6">
                    <animate attributeName="stop-color" values="#3b82f6;#8b5cf6;#4f46e5;#3b82f6" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#06b6d4">
                    <animate attributeName="stop-color" values="#06b6d4;#3b82f6;#1e3b8b;#06b6d4" dur="6s" repeatCount="indefinite" />
                  </stop>
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ffffff">
                    <animate attributeName="stop-color" values="#ffffff;#c084fc;#22d3ee;#ffffff" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#67e8f9">
                    <animate attributeName="stop-color" values="#67e8f9;#ffffff;#f472b6;#67e8f9" dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#c084fc">
                    <animate attributeName="stop-color" values="#c084fc;#67e8f9;#ffffff;#c084fc" dur="6s" repeatCount="indefinite" />
                  </stop>
                </>
              )}
            </linearGradient>

            {/* Dynamic Shifting Gradient for HEALTH text */}
            <linearGradient id={`health-text-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {variant === "light" ? (
                <>
                  <stop offset="0%" stopColor="#2563eb">
                    <animate attributeName="stop-color" values="#2563eb;#0d9488;#10b981;#2563eb" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#0d9488">
                    <animate attributeName="stop-color" values="#0d9488;#10b981;#2563eb;#0d9488" dur="4s" repeatCount="indefinite" />
                  </stop>
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#a78bfa">
                    <animate attributeName="stop-color" values="#a78bfa;#38bdf8;#34d399;#a78bfa" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#38bdf8">
                    <animate attributeName="stop-color" values="#38bdf8;#34d399;#a78bfa;#38bdf8" dur="4s" repeatCount="indefinite" />
                  </stop>
                </>
              )}
            </linearGradient>
          </defs>

          {/* Cybernetic Holographic Core (Background display) */}
          <g className={`tech-core-${uniqueId}`}>
            {/* Hologram base radial glow */}
            <circle cx="50" cy="50" r="46" fill={`url(#core-glow-grad-${uniqueId})`} opacity="0.45" />

            {/* Inner HUD Circular Rings */}
            <circle cx="50" cy="50" r="43" stroke="url(#neon-cyan-purple-uniqueId)" strokeWidth="1" strokeOpacity="0.25" />
            
            {/* Spinning Dashed HUD Orbitals */}
            <circle 
              cx="50" 
              cy="50" 
              r="38" 
              stroke="#06b6d4" 
              strokeWidth="1.5" 
              strokeDasharray="120 40 10 30" 
              strokeOpacity="0.75" 
              style={{ animation: `cyberRotateCW-${uniqueId} 12s linear infinite`, transformOrigin: "50px 50px" }} 
            />
            
            <circle 
              cx="50" 
              cy="50" 
              r="34" 
              stroke="#d946ef" 
              strokeWidth="1" 
              strokeDasharray="40 80 15 25" 
              strokeOpacity="0.6" 
              style={{ animation: `cyberRotateCCW-${uniqueId} 8s linear infinite`, transformOrigin: "50px 50px" }} 
            />

            {/* Glowing Tech Circuit Board traces (Background detail) */}
            <g opacity="0.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round">
              {/* Circuit 1 */}
              <path d="M 28 35 L 36 35 L 42 41" className={`circuit-line-${uniqueId}`} style={{ animation: `circuitPulse-${uniqueId} 4s ease-in-out infinite` }} />
              <circle cx="28" cy="35" r="1.5" fill="#fbbf24" />
              {/* Circuit 2 */}
              <path d="M 72 65 L 64 65 L 58 59" className={`circuit-line-${uniqueId}`} style={{ animation: `circuitPulse-${uniqueId} 4s ease-in-out infinite 1s` }} />
              <circle cx="72" cy="65" r="1.5" fill="#fbbf24" />
              {/* Circuit 3 */}
              <path d="M 68 32 L 60 40 L 58 40" className={`circuit-line-${uniqueId}`} style={{ animation: `circuitPulse-${uniqueId} 4s ease-in-out infinite 2s` }} />
              <circle cx="68" cy="32" r="1.5" fill="#fbbf24" />
            </g>

            {/* Center glowing capsule (Minimalist tech medical cross core) */}
            <g style={{ animation: `corePulse-${uniqueId} 3s ease-in-out infinite` }}>
              <rect x="46" y="32" width="8" height="36" rx="4" fill="#22d3ee" filter={`url(#hologram-glow-${uniqueId})`} />
              <rect x="32" y="46" width="36" height="8" rx="4" fill="#22d3ee" filter={`url(#hologram-glow-${uniqueId})`} />
              <rect x="46" y="32" width="8" height="36" rx="4" fill="#ffffff" />
              <rect x="32" y="46" width="36" height="8" rx="4" fill="#ffffff" />
            </g>
          </g>

          {/* Swirling Liquid Metallic Chrome / Mercury Wave (Wrapping the core) */}
          <g className={`chrome-swirl-${uniqueId}`} filter="drop-shadow(0 6px 12px rgba(15, 23, 42, 0.3))">
            {/* Swirling path 1 */}
            <path
              d="M 16,56 
                 C 14,24 40,8 64,12 
                 C 88,16 94,40 86,68 
                 C 78,96 48,94 30,86 
                 C 12,78 18,88 14,72
                 C 10,56 18,88 32,84
                 C 46,80 78,86 82,62
                 C 86,38 78,22 58,18
                 C 38,14 22,28 20,48
                 Z"
              fill={`url(#chrome-grad-${uniqueId})`}
            />
            {/* Mirror gloss highlight path on top */}
            <path
              d="M 16,56 
                 C 14,24 40,8 64,12 
                 C 88,16 94,40 86,68 
                 C 78,96 48,94 30,86 
                 C 12,78 18,88 14,72
                 C 10,56 18,88 32,84
                 C 46,80 78,86 82,62
                 C 86,38 78,22 58,18
                 C 38,14 22,28 20,48
                 Z"
              fill={`url(#chrome-highlight-${uniqueId})`}
              style={{ mixBlendMode: "overlay" }}
            />
            
            {/* Starburst Flares (Holographic light rays) */}
            <g transform="translate(68, 16)" stroke="#ffffff" strokeWidth="1">
              <line x1="-8" y1="0" x2="8" y2="0" />
              <line x1="0" y1="-8" x2="0" y2="8" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" filter="drop-shadow(0 0 3px #06b6d4)" />
            </g>
            <g transform="translate(26, 82)" stroke="#ffffff" strokeWidth="0.8">
              <line x1="-5" y1="0" x2="5" y2="0" />
              <line x1="0" y1="-5" x2="0" y2="5" />
              <circle cx="0" cy="0" r="1.5" fill="#ffffff" filter="drop-shadow(0 0 2px #d946ef)" />
            </g>
          </g>

          {/* Integrated Dynamic Text (Enlarged and bolded) */}
          {showText && (
            <text
              x="125"
              y="66"
              fill={`url(#stratos-text-grad-${uniqueId})`}
              fontFamily="'Outfit', 'Inter', -apple-system, sans-serif"
              fontSize="52"
              fontWeight="900"
              letterSpacing="-2.2"
              style={{ pointerEvents: "none" }}
            >
              STRATOS
              <tspan 
                dx="12" 
                fontWeight="300" 
                fill={`url(#health-text-grad-${uniqueId})`}
                letterSpacing="-1.2"
              >
                HEALTH
              </tspan>
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
