export interface ItemDto {
  id: string
  srdItemId: string | null
  itemType: string
  customName: string | null
  quantity: number
  weightLbs: number | null
  equipped: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AddItemRequest {
  srdItemId?: string | null
  itemType: string
  customName?: string | null
  quantity: number
  weightLbs?: number | null
  equipped: boolean
  notes?: string | null
}

export interface UpdateItemRequest {
  quantity?: number | null
  equipped?: boolean | null
  customName?: string | null
  notes?: string | null
}
