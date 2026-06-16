import { useState } from 'react'
import { useUpdateHp } from '@/features/characters/useCharacterMutations'

// HP 調整器（即時狀態編輯）：輸入數值 → 治療(+) / 傷害(-) / 暫時 HP(+temp)。
// mutation 以伺服器回應更新角色卡，戰鬥區 HP 顯示即時刷新。
export function HpAdjuster({ characterId }: { characterId: string }) {
  const [amount, setAmount] = useState('')
  const mutation = useUpdateHp(characterId)
  const n = parseInt(amount, 10)
  const valid = Number.isFinite(n) && n > 0
  const busy = !valid || mutation.isPending

  const apply = (delta: number, tempHp: boolean) => {
    if (!valid) return
    mutation.mutate({ delta, tempHp }, { onSuccess: () => setAmount('') })
  }

  const btn = (color: string): React.CSSProperties => ({
    border: `1px solid ${color}`, color, borderRadius: 4, padding: '6px 12px',
    fontSize: 12, background: 'transparent', cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.4 : 1,
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
      <input
        type="number" inputMode="numeric" min={1} value={amount}
        onChange={(e) => setAmount(e.target.value)} placeholder="數值"
        style={{
          width: 72, padding: '6px 8px', fontSize: 13, background: 'var(--elevated)',
          border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)',
        }}
      />
      <button disabled={busy} onClick={() => apply(n, false)} style={btn('var(--positive)')}>治療</button>
      <button disabled={busy} onClick={() => apply(-n, false)} style={btn('var(--danger)')}>傷害</button>
      <button disabled={busy} onClick={() => apply(n, true)} style={btn('var(--accent)')}>暫時 HP</button>
      {mutation.isError && <span style={{ color: 'var(--danger)', fontSize: 11 }}>更新失敗</span>}
    </div>
  )
}
