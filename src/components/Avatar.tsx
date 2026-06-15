import { avatarInitial, avatarColor } from '@/lib/avatar'

// 角色頭像（圓形）：有 portraitData 顯圖、無則名稱首字 + 依名 hash 底色。

interface Props {
  name: string
  portraitData?: string | null
  size?: number
}

export function Avatar({ name, portraitData, size = 48 }: Props) {
  const common = { width: size, height: size, borderRadius: '50%', flexShrink: 0 } as const

  if (portraitData) {
    return <img src={portraitData} alt={name} style={{ ...common, objectFit: 'cover' }} />
  }

  return (
    <div
      style={{
        ...common,
        background: avatarColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: size * 0.42,
        fontFamily: 'Georgia, serif',
      }}
      aria-label={name}
    >
      {avatarInitial(name)}
    </div>
  )
}
