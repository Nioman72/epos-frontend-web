export type AsiType = 'ABILITY_SCORE' | 'FEAT'
export type AbilityCode = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export interface AsiEntry {
  ability: AbilityCode
  increase: number
}

export interface AsiChoiceRequest {
  type: AsiType
  improvements: AsiEntry[] | null
  featSlug: string | null
}

export interface LevelUpRequest {
  hpIncrease: number
  asiChoice: AsiChoiceRequest | null
}
