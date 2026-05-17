import * as React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export default function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
        <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="currentColor" floodOpacity="0.08" />
        </filter>
      </defs>

      <g filter="url(#f)">
        <rect x="6" y="8" width="52" height="12" rx="6" fill="url(#g)" transform="rotate(-6 32 14)" />
        <rect x="6" y="24" width="52" height="12" rx="6" fill="currentColor" fillOpacity="0.9" transform="rotate(-2 32 30)" />
        <rect x="6" y="40" width="52" height="12" rx="6" fill="#ffffff" />
      </g>

      <g transform="translate(8,8)">
        <rect x="0" y="0" width="14" height="6" rx="2.5" fill="#ffffff" opacity="0.14" />
      </g>
    </svg>
  )
}
