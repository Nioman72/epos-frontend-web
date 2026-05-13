import { apiClient } from './client'
import type {
  SrdRace, SrdSubrace, SrdClass, SrdSubclass,
  SrdSkill, SrdBackground, SrdSpell, SrdEquipment,
  PageResponse, SrdLocale, SrdRuleset,
} from '../types/srd'

const BASE = '/api/v1/srd'

/** Accept-Language header 設定 */
function langHeader(locale: SrdLocale) {
  return { headers: { 'Accept-Language': locale } }
}

export const srdApi = {
  // ── 種族 ────────────────────────────────────────────────────────────
  listRaces: (ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdRace[]>(`${BASE}/races`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  getRace: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdRace>(`${BASE}/races/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  listSubraces: (raceSlug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdSubrace[]>(`${BASE}/races/${raceSlug}/subraces`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  // ── 職業 ────────────────────────────────────────────────────────────
  listClasses: (ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdClass[]>(`${BASE}/classes`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  getClass: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdClass>(`${BASE}/classes/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  listSubclasses: (classSlug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdSubclass[]>(`${BASE}/classes/${classSlug}/subclasses`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  // ── 技能 ────────────────────────────────────────────────────────────
  listSkills: (ruleset: SrdRuleset, locale: SrdLocale, abilityCode?: string) =>
    apiClient.get<SrdSkill[]>(`${BASE}/skills`, { params: { ruleset, abilityCode }, ...langHeader(locale) }).then(r => r.data),

  getSkill: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdSkill>(`${BASE}/skills/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  // ── 背景 ────────────────────────────────────────────────────────────
  listBackgrounds: (ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdBackground[]>(`${BASE}/backgrounds`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  getBackground: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdBackground>(`${BASE}/backgrounds/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  // ── 裝備（分頁 + 詳情）─────────────────────────────────────────────
  listEquipment: (ruleset: SrdRuleset, locale: SrdLocale, search?: string, page = 0, size = 30) =>
    apiClient.get<PageResponse<SrdEquipment>>(`${BASE}/equipment`, { params: { ruleset, search, page, size }, ...langHeader(locale) }).then(r => r.data),

  getEquipment: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdEquipment>(`${BASE}/equipment/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),

  // ── 法術（分頁 + 詳情）─────────────────────────────────────────────
  listSpells: (ruleset: SrdRuleset, locale: SrdLocale, level?: number, search?: string, page = 0, size = 30) =>
    apiClient.get<PageResponse<SrdSpell>>(`${BASE}/spells`, { params: { ruleset, level, search, page, size }, ...langHeader(locale) }).then(r => r.data),

  getSpell: (slug: string, ruleset: SrdRuleset, locale: SrdLocale) =>
    apiClient.get<SrdSpell>(`${BASE}/spells/${slug}`, { params: { ruleset }, ...langHeader(locale) }).then(r => r.data),
}
