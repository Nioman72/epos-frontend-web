import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { characterApi } from '@/api/characterApi'
import { inventoryApi } from '@/api/inventoryApi'
import { Avatar } from '@/components/Avatar'
import { abilityMod, proficiencyBonus, proficiencyBonusFor, signed, SKILL_ABILITY } from '@/lib/rules'
import { HpAdjuster } from '@/components/HpAdjuster'
import { CurrencyEditor } from '@/components/CurrencyEditor'
import { TraitsEditor } from '@/components/TraitsEditor'
import { useUpdateSpellSlots } from '@/hooks/useCharacterMutations'
import type { SpellSlotInput } from '@/types/character'

// 唯讀角色卡（6.2 W3 + W5）：react-query 直接 API；六圍/戰鬥/技能/攻擊/法術/裝備/性格。
// 性格敘事由後端 detail GET 的 backstory 物件提供（W5 補完，list 端點不帶）。
const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const

export default function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c, isLoading, error } = useQuery({
    queryKey: ['character', id],
    queryFn: () => characterApi.get(id!),
    enabled: !!id,
  })
  const { data: inventory } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryApi.list(id!),
    enabled: !!id,
  })
  const slotsMutation = useUpdateSpellSlots(id!)

  if (isLoading) return <p style={{ color: 'var(--muted)' }}>載入中…</p>
  if (error || !c) return <p style={{ color: 'var(--danger)' }}>載入角色失敗。</p>

  const pb = proficiencyBonus(c.totalLevel)
  const scoreOf = (code: string) => c.abilities?.find((a) => a.code === code)?.score ?? 10
  const saveProf = (code: string) => c.abilities?.find((a) => a.code === code)?.savingThrowProficient ?? false
  const skillProf = (slug: string) => c.skills?.find((s) => s.slug === slug)?.proficiencyLevel ?? 0
  const skillBonus = (slug: string) =>
    abilityMod(scoreOf(SKILL_ABILITY[slug].toUpperCase())) + proficiencyBonusFor(skillProf(slug), pb)
  const passivePerception = 10 + abilityMod(scoreOf('WIS')) + proficiencyBonusFor(skillProf('perception'), pb)

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: 16,
  }
  const h2: React.CSSProperties = {
    fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent)',
    borderBottom: '1px solid var(--border)', paddingBottom: 4, margin: '0 0 12px',
  }
  const sub = [c.raceSlug, c.classSlug, c.subclassSlug].filter(Boolean).join(' · ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={() => navigate('/characters')} style={{
        alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--muted)',
        cursor: 'pointer', fontSize: 13,
      }}>← 返回角色清單</button>

      {/* 頭部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Avatar name={c.name} portraitData={c.portraitData} size={84} />
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, letterSpacing: 2 }}>{c.name}</div>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 4 }}>
            {sub} · Lv {c.totalLevel}{c.alignment ? ` · ${c.alignment}` : ''}
          </div>
        </div>
      </div>

      {/* 六圍 */}
      <section style={card}>
        <h2 style={h2}>屬性值</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {ABILITIES.map((code) => (
            <div key={code} style={{ flex: 1, textAlign: 'center', background: 'var(--elevated)', borderRadius: 4, padding: '10px 4px' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--muted)' }}>{code}</div>
              <div style={{ fontSize: 22, margin: '2px 0' }}>{signed(abilityMod(scoreOf(code)))}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{scoreOf(code)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 戰鬥 */}
      <section style={card}>
        <h2 style={h2}>戰鬥</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[['AC', c.armorClass], ['HP', `${c.hpCurrent}/${c.hpMax}`], ['速度', c.speed ?? 30],
            ['先攻', signed(abilityMod(scoreOf('DEX')))], ['熟練', signed(pb)]].map(([label, val]) => (
            <div key={String(label)} style={{ flex: 1, textAlign: 'center', background: 'var(--elevated)', borderRadius: 4, padding: '8px 4px' }}>
              <div style={{ fontSize: 18 }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ABILITIES.map((code) => {
            const prof = saveProf(code)
            const bonus = abilityMod(scoreOf(code)) + (prof ? pb : 0)
            return (
              <span key={code} style={{ fontSize: 11, color: prof ? 'var(--accent)' : 'var(--muted)' }}>
                {code} {signed(bonus)}
              </span>
            )
          })}
        </div>
        <HpAdjuster characterId={c.id} />
      </section>

      {/* 技能 */}
      <section style={card}>
        <h2 style={h2}>技能</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
          {Object.keys(SKILL_ABILITY).sort().map((slug) => {
            const lvl = skillProf(slug)
            const dot = lvl === 2 ? '◆' : lvl === 1 ? '●' : '○'
            return (
              <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--accent)', width: 12 }}>{dot}</span>
                <span style={{ flex: 1, textTransform: 'capitalize' }}>{slug.replace(/-/g, ' ')}</span>
                <span style={{ color: 'var(--muted)' }}>{signed(skillBonus(slug))}</span>
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>被動感知 {passivePerception}</p>
      </section>

      {/* 攻擊 */}
      {!!c.attacks?.length && (
        <section style={card}>
          <h2 style={h2}>攻擊</h2>
          {c.attacks.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{a.name}</span>
              <span style={{ color: 'var(--muted)' }}>{signed(a.bonus)} · {a.damageDice}d{a.dieSize}{a.damageFlat ? signed(a.damageFlat) : ''} {a.damageType}</span>
            </div>
          ))}
        </section>
      )}

      {/* 法術 */}
      {(!!c.spellSlots?.length || !!c.preparedSpells?.length) && (
        <section style={card}>
          <h2 style={h2}>法術</h2>
          {!!c.spellSlots?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {c.spellSlots.filter((s) => s.slotsMax > 0).map((s) => {
                const setUsed = (used: number) => {
                  const next: SpellSlotInput[] = (c.spellSlots ?? []).map((x) =>
                    x.spellLevel === s.spellLevel ? { ...x, slotsUsed: used } : x)
                  slotsMutation.mutate(next)
                }
                const stepBtn = (off: boolean): React.CSSProperties => ({
                  background: 'transparent', border: 'none', color: 'var(--accent)',
                  cursor: off ? 'default' : 'pointer', fontSize: 14, padding: '0 5px',
                  lineHeight: 1, opacity: off ? 0.3 : 1,
                })
                const spent = s.slotsUsed >= s.slotsMax
                const full = s.slotsUsed <= 0
                return (
                  <span key={s.spellLevel} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px' }}>
                    <button disabled={full || slotsMutation.isPending} onClick={() => setUsed(s.slotsUsed - 1)}
                      title="回復一格" style={stepBtn(full || slotsMutation.isPending)}>＋</button>
                    <span style={{ minWidth: 58, textAlign: 'center' }}>環 {s.spellLevel}：{s.slotsMax - s.slotsUsed}/{s.slotsMax}</span>
                    <button disabled={spent || slotsMutation.isPending} onClick={() => setUsed(s.slotsUsed + 1)}
                      title="消耗一格" style={stepBtn(spent || slotsMutation.isPending)}>－</button>
                  </span>
                )
              })}
            </div>
          )}
          {(c.preparedSpells ?? []).slice().sort((a, b) => a.spellLevel - b.spellLevel).map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{s.spellName}</span>
              <span style={{ color: 'var(--muted)' }}>{s.spellLevel === 0 ? '戲法' : `環 ${s.spellLevel}`}{s.concentration ? ' · 專注' : ''}</span>
            </div>
          ))}
        </section>
      )}

      {/* 裝備 */}
      {!!inventory?.length && (
        <section style={card}>
          <h2 style={h2}>裝備</h2>
          {inventory.map((it) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{it.customName ?? '物品'}{it.quantity > 1 ? ` ×${it.quantity}` : ''}</span>
              {it.equipped && <span style={{ color: 'var(--accent)', fontSize: 11 }}>已裝備</span>}
            </div>
          ))}
        </section>
      )}

      {/* 金錢（獨立區，不依賴 inventory；即時狀態編輯：絕對值覆寫） */}
      <section style={card}>
        <h2 style={h2}>金錢</h2>
        <CurrencyEditor characterId={c.id} cp={c.cp ?? 0} sp={c.sp ?? 0} ep={c.ep ?? 0} gp={c.gp ?? 0} pp={c.pp ?? 0} />
      </section>

      {/* 性格與背景（可編輯：TraitsEditor 內含唯讀/編輯切換，總是顯示以提供編輯入口） */}
      <section style={card}>
        <h2 style={h2}>性格與背景</h2>
        <TraitsEditor characterId={c.id} backstory={c.backstory} />
      </section>
    </div>
  )
}
