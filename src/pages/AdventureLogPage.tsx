import { useState, useCallback } from 'react'
import { characterApi } from '@/api/characterApi'
import { adventureLogApi } from '@/api/adventureLogApi'
import type { CharacterSummary } from '@/types/character'
import type { AdventureLogDto, CreateAdventureLogRequest, UpdateAdventureLogRequest } from '@/types/adventurelog'
import type { ApiError } from '@/types/api'
import { useAuth } from '@/context/AuthContext'

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
  onClick, disabled, variant = 'primary', children, small,
}: {
  onClick?: () => void; disabled?: boolean; small?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; children: React.ReactNode
}) {
  const base = `rounded text-sm font-medium transition-colors disabled:opacity-40 ${small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5'}`
  const styles = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-blue-700 hover:bg-blue-600 text-white',
    danger:    'bg-red-800 hover:bg-red-700 text-white',
    ghost:     'bg-slate-700 hover:bg-slate-600 text-slate-300',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
    />
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 text-center"
    />
  )
}

// ── Character Selector ────────────────────────────────────────────────────────

function CharacterSelector({
  selected, onSelect,
}: { selected: CharacterSummary | null; onSelect: (c: CharacterSummary) => void }) {
  const [chars, setChars]     = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try { setChars((await characterApi.list()).content.filter(c => !c.archived)) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-400">選擇角色</div>
        <Btn variant="secondary" onClick={load} disabled={loading} small>
          {loading ? '…' : '載入'}
        </Btn>
      </div>
      <ErrorBox error={error} />
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {chars.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
              selected?.id === c.id
                ? 'border-violet-500 bg-violet-900/30'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
            }`}
          >
            <span className="font-medium text-slate-200">{c.name}</span>
            <span className="text-slate-500 ml-2">Lv.{c.totalLevel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Create Form ───────────────────────────────────────────────────────────────

function CreateForm({
  characterId, onCreated,
}: { characterId: string; onCreated: (log: AdventureLogDto) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<CreateAdventureLogRequest>({
    adventureName: 'Session 1',
    sessionDate: today,
    dmName: '',
    xpStart: 0, xpGained: 100, xpEnd: 100,
    gpChange: 10,
    downtimeGained: 1,
    renownGained: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  function set<K extends keyof CreateAdventureLogRequest>(k: K, v: CreateAdventureLogRequest[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleCreate() {
    setError(null); setLoading(true)
    try { onCreated(await adventureLogApi.create(characterId, form)) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-3">
      <div className="text-xs font-semibold text-slate-400">新增冒險記錄 POST /logs</div>
      <ErrorBox error={error} />

      <Field label="Adventure Name *">
        <Input value={form.adventureName} onChange={e => set('adventureName', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Session Date">
          <Input type="date" value={form.sessionDate ?? ''} onChange={e => set('sessionDate', e.target.value || null)} />
        </Field>
        <Field label="DM Name">
          <Input value={form.dmName ?? ''} onChange={e => set('dmName', e.target.value || null)} />
        </Field>
      </div>

      {/* XP Row */}
      <div>
        <div className="text-xs text-slate-400 mb-1">XP</div>
        <div className="grid grid-cols-3 gap-1">
          {(['xpStart', 'xpGained', 'xpEnd'] as const).map(k => (
            <div key={k}>
              <div className="text-xs text-slate-500 text-center mb-0.5">{k.replace('xp', '')}</div>
              <NumInput value={(form[k] as number) ?? 0} onChange={v => set(k, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* GP / Downtime / Renown Row */}
      <div className="grid grid-cols-3 gap-2">
        <Field label="GP Change">
          <Input type="number" value={form.gpChange ?? ''} onChange={e => set('gpChange', e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Downtime +">
          <Input type="number" min={0} value={form.downtimeGained ?? 0} onChange={e => set('downtimeGained', Number(e.target.value))} />
        </Field>
        <Field label="Renown +">
          <Input type="number" min={0} value={form.renownGained ?? 0} onChange={e => set('renownGained', Number(e.target.value))} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value || null)}
          rows={2}
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 resize-none"
        />
      </Field>

      <Btn onClick={handleCreate} disabled={loading || !form.adventureName.trim()}>
        {loading ? '新增中…' : '+ 新增'}
      </Btn>
    </div>
  )
}

// ── Log Card ──────────────────────────────────────────────────────────────────

function LogCard({
  log, characterId, selected, onSelect, onUpdated, onDeleted,
}: {
  log: AdventureLogDto; characterId: string; selected: boolean
  onSelect: () => void
  onUpdated: (log: AdventureLogDto) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [patch, setPatch]     = useState<UpdateAdventureLogRequest>({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  async function handleUpdate() {
    setError(null); setLoading(true)
    try {
      onUpdated(await adventureLogApi.update(characterId, log.id, patch))
      setEditing(false); setPatch({})
    }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm(`刪除「${log.adventureName}」？`)) return
    setLoading(true)
    try { await adventureLogApi.delete(characterId, log.id); onDeleted(log.id) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div
      onClick={onSelect}
      className={`border rounded p-3 space-y-2 cursor-pointer transition-colors ${
        selected ? 'border-violet-500 bg-violet-900/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      }`}
    >
      <div className="font-medium text-slate-200 text-sm">{log.adventureName}</div>
      <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
        {log.sessionDate && <span>📅 {log.sessionDate}</span>}
        {log.dmName && <span>🎲 {log.dmName}</span>}
        <span>XP +{log.xpGained}</span>
        {log.gpChange != null && <span>GP {log.gpChange > 0 ? '+' : ''}{log.gpChange}</span>}
        {log.downtimeGained > 0 && <span>DT +{log.downtimeGained}</span>}
      </div>
      {log.notes && <div className="text-xs text-slate-500 truncate">{log.notes}</div>}

      <ErrorBox error={error} />

      {editing && (
        <div className="space-y-2 pt-1" onClick={e => e.stopPropagation()}>
          <Field label="Adventure Name">
            <Input
              value={patch.adventureName ?? log.adventureName}
              onChange={e => setPatch(p => ({ ...p, adventureName: e.target.value }))}
            />
          </Field>
          <Field label="DM Name">
            <Input
              value={patch.dmName ?? log.dmName ?? ''}
              onChange={e => setPatch(p => ({ ...p, dmName: e.target.value || null }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-1">
            <Field label="XP Gained">
              <Input
                type="number"
                value={patch.xpGained ?? log.xpGained}
                onChange={e => setPatch(p => ({ ...p, xpGained: Number(e.target.value) }))}
              />
            </Field>
            <Field label="GP Change">
              <Input
                type="number"
                value={patch.gpChange ?? log.gpChange ?? ''}
                onChange={e => setPatch(p => ({ ...p, gpChange: e.target.value ? Number(e.target.value) : null }))}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={patch.notes ?? log.notes ?? ''}
              onChange={e => setPatch(p => ({ ...p, notes: e.target.value || null }))}
              rows={2}
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 resize-none"
            />
          </Field>
        </div>
      )}

      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        {!editing
          ? <Btn small variant="ghost" onClick={() => { setEditing(true); setPatch({}) }}>編輯</Btn>
          : <>
              <Btn small variant="primary" onClick={handleUpdate} disabled={loading}>儲存</Btn>
              <Btn small variant="ghost" onClick={() => setEditing(false)}>取消</Btn>
            </>
        }
        <Btn small variant="danger" onClick={handleDelete} disabled={loading}>刪除</Btn>
      </div>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function AdventureLogPage() {
  const { isAuthenticated } = useAuth()
  const [character, setCharacter]   = useState<CharacterSummary | null>(null)
  const [logs, setLogs]             = useState<AdventureLogDto[]>([])
  const [selected, setSelected]     = useState<AdventureLogDto | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<ApiError | null>(null)

  const loadLogs = useCallback(async (charId: string) => {
    setError(null); setLoading(true)
    try { setLogs(await adventureLogApi.list(charId)) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }, [])

  function handleSelectChar(c: CharacterSummary) {
    setCharacter(c); setSelected(null); setLogs([])
    loadLogs(c.id)
  }

  function handleCreated(log: AdventureLogDto) {
    setLogs(prev => [log, ...prev])
    setSelected(log)
  }

  function handleUpdated(log: AdventureLogDto) {
    setLogs(prev => prev.map(l => l.id === log.id ? log : l))
    setSelected(log)
  }

  function handleDeleted(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-64 text-slate-400">請先到 Auth 頁面登入</div>
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">
          📖 Adventure Log
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.9</span>
        </h1>
        {character && (
          <Btn variant="ghost" onClick={() => loadLogs(character.id)} disabled={loading} small>
            {loading ? '…' : '重新載入'}
          </Btn>
        )}
      </div>

      <ErrorBox error={error} />

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左欄：角色 + 新增表單 */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <CharacterSelector selected={character} onSelect={handleSelectChar} />
          {character && <CreateForm characterId={character.id} onCreated={handleCreated} />}
        </div>

        {/* 中欄：Log List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400">
            GET /logs（{logs.length} 筆）
          </div>
          {!character && (
            <div className="text-xs text-slate-500 text-center py-8">← 先選擇角色</div>
          )}
          {character && logs.length === 0 && !loading && (
            <div className="text-xs text-slate-500 text-center py-8">尚無冒險記錄</div>
          )}
          {logs.map(log => (
            <LogCard
              key={log.id}
              log={log}
              characterId={character!.id}
              selected={selected?.id === log.id}
              onSelect={() => setSelected(log)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>

        {/* 右欄：JSON Detail */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-4 overflow-y-auto min-w-0">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              ← 點選記錄查看 Response JSON
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ['Adventure', selected.adventureName],
                  ['Date', selected.sessionDate ?? '—'],
                  ['DM', selected.dmName ?? '—'],
                  ['XP Start', selected.xpStart],
                  ['XP Gained', `+${selected.xpGained}`],
                  ['XP End', selected.xpEnd],
                  ['GP Change', selected.gpChange != null ? (selected.gpChange > 0 ? `+${selected.gpChange}` : String(selected.gpChange)) : '—'],
                  ['Downtime +', selected.downtimeGained],
                  ['Renown +', selected.renownGained],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-slate-700/50 rounded p-2">
                    <div className="text-slate-400">{k}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{String(v)}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Response JSON</div>
                <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto max-h-80">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
