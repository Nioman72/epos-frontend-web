// 角色卡 detail GET 子資源摘要（list 端點為空 / 缺）——對齊後端 CharacterSummaryDto
export interface AbilitySummary { code: string; score: number; modifier: number; savingThrowProficient: boolean }
export interface SkillSummary { slug: string; proficiencyLevel: number }
export interface AttackSummary {
  id: string; name: string; attackType: string; range: string | null; property: string | null
  bonus: number; damageDice: number; dieSize: number; damageFlat: number; damageType: string
}
export interface SpellSlotSummary { spellLevel: number; slotsMax: number; slotsUsed: number }
export interface PreparedSpellSummary {
  id: string; spellName: string; spellLevel: number; school: string | null
  castingRange: string | null; concentration: boolean; prepared: boolean
}
// 角色扮演敘事（detail GET 提供；list 缺）——後端 NON_NULL 序列化，空欄省略故每欄 optional
export interface BackstorySummary {
  personalityTraits?: string | null
  ideals?: string | null
  bonds?: string | null
  flaws?: string | null
  backstory?: string | null
}

// 即時狀態編輯 request（6.2）
export interface SpellSlotInput { spellLevel: number; slotsMax: number; slotsUsed: number }
export interface CurrencyUpdate { cp: number; sp: number; ep: number; gp: number; pp: number }

export interface CharacterSummary {
  id: string
  name: string
  totalLevel: number
  raceId: string | null
  alignment: string | null
  hpCurrent: number
  hpMax: number
  armorClass: number
  archived: boolean
  rulesetCode: string
  portraitKey: string | null
  updatedAt: string
  // detail GET 補完（6.2 W0）；list 端點多為空 / 缺，故 optional
  raceSlug?: string | null
  classSlug?: string | null
  subclassSlug?: string | null
  backgroundSlug?: string | null
  speed?: number
  hitDiceType?: string
  portraitData?: string | null
  cp?: number; sp?: number; ep?: number; gp?: number; pp?: number
  abilities?: AbilitySummary[]
  skills?: SkillSummary[]
  attacks?: AttackSummary[]
  spellSlots?: SpellSlotSummary[]
  preparedSpells?: PreparedSpellSummary[]
  backstory?: BackstorySummary
}

export interface CreateCharacterRequest {
  name: string
  startingLevel: number
  raceId?: string | null
  subraceId?: string | null
  backgroundId?: string | null
  alignment?: string | null
  abilityScores?: Record<string, number> | null
}

// Sync sub-types
export interface AbilityScoreInput {
  abilityCode: string
  score: number
  savingThrowProficient: boolean
}

export interface ClassInput {
  classId: string
  subclassId?: string | null
  level: number
  isPrimary: boolean
}

export interface CurrencyInput {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface SkillInput {
  skillId: string
  /** 0 = none, 1 = proficient, 2 = expertise */
  proficiencyLevel: number
}

export interface SyncCharacterRequest {
  name: string
  totalLevel: number
  experiencePoints: number
  raceId?: string | null
  subraceId?: string | null
  backgroundId?: string | null
  alignment?: string | null
  spellcastingAbility?: string | null
  armorClass: number
  initiativeBonus: number
  speed: number
  hpMax: number
  hpCurrent: number
  hpTemp: number
  hitDiceType: string
  hitDiceUsed: number
  deathSaveSuccesses: number
  deathSaveFailures: number
  abilityScores?: AbilityScoreInput[] | null
  classes?: ClassInput[] | null
  currency?: CurrencyInput | null
  skills?: SkillInput[] | null
  items?: null
  backstory?: null
  appearance?: null
}

// ── apply-background ──────────────────────────────────────────────────────────
export interface ApplyBackgroundItemResult {
  srdItemId: string | null
  nameZh: string
  quantity: number
  itemType: string
  isChoice: boolean
  choiceCategory: string | null
}

export interface ApplyBackgroundGrantResult {
  grantType: string
  slug: string
  name: string
  nameZh: string
  applied: boolean
  isChoice: boolean
  choiceCategory: string | null
}

export interface ApplyBackgroundResponse {
  characterId: string
  backgroundSlug: string
  backgroundName: string
  packageChosen: string
  itemsAdded: ApplyBackgroundItemResult[]
  currencyGpAdded: number
  grantsApplied: ApplyBackgroundGrantResult[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
