import { useState, useCallback } from 'react'
import { characterApi } from '@/features/characters/characterApi'
import { inventoryApi } from '@/features/inventory/inventoryApi'
import type { CharacterSummary } from '@/features/characters/types'
import type { ItemDto, AddItemRequest, UpdateItemRequest } from '@/features/inventory/types'
import type { ApiError } from '@/shared/types/api'
import { useAuth } from '@/features/auth/AuthContext'

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

const ITEM_TYPES = ['EQUIPMENT', 'MAGIC_ITEM', 'CUSTOM'] as const

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

// ── Add Item Form ─────────────────────────────────────────────────────────────

function AddItemForm({ characterId, onAdded }: { characterId: string; onAdded: (item: ItemDto) => void }) {
  const [form, setForm] = useState<AddItemRequest>({
    itemType: 'CUSTOM', customName: 'Test Sword', quantity: 1,
    equipped: false, weightLbs: null, notes: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  function set<K extends keyof AddItemRequest>(k: K, v: AddItemRequest[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleAdd() {
    setError(null); setLoading(true)
    try { onAdded(await inventoryApi.add(characterId, form)) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-2">
      <div className="text-xs font-semibold text-slate-400">新增物品 POST /items</div>
      <ErrorBox error={error} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400">Item Type</label>
          <select
            value={form.itemType}
            onChange={e => set('itemType', e.target.value)}
            className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
          >
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Quantity</label>
          <input
            type="number" min={0} value={form.quantity}
            onChange={e => set('quantity', Number(e.target.value))}
            className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
          />
        </div>
        {form.itemType === 'CUSTOM' && (
          <div className="col-span-2">
            <label className="text-xs text-slate-400">Custom Name</label>
            <input
              value={form.customName ?? ''}
              onChange={e => set('customName', e.target.value)}
              className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400">Weight (lbs)</label>
          <input
            type="number" min={0} step={0.1}
            value={form.weightLbs ?? ''}
            onChange={e => set('weightLbs', e.target.value ? Number(e.target.value) : null)}
            placeholder="optional"
            className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox" checked={form.equipped}
              onChange={e => set('equipped', e.target.checked)}
              className="accent-violet-500"
            />
            Equipped
          </label>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400">Notes</label>
          <input
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value || null)}
            placeholder="optional"
            className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <Btn onClick={handleAdd} disabled={loading || !form.itemType}>
        {loading ? '新增中…' : '+ 新增物品'}
      </Btn>
    </div>
  )
}

// ── Item Row ──────────────────────────────────────────────────────────────────

function ItemRow({
  item, characterId, onUpdated, onDeleted, onSelect, selected,
}: {
  item: ItemDto; characterId: string
  onUpdated: (item: ItemDto) => void
  onDeleted: (id: string) => void
  onSelect: () => void; selected: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [patch, setPatch]     = useState<UpdateItemRequest>({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<ApiError | null>(null)

  async function handleUpdate() {
    setError(null); setLoading(true)
    try {
      onUpdated(await inventoryApi.update(characterId, item.id, patch))
      setEditing(false); setPatch({})
    }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    setLoading(true)
    try { await inventoryApi.delete(characterId, item.id); onDeleted(item.id) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  async function toggleEquipped() {
    setLoading(true)
    try { onUpdated(await inventoryApi.update(characterId, item.id, { equipped: !item.equipped })) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }

  return (
    <div
      className={`border rounded p-3 space-y-2 cursor-pointer transition-colors ${
        selected ? 'border-violet-500 bg-violet-900/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-200 text-sm flex-1">
          {item.customName ?? item.itemType}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          item.itemType === 'CUSTOM' ? 'bg-slate-700 text-slate-400' :
          item.itemType === 'MAGIC_ITEM' ? 'bg-purple-900/50 text-purple-300' :
          'bg-blue-900/50 text-blue-300'
        }`}>{item.itemType}</span>
        {item.equipped && <span className="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">裝備中</span>}
      </div>

      <div className="flex gap-3 text-xs text-slate-500">
        <span>×{item.quantity}</span>
        {item.weightLbs != null && <span>{item.weightLbs} lbs</span>}
        {item.notes && <span className="truncate">{item.notes}</span>}
      </div>

      <ErrorBox error={error} />

      {editing && (
        <div className="grid grid-cols-2 gap-2 pt-1" onClick={e => e.stopPropagation()}>
          <div>
            <label className="text-xs text-slate-400">Quantity</label>
            <input
              type="number" min={0}
              value={patch.quantity ?? item.quantity}
              onChange={e => setPatch(p => ({ ...p, quantity: Number(e.target.value) }))}
              className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          {item.itemType === 'CUSTOM' && (
            <div>
              <label className="text-xs text-slate-400">Custom Name</label>
              <input
                value={patch.customName ?? item.customName ?? ''}
                onChange={e => setPatch(p => ({ ...p, customName: e.target.value }))}
                className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}
          <div className="col-span-2">
            <label className="text-xs text-slate-400">Notes</label>
            <input
              value={patch.notes ?? item.notes ?? ''}
              onChange={e => setPatch(p => ({ ...p, notes: e.target.value || null }))}
              className="mt-0.5 w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
        <Btn small variant="ghost" onClick={toggleEquipped} disabled={loading}>
          {item.equipped ? '脫下' : '裝備'}
        </Btn>
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

export default function InventoryPage() {
  const { isAuthenticated } = useAuth()
  const [character, setCharacter]   = useState<CharacterSummary | null>(null)
  const [items, setItems]           = useState<ItemDto[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<ApiError | null>(null)

  const loadItems = useCallback(async (charId: string) => {
    setError(null); setLoading(true)
    try { setItems(await inventoryApi.list(charId)) }
    catch (e) { setError(e as ApiError) }
    finally { setLoading(false) }
  }, [])

  function handleSelectChar(c: CharacterSummary) {
    setCharacter(c); setSelectedItem(null); setItems([])
    loadItems(c.id)
  }

  function handleAdded(item: ItemDto) {
    setItems(prev => [...prev, item])
    setSelectedItem(item)
  }

  function handleUpdated(item: ItemDto) {
    setItems(prev => prev.map(i => i.id === item.id ? item : i))
    setSelectedItem(item)
  }

  function handleDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-64 text-slate-400">請先到 Auth 頁面登入</div>
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">
          🎒 Inventory
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.8</span>
        </h1>
        {character && (
          <Btn variant="ghost" onClick={() => loadItems(character.id)} disabled={loading} small>
            {loading ? '…' : '重新載入'}
          </Btn>
        )}
      </div>

      <ErrorBox error={error} />

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左欄 */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <CharacterSelector selected={character} onSelect={handleSelectChar} />
          {character && (
            <AddItemForm characterId={character.id} onAdded={handleAdded} />
          )}
        </div>

        {/* 中欄：Item List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400">
              GET /items（{items.length} 筆）
            </div>
          </div>
          {!character && (
            <div className="text-xs text-slate-500 text-center py-8">← 先選擇角色</div>
          )}
          {character && items.length === 0 && !loading && (
            <div className="text-xs text-slate-500 text-center py-8">物品欄空空的，新增一個試試</div>
          )}
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              characterId={character!.id}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onSelect={() => setSelectedItem(item)}
              selected={selectedItem?.id === item.id}
            />
          ))}
        </div>

        {/* 右欄：JSON Detail */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-4 overflow-y-auto min-w-0">
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">← 點選物品查看 Response JSON</div>
          ) : (
            <>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Item Detail</div>
                <pre className="text-xs text-blue-300 bg-slate-900 rounded p-3 overflow-auto">
                  {JSON.stringify(selectedItem, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['ID', selectedItem.id.slice(0, 16) + '…'],
                  ['Type', selectedItem.itemType],
                  ['Qty', selectedItem.quantity],
                  ['Equipped', String(selectedItem.equipped)],
                  ['Weight', selectedItem.weightLbs != null ? `${selectedItem.weightLbs} lbs` : '—'],
                  ['Updated', new Date(selectedItem.updatedAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-slate-700/50 rounded p-2">
                    <div className="text-slate-400">{k}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{String(v)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
