import { useId } from 'react'

/** Three small, local spot illustrations. No icon font or external image service. */
export function PromptArt({ kind }: { kind: 'research' | 'ideas' | 'analysis' }) {
  const id = useId().replace(/:/g, '')
  const fill = (s: string) => `url(#${id}-${s})`
  if (kind === 'ideas')
    return (
      <svg viewBox="0 0 60 54" className="prompt-art" aria-hidden="true">
        <defs>
          <linearGradient
            id={id + '-a'}
            x1="0"
            y1="0"
            x2=".8"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop stopColor="#fff0d9" />
            <stop offset=".48" stopColor="#edb49b" />
            <stop offset="1" stopColor="#cb86a0" />
          </linearGradient>
          <linearGradient id={id + '-b'} x2="1" y2=".8" gradientUnits="objectBoundingBox">
            <stop stopColor="#ffedce" />
            <stop offset="1" stopColor="#dc98a2" />
          </linearGradient>
        </defs>
        <path
          d="M27 5C29 18 33 21 45 24c-13 3-16 7-18 20-3-13-7-17-20-20C20 21 24 18 27 5Z"
          fill={fill('a')}
          stroke="#c98e9c"
          strokeWidth=".9"
        />
        <path d="m27 5 .3 19-20.3 0c13-3 17-7 20-19Z" fill="#ffe9d9" />
        <path d="m27.3 24 .2 20 4-12L45 24Z" fill="#c6879f" opacity=".66" />
        <path
          d="M46 30c1.2 6 3.4 8 9 9-5.6 1.5-7.8 4-9 10-1.4-6-3.2-8.5-9-10 5.8-1 7.7-3 9-9Z"
          fill={fill('b')}
          stroke="#c998a4"
          strokeWidth=".85"
        />
        <path d="m45.5 5 .9 4 3.7 1.4-3.7 1.2-1.1 3.5-1-3.5-3.4-1.2 3.6-1.4Z" fill="#dcbaae" />
      </svg>
    )
  if (kind === 'analysis')
    return (
      <svg viewBox="0 0 60 54" className="prompt-art" aria-hidden="true">
        <defs>
          <linearGradient id={id + '-a'} x2=".8" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#e2f0ff" />
            <stop offset=".56" stopColor="#bed8f6" />
            <stop offset="1" stopColor="#9db9de" />
          </linearGradient>
          <linearGradient id={id + '-b'} x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#fbfeff" />
            <stop offset="1" stopColor="#d8e7fc" />
          </linearGradient>
        </defs>
        <g strokeLinejoin="round" transform="rotate(-12 29 27)">
          <rect x="18" y="10" width="29" height="37" rx="4" fill="#92b1da" stroke="#849fc6" />
          <rect x="14" y="7" width="29" height="37" rx="4" fill={fill('a')} stroke="#99b3d8" />
          <path
            d="M15 4h16l8 9v24q0 4-4 4H15q-4 0-4-4V8q0-4 4-4Z"
            fill={fill('b')}
            stroke="#91acd2"
          />
          <path d="M31 4v7q0 2 2 2h6" fill="#b4ceee" stroke="#91acd2" />
          <path d="M17 17h10M17 21h7" stroke="#a0b6d8" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="17" y="29" width="3.6" height="5.5" rx="1" fill="#92b1da" />
          <rect x="23.3" y="25.5" width="3.6" height="9" rx="1" fill="#7f9dce" />
          <rect x="29.6" y="22.5" width="3.6" height="12" rx="1" fill="#adc4e6" />
        </g>
      </svg>
    )
  return (
    <svg viewBox="0 0 60 54" className="prompt-art" aria-hidden="true">
      <defs>
        <radialGradient id={id + '-a'} cx="36%" cy="25%" r="76%">
          <stop stopColor="#f9f3ff" />
          <stop offset=".53" stopColor="#d7c7fb" />
          <stop offset=".85" stopColor="#b99ee7" />
          <stop offset="1" stopColor="#9982c8" />
        </radialGradient>
      </defs>
      <g transform="rotate(-23 28 25)">
        <circle cx="28" cy="25" r="17.5" fill={fill('a')} stroke="#9682b6" strokeWidth="1" />
        <g fill="none" stroke="#9d88bf" strokeWidth="1.05">
          <ellipse cx="28" cy="25" rx="8.5" ry="17.2" />
          <path d="M11 25h34M15 14q13 6 26 0M14.8 36q13-6.2 26.4 0" />
        </g>
      </g>
      <path
        d="M11 33c-11 12 6 10 24 .5s23-17 13-15"
        fill="none"
        stroke="#9b7cc7"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path d="m48 6 1.2 3.7 3.8 1.2-3.8 1.3L48 16l-1.3-3.8-3.6-1.3 3.6-1.2Z" fill="#baa5d7" />
    </svg>
  )
}
