import { useState, useCallback } from 'react'
import { characterApi } from '@/api/characterApi'
import type { CharacterSummary } from '@/types/character'
import type { LevelUpRequest, AsiChoiceRequest, AsiEntry, AbilityCode } from '@/types/levelup'
import type { ApiError } from '@/types/api'
import { useAuth } from '@/context/AuthContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const ASI_LEVELS = new Set([4, 8, 12, 16, 19])
const ABILITIES: AbilityCode[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
const HIT_DIES = [6, 8, 10, 12] as const
type HpMode = 'roll' | 'average' | 'manual'

// ── 小工具 ────────────────────────────────────────────────────────────────────

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className="bg-red-900/40 border border-red-700 rounded p-3 text-sm text-red-300">
      [{error.status} {error.code}] {error.message}
    </div>
  )
}

function Btn({
  onClick, disabled, variant = 'primary', children,
}: {
  onClick?: () => void; disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; children: React.ReactNode
}) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40'
  const styles = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-blue-700 hover:bg-blue-600 text-white',
    ghost:     'bg-slate-700 hover:bg-slate-600 text-slate-300',
    danger:    'bg-red-800 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>
}

function Tag({ children, color = 'slate' }: { children: React.ReactNode; color?: 'violet' | 'green' | 'amber' | 'slate' | 'red' }) {
  const c = { violet: 'bg-violet-900/40 text-violet-300', green: 'bg-green-900/40 text-green-300', amber: 'bg-amber-900/40 text-amber-300', slate: 'bg-slate-700 text-slate-300', red: 'bg-red-900/40 text-red-300' }
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${c[color]}`}>{children}</span>
}

// ── Character Selector ────────────────────────────────────────────────────────

function CharacterSelector({
  selected, onSelect,
}: {
  selected: CharacterSummary | null
  onSelect: (c: CharacterSummary) => void
}) {
  const [chars, setChars]     = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await characterApi.list()
      setChars(data.content.filter(c => !c.archived))
      setLoaded(true)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }, [])

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-300">選擇角色</div>
        <Btn variant="secondary" onClick={load} disabled={loading}>
          {loading ? '載入中…' : '載入角色清單'}
        </Btn>
      </div>
      <ErrorBox error={error} />
      {loaded && chars.length === 0 && (
        <div className="text-xs text-slate-500">沒有可升級的角色，請先到 Characters 頁面建立角色</div>
      )}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {chars.map(c => {
          const nextLv = c.totalLevel + 1
          const isMax  = c.totalLevel >= 20
          const isAsi  = ASI_LEVELS.has(nextLv)
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                selected?.id === c.id
                  ? 'border-violet-500 bg-violet-900/30'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              } ${isMax ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-100 flex-1">{c.name}</span>
                {isMax && <Tag color="red">MAX 20</Tag>}
                {!isMax && isAsi && <Tag color="amber">⬆️ ASI Lv.{nextLv}</Tag>}
                {!isMax && !isAsi && <Tag color="green">→ Lv.{nextLv}</Tag>}
              </div>
              <div className="mt-1 text-xs text-slate-500 flex gap-3">
                <span>Lv.{c.totalLevel}</span>
                <span>HP {c.hpCurrent}/{c.hpMax}</span>
                <span>AC {c.armorClass}</span>
                <span className="font-mono truncate">{c.id.slice(0, 8)}…</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── HP Mode ───────────────────────────────────────────────────────────────────

function HpModePanel({
  mode, setMode, hitDie, setHitDie, hpIncrease, setHpIncrease,
}: {
  mode: HpMode; setMode: (m: HpMode) => void
  hitDie: number; setHitDie: (d: number) => void
  hpIncrease: number; setHpIncrease: (n: number) => void
}) {
  function rollDie() {
    const result = Math.floor(Math.random() * hitDie) + 1
    setHpIncrease(result)
  }

  function calcAverage() {
    return Math.floor(hitDie / 2) + 1
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-300">HP 增加模式</div>

      {/* Hit Die selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Hit Die：</span>
        {HIT_DIES.map(d => (
          <button
            key={d}
            onClick={() => { setHitDie(d); if (mode === 'average') setHpIncrease(Math.floor(d / 2) + 1) }}
            className={`px-2 py-1 rounded text-xs font-medium border ${
              hitDie === d ? 'border-violet-500 bg-violet-900/30 text-violet-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            d{d}
          </button>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {([['roll', `🎲 擲骰 (1–${hitDie})`], ['average', `📐 取平均 (${calcAverage()})`], ['manual', '✏️ 手動輸入']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m === 'average') setHpIncrease(calcAverage()) }}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              mode === m ? 'border-violet-500 bg-violet-900/30 text-violet-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="flex items-center gap-3">
        {mode === 'roll' && (
          <Btn variant="secondary" onClick={rollDie}>🎲 Roll d{hitDie}</Btn>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">hpIncrease =</span>
          <input
            type="number" min={0} max={999}
            value={hpIncrease}
            readOnly={mode !== 'manual'}
            onChange={e => setHpIncrease(Number(e.target.value))}
            className={`w-20 bg-slate-900 border rounded px-2 py-1 text-center text-sm text-slate-100 focus:outline-none ${
              mode === 'manual' ? 'border-violet-500' : 'border-slate-700'
            }`}
          />
        </div>
        {hpIncrease > 0 && <Tag color="green">+{hpIncrease} HP</Tag>}
      </div>
    </div>
  )
}

// ── ASI Panel ─────────────────────────────────────────────────────────────────

function AsiPanel({
  asiChoice, setAsiChoice,
}: {
  asiChoice: AsiChoiceRequest | null
  setAsiChoice: (a: AsiChoiceRequest | null) => void
}) {
  const type = asiChoice?.type ?? 'ABILITY_SCORE'

  function setType(t: 'ABILITY_SCORE' | 'FEAT') {
    setAsiChoice({ type: t, improvements: t === 'ABILITY_SCORE' ? [] : null, featSlug: t === 'FEAT' ? '' : null })
  }

  function setImprovement(idx: number, field: keyof AsiEntry, val: string | number) {
    const prev = asiChoice?.improvements ?? []
    const next = [...prev]
    next[idx] = { ...next[idx], [field]: val } as AsiEntry
    setAsiChoice({ ...asiChoice!, improvements: next })
  }

  function addImprovement() {
    const prev = asiChoice?.improvements ?? []
    if (prev.length >= 2) return
    setAsiChoice({ ...asiChoice!, improvements: [...prev, { ability: 'STR', increase: 1 }] })
  }

  function removeImprovement(idx: number) {
    const next = (asiChoice?.improvements ?? []).filter((_, i) => i !== idx)
    setAsiChoice({ ...asiChoice!, improvements: next })
  }

  const totalPoints = (asiChoice?.improvements ?? []).reduce((s, e) => s + e.increase, 0)

  return (
    <div className="bg-slate-800 rounded-lg border border-amber-700/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-amber-300">⬆️ ASI 選擇</div>
        <Tag color="amber">此等級需要 ASI</Tag>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(['ABILITY_SCORE', 'FEAT'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${
              type === t ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {t === 'ABILITY_SCORE' ? '屬性值提升' : '特技（Feat）'}
          </button>
        ))}
      </div>

      {type === 'ABILITY_SCORE' && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            分配 +2 點（可全給一項 +2，或分兩項各 +1）— 已用 <span className={totalPoints > 2 ? 'text-red-400' : 'text-green-400'}>{totalPoints}</span>/2
          </div>
          {(asiChoice?.improvements ?? []).map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={entry.ability}
                onChange={e => setImprovement(i, 'ability', e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                {ABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={entry.increase}
                onChange={e => setImprovement(i, 'increase', Number(e.target.value))}
                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value={1}>+1</option>
                <option value={2}>+2</option>
              </select>
              <button onClick={() => removeImprovement(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
            </div>
          ))}
          {(asiChoice?.improvements ?? []).length < 2 && (
            <Btn variant="ghost" onClick={addImprovement}>+ 新增屬性</Btn>
          )}
        </div>
      )}

      {type === 'FEAT' && (
        <div>
          <label className="text-xs text-slate-400">featSlug</label>
          <input
            value={asiChoice?.featSlug ?? ''}
            onChange={e => setAsiChoice({ ...asiChoice!, featSlug: e.target.value })}
            placeholder="e.g. alert, lucky, sharpshooter"
            className="mt-1 w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      )}
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function LevelUpPage() {
  const { isAuthenticated } = useAuth()
  const [selected, setSelected]     = useState<CharacterSummary | null>(null)
  const [mode, setMode]             = useState<HpMode>('average')
  const [hitDie, setHitDie]         = useState(8)
  const [hpIncrease, setHpIncrease] = useState(5)
  const [asiChoice, setAsiChoice]   = useState<AsiChoiceRequest | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<ApiError | null>(null)
  const [result, setResult]         = useState<CharacterSummary | null>(null)

  const nextLevel   = (selected?.totalLevel ?? 0) + 1
  const isAsiLevel  = ASI_LEVELS.has(nextLevel)
  const isMaxLevel  = (selected?.totalLevel ?? 0) >= 20

  function handleSelectChar(c: CharacterSummary) {
    setSelected(c)
    setResult(null)
    setError(null)
    setAsiChoice(null)
    // Default average HP based on d8
    setHpIncrease(Math.floor(hitDie / 2) + 1)
  }

  async function handleLevelUp() {
    if (!selected) return
    setError(null); setResult(null); setLoading(true)
    const body: LevelUpRequest = {
      hpIncrease,
      asiChoice: isAsiLevel ? asiChoice : null,
    }
    try {
      const updated = await characterApi.levelUp(selected.id, body)
      setResult(updated)
      setSelected(updated)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  // Edge-case: force send with asiChoice on non-ASI level (expect 409)
  async function handleForce409() {
    if (!selected) return
    setError(null); setResult(null); setLoading(true)
    try {
      const updated = await characterApi.levelUp(selected.id, {
        hpIncrease,
        asiChoice: {
          type: 'ABILITY_SCORE',
          improvements: [{ ability: 'STR', increase: 1 }],
          featSlug: null,
        },
      })
      setResult(updated)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-64 text-slate-400">請先到 Auth 頁面登入</div>
  }

  const requestBody: LevelUpRequest = {
    hpIncrease,
    asiChoice: isAsiLevel ? asiChoice : null,
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">
          ⬆️ Level Up
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.7</span>
        </h1>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左欄 */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <CharacterSelector selected={selected} onSelect={handleSelectChar} />

          {selected && !isMaxLevel && (
            <>
              <HpModePanel
                mode={mode} setMode={setMode}
                hitDie={hitDie} setHitDie={d => { setHitDie(d); if (mode === 'average') setHpIncrease(Math.floor(d / 2) + 1) }}
                hpIncrease={hpIncrease} setHpIncrease={setHpIncrease}
              />

              {isAsiLevel && (
                <AsiPanel asiChoice={asiChoice} setAsiChoice={setAsiChoice} />
              )}

              <ErrorBox error={error} />
              {result && (
                <div className="bg-green-900/40 border border-green-700 rounded p-3 text-sm text-green-300">
                  ✅ 升級成功！{selected.totalLevel - 1 < result.totalLevel ? `Lv.${result.totalLevel}` : ''} HP: {result.hpMax}（+{result.hpMax - (selected.hpMax)}）
                </div>
              )}

              <Btn onClick={handleLevelUp} disabled={loading}>
                {loading ? '升級中…' : `🎲 升至 Lv.${nextLevel}`}
              </Btn>
            </>
          )}

          {selected && isMaxLevel && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
              已達 20 級上限，升級 API 應回傳 409 Conflict
            </div>
          )}

          {/* Edge case testers */}
          {selected && (
            <div className="bg-slate-800 rounded-lg border border-slate-600 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-400">🧪 邊界值測試</div>
              {isMaxLevel && (
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">20 級 → 期望 409</div>
                  <Btn variant="danger" onClick={handleLevelUp} disabled={loading}>
                    送出（期望 409）
                  </Btn>
                  {error && <ErrorBox error={error} />}
                </div>
              )}
              {!isMaxLevel && !isAsiLevel && (
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">非 ASI 等級（Lv.{nextLevel}）帶 asiChoice → 期望 409</div>
                  <Btn variant="danger" onClick={handleForce409} disabled={loading}>
                    帶 asiChoice 強制送（期望 409）
                  </Btn>
                </div>
              )}
              {!isMaxLevel && isAsiLevel && (
                <div className="text-xs text-slate-500">ASI 等級（Lv.{nextLevel}）— 上方可正常填寫 ASI</div>
              )}
            </div>
          )}
        </div>

        {/* 右欄：JSON */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-4 overflow-y-auto min-w-0">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">← 載入清單並選取角色</div>
          ) : (
            <>
              {/* 角色摘要 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">選取角色</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    ['Name', selected.name],
                    ['Level', selected.totalLevel],
                    ['HP', `${selected.hpCurrent}/${selected.hpMax}`],
                    ['AC', selected.armorClass],
                    ['Next Lv', isMaxLevel ? 'MAX' : nextLevel],
                    ['ASI?', isAsiLevel ? `Yes (Lv.${nextLevel})` : 'No'],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="bg-slate-700/50 rounded p-2">
                      <div className="text-xs text-slate-400">{k}</div>
                      <div className="font-medium text-slate-200 mt-0.5 text-xs">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  POST /characters/{selected.id.slice(0, 8)}…/level-up
                </div>
                <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto">
                  {JSON.stringify(requestBody, null, 2)}
                </pre>
              </div>

              {/* Response */}
              {result && (
                <div>
                  <div className="text-xs font-semibold text-green-400 mb-1">Response ✅</div>
                  <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto max-h-64">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
              {error && (
                <div>
                  <div className="text-xs font-semibold text-red-400 mb-1">Response ❌ {error.status}</div>
                  <pre className="text-xs text-red-300 bg-slate-900 rounded p-3 overflow-auto">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
