import React from 'react'
import { Book, Sparkles } from 'lucide-react'

interface BookCoverThumbnailProps {
  title: string
  author: string
  genre?: string
  coverImage?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Preset luxury book cloth styles for covers without an uploaded image
const CLOTH_PALETTES = [
  {
    bg: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', // Midnight Slate
    accent: '#cbd5e1',
    gold: '#e2e8f0',
    spine: 'rgba(0, 0, 0, 0.45)',
  },
  {
    bg: 'linear-gradient(145deg, #3b1820 0%, #1f0b11 100%)', // Moroccan Burgundy
    accent: '#f3c4cb',
    gold: '#fcd34d',
    spine: 'rgba(0, 0, 0, 0.5)',
  },
  {
    bg: 'linear-gradient(145deg, #132e22 0%, #091711 100%)', // Forest Emerald
    accent: '#bbf7d0',
    gold: '#fef08a',
    spine: 'rgba(0, 0, 0, 0.5)',
  },
  {
    bg: 'linear-gradient(145deg, #2b1f14 0%, #17100a 100%)', // Antique Saddle Leather
    accent: '#fde68a',
    gold: '#fbbf24',
    spine: 'rgba(0, 0, 0, 0.5)',
  },
  {
    bg: 'linear-gradient(145deg, #231b34 0%, #130d1f 100%)', // Royal Obsidian Plum
    accent: '#e9d5ff',
    gold: '#fde047',
    spine: 'rgba(0, 0, 0, 0.5)',
  },
]

export const BookCoverThumbnail: React.FC<BookCoverThumbnailProps> = ({
  title,
  author,
  genre,
  coverImage,
  size = 'md',
  className = '',
}) => {
  // Deterministic palette choice based on title hash
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const palette = CLOTH_PALETTES[hash % CLOTH_PALETTES.length]

  const sizeClasses = {
    sm: 'w-12 h-18 text-[8px]',
    md: 'w-24 h-36 text-[10px]',
    lg: 'w-32 h-48 text-xs',
  }[size]

  return (
    <div
      className={`relative shrink-0 rounded-r-md rounded-l-xs overflow-hidden select-none shadow-md transition-shadow duration-300 ${sizeClasses} ${className}`}
      style={{
        aspectRatio: '1 / 1.5',
      }}
    >
      {/* 3D Book Spine Shadow on Left Edge */}
      <div
        className="absolute inset-y-0 left-0 w-2.5 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(255,255,255,0.18) 18%, rgba(0,0,0,0.25) 45%, transparent 100%)',
        }}
      />

      {/* Subtle Right Page Edge Illusion */}
      <div
        className="absolute inset-y-0 right-0 w-[1.5px] z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(0,0,0,0.3))',
        }}
      />

      {coverImage ? (
        /* Image Cover */
        <div className="w-full h-full relative bg-panel">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover block"
            loading="lazy"
          />
          {/* Subtle vignette lighting */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
        </div>
      ) : (
        /* Bespoke Cloth-Bound Foil Cover */
        <div
          className="w-full h-full p-2 flex flex-col justify-between items-center text-center relative overflow-hidden"
          style={{ background: palette.bg }}
        >
          {/* Subtle tactile paper texture effect */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />

          {/* Ornamental border frame */}
          <div
            className="absolute inset-1.5 rounded-sm border pointer-events-none opacity-40"
            style={{ borderColor: palette.gold }}
          />

          {/* Top Emblem / Genre */}
          <div className="z-10 pt-1 flex flex-col items-center">
            <Sparkles className="w-2.5 h-2.5 opacity-70 mb-0.5" style={{ color: palette.gold }} />
            {genre && size !== 'sm' && (
              <span
                className="text-[7px] uppercase tracking-widest font-sans line-clamp-1 opacity-75 px-1"
                style={{ color: palette.accent }}
              >
                {genre}
              </span>
            )}
          </div>

          {/* Center Title */}
          <div className="z-10 my-auto px-1">
            <h4
              className="font-serif font-bold leading-tight line-clamp-3"
              style={{
                color: palette.gold,
                fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '13px',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              {title}
            </h4>
            <div
              className="w-4 h-[1px] mx-auto my-1 opacity-60"
              style={{ backgroundColor: palette.gold }}
            />
          </div>

          {/* Bottom Author */}
          <div className="z-10 pb-1">
            <p
              className="font-sans text-[7px] uppercase tracking-wider line-clamp-1 opacity-80"
              style={{ color: palette.accent }}
            >
              {author || 'Author'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
