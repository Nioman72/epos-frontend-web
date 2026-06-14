// D&D 5e 衍生數值（純函式，與 mobile src/lib/rules.ts 同邏輯）。

/** 屬性調整值：floor((score - 10) / 2) */
export const abilityMod = (score: number): number => Math.floor((score - 10) / 2)

/** 熟練加值：ceil(level / 4) + 1（Lv1-4=+2 ... Lv17-20=+6） */
export const proficiencyBonus = (level: number): number => Math.ceil(level / 4) + 1

/** 依熟練等級換算加值：0 無 / 1 熟練=pb / 2 專精=pb×2 */
export const proficiencyBonusFor = (profLevel: number, pb: number): number =>
  profLevel === 2 ? pb * 2 : profLevel === 1 ? pb : 0

/** 帶正負號顯示（+3 / -1 / +0） */
export const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

/** 初始 HP：1 級取 hitDie 滿值 + CON，之後每級取平均（floor(die/2)+1）+ CON（與 Phase 2 建角同邏輯）。 */
export const calcHp = (hitDie: number, level: number, con: number): number => {
  if (level <= 0) return 0
  const conMod = abilityMod(con)
  const lv1 = hitDie + conMod
  const rest = (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
  return Math.max(1, lv1 + rest)
}

/** 無裝甲 AC：10 + DEX 調整值。 */
export const calcAc = (dex: number): number => 10 + abilityMod(dex)

/** Point-buy 已用點數參考（每項累加 max(0, score-8)，>27 為超標）。 */
export const pointBuyUsed = (scores: Record<string, number>): number =>
  Object.values(scores).reduce((s, v) => s + Math.max(0, v - 8), 0)

// 技能 → 主導屬性（SRD 18 技能）
export const SKILL_ABILITY: Record<string, string> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', 'sleight-of-hand': 'dex',
  stealth: 'dex', survival: 'wis',
}
