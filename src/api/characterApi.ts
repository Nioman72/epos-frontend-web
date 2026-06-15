import { apiClient } from '@/api/client'
import type {
  CharacterSummary,
  CreateCharacterRequest,
  SyncCharacterRequest,
  ApplyBackgroundResponse,
  PageResponse,
  SpellSlotInput,
  CurrencyUpdate,
  TraitsUpdate,
} from '@/types/character'
import type { LevelUpRequest } from '@/types/levelup'

const BASE = '/api/v1/characters'

export const characterApi = {
  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<CharacterSummary>>(BASE, { params: { page, size } }).then(r => r.data),

  create: (body: CreateCharacterRequest) =>
    apiClient.post<CharacterSummary>(BASE, body).then(r => r.data),

  get: (id: string) =>
    apiClient.get<CharacterSummary>(`${BASE}/${id}`).then(r => r.data),

  sync: (id: string, body: SyncCharacterRequest) =>
    apiClient.put<CharacterSummary>(`${BASE}/${id}`, body).then(r => r.data),

  applyBackground: (id: string, packageChoice: 'A' | 'B' = 'A') =>
    apiClient.post<ApplyBackgroundResponse>(
      `${BASE}/${id}/apply-background`,
      { packageChoice },
    ).then(r => r.data),

  levelUp: (id: string, body: LevelUpRequest) =>
    apiClient.post<CharacterSummary>(`${BASE}/${id}/level-up`, body).then(r => r.data),

  updateHp: (id: string, delta: number, tempHp = false) =>
    apiClient.patch<CharacterSummary>(`${BASE}/${id}/hp`, { delta, tempHp }).then(r => r.data),

  updateCurrency: (id: string, body: CurrencyUpdate) =>
    apiClient.patch<CharacterSummary>(`${BASE}/${id}/currency`, body).then(r => r.data),

  // 全量替換法術環位快照（後端為 PUT，非 PATCH）
  updateSpellSlots: (id: string, slots: SpellSlotInput[]) =>
    apiClient.put<CharacterSummary>(`${BASE}/${id}/spell-slots`, { slots }).then(r => r.data),

  // 全量覆寫角色扮演敘事（PATCH /traits，5 欄絕對值覆寫）
  updateTraits: (id: string, body: TraitsUpdate) =>
    apiClient.patch<CharacterSummary>(`${BASE}/${id}/traits`, body).then(r => r.data),

  archive: (id: string) =>
    apiClient.patch<CharacterSummary>(`${BASE}/${id}/archive`).then(r => r.data),

  restore: (id: string) =>
    apiClient.patch<CharacterSummary>(`${BASE}/${id}/restore`).then(r => r.data),
}
