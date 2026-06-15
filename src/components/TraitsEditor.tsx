import { useState } from 'react'
import { useUpdateTraits } from '@/hooks/useCharacterMutations'
import type { BackstorySummary } from '@/types/character'

const FIELDS: Array<[keyof BackstorySummary, string]> = [
  ['personalityTraits', '性格特質'], ['ideals', '理想'], ['bonds', '羈絆'], ['flaws', '缺陷'], ['backstory', '背景故事'],
]

// 性格與背景編輯（角色卡編輯閉環）：唯讀顯示 →「編輯」展開 5 欄 textarea → 儲存（PATCH /traits 全量覆寫）。
// 複用 useUpdateTraits（setQueryData + invalidate 基礎設施，與 HP/貨幣/環位同模式）。
export function TraitsEditor({ characterId, backstory }: { characterId: string; backstory?: BackstorySummary }) {
  const [editing, setEditing] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})
  const mutation = useUpdateTraits(characterId)

  const cur = (k: keyof BackstorySummary) => backstory?.[k] ?? ''
  const hasAny = FIELDS.some(([k]) => !!cur(k))

  const btn: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px',
    fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--text)',
  }

  if (!editing) {
    const startEdit = () => {
      setVals(Object.fromEntries(FIELDS.map(([k]) => [k, cur(k)])))
      setEditing(true)
    }
    return (
      <div>
        {hasAny ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {FIELDS.slice(0, 4).filter(([k]) => !!cur(k)).map(([k, lab]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 3 }}>{lab}</div>
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{cur(k)}</div>
                </div>
              ))}
            </div>
            {cur('backstory') && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 3 }}>背景故事</div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{cur('backstory')}</div>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>尚未填寫性格與背景。</p>
        )}
        <button style={{ ...btn, marginTop: 14 }} onClick={startEdit}>編輯</button>
      </div>
    )
  }

  const save = () => mutation.mutate({
    personalityTraits: vals.personalityTraits ?? '', ideals: vals.ideals ?? '',
    bonds: vals.bonds ?? '', flaws: vals.flaws ?? '', backstory: vals.backstory ?? '',
  }, { onSuccess: () => setEditing(false) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {FIELDS.map(([k, lab]) => (
        <label key={k}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 4 }}>{lab}</div>
          <textarea
            value={vals[k] ?? ''} rows={k === 'backstory' ? 4 : 2}
            onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))}
            style={{
              width: '100%', padding: '8px', fontSize: 13, lineHeight: 1.5, resize: 'vertical',
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
        </label>
      ))}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...btn, borderColor: 'var(--accent)', color: 'var(--accent)', opacity: mutation.isPending ? 0.5 : 1 }}
          disabled={mutation.isPending} onClick={save}>儲存</button>
        <button style={btn} disabled={mutation.isPending} onClick={() => setEditing(false)}>取消</button>
        {mutation.isError && <span style={{ color: 'var(--danger)', fontSize: 11, alignSelf: 'center' }}>更新失敗</span>}
      </div>
    </div>
  )
}
