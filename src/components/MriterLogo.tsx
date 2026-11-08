import React from 'react'

interface MriterLogoProps {
  size?: number
  className?: string
  variant?: 'monogram' | 'app-icon'
}

/**
 * MriterLogo — The Architectural Folio (Concept 2)
 *
 * An architectural synthesis of two folded manuscript folios forming
 * the letter 'M', bound with a golden silk bookmark ribbon.
 */
export const MriterLogo: React.FC<MriterLogoProps> = ({
  size = 20,
  className = '',
  variant = 'monogram',
}) => {
  if (variant === 'app-icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="512" height="512" rx="112" fill="url(#mriter-app-bg)" />
        <rect
          x="8"
          y="8"
          width="496"
          height="496"
          rx="104"
          stroke="url(#mriter-app-sheen)"
          strokeWidth="2"
          fill="none"
        />

        <g filter="url(#mriter-app-shadow)">
          {/* Top Anchor behind pages */}
          <path d="M 242 110 L 270 110 L 270 180 L 242 180 Z" fill="#8c5f1c" />

          {/* Left Folio */}
          <path
            d="M 104 380 L 104 186 C 104 136 136 112 182 112 C 220 112 248 140 256 208 L 256 364 C 248 320 220 298 182 298 C 136 298 104 326 104 380 Z"
            fill="url(#mriter-page-left)"
          />
          <path
            d="M 182 112 C 220 112 248 140 256 208 L 256 364 C 248 320 220 298 182 298 L 182 112 Z"
            fill="url(#mriter-fold-left)"
            opacity="0.9"
          />

          {/* Right Folio */}
          <path
            d="M 408 380 L 408 186 C 408 136 376 112 330 112 C 292 112 264 140 256 208 L 256 364 C 264 320 292 298 330 298 C 376 298 408 326 408 380 Z"
            fill="url(#mriter-page-right)"
          />
          <path
            d="M 330 112 C 292 112 264 140 256 208 L 256 364 C 264 320 292 298 330 298 L 330 112 Z"
            fill="url(#mriter-fold-right)"
            opacity="0.95"
          />

          {/* Spine & Page Rim */}
          <path
            d="M 104 380 L 104 186 C 104 136 136 112 182 112 C 220 112 248 140 256 208 C 264 140 292 112 330 112 C 376 112 408 136 408 186 L 408 380"
            stroke="#cfc5b4"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />

          {/* Ribbon */}
          <path
            d="M 242 160 L 270 160 L 270 324 L 256 306 L 242 324 Z"
            fill="url(#mriter-ribbon-gold)"
          />
          <path
            d="M 242 160 L 270 160 L 270 172 L 242 172 Z"
            fill="#ffe49e"
            opacity="0.9"
          />
          <line
            x1="256"
            y1="160"
            x2="256"
            y2="306"
            stroke="#805414"
            strokeWidth="1.8"
            opacity="0.7"
          />
        </g>

        <defs>
          <filter id="mriter-app-shadow" x="50" y="70" width="412" height="360" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="16" stdDeviation="22" floodColor="#000000" floodOpacity="0.5" />
          </filter>
          <linearGradient id="mriter-app-bg" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2c2825" />
            <stop offset="50%" stopColor="#201e1d" />
            <stop offset="100%" stopColor="#141312" />
          </linearGradient>
          <linearGradient id="mriter-app-sheen" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="mriter-page-left" x1="104" y1="112" x2="256" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f6f1e8" />
            <stop offset="100%" stopColor="#ded2bf" />
          </linearGradient>
          <linearGradient id="mriter-fold-left" x1="182" y1="112" x2="256" y2="364" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ece2d0" />
            <stop offset="100%" stopColor="#b2a48f" />
          </linearGradient>
          <linearGradient id="mriter-page-right" x1="408" y1="112" x2="256" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#faf4ea" />
            <stop offset="55%" stopColor="#ede2d0" />
            <stop offset="100%" stopColor="#c6b8a3" />
          </linearGradient>
          <linearGradient id="mriter-fold-right" x1="330" y1="112" x2="256" y2="364" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ded3bf" />
            <stop offset="100%" stopColor="#a4947d" />
          </linearGradient>
          <linearGradient id="mriter-ribbon-gold" x1="256" y1="160" x2="256" y2="324" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffdc82" />
            <stop offset="35%" stopColor="#d69f3c" />
            <stop offset="70%" stopColor="#af7820" />
            <stop offset="100%" stopColor="#7e5210" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  // Bare Monogram for in-app UI (TitleBar, headers, micro sizes)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Folio (Drafting Page) */}
      <path
        d="M 3 19.5 L 3 9 C 3 6.4 5 4.8 7.5 4.8 C 9.5 4.8 11.2 6.4 12 10 L 12 18 C 11.2 15.8 9.5 14.6 7.5 14.6 C 5 14.6 3 16 3 19.5 Z"
        fill="currentColor"
      />
      {/* Right Folio (Published Volume) */}
      <path
        d="M 21 19.5 L 21 9 C 21 6.4 19 4.8 16.5 4.8 C 14.5 4.8 12.8 6.4 12 10 L 12 18 C 12.8 15.8 14.5 14.6 16.5 14.6 C 19 14.6 21 16 21 19.5 Z"
        fill="currentColor"
        opacity="0.82"
      />
      {/* Golden Silk Bookmark Ribbon */}
      <path
        d="M 11.2 7.5 L 12.8 7.5 L 12.8 15.4 L 12 14.7 L 11.2 15.4 Z"
        fill="#c59d5f"
      />
    </svg>
  )
}
export default MriterLogo
