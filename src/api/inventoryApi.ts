import { apiClient } from '@/api/client'
import type { ItemDto, AddItemRequest, UpdateItemRequest } from '@/types/inventory'

function base(characterId: string) {
  return `/api/v1/characters/${characterId}/items`
}

export const inventoryApi = {
  list: (characterId: string) =>
    apiClient.get<ItemDto[]>(base(characterId)).then(r => r.data),

  add: (characterId: string, body: AddItemRequest) =>
    apiClient.post<ItemDto>(base(characterId), body).then(r => r.data),

  update: (characterId: string, itemId: string, body: UpdateItemRequest) =>
    apiClient.patch<ItemDto>(`${base(characterId)}/${itemId}`, body).then(r => r.data),

  delete: (characterId: string, itemId: string) =>
    apiClient.delete(`${base(characterId)}/${itemId}`),
}
