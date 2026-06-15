import { useState, useCallback } from 'react'
import { characterApi } from '../api/characterApi'
import type { CharacterSummary, SyncCharacterRequest } from '../types/character'
import type { ApiError } from '../types/api'
import { useAuth } from '../context/AuthContext'

// ── 小工具 ────────────────────────────────────────────────────────────────────

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className="bg-red-900/40 border border-red-700 rounded p-3 text-sm text-red-300">
      [{error.status} {error.code}] {error.message}
    </div>
  )
}

function SuccessBox({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <div className="bg-green-900/40 border border-green-700 rounded p-3 text-sm text-green-300">✅ {msg}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
    />
  )
}

function Btn({
  onClick, disabled, variant = 'primary', children,
}: {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: React.ReactNode
}) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40'
  const styles = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-blue-700 hover:bg-blue-600 text-white',
    danger:    'bg-red-800 hover:bg-red-700 text-white',
    ghost:     'bg-slate-700 hover:bg-slate-600 text-slate-300',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  )
}

// ── 角色卡列表 ────────────────────────────────────────────────────────────────

function CharacterCard({
  char, selected, onSelect,
}: {
  char: CharacterSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded border transition-colors ${
        selected
          ? 'border-violet-500 bg-violet-900/30'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      } ${char.archived ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-100 truncate flex-1">{char.name}</span>
        {char.archived && (
          <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">封存</span>
        )}
        <span className="text-xs text-slate-400 flex-shrink-0">Lv.{char.totalLevel}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500 font-mono truncate">{char.id}</div>
      <div className="mt-1 flex gap-3 text-xs text-slate-400">
        <span>HP {char.hpCurrent}/{char.hpMax}</span>
        <span>AC {char.armorClass}</span>
        <span>SRD {char.rulesetCode}</span>
      </div>
    </button>
  )
}

// ── 建立表單 ──────────────────────────────────────────────────────────────────

function CreateForm({ onCreated }: { onCreated: (c: CharacterSummary) => void }) {
  const [name, setName]       = useState('Test Hero')
  const [level, setLevel]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  async function handleCreate() {
    setError(null)
    setLoading(true)
    try {
      const char = await characterApi.create({ name, startingLevel: level, raceSlug: 'human', classSlug: 'fighter', backgroundSlug: 'soldier' })
      onCreated(char)
      setName('Test Hero')
      setLevel(1)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-300">建立角色卡</div>
      <ErrorBox error={error} />
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Name">
            <Input value={name} onChange={e => setName(e.target.value)} />
          </Field>
        </div>
        <div className="w-24">
          <Field label="Level">
            <Input type="number" min={1} max={20} value={level}
              onChange={e => setLevel(Number(e.target.value))} />
          </Field>
        </div>
      </div>
      <Btn onClick={handleCreate} disabled={loading || !name.trim()}>
        {loading ? '建立中…' : '+ 建立'}
      </Btn>
    </div>
  )
}

// ── Sync 表單（基礎版：只更新核心欄位）────────────────────────────────────────

function SyncForm({
  char, onSynced,
}: {
  char: CharacterSummary
  onSynced: (c: CharacterSummary) => void
}) {
  const [form, setForm] = useState<{
    name: string; hpCurrent: number; hpMax: number; armorClass: number; totalLevel: number
  }>({
    name: char.name, hpCurrent: char.hpCurrent, hpMax: char.hpMax,
    armorClass: char.armorClass, totalLevel: char.totalLevel,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSync() {
    setError(null); setSuccess(null); setLoading(true)
    try {
      const body: SyncCharacterRequest = {
        name:             form.name,
        totalLevel:       form.totalLevel,
        experiencePoints: 0,
        armorClass:       form.armorClass,
        initiativeBonus:  0,
        speed:            30,
        hpMax:            form.hpMax,
        hpCurrent:        form.hpCurrent,
        hpTemp:           0,
        hitDiceType:      'd8',
        hitDiceUsed:      0,
        deathSaveSuccesses: 0,
        deathSaveFailures:  0,
      }
      const updated = await characterApi.sync(char.id, body)
      onSynced(updated)
      setSuccess('Sync 成功')
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-400">PUT /characters/{char.id.slice(0, 8)}…</div>
      <ErrorBox error={error} />
      <SuccessBox msg={success} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Name">
            <Input value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
        </div>
        <Field label="Total Level">
          <Input type="number" min={1} max={20} value={form.totalLevel}
            onChange={e => set('totalLevel', Number(e.target.value))} />
        </Field>
        <Field label="Armor Class">
          <Input type="number" min={0} value={form.armorClass}
            onChange={e => set('armorClass', Number(e.target.value))} />
        </Field>
        <Field label="HP Current">
          <Input type="number" min={0} value={form.hpCurrent}
            onChange={e => set('hpCurrent', Number(e.target.value))} />
        </Field>
        <Field label="HP Max">
          <Input type="number" min={1} value={form.hpMax}
            onChange={e => set('hpMax', Number(e.target.value))} />
        </Field>
      </div>
      <Btn onClick={handleSync} disabled={loading}>
        {loading ? 'Sync 中…' : '↑ Sync to Server'}
      </Btn>
      <p className="text-xs text-slate-500">
        其餘子表（abilityScores / skills / classes 等）傳 null → 後端跳過，不更新。
      </p>
    </div>
  )
}

// ── HP 更新表單 ────────────────────────────────────────────────────────────────

function HpForm({
  char, onUpdated,
}: {
  char: CharacterSummary
  onUpdated: (c: CharacterSummary) => void
}) {
  const [delta, setDelta]   = useState(0)
  const [tempHp, setTempHp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<ApiError | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleUpdate() {
    setError(null); setSuccess(null); setLoading(true)
    try {
      const updated = await characterApi.updateHp(char.id, delta, tempHp)
      onUpdated(updated)
      setSuccess(`HP 更新成功 → ${updated.hpCurrent} / ${updated.hpMax}`)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-300">HP 更新驗證</div>
      <div className="text-xs font-mono text-slate-500">PATCH /characters/{char.id.slice(0, 8)}…/hp</div>
      <ErrorBox error={error} />
      <SuccessBox msg={success} />
      <div className="flex gap-3 items-end flex-wrap">
        <div className="w-28">
          <Field label="Delta（正=治療 / 負=傷害）">
            <Input type="number" value={delta} onChange={e => setDelta(Number(e.target.value))} />
          </Field>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 pb-1.5 cursor-pointer">
          <input type="checkbox" checked={tempHp} onChange={e => setTempHp(e.target.checked)} className="accent-violet-500" />
          tempHp（作用於暫時 HP）
        </label>
        <Btn onClick={handleUpdate} disabled={loading}>
          {loading ? '更新中…' : '套用 HP 變更'}
        </Btn>
      </div>
      <p className="text-xs text-slate-500">
        目前 HP: {char.hpCurrent} / {char.hpMax}｜傷害先扣 tempHp，tempHp 歸 0 後再扣 hpCurrent。
      </p>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const { isAuthenticated } = useAuth()
  const [chars, setChars]         = useState<CharacterSummary[]>([])
  const [selected, setSelected]   = useState<CharacterSummary | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<ApiError | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const loadList = useCallback(async () => {
    setError(null); setLoading(true)
    try {
      const data = await characterApi.list()
      setChars(data.content)
    } catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }, [])

  const handleSelect = useCallback(async (char: CharacterSummary) => {
    setError(null)
    try {
      const detail = await characterApi.get(char.id)
      setSelected(detail)
    } catch (e) { setError(e as ApiError) }
  }, [])

  const handleArchive = async () => {
    if (!selected) return
    try {
      const updated = await characterApi.archive(selected.id)
      setSelected(updated)
      setChars(cs => cs.map(c => c.id === updated.id ? updated : c))
    } catch (e) { setError(e as ApiError) }
  }

  const handleRestore = async () => {
    if (!selected) return
    try {
      const updated = await characterApi.restore(selected.id)
      setSelected(updated)
      setChars(cs => cs.map(c => c.id === updated.id ? updated : c))
    } catch (e) { setError(e as ApiError) }
  }

  const handleCreated = (char: CharacterSummary) => {
    setChars(cs => [char, ...cs])
    setSelected(char)
  }

  const handleSynced = (char: CharacterSummary) => {
    setSelected(char)
    setChars(cs => cs.map(c => c.id === char.id ? char : c))
  }

  const displayed = showArchived ? chars : chars.filter(c => !c.archived)

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        請先到 Auth 頁面登入
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-100">
          🃏 Characters
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.6</span>
        </h1>
        <div className="flex gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="accent-violet-500" />
            顯示封存
          </label>
          <Btn onClick={loadList} disabled={loading} variant="secondary">
            {loading ? '載入中…' : '重新載入清單'}
          </Btn>
        </div>
      </div>

      <ErrorBox error={error} />

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左欄：清單 + 建立 */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <CreateForm onCreated={handleCreated} />

          <div className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col flex-1 min-h-0">
            <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">
              角色卡清單 ({displayed.length})
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {displayed.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  {chars.length === 0 ? '點「重新載入清單」取得資料' : '無符合條件的角色卡'}
                </div>
              ) : (
                displayed.map(c => (
                  <CharacterCard
                    key={c.id}
                    char={c}
                    selected={selected?.id === c.id}
                    onSelect={() => handleSelect(c)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右欄：詳情 + 操作 */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 flex flex-col min-w-0 overflow-y-auto p-4">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              ← 點選左側角色卡或建立新角色
            </div>
          ) : (
            <div className="space-y-5">
              {/* 標題 */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-xl font-bold text-slate-100">{selected.name}</div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">{selected.id}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {selected.archived ? (
                    <Btn onClick={handleRestore} variant="secondary">復原</Btn>
                  ) : (
                    <Btn onClick={handleArchive} variant="danger">封存</Btn>
                  )}
                </div>
              </div>

              {/* 摘要欄位 */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  ['Level', selected.totalLevel],
                  ['HP', `${selected.hpCurrent} / ${selected.hpMax}`],
                  ['AC', selected.armorClass],
                  ['Ruleset', selected.rulesetCode],
                  ['Alignment', selected.alignment ?? '—'],
                  ['Archived', String(selected.archived)],
                ].map(([label, val]) => (
                  <div key={String(label)} className="bg-slate-700/50 rounded p-2">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="font-medium text-slate-200 mt-0.5">{String(val)}</div>
                  </div>
                ))}
              </div>

              {/* HP 更新 */}
              <HpForm char={selected} onUpdated={char => { setSelected(char); setChars(cs => cs.map(c => c.id === char.id ? char : c)) }} />

              {/* Sync 表單 */}
              <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-4">
                <div className="text-sm font-semibold text-slate-300 mb-3">Sync 驗證</div>
                <SyncForm char={selected} onSynced={handleSynced} />
              </div>

              {/* 完整 JSON */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Response JSON</div>
                <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto max-h-64">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
