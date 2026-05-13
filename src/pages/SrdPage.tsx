import { useState, useEffect, useCallback } from 'react'
import { srdApi } from '../api/srdApi'
import type { SrdBase, SrdLocale, SrdRuleset, SrdSkill } from '../types/srd'
import type { ApiError } from '../types/api'

// ── 小工具元件 ────────────────────────────────────────────────────────────────

function Toggle<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex rounded overflow-hidden border border-slate-600">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto max-h-[calc(100vh-260px)] whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className="bg-red-900/40 border border-red-700 rounded p-3 text-sm text-red-300">
      [{error.status} {error.code}] {error.message}
    </div>
  )
}

// ── 清單面板 ─────────────────────────────────────────────────────────────────

function ListPanel<T extends SrdBase>({
  items,
  loading,
  selectedSlug,
  onSelect,
  renderSub,
}: {
  items: T[]
  loading: boolean
  selectedSlug: string | null
  onSelect: (item: T) => void
  renderSub?: (item: T) => React.ReactNode
}) {
  if (loading) return <div className="text-slate-400 text-sm p-4">載入中…</div>
  if (!items.length) return <div className="text-slate-500 text-sm p-4">無資料</div>

  return (
    <div className="overflow-y-auto flex-1">
      {items.map(item => (
        <div key={item.id ?? item.slug}>
          <button
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              selectedSlug === item.slug
                ? 'bg-violet-700 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="font-mono text-xs text-slate-500 w-28 flex-shrink-0 truncate">{item.slug}</span>
            <span className="truncate">{item.name}</span>
          </button>
          {renderSub?.(item)}
        </div>
      ))}
    </div>
  )
}

// ── Tab 定義 ─────────────────────────────────────────────────────────────────

type TabId = 'races' | 'classes' | 'skills' | 'backgrounds' | 'equipment' | 'spells'

const TABS: { id: TabId; label: string }[] = [
  { id: 'races',       label: '🧬 種族' },
  { id: 'classes',     label: '⚔️ 職業' },
  { id: 'skills',      label: '🎯 技能' },
  { id: 'backgrounds', label: '📜 背景' },
  { id: 'equipment',   label: '🗡️ 裝備' },
  { id: 'spells',      label: '✨ 法術' },
]

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function SrdPage() {
  const [tab, setTab]         = useState<TabId>('races')
  const [ruleset, setRuleset] = useState<SrdRuleset>('5.1')
  const [locale, setLocale]   = useState<SrdLocale>('zh-TW')
  const [search, setSearch]   = useState('')

  const [items, setItems]         = useState<SrdBase[]>([])
  const [selected, setSelected]   = useState<SrdBase | null>(null)
  const [detail, setDetail]       = useState<unknown>(null)
  const [subItems, setSubItems]   = useState<SrdBase[]>([])
  const [loading, setLoading]     = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError]         = useState<ApiError | null>(null)
  const [totalElements, setTotalElements] = useState<number | null>(null)

  // 切 tab 時重置
  useEffect(() => {
    setItems([])
    setSelected(null)
    setDetail(null)
    setSubItems([])
    setSearch('')
    setError(null)
    setTotalElements(null)
  }, [tab, ruleset, locale])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      switch (tab) {
        case 'races': {
          const data = await srdApi.listRaces(ruleset, locale)
          setItems(data)
          break
        }
        case 'classes': {
          const data = await srdApi.listClasses(ruleset, locale)
          setItems(data)
          break
        }
        case 'skills': {
          const data = await srdApi.listSkills(ruleset, locale)
          setItems(data)
          break
        }
        case 'backgrounds': {
          const data = await srdApi.listBackgrounds(ruleset, locale)
          setItems(data)
          break
        }
        case 'equipment': {
          const data = await srdApi.listEquipment(ruleset, locale, search || undefined)
          setItems(data.content)
          setTotalElements(data.totalElements)
          break
        }
        case 'spells': {
          const data = await srdApi.listSpells(ruleset, locale, undefined, search || undefined)
          setItems(data.content)
          setTotalElements(data.totalElements)
          break
        }
      }
    } catch (e) {
      setError(e as ApiError)
    } finally {
      setLoading(false)
    }
  }, [tab, ruleset, locale, search])

  const handleSelect = useCallback(async (item: SrdBase) => {
    setSelected(item)
    setDetail(item)
    setSubItems([])
    setDetailLoading(true)
    try {
      // 取詳情
      let detailData: unknown = item
      if (tab === 'races')       detailData = await srdApi.getRace(item.slug, ruleset, locale)
      if (tab === 'classes')     detailData = await srdApi.getClass(item.slug, ruleset, locale)
      if (tab === 'skills')      detailData = await srdApi.getSkill(item.slug, ruleset, locale)
      if (tab === 'backgrounds') detailData = await srdApi.getBackground(item.slug, ruleset, locale)
      if (tab === 'equipment')   detailData = await srdApi.getEquipment(item.slug, ruleset, locale)
      if (tab === 'spells')      detailData = await srdApi.getSpell(item.slug, ruleset, locale)
      setDetail(detailData)

      // 取子項目
      if (tab === 'races') {
        const subs = await srdApi.listSubraces(item.slug, ruleset, locale)
        setSubItems(subs)
      }
      if (tab === 'classes') {
        const subs = await srdApi.listSubclasses(item.slug, ruleset, locale)
        setSubItems(subs)
      }
    } catch (e) {
      setError(e as ApiError)
    } finally {
      setDetailLoading(false)
    }
  }, [tab, ruleset, locale])

  const showSearch = tab === 'equipment' || tab === 'spells'
  const showSkillAbility = tab === 'skills'

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-slate-100">
          📚 SRD 靜態資料查詢
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.4</span>
        </h1>
        <div className="flex gap-3 flex-wrap ml-auto">
          <Toggle
            label="Ruleset"
            options={[{ value: '5.1', label: 'SRD 5.1' }, { value: '5.2', label: 'SRD 5.2' }]}
            value={ruleset}
            onChange={v => { setRuleset(v); setItems([]); setSelected(null) }}
          />
          <Toggle
            label="Language"
            options={[{ value: 'zh-TW', label: '繁中' }, { value: 'en', label: 'EN' }]}
            value={locale}
            onChange={v => { setLocale(v); setItems([]); setSelected(null) }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBox error={error} />

      {/* Body：左清單 + 右詳情 */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左：清單 */}
        <div className="w-72 flex-shrink-0 bg-slate-800 rounded-lg border border-slate-700 flex flex-col">
          <div className="px-3 py-2 border-b border-slate-700 flex gap-2 items-center">
            {showSearch && (
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋…"
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              />
            )}
            {showSkillAbility && (
              <span className="text-xs text-slate-400">按屬性篩選 → 點 Log Panel 查看</span>
            )}
            <button
              onClick={loadList}
              disabled={loading}
              className="ml-auto bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white rounded px-3 py-1 text-xs font-medium flex-shrink-0"
            >
              {loading ? '…' : '載入'}
            </button>
          </div>

          {totalElements !== null && (
            <div className="px-3 py-1 text-xs text-slate-500 border-b border-slate-700">
              共 {totalElements} 筆（顯示前 30）
            </div>
          )}

          <ListPanel
            items={items}
            loading={loading}
            selectedSlug={selected?.slug ?? null}
            onSelect={handleSelect}
          />
        </div>

        {/* 右：詳情 */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              ← 選擇左側項目查看詳情
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 p-4 gap-3 overflow-y-auto">
              {/* 標題列 */}
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-100">{selected.name}</div>
                  <div className="text-xs font-mono text-slate-400">{selected.slug}</div>
                </div>
                {/* Skills：顯示 abilityCode */}
                {tab === 'skills' && (selected as SrdSkill).abilityCode && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-slate-700 text-xs text-violet-300 font-mono">
                    {(selected as SrdSkill).abilityCode}
                  </span>
                )}
                {detailLoading && (
                  <span className="text-xs text-slate-400 ml-auto">載入詳情…</span>
                )}
              </div>

              {/* 子項目（subraces / subclasses）*/}
              {subItems.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">
                    {tab === 'races' ? '亞種' : '子職業'} ({subItems.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subItems.map(s => (
                      <span
                        key={s.slug}
                        className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300"
                        title={s.slug}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON 詳情 */}
              <div className="flex-1 min-h-0">
                <div className="text-xs font-semibold text-slate-400 mb-1">完整資料 (JSON)</div>
                <JsonViewer data={detail} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
