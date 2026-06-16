/** 所有 SRD entity 共用的基底欄位 */
export interface SrdBase {
  id: string
  slug: string
  name: string
  data: Record<string, unknown>
}

export interface SrdRace extends SrdBase {
  speed: number
}

export interface SrdSubrace extends SrdBase {
  race?: SrdBase
}

export interface SrdClass extends SrdBase {
  hitDie: number
}

export interface SrdSubclass extends SrdBase {
  srdClass?: SrdBase
}

export interface SrdSkill extends SrdBase {
  abilityCode: string
}

export type SrdBackground = SrdBase

export interface SrdSpell extends SrdBase {
  level?: number
}

export type SrdEquipment = SrdBase

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type SrdLocale = 'zh-TW' | 'en'
export type SrdRuleset = '5.1' | '5.2'
