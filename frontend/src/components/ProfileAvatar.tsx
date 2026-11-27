import { UserRound } from 'lucide-react'

/** Only a chosen display name supplies an initial. Anonymous workspaces use an icon. */
export function ProfileAvatar({ name, small = false }: { name: string; small?: boolean }) {
  const first = Array.from(name)[0]
  return (
    <span className={small ? 'mini-avatar' : 'avatar'} aria-hidden="true">
      {first || <UserRound size={small ? 13 : 16} />}
    </span>
  )
}
