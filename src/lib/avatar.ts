// 角色頭像首字母 + 底色（純函式，與 mobile src/lib/avatar.ts 同邏輯）。
// 未上傳頭像時顯示角色名首字 + 依名穩定 hash 底色。

const AVATAR_COLORS = [
  '#7C6F9B', '#4A7A6F', '#A8754A', '#8A5A6F',
  '#5A6F8A', '#7A7A4A', '#9B6F4A', '#5F7A5A',
]

/** 取角色名首字（中文首字 / 英文首字母大寫 / emoji 安全 / 空名 → ?）。 */
export function avatarInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  return Array.from(trimmed)[0].toUpperCase()
}

/** 依名穩定 hash 選底色（同名同色；空名 → 第一色）。 */
export function avatarColor(seed: string | null | undefined): string {
  const s = (seed ?? '').trim()
  if (!s) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
