import { useState, useEffect, useCallback } from 'react'
import { srdApi } from '../api/srdApi'
import { characterApi } from '../api/characterApi'
import type { SrdRace, SrdSubrace, SrdClass, SrdSubclass, SrdBackground, SrdRuleset } from '../types/srd'
import type { CharacterSummary, SyncCharacterRequest, ApplyBackgroundResponse } from '../types/character'
import type { ApiError } from '../types/api'
import { useAuth } from '../context/AuthContext'

// ── 計算工具 ──────────────────────────────────────────────────────────────────

function mod(score: number) { return Math.floor((score - 10) / 2) }
function modStr(score: number) { const m = mod(score); return (m >= 0 ? '+' : '') + m }

function calcHp(hitDie: number, level: number, con: number): number {
  if (level <= 0) return 0
  const conMod = mod(con)
  const lv1 = hitDie + conMod                                   // 1 級固定取最大
  const rest = (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod) // 之後取平均
  return Math.max(1, lv1 + rest)
}

function calcAc(dex: number): number { return 10 + mod(dex) }

// ── 小工具 ────────────────────────────────────────────────────────────────────

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className="bg-red-900/40 border border-red-700 rounded p-3 text-sm text-red-300">
      [{error.status} {error.code}] {error.message}
    </div>
  )
}

function JsonPanel({ label, data }: { label: string; data: unknown }) {
  if (data == null) return null
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 mb-1">{label}</div>
      <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function Btn({
  onClick, disabled, variant = 'primary', children,
}: {
  onClick?: () => void; disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'; children: React.ReactNode
}) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40'
  const styles = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    ghost:     'bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>
}

function SelectableCard({ label, sub, selected, onClick }: {
  label: string; sub?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
        selected
          ? 'border-violet-500 bg-violet-900/30 text-violet-200'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 text-slate-300'
      }`}
    >
      <div className="font-medium">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </button>
  )
}

// 帶覆寫切換的數值輸入
function OverrideInput({
  label, autoValue, autoNote, value, onChange,
}: {
  label: string; autoValue: number; autoNote: string
  value: number; onChange: (n: number) => void
}) {
  const [manual, setManual] = useState(false)
  const displayed = manual ? value : autoValue

  // 每次 autoValue 變動且不在手動模式時，同步給父層
  useEffect(() => { if (!manual) onChange(autoValue) }, [autoValue, manual])

  return (
    <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox" checked={manual}
            onChange={e => { setManual(e.target.checked); if (!e.target.checked) onChange(autoValue) }}
            className="accent-violet-500"
          />
          手動輸入
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={displayed}
          readOnly={!manual}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-20 bg-slate-900 border rounded px-2 py-1.5 text-center text-lg font-bold text-slate-100 focus:outline-none ${
            manual ? 'border-violet-500' : 'border-slate-700'
          }`}
        />
        {!manual && <span className="text-xs text-slate-500">{autoNote}</span>}
      </div>
    </div>
  )
}

// ── Step Indicator ────────────────────────────────────────────────────────────

const STEPS = ['種族', '職業', '背景', '屬性', '確認建立']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
            i === current ? 'bg-violet-600 text-white'
            : i < current ? 'bg-green-900/40 text-green-400'
            : 'bg-slate-800 text-slate-500'
          }`}>
            {i < current ? '✓' : i + 1}. {label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-px ${i < current ? 'bg-green-600' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Race ──────────────────────────────────────────────────────────────

function RaceStep({ ruleset, onNext }: {
  ruleset: SrdRuleset
  onNext: (raceId: string, raceSlug: string, raceName: string, raceSpeed: number,
           subraceId: string | null, subraceName: string | null) => void
}) {
  const [races, setRaces]               = useState<SrdRace[]>([])
  const [subraces, setSubraces]         = useState<SrdSubrace[]>([])
  const [selectedRace, setSelectedRace] = useState<SrdRace | null>(null)
  const [selectedSub, setSelectedSub]   = useState<SrdSubrace | null>(null)
  const [loading, setLoading]           = useState(false)
  const [loadingSub, setLoadingSub]     = useState(false)
  const [error, setError]               = useState<ApiError | null>(null)

  useEffect(() => {
    setLoading(true); setSelectedRace(null); setSelectedSub(null); setSubraces([])
    srdApi.listRaces(ruleset, 'zh-TW')
      .then(setRaces)
      .catch(e => setError(e as ApiError))
      .finally(() => setLoading(false))
  }, [ruleset])

  const handleRaceSelect = useCallback(async (race: SrdRace) => {
    setSelectedRace(race); setSelectedSub(null); setSubraces([]); setLoadingSub(true)
    try { setSubraces(await srdApi.listSubraces(race.slug, ruleset, 'zh-TW')) }
    catch { /* 無亞種族 */ }
    finally { setLoadingSub(false) }
  }, [ruleset])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <ErrorBox error={error} />
        <div className="text-xs text-slate-400 font-semibold">選擇種族 {loading && '（載入中…）'}</div>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {races.map(r => (
            <SelectableCard key={r.id} label={r.name} sub={`速度 ${r.speed}ft · ${r.slug}`}
              selected={selectedRace?.id === r.id} onClick={() => handleRaceSelect(r)} />
          ))}
        </div>
        {selectedRace && (
          <>
            <div className="text-xs text-slate-400 font-semibold">
              亞種族 {loadingSub && '（載入中…）'}
              {!loadingSub && subraces.length === 0 && <span className="text-slate-600">（無亞種族）</span>}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {subraces.map(s => (
                <SelectableCard key={s.id} label={s.name} sub={s.slug}
                  selected={selectedSub?.id === s.id} onClick={() => setSelectedSub(s)} />
              ))}
            </div>
          </>
        )}
        <Btn onClick={() => onNext(
          selectedRace!.id, selectedRace!.slug, selectedRace!.name, selectedRace!.speed,
          selectedSub?.id ?? null, selectedSub?.name ?? null,
        )} disabled={!selectedRace}>下一步 →</Btn>
      </div>
      <div className="space-y-3">
        <JsonPanel label={`GET /srd/races（${races.length} 筆）`}
          data={races.slice(0, 3).concat(races.length > 3 ? [{ id:'...', name:`…共 ${races.length} 筆` } as SrdRace] : [])} />
        {selectedRace && <JsonPanel label={`選取：${selectedRace.name}`} data={selectedRace} />}
        {subraces.length > 0 && <JsonPanel label={`GET /subraces`} data={subraces} />}
      </div>
    </div>
  )
}

// ── Step 2: Class ─────────────────────────────────────────────────────────────

function ClassStep({ ruleset, onNext, onBack }: {
  ruleset: SrdRuleset
  onNext: (classSlug: string, className: string, hitDie: number,
           subclassId: string | null, subclassName: string | null) => void
  onBack: () => void
}) {
  const [classes, setClasses]             = useState<SrdClass[]>([])
  const [subclasses, setSubclasses]       = useState<SrdSubclass[]>([])
  const [selectedClass, setSelectedClass] = useState<SrdClass | null>(null)
  const [selectedSub, setSelectedSub]     = useState<SrdSubclass | null>(null)
  const [loading, setLoading]             = useState(false)
  const [loadingSub, setLoadingSub]       = useState(false)

  useEffect(() => {
    setLoading(true); setSelectedClass(null); setSelectedSub(null); setSubclasses([])
    srdApi.listClasses(ruleset, 'zh-TW').then(setClasses).finally(() => setLoading(false))
  }, [ruleset])

  const handleClassSelect = useCallback(async (cls: SrdClass) => {
    setSelectedClass(cls); setSelectedSub(null); setSubclasses([]); setLoadingSub(true)
    try { setSubclasses(await srdApi.listSubclasses(cls.slug, ruleset, 'zh-TW')) }
    catch { /* ok */ }
    finally { setLoadingSub(false) }
  }, [ruleset])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="text-xs text-slate-400 font-semibold">選擇職業 {loading && '（載入中…）'}</div>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {classes.map(c => (
            <SelectableCard key={c.id} label={c.name} sub={`Hit Die d${c.hitDie} · ${c.slug}`}
              selected={selectedClass?.id === c.id} onClick={() => handleClassSelect(c)} />
          ))}
        </div>
        {selectedClass && (
          <>
            <div className="text-xs text-slate-400 font-semibold">
              子職業 {loadingSub && '（載入中…）'}
              {!loadingSub && subclasses.length === 0 && <span className="text-slate-600">（無子職業）</span>}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {subclasses.map(s => (
                <SelectableCard key={s.id} label={s.name} sub={s.slug}
                  selected={selectedSub?.id === s.id} onClick={() => setSelectedSub(s)} />
              ))}
            </div>
            {/* Hit Die 提示 */}
            <div className="bg-slate-700/50 rounded p-2 text-xs text-slate-400">
              💡 Hit Die <span className="text-violet-300 font-bold">d{selectedClass.hitDie}</span> — 將用於計算初始 HP
            </div>
          </>
        )}
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onBack}>← 返回</Btn>
          <Btn onClick={() => onNext(
            selectedClass?.slug ?? '', selectedClass?.name ?? '（未選）', selectedClass?.hitDie ?? 8,
            selectedSub?.id ?? null, selectedSub?.name ?? null,
          )}>下一步 →</Btn>
        </div>
      </div>
      <div className="space-y-3">
        <JsonPanel label={`GET /srd/classes（${classes.length} 筆）`}
          data={classes.slice(0, 3).concat(classes.length > 3 ? [{ id:'...', name:`…共 ${classes.length} 筆` } as SrdClass] : [])} />
        {selectedClass && <JsonPanel label={`選取：${selectedClass.name}`} data={selectedClass} />}
        {subclasses.length > 0 && <JsonPanel label="GET /subclasses" data={subclasses} />}
      </div>
    </div>
  )
}

// ── Step 3: Background ────────────────────────────────────────────────────────

function BackgroundStep({ ruleset, onNext, onBack }: {
  ruleset: SrdRuleset
  onNext: (backgroundId: string, backgroundName: string) => void
  onBack: () => void
}) {
  const [backgrounds, setBackgrounds] = useState<SrdBackground[]>([])
  const [selected, setSelected]       = useState<SrdBackground | null>(null)
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    setLoading(true)
    srdApi.listBackgrounds(ruleset, 'zh-TW').then(setBackgrounds).finally(() => setLoading(false))
  }, [ruleset])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="text-xs text-slate-400 font-semibold">選擇背景 {loading && '（載入中…）'}</div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {backgrounds.map(b => (
            <SelectableCard key={b.id} label={b.name} sub={b.slug}
              selected={selected?.id === b.id} onClick={() => setSelected(b)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onBack}>← 返回</Btn>
          <Btn onClick={() => onNext(selected?.id ?? '', selected?.name ?? '（未選）')}>下一步 →</Btn>
        </div>
      </div>
      <div className="space-y-3">
        <JsonPanel label={`GET /srd/backgrounds（${backgrounds.length} 筆）`} data={backgrounds} />
        {selected && <JsonPanel label={`選取：${selected.name}`} data={selected} />}
      </div>
    </div>
  )
}

// ── Step 4: Ability Scores ────────────────────────────────────────────────────

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const

function AbilityStep({ hitDie, onNext, onBack }: {
  hitDie: number
  onNext: (scores: Record<string, number>) => void
  onBack: () => void
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(ABILITIES.map(a => [a, 10]))
  )
  const pointBuy = Object.values(scores).reduce((s, v) => s + Math.max(0, v - 8), 0)
  const previewHp = calcHp(hitDie, 1, scores['CON'])
  const previewAc = calcAc(scores['DEX'])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-semibold">
          六圍屬性（Point Buy 參考：已用{' '}
          <span className={pointBuy > 27 ? 'text-red-400' : 'text-green-400'}>{pointBuy}</span>/27 點）
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ABILITIES.map(ab => (
            <div key={ab} className="bg-slate-800 rounded p-2 text-center">
              <div className="text-xs text-slate-400 mb-1">{ab}</div>
              <input
                type="number" min={3} max={20} value={scores[ab]}
                onChange={e => setScores(s => ({ ...s, [ab]: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-center text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
              <div className="text-xs text-slate-500 mt-1">{modStr(scores[ab])}</div>
            </div>
          ))}
        </div>

        {/* 預覽 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-xs text-slate-400">預估初始 HP</div>
            <div className="text-xl font-bold text-green-400 mt-0.5">{previewHp}</div>
            <div className="text-xs text-slate-500">d{hitDie}({hitDie}) + CON({modStr(scores['CON'])})</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-xs text-slate-400">預估 AC（無裝甲）</div>
            <div className="text-xl font-bold text-blue-400 mt-0.5">{previewAc}</div>
            <div className="text-xs text-slate-500">10 + DEX({modStr(scores['DEX'])})</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onBack}>← 返回</Btn>
          <Btn onClick={() => onNext(scores)}>下一步 →</Btn>
        </div>
      </div>
      <div className="space-y-3">
        <JsonPanel label="abilityScores（將送出的格式）" data={
          Object.entries(scores).map(([abilityCode, score]) => ({ abilityCode, score, savingThrowProficient: false }))
        } />
      </div>
    </div>
  )
}

// ── Step 5: Confirm & Create ──────────────────────────────────────────────────

function ConfirmStep({ summary, onBack, onCreated }: {
  summary: WizardSummary
  onBack: () => void
  onCreated: (c: CharacterSummary) => void
}) {
  const dexMod = mod(summary.abilityScores['DEX'] ?? 10)

  const [name, setName]     = useState('Wizard Hero')
  const [level, setLevel]   = useState(1)
  const [hpMax, setHpMax]   = useState(calcHp(summary.hitDie, 1, summary.abilityScores['CON'] ?? 10))
  const [ac, setAc]         = useState(calcAc(summary.abilityScores['DEX'] ?? 10))
  const [loading, setLoading] = useState(false)
  const [phase, setPhase]     = useState<'idle' | 'creating' | 'syncing' | 'applying' | 'done'>('idle')
  const [error, setError]     = useState<ApiError | null>(null)
  const [createResult, setCreateResult]   = useState<CharacterSummary | null>(null)
  const [syncResult, setSyncResult]       = useState<CharacterSummary | null>(null)
  const [applyResult, setApplyResult]     = useState<ApplyBackgroundResponse | null>(null)
  const [pkgChoice, setPkgChoice]         = useState<'A' | 'B'>('A')

  // 每次 level 改變時重算 HP（如果沒有手動覆寫）
  useEffect(() => {
    setHpMax(calcHp(summary.hitDie, level, summary.abilityScores['CON'] ?? 10))
  }, [level, summary.hitDie, summary.abilityScores])

  async function handleCreate() {
    setError(null); setLoading(true); setPhase('creating')
    try {
      // Step 1: POST /characters
      const char = await characterApi.create({
        name,
        startingLevel: level,
        raceId:       summary.raceId || null,
        subraceId:    summary.subraceId || null,
        backgroundId: summary.backgroundId || null,
        abilityScores: Object.fromEntries(Object.entries(summary.abilityScores)),
      })
      setCreateResult(char)
      setPhase('syncing')

      // Step 2: PUT /characters/{id} — 寫入 HP / AC / ability scores
      const syncBody: SyncCharacterRequest = {
        name:               char.name,
        totalLevel:         char.totalLevel,
        experiencePoints:   0,
        armorClass:         ac,
        initiativeBonus:    dexMod,
        speed:              summary.raceSpeed,
        hpMax:              hpMax,
        hpCurrent:          hpMax,
        hpTemp:             0,
        hitDiceType:        `d${summary.hitDie}`,
        hitDiceUsed:        0,
        deathSaveSuccesses: 0,
        deathSaveFailures:  0,
        abilityScores: Object.entries(summary.abilityScores).map(([abilityCode, score]) => ({
          abilityCode, score, savingThrowProficient: false,
        })),
        classes: null, currency: null, items: null, skills: null, backstory: null, appearance: null,
      }
      const synced = await characterApi.sync(char.id, syncBody)
      setSyncResult(synced)

      // Step 3: POST /characters/{id}/apply-background — 套用背景裝備 & 天賦
      if (summary.backgroundId) {
        setPhase('applying')
        const applied = await characterApi.applyBackground(char.id, pkgChoice)
        setApplyResult(applied)
      }

      setPhase('done')
      onCreated(synced)
    } catch (e) {
      setError(e as ApiError)
      setPhase('idle')
    } finally { setLoading(false) }
  }

  const autoHp = calcHp(summary.hitDie, level, summary.abilityScores['CON'] ?? 10)
  const autoAc = calcAc(summary.abilityScores['DEX'] ?? 10)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* 摘要 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-1.5 text-xs">
          <div className="font-semibold text-slate-300 mb-2">建角摘要</div>
          {[
            ['Ruleset', summary.ruleset],
            ['種族', `${summary.raceName}（速度 ${summary.raceSpeed}ft）`],
            ['亞種族', summary.subraceName || '—'],
            ['職業', `${summary.className}（Hit Die d${summary.hitDie}）`],
            ['子職業', summary.subclassName || '—'],
            ['背景', summary.backgroundName || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-400">{k}</span>
              <span className="text-slate-200">{v}</span>
            </div>
          ))}
        </div>

        {/* 基本資料 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400">角色名稱</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400">起始等級</label>
            <input type="number" min={1} max={20} value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className="mt-1 w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        {/* HP & AC 覆寫 */}
        <div className="grid grid-cols-2 gap-3">
          <OverrideInput
            label="HP Max"
            autoValue={autoHp}
            autoNote={`d${summary.hitDie}(${summary.hitDie}) + CON(${modStr(summary.abilityScores['CON'] ?? 10)})${level > 1 ? ` × Lv.${level}` : ''}`}
            value={hpMax}
            onChange={setHpMax}
          />
          <OverrideInput
            label="AC"
            autoValue={autoAc}
            autoNote={`10 + DEX(${modStr(summary.abilityScores['DEX'] ?? 10)})`}
            value={ac}
            onChange={setAc}
          />
        </div>

        <ErrorBox error={error} />

        {/* 裝備包選擇 */}
        {summary.backgroundId && (
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">背景裝備包選擇</div>
            <div className="flex gap-2">
              {(['A', 'B'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPkgChoice(p)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                    pkgChoice === p
                      ? 'border-violet-500 bg-violet-900/40 text-violet-200'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {p === 'A' ? '🎒 A 包（具體裝備）' : '💰 B 包（50 金幣）'}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              選 A：取得背景對應裝備清單；選 B：改以 50 金幣替代（PHB 2024 規則）
            </div>
          </div>
        )}

        {/* 進度 */}
        {phase !== 'idle' && (
          <div className="space-y-1 text-xs">
            <div className={`flex items-center gap-2 ${createResult ? 'text-green-400' : 'text-slate-400'}`}>
              {createResult ? '✅' : phase === 'creating' ? '⏳' : '⬜'} POST /characters
            </div>
            <div className={`flex items-center gap-2 ${syncResult ? 'text-green-400' : phase === 'syncing' ? 'text-slate-400' : 'text-slate-600'}`}>
              {syncResult ? '✅' : phase === 'syncing' ? '⏳' : '⬜'} PUT /characters/{'{id}'} — 寫入 HP / AC / ability scores
            </div>
            {summary.backgroundId && (
              <div className={`flex items-center gap-2 ${applyResult ? 'text-green-400' : phase === 'applying' ? 'text-slate-400' : 'text-slate-600'}`}>
                {applyResult ? '✅' : phase === 'applying' ? '⏳' : '⬜'} POST /apply-background — 套用背景裝備 & 天賦
                {applyResult && (
                  <span className="text-slate-500">
                    （{applyResult.itemsAdded.length} 件裝備, {applyResult.currencyGpAdded} GP）
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'done' && syncResult && (
          <div className="bg-green-900/40 border border-green-700 rounded p-3 text-sm text-green-300">
            ✅ 建立完成！HP {syncResult.hpMax} / AC {syncResult.armorClass}
            {applyResult && (
              <span className="ml-2 text-xs text-green-400">
                · 背景「{applyResult.backgroundName}」裝備已寫入
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onBack} disabled={loading}>← 返回</Btn>
          <Btn onClick={handleCreate} disabled={loading || !name.trim() || phase === 'done'}>
            {loading ? (phase === 'creating' ? '建立中…' : 'Sync 中…') : phase === 'done' ? '已完成' : '🎲 建立角色'}
          </Btn>
        </div>
      </div>

      <div className="space-y-3">
        <JsonPanel label="POST /characters — Request Body" data={{
          name, startingLevel: level,
          raceId: summary.raceId || null,
          subraceId: summary.subraceId || null,
          backgroundId: summary.backgroundId || null,
          abilityScores: Object.fromEntries(Object.entries(summary.abilityScores)),
        }} />
        {createResult && <JsonPanel label="POST Response" data={createResult} />}
        {syncResult && <JsonPanel label="PUT /characters/{id} Response（含 HP / AC）" data={syncResult} />}
        {applyResult && (
          <>
            <JsonPanel label={`POST /apply-background Response（${applyResult.packageChosen} 包）`} data={{
              background: applyResult.backgroundName,
              itemsAdded: applyResult.itemsAdded,
              currencyGpAdded: applyResult.currencyGpAdded,
            }} />
            <JsonPanel label="Grants Applied" data={
              applyResult.grantsApplied.reduce<Record<string, unknown[]>>((acc, g) => {
                const k = g.grantType
                acc[k] = [...(acc[k] ?? []), { slug: g.slug, nameZh: g.nameZh, applied: g.applied }]
                return acc
              }, {})
            } />
          </>
        )}
      </div>
    </div>
  )
}

// ── Wizard Summary ─────────────────────────────────────────────────────────────

interface WizardSummary {
  ruleset: SrdRuleset
  raceId: string; raceSlug: string; raceName: string; raceSpeed: number
  subraceId: string | null; subraceName: string | null
  classSlug: string; className: string; hitDie: number
  subclassId: string | null; subclassName: string | null
  backgroundId: string; backgroundName: string
  abilityScores: Record<string, number>
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function CharacterWizardPage() {
  const { isAuthenticated } = useAuth()
  const [step, setStep]         = useState(0)
  const [ruleset, setRuleset]   = useState<SrdRuleset>('5.2')
  const [summary, setSummary]   = useState<Partial<WizardSummary>>({})
  const [createdChar, setCreatedChar] = useState<CharacterSummary | null>(null)

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-64 text-slate-400">請先到 Auth 頁面登入</div>
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-100">
          🧙 Character Wizard
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.5</span>
        </h1>
        {/* Ruleset selector */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">Ruleset</span>
          {(['5.1', '5.2'] as SrdRuleset[]).map(v => (
            <button
              key={v}
              onClick={() => { setRuleset(v); setStep(0); setSummary({}); setCreatedChar(null) }}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                ruleset === v
                  ? 'border-violet-500 bg-violet-900/40 text-violet-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400'
              }`}
            >
              SRD {v}
            </button>
          ))}
        </div>
      </div>

      <StepIndicator current={step} />

      <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-4 overflow-y-auto">
        {step === 0 && (
          <RaceStep ruleset={ruleset} onNext={(raceId, raceSlug, raceName, raceSpeed, subraceId, subraceName) => {
            setSummary(s => ({ ...s, ruleset, raceId, raceSlug, raceName, raceSpeed, subraceId, subraceName }))
            setStep(1)
          }} />
        )}
        {step === 1 && (
          <ClassStep ruleset={ruleset} onBack={() => setStep(0)}
            onNext={(classSlug, className, hitDie, subclassId, subclassName) => {
              setSummary(s => ({ ...s, classSlug, className, hitDie, subclassId, subclassName }))
              setStep(2)
            }} />
        )}
        {step === 2 && (
          <BackgroundStep ruleset={ruleset} onBack={() => setStep(1)}
            onNext={(backgroundId, backgroundName) => {
              setSummary(s => ({ ...s, backgroundId, backgroundName }))
              setStep(3)
            }} />
        )}
        {step === 3 && (
          <AbilityStep hitDie={summary.hitDie ?? 8} onBack={() => setStep(2)}
            onNext={abilityScores => {
              setSummary(s => ({ ...s, abilityScores }))
              setStep(4)
            }} />
        )}
        {step === 4 && (
          <ConfirmStep
            summary={summary as WizardSummary}
            onBack={() => setStep(3)}
            onCreated={char => setCreatedChar(char)}
          />
        )}
      </div>

      {createdChar && (
        <div className="bg-slate-800 rounded-lg border border-green-700 p-3 text-xs text-green-300 flex items-center gap-2">
          ✅ <strong>{createdChar.name}</strong> — HP {createdChar.hpMax} / AC {createdChar.armorClass} / Lv.{createdChar.totalLevel}
          <span className="text-slate-500 ml-1">({createdChar.id.slice(0, 8)}…)</span>
          <span className="ml-auto text-slate-500">可到 Characters 頁面查看完整資料</span>
        </div>
      )}
    </div>
  )
}
