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
