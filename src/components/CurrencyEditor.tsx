import { useState } from 'react'
import { useUpdateCurrency } from '@/hooks/useCharacterMutations'
import type { CurrencyUpdate } from '@/types/character'

type Props = CurrencyUpdate & { characterId: string }

const COINS: Array<[keyof CurrencyUpdate, string]> = [
  ['pp', 'PP'], ['gp', 'GP'], ['ep', 'EP'], ['sp', 'SP'], ['cp', 'CP'],
]

// 貨幣編輯（即時狀態編輯）：唯讀顯示 →「編輯」展開 5 幣別輸入 → 儲存（PATCH 絕對值覆寫）。
export function CurrencyEditor({ characterId, cp, sp, ep, gp, pp }: Props) {
  const [editing, setEditing] = useState(false)
  const [vals, setVals] = useState<CurrencyUpdate>({ cp, sp, ep, gp, pp })
  const mutation = useUpdateCurrency(characterId)

  const btn: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px',
    fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--text)',
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>
          GP {gp} · SP {sp} · CP {cp} · PP {pp}{ep ? ` · EP ${ep}` : ''}
        </span>
        <button style={btn} onClick={() => { setVals({ cp, sp, ep, gp, pp }); setEditing(true) }}>編輯</button>
      </div>
    )
  }

  const save = () => mutation.mutate(vals, { onSuccess: () => setEditing(false) })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {COINS.map(([key, label]) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
          {label}
          <input
            type="number" min={0} value={vals[key]}
            onChange={(e) => setVals((v) => ({ ...v, [key]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            style={{
              width: 64, padding: '5px 6px', fontSize: 13, background: 'var(--elevated)',
              border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)',
            }}
          />
        </label>
      ))}
      <button
        style={{ ...btn, borderColor: 'var(--accent)', color: 'var(--accent)', opacity: mutation.isPending ? 0.5 : 1 }}
        disabled={mutation.isPending} onClick={save}>儲存</button>
      <button style={btn} disabled={mutation.isPending} onClick={() => setEditing(false)}>取消</button>
      {mutation.isError && <span style={{ color: 'var(--danger)', fontSize: 11 }}>更新失敗</span>}
    </div>
  )
}
