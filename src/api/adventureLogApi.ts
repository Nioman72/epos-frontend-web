import { apiClient } from '@/api/client'
import type { AdventureLogDto, CreateAdventureLogRequest, UpdateAdventureLogRequest } from '@/types/adventurelog'

function base(characterId: string) {
  return `/api/v1/characters/${characterId}/logs`
}

export const adventureLogApi = {
  list: (characterId: string) =>
    apiClient.get<AdventureLogDto[]>(base(characterId)).then(r => r.data),

  create: (characterId: string, body: CreateAdventureLogRequest) =>
    apiClient.post<AdventureLogDto>(base(characterId), body).then(r => r.data),

  get: (characterId: string, logId: string) =>
    apiClient.get<AdventureLogDto>(`${base(characterId)}/${logId}`).then(r => r.data),

  update: (characterId: string, logId: string, body: UpdateAdventureLogRequest) =>
    apiClient.patch<AdventureLogDto>(`${base(characterId)}/${logId}`, body).then(r => r.data),

  delete: (characterId: string, logId: string) =>
    apiClient.delete(`${base(characterId)}/${logId}`),
}
