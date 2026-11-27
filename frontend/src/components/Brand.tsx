import { CloudSun, ScanSearch, AudioLines } from 'lucide-react'
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <img
      className="atlas-mark"
      src="/atlas-mark.png"
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  )
}
export function AppLogo({ id, size = 30 }: { id: string; size?: number }) {
  if (id === 'openweather') return <CloudSun size={size} color="#d17843" />
  if (id === 'groq') return <AudioLines size={size} color="#ed6b43" />
  if (id === 'tavily') return <ScanSearch size={size} color="#5868ae" />
  return (
    <img
      className={'brand-icon brand-' + id}
      src={'/brands/' + id + '.svg'}
      width={size}
      height={size}
      alt=""
    />
  )
}
