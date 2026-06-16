import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { srdApi } from '@/features/srd/srdApi'
import { characterApi } from '@/features/characters/characterApi'
import type { SrdRace, SrdSubrace, SrdClass, SrdSubclass, SrdBackground, SrdSkill } from '@/features/srd/types'
import type { SyncCharacterRequest } from '@/features/characters/types'
import { abilityMod, signed, calcHp, calcAc, pointBuyUsed } from '@/shared/lib/rules'

// 完整引導建角 wizard（6.2，ADR-026 修正後）：種族→職業→背景→屬性→技能→確認。
// 提交鏈對齊後端實際契約（slug 模式）：
//   1. create（slug + abilityScores + startEquipmentMode）——後端一步建好：查 SRD → 算
//      HP/AC/速度/先攻、寫六圍(含豁免)、寫職業子表（含子職業）。
//   2. applyBackground——套背景裝備（A 具體裝備 / B 50 金幣）。
//   3. 若有自選技能 → sync 補 skills（classes/abilityScores 傳 null 保留 create 寫入，
//      因後端 sync 對 null 欄位 null-guarded 不動；create 無 skills 欄位故需此步）。
// 完成後導向角色卡。
const RULESET = '5.2' as const   // 全 app 固定 PHB 2024（與 mobile / Phase 2 一致）
const LOCALE = 'zh-TW' as const
const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
const STEPS = ['種族', '職業', '背景', '屬性', '技能', '確認']

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }
const label: React.CSSProperties = { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }
const navRow: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 20 }
const listBox: React.CSSProperties = { maxHeight: 300, overflowY: 'auto' }
const numInput: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: 16, textAlign: 'center', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)',
}
const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)',
  borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
}
const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  border: '1px solid var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent)',
  borderRadius: 4, padding: '8px 18px', cursor: disabled ? 'default' : 'pointer', fontSize: 13,
  opacity: disabled ? 0.4 : 1, marginLeft: 'auto',
})

function SelCard({ name, sub, selected, onClick }: { name: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: 4, padding: '10px 12px', marginBottom: 6,
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'var(--accent-bg)' : 'var(--elevated)',
      color: selected ? 'var(--accent)' : 'var(--text)',
    }}>
      <div style={{ fontSize: 14 }}>{name}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </button>
  )
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
      {STEPS.map((s, i) => (
        <span key={s} style={{
          fontSize: 11, letterSpacing: 1, padding: '4px 10px', borderRadius: 3,
          background: i === current ? 'var(--accent-bg)' : 'transparent',
          color: i === current ? 'var(--accent)' : i < current ? 'var(--positive)' : 'var(--muted)',
          border: `1px solid ${i === current ? 'var(--accent)' : 'transparent'}`,
        }}>{i < current ? '✓ ' : `${i + 1}. `}{s}</span>
      ))}
    </div>
  )
}

interface Draft {
  raceSlug: string; raceName: string; raceSpeed: number; subraceSlug: string | null; subraceName: string | null
  classSlug: string; className: string; hitDie: number; subclassSlug: string | null; subclassName: string | null
  backgroundSlug: string; backgroundName: string
  scores: Record<string, number>
  skillIds: string[]
}

// ── Step 1：種族 ──
function RaceStep({ onNext }: { onNext: (p: Pick<Draft, 'raceSlug' | 'raceName' | 'raceSpeed' | 'subraceSlug' | 'subraceName'>) => void }) {
  const [races, setRaces] = useState<SrdRace[]>([])
  const [subraces, setSubraces] = useState<SrdSubrace[]>([])
  const [race, setRace] = useState<SrdRace | null>(null)
  const [sub, setSub] = useState<SrdSubrace | null>(null)
  useEffect(() => { srdApi.listRaces(RULESET, LOCALE).then(setRaces).catch(() => {}) }, [])
  const pick = useCallback(async (r: SrdRace) => {
    setRace(r); setSub(null); setSubraces([])
    try { setSubraces(await srdApi.listSubraces(r.slug, RULESET, LOCALE)) } catch { /* 無亞種族 */ }
  }, [])
  return (
    <div>
      <div style={label}>選擇種族</div>
      <div style={listBox}>
        {races.map(r => <SelCard key={r.id} name={r.name} sub={`速度 ${r.speed}ft`} selected={race?.id === r.id} onClick={() => pick(r)} />)}
      </div>
      {race && subraces.length > 0 && (
        <>
          <div style={{ ...label, marginTop: 16 }}>亞種族</div>
          <div style={listBox}>
            {subraces.map(s => <SelCard key={s.id} name={s.name} selected={sub?.id === s.id} onClick={() => setSub(sub?.id === s.id ? null : s)} />)}
          </div>
        </>
      )}
      <div style={navRow}>
        <button style={primaryBtn(!race)} disabled={!race}
          onClick={() => onNext({ raceSlug: race!.slug, raceName: race!.name, raceSpeed: race!.speed, subraceSlug: sub?.slug ?? null, subraceName: sub?.name ?? null })}>下一步 →</button>
      </div>
    </div>
  )
}

// ── Step 2：職業 ──
function ClassStep({ onNext, onBack }: { onNext: (p: Pick<Draft, 'classSlug' | 'className' | 'hitDie' | 'subclassSlug' | 'subclassName'>) => void; onBack: () => void }) {
  const [classes, setClasses] = useState<SrdClass[]>([])
  const [subclasses, setSubclasses] = useState<SrdSubclass[]>([])
  const [cls, setCls] = useState<SrdClass | null>(null)
  const [sub, setSub] = useState<SrdSubclass | null>(null)
  useEffect(() => { srdApi.listClasses(RULESET, LOCALE).then(setClasses).catch(() => {}) }, [])
  const pick = useCallback(async (c: SrdClass) => {
    setCls(c); setSub(null); setSubclasses([])
    try { setSubclasses(await srdApi.listSubclasses(c.slug, RULESET, LOCALE)) } catch { /* 多數職業 L1 無子職業 */ }
  }, [])
  return (
    <div>
      <div style={label}>選擇職業</div>
      <div style={listBox}>
        {classes.map(c => <SelCard key={c.id} name={c.name} sub={`Hit Die d${c.hitDie}`} selected={cls?.id === c.id} onClick={() => pick(c)} />)}
      </div>
      {cls && subclasses.length > 0 && (
        <>
          <div style={{ ...label, marginTop: 16 }}>子職業（選填）</div>
          <div style={listBox}>
            {subclasses.map(s => <SelCard key={s.id} name={s.name} selected={sub?.id === s.id} onClick={() => setSub(sub?.id === s.id ? null : s)} />)}
          </div>
        </>
      )}
      <div style={navRow}>
        <button style={ghostBtn} onClick={onBack}>← 返回</button>
        <button style={primaryBtn(!cls)} disabled={!cls}
          onClick={() => onNext({ classSlug: cls!.slug, className: cls!.name, hitDie: cls!.hitDie, subclassSlug: sub?.slug ?? null, subclassName: sub?.name ?? null })}>下一步 →</button>
      </div>
    </div>
  )
}

// ── Step 3：背景 ──
function BackgroundStep({ onNext, onBack }: { onNext: (p: Pick<Draft, 'backgroundSlug' | 'backgroundName'>) => void; onBack: () => void }) {
  const [bgs, setBgs] = useState<SrdBackground[]>([])
  const [bg, setBg] = useState<SrdBackground | null>(null)
  useEffect(() => { srdApi.listBackgrounds(RULESET, LOCALE).then(setBgs).catch(() => {}) }, [])
  return (
    <div>
      <div style={label}>選擇背景</div>
      <div style={listBox}>
        {bgs.map(b => <SelCard key={b.id} name={b.name} selected={bg?.id === b.id} onClick={() => setBg(b)} />)}
      </div>
      <div style={navRow}>
        <button style={ghostBtn} onClick={onBack}>← 返回</button>
        <button style={primaryBtn(!bg)} disabled={!bg} onClick={() => onNext({ backgroundSlug: bg!.slug, backgroundName: bg!.name })}>下一步 →</button>
      </div>
    </div>
  )
}

// ── Step 4：屬性 ──
function AbilityStep({ hitDie, initial, onNext, onBack }: { hitDie: number; initial: Record<string, number>; onNext: (s: Record<string, number>) => void; onBack: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>(initial)
  const used = pointBuyUsed(scores)
  return (
    <div>
      <div style={label}>六圍屬性（Point Buy 參考：<span style={{ color: used > 27 ? 'var(--danger)' : 'var(--positive)' }}>{used}</span>/27）</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {ABILITIES.map(ab => (
          <div key={ab} style={{ background: 'var(--elevated)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{ab}</div>
            <input type="number" min={3} max={20} value={scores[ab]}
              onChange={e => setScores(s => ({ ...s, [ab]: Number(e.target.value) }))} style={numInput} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{signed(abilityMod(scores[ab]))}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1, background: 'var(--elevated)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>預估初始 HP</div>
          <div style={{ fontSize: 18, color: 'var(--positive)' }}>{calcHp(hitDie, 1, scores['CON'])}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--elevated)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>預估 AC（無裝甲）</div>
          <div style={{ fontSize: 18, color: 'var(--accent)' }}>{calcAc(scores['DEX'])}</div>
        </div>
      </div>
      <div style={navRow}>
        <button style={ghostBtn} onClick={onBack}>← 返回</button>
        <button style={primaryBtn(false)} onClick={() => onNext(scores)}>下一步 →</button>
      </div>
    </div>
  )
}

// ── Step 5：技能（後端 create 無 skills 欄位，建角後以 sync 補）──
function SkillStep({ scores, initial, onNext, onBack }: { scores: Record<string, number>; initial: string[]; onNext: (ids: string[]) => void; onBack: () => void }) {
  const [skills, setSkills] = useState<SrdSkill[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(initial))
  useEffect(() => { srdApi.listSkills(RULESET, LOCALE).then(setSkills).catch(() => {}) }, [])
  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  return (
    <div>
      <div style={label}>技能熟練（已選 {selected.size}；依職業通常 2–4 項）</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {skills.map(sk => {
          const sel = selected.has(sk.id)
          const ab = sk.abilityCode?.toUpperCase()
          const bonus = ab && scores[ab] != null ? signed(abilityMod(scores[ab]) + (sel ? 2 : 0)) : ''
          return (
            <button key={sk.id} onClick={() => toggle(sk.id)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
              border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
              background: sel ? 'var(--accent-bg)' : 'var(--elevated)',
              color: sel ? 'var(--accent)' : 'var(--text)', borderRadius: 4, padding: '8px 10px', fontSize: 12,
            }}>
              <span>{sk.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>{ab} {bonus}</span>
            </button>
          )
        })}
      </div>
      <div style={navRow}>
        <button style={ghostBtn} onClick={onBack}>← 返回</button>
        <button style={primaryBtn(false)} onClick={() => onNext([...selected])}>下一步 →</button>
      </div>
    </div>
  )
}

// ── Step 6：確認 + 提交（create → applyBackground → 有技能才 sync 補）──
function ConfirmStep({ draft, onBack }: { draft: Draft; onBack: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)
  const [pkg, setPkg] = useState<'A' | 'B'>('A')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const estHp = calcHp(draft.hitDie, level, draft.scores['CON'] ?? 10)
  const estAc = calcAc(draft.scores['DEX'] ?? 10)

  const create = async () => {
    setBusy(true); setError(null)
    try {
      // 1. create（slug 一步建好：種族/職業/屬性含豁免/HP/AC/速度/先攻）
      const char = await characterApi.create({
        name: name.trim(), startingLevel: level,
        raceSlug: draft.raceSlug, subraceSlug: draft.subraceSlug,
        classSlug: draft.classSlug, subclassSlug: draft.subclassSlug,
        backgroundSlug: draft.backgroundSlug,
        abilityScores: draft.scores, startEquipmentMode: pkg,
      })
      // 2. 套背景裝備（A 具體裝備 / B 50 金幣）
      await characterApi.applyBackground(char.id, pkg)
      // 3. 自選技能：後端 create 無 skills 欄位，以 sync 補（classes/abilityScores 傳 null
      //    → 後端 null-guarded 保留 create 寫入的職業與含豁免六圍）
      if (draft.skillIds.length > 0) {
        await characterApi.sync(char.id, {
          name: char.name, totalLevel: char.totalLevel, experiencePoints: 0,
          armorClass: char.armorClass, initiativeBonus: abilityMod(draft.scores['DEX'] ?? 10),
          speed: char.speed ?? draft.raceSpeed, hpMax: char.hpMax, hpCurrent: char.hpCurrent, hpTemp: 0,
          hitDiceType: char.hitDiceType ?? `d${draft.hitDie}`, hitDiceUsed: 0,
          deathSaveSuccesses: 0, deathSaveFailures: 0,
          abilityScores: null, classes: null,
          skills: draft.skillIds.map(id => ({ skillId: id, proficiencyLevel: 1 })),
          currency: null, items: null, backstory: null, appearance: null,
        } as SyncCharacterRequest)
      }
      navigate(`/characters/${char.id}`)
    } catch (e) {
      setError((e as { message?: string }).message ?? '建立失敗，請稍後再試')
      setBusy(false)
    }
  }

  return (
    <div>
      <div style={{ background: 'var(--elevated)', borderRadius: 4, padding: 14, marginBottom: 16, fontSize: 12 }}>
        {[
          ['種族', draft.subraceName ? `${draft.raceName} · ${draft.subraceName}` : draft.raceName],
          ['職業', draft.subclassName ? `${draft.className} · ${draft.subclassName}` : `${draft.className}（d${draft.hitDie}）`],
          ['背景', draft.backgroundName],
          ['技能熟練', `${draft.skillIds.length} 項`],
          ['預估 HP / AC', `${estHp} / ${estAc}（後端最終計算）`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span><span style={{ color: 'var(--text)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <label style={{ flex: 2 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>角色名稱</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="輸入名稱"
            style={{ ...numInput, textAlign: 'left', fontSize: 14 }} />
        </label>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>起始等級</div>
          <input type="number" min={1} max={20} value={level} onChange={e => setLevel(Number(e.target.value))} style={{ ...numInput, fontSize: 14 }} />
        </label>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>背景裝備包</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['A', 'B'] as const).map(p => (
            <button key={p} onClick={() => setPkg(p)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 4, padding: '8px', fontSize: 12,
              border: `1px solid ${pkg === p ? 'var(--accent)' : 'var(--border)'}`,
              background: pkg === p ? 'var(--accent-bg)' : 'var(--elevated)',
              color: pkg === p ? 'var(--accent)' : 'var(--muted)',
            }}>{p === 'A' ? 'A 包（具體裝備）' : 'B 包（50 金幣）'}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{error}</div>}

      <div style={navRow}>
        <button style={ghostBtn} onClick={onBack} disabled={busy}>← 返回</button>
        <button style={primaryBtn(busy || !name.trim())} disabled={busy || !name.trim()} onClick={create}>
          {busy ? '建立中…' : '建立角色'}
        </button>
      </div>
    </div>
  )
}

export default function CharacterCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Partial<Draft>>({
    scores: Object.fromEntries(ABILITIES.map(a => [a, 10])), skillIds: [],
  })
  const set = (p: Partial<Draft>) => setDraft(d => ({ ...d, ...p }))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button onClick={() => navigate('/characters')} style={{
        background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 16,
      }}>← 返回角色清單</button>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, letterSpacing: 2, color: 'var(--text)', marginBottom: 18 }}>建立新角色</h1>
      <StepIndicator current={step} />
      <section style={card}>
        {step === 0 && <RaceStep onNext={p => { set(p); setStep(1) }} />}
        {step === 1 && <ClassStep onBack={() => setStep(0)} onNext={p => { set(p); setStep(2) }} />}
        {step === 2 && <BackgroundStep onBack={() => setStep(1)} onNext={p => { set(p); setStep(3) }} />}
        {step === 3 && <AbilityStep hitDie={draft.hitDie ?? 8} initial={draft.scores!} onBack={() => setStep(2)} onNext={s => { set({ scores: s }); setStep(4) }} />}
        {step === 4 && <SkillStep scores={draft.scores!} initial={draft.skillIds!} onBack={() => setStep(3)} onNext={ids => { set({ skillIds: ids }); setStep(5) }} />}
        {step === 5 && <ConfirmStep draft={draft as Draft} onBack={() => setStep(4)} />}
      </section>
    </div>
  )
}
