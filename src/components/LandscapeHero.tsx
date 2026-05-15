/**
 * Inline SVG of a green mountain landscape — loads instantly, no third-party
 * host. Used as the visual anchor for the Apple-style hero on the Landing
 * page and the Kesehatan Finansial header.
 */
export default function LandscapeHero({
  className = '',
  height = 220,
}: {
  className?: string
  height?: number
}) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className={`landscape-svg ${className}`}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id="mtnBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86c294" />
          <stop offset="100%" stopColor="#4f9d63" />
        </linearGradient>
        <linearGradient id="mtnMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f9d63" />
          <stop offset="100%" stopColor="#2f7d3a" />
        </linearGradient>
        <linearGradient id="mtnFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f7d3a" />
          <stop offset="100%" stopColor="#1c4a23" />
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Back mountain range */}
      <path
        d="M0,180 L120,140 L260,170 L400,110 L560,150 L720,90 L880,140 L1040,100 L1200,150 L1340,120 L1440,150 L1440,320 L0,320 Z"
        fill="url(#mtnBack)"
        opacity="0.7"
      />

      {/* Mid mountain range */}
      <path
        d="M0,220 L160,180 L320,210 L480,160 L640,200 L800,150 L960,200 L1120,160 L1280,210 L1440,180 L1440,320 L0,320 Z"
        fill="url(#mtnMid)"
        opacity="0.9"
      />

      {/* Mist band */}
      <rect x="0" y="200" width="1440" height="40" fill="url(#mist)" />

      {/* Front hills */}
      <path
        d="M0,260 C160,230 320,250 480,235 C640,220 800,250 960,240 C1120,230 1280,255 1440,240 L1440,320 L0,320 Z"
        fill="url(#mtnFront)"
      />

      {/* Trees silhouette */}
      <g fill="#1c4a23" opacity="0.85">
        <polygon points="120,260 130,242 140,260" />
        <polygon points="200,265 212,243 224,265" />
        <polygon points="320,258 332,238 344,258" />
        <polygon points="470,262 482,242 494,262" />
        <polygon points="620,260 632,238 644,260" />
        <polygon points="790,258 802,238 814,258" />
        <polygon points="940,262 952,242 964,262" />
        <polygon points="1090,260 1102,238 1114,260" />
        <polygon points="1250,262 1262,240 1274,262" />
        <polygon points="1380,258 1392,236 1404,258" />
      </g>
    </svg>
  )
}
